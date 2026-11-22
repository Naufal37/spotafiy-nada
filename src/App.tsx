import { AppShell } from './AppShell';
import { AuthProvider, useAuth } from './lib/auth-context';
import { LibraryProvider, useLibrary } from './lib/library';
import { PlayerProvider } from './lib/player';

/**
 * PlayerProvider butuh Client ID + status Premium dari auth, dan butuh
 * pushRecent dari library — jadi dijembatani di komponen kecil ini supaya
 * urutan provider tetap jelas.
 */
function PlayerBridge() {
  const auth = useAuth();
  const library = useLibrary();

  return (
    <PlayerProvider
      clientId={auth.clientId}
      premium={auth.premium}
      onTrackStart={library.pushRecent}
    >
      <AppShell />
    </PlayerProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <PlayerBridge />
      </LibraryProvider>
    </AuthProvider>
  );
}
