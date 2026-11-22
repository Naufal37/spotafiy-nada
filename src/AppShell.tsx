import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Track, ViewId } from './types';
import { useAuth } from './lib/auth-context';
import { useLibrary } from './lib/library';
import { usePlayer } from './lib/player';
import { loadDiscovery, SpotifyApiError } from './lib/spotify';
import { TopNavigation } from './components/TopNavigation';
import { NowPlayingPanel } from './components/NowPlayingPanel';
import { SidePanel, type SideTab } from './components/SidePanel';
import { SearchOverlay } from './components/SearchOverlay';
import { TrackGrid } from './components/TrackGrid';
import { MoodsView } from './views/MoodsView';
import { LibraryView } from './views/LibraryView';
import { RadioView } from './views/RadioView';
import { IconClose } from './components/Icons';

export function AppShell() {
  const auth = useAuth();
  const library = useLibrary();
  const player = usePlayer();

  const [view, setView] = useState<ViewId>('listen');
  const [searchOpen, setSearchOpen] = useState(false);
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
    document.body.classList.toggle('is-syncing', library.moodSync);
    return () => document.body.classList.remove('is-syncing');
  }, [library.moodSync]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const queue = player.queue;
  const duration = player.durationMs || current?.durationMs || 0;

  const handleSeek = (ratio: number) => {
    player.seek(ratio * duration);
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
    notify(
      added
        ? 'Lagu ditambahkan ke antrean.'
        : 'Lagu ini sudah ada di antrean.',
    );
  };

  const handleToggleFavorite = () => {
    if (!current) return;
    library.toggleFavorite(current);
    notify(
      library.isFavorite(current.id)
        ? 'Dihapus dari favorit.'
        : 'Disimpan ke favorit.',
    );
  };

  const handleLogout = () => {
    auth.logout();
    notify('Keluar dari Spotify. Katalog tetap bisa dipakai.');
  };

  const handleLogin = () => {
    if (!auth.clientId) {
      notify('SPOTIFY_CLIENT_ID belum diisi di server.');
      return;
    }
    auth.login();
  };

  const playerPanel = useMemo(
    () => (
      <NowPlayingPanel
        track={current}
        isPlaying={player.isPlaying}
        positionMs={player.positionMs}
        durationMs={duration}
        volume={player.volume}
        favorite={current ? library.isFavorite(current.id) : false}
        disabled={queue.length === 0 && !current}
        onToggleFavorite={handleToggleFavorite}
        onShare={() => void handleShare()}
        onAddToQueue={handleQueueCurrent}
        onOpenCredits={() => setSideTab('credits')}
        onSeek={handleSeek}
        onToggle={player.toggle}
        onPrevious={player.previous}
        onNext={player.next}
        onVolume={player.setVolume}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, player, duration, queue.length, library],
  );

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Lewati ke konten utama
      </a>

      <TopNavigation
        view={view}
        onViewChange={setView}
        onOpenSearch={() => setSearchOpen(true)}
        moodSync={library.moodSync}
        onToggleMoodSync={() => {
          library.setMoodSync(!library.moodSync);
          notify(
            library.moodSync
              ? 'Mood sync mati.'
              : 'Mood sync nyala — ini hanya efek visual, bukan analisis audio.',
          );
        }}
        me={auth.me}
        canLogin={Boolean(auth.clientId)}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {!auth.spotifyConfigured && !setupDismissed ? (
        <div className="banner" role="status">
          <div>
            <strong>Spotify belum tersambung.</strong> Isi <code>SPOTIFY_CLIENT_ID</code> dan{' '}
            <code>SPOTIFY_CLIENT_SECRET</code> di <code>.env.local</code> (lokal) atau
            Environment Variables Vercel, lalu restart. Tanpa itu katalog lagu belum bisa dimuat.
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
            utuh. Tanpa login, hanya lagu yang punya preview 30 detik yang bisa dibunyikan.
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

      <main id="main" className="main">
        {view === 'listen' ? (
        <div className="view">
          <div className="layout">
            {playerPanel}
            <SidePanel
              track={current}
              queue={queue}
              index={player.index}
              positionMs={player.positionMs}
              activeTab={sideTab}
              onTabChange={setSideTab}
              onPlayAt={player.playAt}
              onRemoveFromQueue={player.removeFromQueue}
            />
          </div>

          <section className="panel panel--pad">
            <div className="section-head" style={{ marginBottom: 16 }}>
              <div>
                <h2 className="section-title" style={{ fontSize: 20 }}>
                  Pilihan malam ini
                </h2>
                <p className="section-sub">
                  {discoveryError
                    ? discoveryError
                    : discoveryLoading
                      ? 'Menyusun pilihan dari katalog Spotify…'
                      : `${discovery.length} lagu dari beberapa genre`}
                </p>
              </div>
            </div>

            {discoveryLoading ? (
              <div className="track-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <div className="sk" style={{ aspectRatio: '1', height: 'auto', borderRadius: 12 }} />
                    <div className="sk" style={{ marginTop: 10, width: '78%' }} />
                    <div className="sk" style={{ marginTop: 6, width: '48%', height: 10 }} />
                  </div>
                ))}
              </div>
            ) : discovery.length > 0 ? (
              <TrackGrid
                tracks={discovery}
                onPlay={(index) => player.playQueue(discovery, index)}
              />
            ) : (
              <div className="empty" style={{ minHeight: 160 }}>
                <span className="empty__title">Belum ada lagu</span>
                <span>
                  {auth.spotifyConfigured
                    ? 'Coba muat ulang halaman, atau cari lagu lewat tombol search.'
                    : 'Sambungkan Spotify dulu untuk memuat katalog.'}
                </span>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {view === 'moods' ? (
        <MoodsView onPlay={(tracks, index) => player.playQueue(tracks, index)} />
      ) : null}

      {view === 'library' ? (
        <LibraryView
          queue={queue}
          onPlay={(tracks, index) => player.playQueue(tracks, index)}
          onOpenSearch={() => setSearchOpen(true)}
        />
      ) : null}

      {view === 'radio' ? (
        <RadioView
          seed={current ?? discovery[0] ?? null}
          onPlay={(tracks, index) => player.playQueue(tracks, index)}
        />
      ) : null}
      </main>

      <footer
        style={{
          marginTop: 'auto',
          paddingTop: 18,
          fontSize: 11,
          color: 'var(--muted-dim)',
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <span>nada. — katalog oleh Spotify Web API</span>
        <span>Lirik oleh LRCLIB · dibuat ulang dari desain Nocturne</span>
      </footer>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPlay={(_track, results, index) => {
          player.playQueue(results, index);
          setSearchOpen(false);
        }}
        onQueue={(track) => {
          const added = player.addToQueue(track);
          notify(
            added
              ? `${track.title} masuk antrean.`
              : `${track.title} sudah ada di antrean.`,
          );
        }}
      />

      {toast ? (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Tutup notifikasi">
            <IconClose size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
