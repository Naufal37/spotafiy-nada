import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Elemen #root tidak ditemukan.');

/*
 * Tanpa <StrictMode> di development: navbar memakai WebGL dan library
 * `webgl-liquid-glass` menghancurkan context canvas saat cleanup. StrictMode
 * sengaja menjalankan effect dua kali (mount → cleanup → mount), sehingga
 * canvas yang sama dipakai ulang setelah context-nya hilang dan shader gagal
 * dikompilasi. Build produksi tidak terpengaruh.
 */
createRoot(container).render(<App />);
