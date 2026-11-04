import { useEffect, useState } from 'react';
import type { Track } from '../types';
import { loadRadioSeed } from '../lib/spotify';
import { Artwork } from '../components/Artwork';
import { IconPlay, IconRadio, IconRefresh } from '../components/Icons';

interface RadioViewProps {
  seed: Track | null;
  onPlay: (tracks: Track[], index: number) => void;
}

export function RadioView({ seed, onPlay }: RadioViewProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!seed) {
      setTracks([]);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);

    void loadRadioSeed(seed)
      .then((result) => {
        if (alive) setTracks(result);
      })
      .catch(() => {
        if (!alive) return;
        setTracks([]);
        setError('Gagal menyusun radio. Coba lagi.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [seed, nonce]);

  if (!seed) {
    return (
      <div className="view">
        <div className="section-head">
          <div>
            <h2 className="section-title">Radio</h2>
            <p className="section-sub">Putar satu lagu dulu, radio akan mengikuti dari situ.</p>
          </div>
        </div>
        <section className="panel panel--pad">
          <div className="empty" style={{ minHeight: 280 }}>
            <span className="empty__icon" aria-hidden="true">
              <IconRadio size={18} />
            </span>
            <span className="empty__title">Belum ada benih</span>
            <span>Pilih lagu dari Listen now atau pencarian untuk memulai radio.</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h2 className="section-title">Radio</h2>
          <p className="section-sub">
            Alur lagu dari artis dan album yang sama — bukan rekomendasi AI.
          </p>
        </div>
        <button
          type="button"
          className="link-btn"
          onClick={() => setNonce((value) => value + 1)}
          disabled={loading}
        >
          <IconRefresh size={14} /> Susun ulang
        </button>
      </div>

      <section className="panel panel--pad">
        <div className="radio-hero">
          <Artwork
            className="radio-hero__art"
            src={seed.artwork}
            seed={seed.id}
            alt={seed.album}
          />
          <div>
            <span className="chip">
              <span className="chip__dot" aria-hidden="true" />
              Radio
            </span>
            <h3 className="radio-hero__title">Berdasarkan “{seed.title}”</h3>
            <p className="section-sub" style={{ maxWidth: '48ch' }}>
              {seed.artist} · {seed.album}
              {loading ? ' · menyusun antrean…' : ` · ${tracks.length} lagu`}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="play-btn"
                style={{ width: 52, height: 52 }}
                onClick={() => tracks.length > 0 && onPlay(tracks, 0)}
                disabled={tracks.length === 0}
                aria-label="Putar radio"
              >
                <IconPlay size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="queue" style={{ marginTop: 22 }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="queue-item">
                <div className="sk" style={{ width: 44, height: 44, borderRadius: 10 }} />
                <div style={{ flex: 1, display: 'grid', gap: 7 }}>
                  <div className="sk" style={{ width: '45%' }} />
                  <div className="sk" style={{ width: '28%', height: 10 }} />
                </div>
              </div>
            ))
          ) : tracks.length > 0 ? (
            tracks.map((track, index) => (
              <div key={`${track.id}-${index}`} className="queue-item">
                <button
                  type="button"
                  onClick={() => onPlay(tracks, index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                  }}
                  aria-label={`Putar ${track.title}`}
                >
                  <Artwork
                    className="queue-item__thumb"
                    src={track.artworkSmall ?? track.artwork}
                    seed={track.id}
                    alt={track.album}
                  />
                  <span className="queue-item__body">
                    <span className="queue-item__title" style={{ display: 'block' }}>
                      {track.title}
                    </span>
                    <span className="queue-item__sub" style={{ display: 'block' }}>
                      {track.artist}
                    </span>
                  </span>
                </button>
              </div>
            ))
          ) : (
            <div className="empty" style={{ minHeight: 180 }}>
              <span className="empty__title">{error ?? 'Tidak ada lagu'}</span>
              <span>Coba susun ulang.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
