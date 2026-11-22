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
 * Tanpa <StrictMode> di development: efek Web Playback SDK dan audio preview
 * sengaja tidak dijalankan dua kali (mount → cleanup → mount). Init SDK yang
 * berulang bisa memicu instance player ganda dan state playback yang membingungkan.
 */
createRoot(container).render(<App />);
