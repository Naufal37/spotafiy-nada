import type { Track } from '../types';
import { MOODS } from '../lib/spotify';
import { Artwork } from '../components/Artwork';
import { TrackGrid } from '../components/TrackGrid';
import { IconPlay, IconRefresh, IconSearch } from '../components/Icons';

interface HomeViewProps {
  discovery: Track[];
  loading: boolean;
  error: string | null;
  recent: Track[];
  current: Track | null;
  onPlayDiscovery: (index: number) => void;
  onPlayRecent: (index: number) => void;
  onOpenSearch: () => void;
  onRetry: () => void;
  onSelectMood: (moodId: string) => void;
}

export function HomeView({
  discovery,
  loading,
  error,
  recent,
  current,
  onPlayDiscovery,
  onPlayRecent,
  onOpenSearch,
  onRetry,
  onSelectMood,
}: HomeViewProps) {
  const heroTrack = current ?? discovery[0] ?? null;

  return (
    <div className="home-view">
      <section className="hero" aria-label="Pilihan malam ini">
        <div className="hero__glow" aria-hidden="true" />
        <div className="hero__content">
          <span className="eyebrow">Dibuat untukmu</span>
          <h1 className="hero__title">{heroTrack?.title ?? 'Selamat malam.'}</h1>
          <p className="hero__meta">
            {heroTrack
              ? `${heroTrack.artist} · ${heroTrack.album}`
              : 'Katalog Spotify untuk menemani malammu. Mulai dari satu lagu.'}
          </p>
          <div className="hero__actions">
            <button
              type="button"
              className="pill pill--primary"
              onClick={() => onPlayDiscovery(0)}
              disabled={discovery.length === 0}
            >
              <IconPlay size={17} />
              Putar pilihan
            </button>
            <button type="button" className="pill pill--outline" onClick={onOpenSearch}>
              <IconSearch size={16} />
              Cari lagu
            </button>
          </div>
        </div>
        {heroTrack ? (
          <Artwork
            className="hero__art"
            src={heroTrack.artwork}
            seed={heroTrack.id}
            alt={heroTrack.album}
          />
        ) : null}
      </section>

      <section className="content-section" aria-labelledby="mood-tiles-title">
        <div className="section-head">
          <div>
            <h2 className="section-title" id="mood-tiles-title">Suasana</h2>
            <p className="section-sub">Pilih nuansa, kami carikan lagunya dari Spotify.</p>
          </div>
        </div>
        <div className="mood-grid">
          {MOODS.slice(0, 6).map((mood) => (
            <button
              key={mood.id}
              type="button"
              className="mood-card"
              onClick={() => onSelectMood(mood.id)}
              style={{ background: `linear-gradient(135deg, ${mood.accent}, #1f1f1f)` }}
            >
              <span className="mood-card__label">{mood.label}</span>
              <span className="mood-card__desc">{mood.description}</span>
              <span className="mood-card__play" aria-hidden="true">
                <IconPlay size={18} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="content-section" aria-labelledby="discovery-title">
        <div className="section-head">
          <div>
            <h2 className="section-title" id="discovery-title">Listen now</h2>
            <p className="section-sub">
              {error
                ? error
                : loading
                  ? 'Menyusun pilihan dari katalog Spotify…'
                  : `${discovery.length} lagu dari beberapa genre`}
            </p>
          </div>
          <button type="button" className="link-btn" onClick={onRetry} disabled={loading}>
            <IconRefresh size={14} />
            Muat ulang
          </button>
        </div>

        {loading ? (
          <div className="track-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index}>
                <div className="sk" style={{ aspectRatio: '1', height: 'auto' }} />
                <div className="sk" style={{ marginTop: 8, width: '78%' }} />
                <div className="sk" style={{ marginTop: 4, width: '50%', height: 10 }} />
              </div>
            ))}
          </div>
        ) : discovery.length > 0 ? (
          <TrackGrid tracks={discovery} onPlay={onPlayDiscovery} />
        ) : (
          <div className="empty">
            <span className="empty__title">Belum ada lagu</span>
            <span>Coba muat ulang atau cari lagu lewat tombol search.</span>
          </div>
        )}
      </section>

      {recent.length > 0 ? (
        <section className="content-section" aria-labelledby="recent-title">
          <div className="section-head">
            <div>
              <h2 className="section-title" id="recent-title">Jump back in</h2>
              <p className="section-sub">Lagu yang terakhir kamu putar di browser ini.</p>
            </div>
          </div>
          <TrackGrid tracks={recent.slice(0, 8)} onPlay={onPlayRecent} />
        </section>
      ) : null}
    </div>
  );
}
