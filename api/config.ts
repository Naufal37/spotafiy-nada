import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Konfigurasi publik untuk frontend. Client ID Spotify memang publik (wajib
 * ada di URL authorize PKCE), tapi Client Secret tidak pernah ikut ke sini.
 * File ini sengaja tanpa import lokal agar aman di fungsi serverless.
 */
export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  const clientId = (process.env.SPOTIFY_CLIENT_ID ?? '').trim() || null;
  const secret = (process.env.SPOTIFY_CLIENT_SECRET ?? '').trim();

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify({
      spotifyConfigured: Boolean(clientId && secret),
      clientId,
    }),
  );
}
