import { useCallback, useEffect, useState } from 'react';
import type { Track, ViewId } from './types';
import { useAuth } from './lib/auth-context';
import { useLibrary } from './lib/library';
import { usePlayer } from './lib/player';
import { loadDiscovery, SpotifyApiError } from './lib/spotify';
import { vibeFor } from './lib/vibe';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { SearchOverlay } from './components/SearchOverlay';
import { SidePanel, type SideTab } from './components/SidePanel';
import { VibeMetrics } from './components/VibeMetrics';
import { IconClose, IconMenu, IconSearch, IconSpotify } from './components/Icons';
import { HomeView } from './views/HomeView';
import { LibraryView } from './views/LibraryView';

export function AppShell() {
  const auth = useAuth();
  const library = useLibrary();
  const player = usePlayer();

  const [view, setView] = useState<ViewId>('listen');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>('lyrics');
  const [toast, setToast] = useState<string | null>(null);
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [loginHintDismissed, setLoginHintDismissed] = useState(false);

  const [discovery, setDiscovery] = useState<Track[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  const current = player.current;

  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!player.error) return;
    setToast(player.error);
    player.clearError();
  }, [player]);

  useEffect(() => {
    if (!auth.ready) return;
    if (!auth.spotifyConfigured) {
      setDiscoveryLoading(false);
      return;
    }

    let alive = true;
    setDiscoveryLoading(true);
    setDiscoveryError(null);

    void loadDiscovery()
      .then((tracks) => {
        if (alive) setDiscovery(tracks);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setDiscovery([]);
        setDiscoveryError(
          error instanceof SpotifyApiError
            ? error.message
            : 'Tidak bisa memuat katalog Spotify. Cek Client ID/Secret atau kuota API.',
        );
      })
      .finally(() => {
        if (alive) setDiscoveryLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [auth.ready, auth.spotifyConfigured]);

  const changeView = (next: ViewId) => {
    setView(next);
    setMobileNavOpen(false);
  };

  const openPanel = (tab: SideTab) => {
    setSideTab(tab);
    setDrawerOpen(true);
  };

  const handleShare = async () => {
    if (!current) return;
    const url = current.uri
      ? `https://open.spotify.com/track/${current.id}`
      : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${current.title} — ${current.artist}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify('Link lagu disalin ke clipboard.');
    } catch {
      notify(`Link: ${url}`);
    }
  };

  const handleQueueCurrent = () => {
    if (!current) return;
    const added = player.addToQueue(current);
    notify(added ? 'Lagu ditambahkan ke antrean.' : 'Lagu ini sudah ada di antrean.');
  };

  const handleToggleFavorite = () => {
    if (!current) return;
    const wasFavorite = library.isFavorite(current.id);
    library.toggleFavorite(current);
    notify(wasFavorite ? 'Dihapus dari favorit.' : 'Disimpan ke favorit.');
  };

  const handleLogin = () => {
    if (!auth.clientId) {
      notify('SPOTIFY_CLIENT_ID belum diisi di server.');
      return;
    }
    auth.login();
  };

  const handleLogout = () => {
    auth.logout();
    notify('Keluar dari Spotify. Katalog tetap bisa dipakai.');
  };

  const vibe = current ? vibeFor(current) : null;

  return (
    <div className={`app-shell${drawerOpen ? ' has-drawer' : ''}`}>
      <Sidebar
        view={view}
        onViewChange={changeView}
        onOpenSearch={() => setSearchOpen(true)}
        favoritesCount={library.favorites.length}
        recentCount={library.recent.length}
        playlists={library.playlists}
        me={auth.me}
        canLogin={Boolean(auth.clientId)}
        onLogin={handleLogin}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn topbar__menu"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Buka navigasi"
          >
            <IconMenu size={20} />
          </button>

          <button type="button" className="search-pill" onClick={() => setSearchOpen(true)}>
            <IconSearch size={18} />
            <span>Cari lagu, artis, atau album</span>
          </button>

          <div className="topbar__right">
            {auth.premium ? (
              <span className="premium-badge">
                <IconSpotify size={15} />
                Premium
              </span>
            ) : null}
            {auth.me ? (
              <button
                type="button"
                className="avatar-button"
                onClick={handleLogout}
                title={`${auth.me.display_name ?? auth.me.id} — klik untuk keluar`}
                aria-label="Keluar dari Spotify"
              >
                {auth.me.images?.[0]?.url ? (
                  <img className="avatar" src={auth.me.images[0].url} alt="" />
                ) : (
                  <IconSpotify size={18} />
                )}
              </button>
            ) : (
              <button type="button" className="pill pill--outline" onClick={handleLogin}>
                Login
              </button>
            )}
          </div>
        </header>

        <main id="main" className="content">
          {!auth.spotifyConfigured && !setupDismissed ? (
            <div className="banner" role="status">
              <div>
                <strong>Spotify belum tersambung.</strong> Isi <code>SPOTIFY_CLIENT_ID</code> dan{' '}
                <code>SPOTIFY_CLIENT_SECRET</code> di <code>.env.local</code> (lokal) atau Environment
                Variables Vercel, lalu restart. Tanpa itu katalog belum bisa dimuat.
              </div>
              <button
                type="button"
                className="banner__close"
                onClick={() => setSetupDismissed(true)}
                aria-label="Tutup pemberitahuan"
              >
                <IconClose size={14} />
              </button>
            </div>
          ) : null}

          {auth.spotifyConfigured && !auth.premium && !loginHintDismissed ? (
            <div className="banner" role="status">
              <div>
                <strong>Mode preview.</strong> Login dengan akun Spotify Premium untuk memutar lagu
                utuh. Tanpa login, hanya lagu yang punya <code>preview_url</code> yang bisa dibunyikan.
              </div>
              <button
                type="button"
                className="banner__close"
                onClick={() => setLoginHintDismissed(true)}
                aria-label="Tutup pemberitahuan"
              >
                <IconClose size={14} />
              </button>
            </div>
          ) : null}

          {view === 'listen' ? (
            <HomeView
              discovery={discovery}
              loading={discoveryLoading}
              error={discoveryError}
              recent={library.recent}
              current={current}
              onPlayDiscovery={(index) => player.playQueue(discovery, index)}
              onPlayRecent={(index) => player.playQueue(library.recent, index)}
              onOpenSearch={() => setSearchOpen(true)}
              onRetry={() => {
                setDiscoveryLoading(true);
                setDiscoveryError(null);
                void loadDiscovery()
                  .then(setDiscovery)
                  .catch((error: unknown) => {
                    setDiscovery([]);
                    setDiscoveryError(
                      error instanceof SpotifyApiError
                        ? error.message
                        : 'Tidak bisa memuat katalog Spotify.',
                    );
                  })
                  .finally(() => setDiscoveryLoading(false));
              }}
            />
          ) : null}

          {view === 'library' ? (
            <LibraryView
              queue={player.queue}
              onPlay={(tracks, index) => player.playQueue(tracks, index)}
              onOpenSearch={() => setSearchOpen(true)}
            />
          ) : null}
        </main>
      </div>

      {drawerOpen ? (
        <aside className="now-playing-drawer" aria-label="Detail lagu">
          <div className="drawer__head">
            <div>
              <span className="eyebrow">Sedang diputar</span>
              <h2 className="drawer__title">{current?.title ?? 'Belum ada lagu'}</h2>
              {current ? (
                <p className="drawer__artist">{current.artist} · {current.album}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setDrawerOpen(false)}
              aria-label="Tutup panel lagu"
            >
              <IconClose size={18} />
            </button>
          </div>

          {vibe ? <VibeMetrics vibe={vibe} /> : null}

          <SidePanel
            track={current}
            queue={player.queue}
            index={player.index}
            positionMs={player.positionMs}
            activeTab={sideTab}
            onTabChange={setSideTab}
            onPlayAt={player.playAt}
            onRemoveFromQueue={player.removeFromQueue}
          />
        </aside>
      ) : null}

      <PlayerBar
        track={current}
        isPlaying={player.isPlaying}
        positionMs={player.positionMs}
        durationMs={player.durationMs}
        volume={player.volume}
        engine={player.engine}
        sdkStatus={player.sdkStatus}
        favorite={current ? library.isFavorite(current.id) : false}
        onToggle={player.toggle}
        onPrevious={player.previous}
        onNext={player.next}
        onSeek={player.seek}
        onVolume={player.setVolume}
        onToggleFavorite={handleToggleFavorite}
        onShare={() => void handleShare()}
        onAddToQueue={handleQueueCurrent}
        onOpenPanel={openPanel}
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPlay={(_track, results, index) => {
          player.playQueue(results, index);
          setSearchOpen(false);
        }}
        onQueue={(track) => {
          const added = player.addToQueue(track);
          notify(added ? 'Lagu ditambahkan ke antrean.' : 'Lagu ini sudah ada di antrean.');
        }}
      />

      {toast ? (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Tutup pesan">
            <IconClose size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
