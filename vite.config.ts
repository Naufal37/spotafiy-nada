import { defineConfig, loadEnv, type Connect } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Di `npm run dev` belum ada Vercel runtime, jadi dua endpoint di folder /api
 * dipanggil langsung sebagai connect middleware. Di produksi Vercel yang
 * menanganinya sendiri.
 */
function devApi(): { name: string; configureServer(server: { middlewares: Connect.Server }): void } {
  return {
    name: 'nada-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (pathname !== '/api/spotify' && pathname !== '/api/config') {
          next();
          return;
        }
        try {
          const mod = pathname === '/api/config'
            ? await import('./api/config')
            : await import('./api/spotify');
          await mod.default(req, res);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'dev_api_failed', message: String(error) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  /*
   * Vite tidak memasukkan isi .env.local ke process.env untuk kode server,
   * padahal handler /api membacanya dari process.env. Jadi kita salin manual
   * (hanya kalau belum ada di environment asli).
   */
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [react(), devApi()],
    server: {
      /*
       * Spotify tidak lagi menerima redirect URI berisi "localhost" (sejak
       * April 2025) — yang sah hanya loopback literal seperti 127.0.0.1.
       * Jadi dev server sengaja listen di IPv4 loopback supaya origin-nya
       * http://127.0.0.1:5173, sama persis dengan yang didaftarkan.
       */
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
  };
});
