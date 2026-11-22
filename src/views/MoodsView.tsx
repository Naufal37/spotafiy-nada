import { useEffect, useState } from 'react';
import type { Track } from '../types';
import { MOODS, searchTracks, type Mood } from '../lib/spotify';
import { TrackGrid } from '../components/TrackGrid';
import { IconRefresh } from '../components/Icons';

interface MoodsViewProps {
  initialMoodId?: string | null;
  onPlay: (tracks: Track[], index: number) => void;
}

export function MoodsView({ initialMoodId, onPlay }: MoodsViewProps) {
  const [active, setActive] = useState<Mood | null>(() =>
    MOODS.find((mood) => mood.id === initialMoodId) ?? MOODS[0],
  );
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!initialMoodId) return;
    const next = MOODS.find((mood) => mood.id === initialMoodId);
    if (next) setActive(next);
  }, [initialMoodId]);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    setLoading(true);
    setError(null);

    void searchTracks(active.query, 10)
      .then((result) => {
        if (alive) setTracks(result);
      })
      .catch(() => {
        if (!alive) return;
        setTracks([]);
        setError('Gagal memuat mood ini.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [active, nonce]);

  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h2 className="section-title">Moods</h2>
          <p className="section-sub">
            Kumpulan pencarian siap pakai. Hasilnya langsung dari katalog Spotify.
          </p>
        </div>
        <button
          type="button"
          className="link-btn"
          onClick={() => setNonce((value) => value + 1)}
          disabled={!active || loading}
        >
          <IconRefresh size={14} /> Acak ulang
        </button>
      </div>

      <div className="mood-grid">
        {MOODS.map((mood) => {
          const selected = active?.id === mood.id;
          return (
            <button
              key={mood.id}
              type="button"
              className={`mood-card${selected ? ' is-selected' : ''}`}
              onClick={() => setActive(mood)}
              aria-pressed={selected}
              style={{ background: `linear-gradient(135deg, ${mood.accent}, #1f1f1f)` }}
            >
              <span
                className="mood-card__glow"
                aria-hidden="true"
                style={{ background: mood.accent }}
              />
              <span className="mood-card__label">{mood.label}</span>
              <span className="mood-card__desc">{mood.description}</span>
            </button>
          );
        })}
      </div>

      <section className="content-section">
        <div className="section-head section-head--tight">
          <div>
            <h3 className="section-title section-title--sm">
              {active ? active.label : 'Pilih mood'}
            </h3>
            <p className="section-sub">
              {loading
                ? 'Memuat lagu…'
                : error ?? `${tracks.length} lagu · ${active?.query ?? ''}`}
            </p>
          </div>
          <button
            type="button"
            className="pill pill--primary"
            onClick={() => tracks.length > 0 && onPlay(tracks, 0)}
            disabled={tracks.length === 0}
          >
            Putar semua
          </button>
        </div>

        {loading ? (
          <div className="track-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="sk" style={{ aspectRatio: '1', height: 'auto', borderRadius: 12 }} />
                <div className="sk" style={{ marginTop: 10, width: '80%' }} />
                <div className="sk" style={{ marginTop: 6, width: '50%', height: 10 }} />
              </div>
            ))}
          </div>
        ) : tracks.length > 0 ? (
          <TrackGrid tracks={tracks} onPlay={(index) => onPlay(tracks, index)} />
        ) : (
          <div className="empty empty--tall">
            <span className="empty__title">Tidak ada lagu</span>
            <span>Coba mood lain atau acak ulang.</span>
          </div>
        )}
      </section>
    </div>
  );
}
