import { AppShell } from './AppShell';
import { LibraryProvider, useLibrary } from './lib/library';
import { PlayerProvider } from './lib/player';

/**
 * PlayerProvider butuh pushRecent dari library — jadi dijembatani di komponen
 * kecil ini supaya urutan provider tetap jelas.
 */
function PlayerBridge() {
  const library = useLibrary();

  return <PlayerProvider onTrackStart={library.pushRecent}><AppShell /></PlayerProvider>;
}

export function App() {
  return (
    <LibraryProvider>
      <PlayerBridge />
    </LibraryProvider>
  );
}
