import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Elemen #root tidak ditemukan.');

/*
 * Spotify menolak redirect URI yang memakai "localhost" (aturan sejak April
 * 2025). Di dev, paksa origin 127.0.0.1 supaya cocok dengan Redirect URI yang
 * didaftarkan di dashboard Spotify.
 */
if (import.meta.env.DEV && window.location.hostname === 'localhost') {
  window.location.replace(
    `http://127.0.0.1:${window.location.port}${window.location.pathname}${window.location.search}`,
  );
}

/*
 * Tanpa <StrictMode> di development: navbar memakai WebGL dan library
 * `webgl-liquid-glass` menghancurkan context canvas saat cleanup. StrictMode
 * sengaja menjalankan effect dua kali (mount → cleanup → mount), sehingga
 * canvas yang sama dipakai ulang setelah context-nya hilang dan shader gagal
 * dikompilasi. Build produksi tidak terpengaruh.
 */
createRoot(container).render(<App />);
