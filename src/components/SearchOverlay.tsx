import { useEffect, useMemo, useRef, useState } from 'react';
import type { Track } from '../types';
import { searchTracks } from '../lib/spotify';
import { Artwork } from './Artwork';
import { IconPlus, IconSearch } from './Icons';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onPlay: (track: Track, results: Track[], index: number) => void;
  onQueue: (track: Track) => void;
}

export function SearchOverlay({ open, onClose, onPlay, onQueue }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setCursor(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let alive = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void searchTracks(trimmed, 22)
        .then((tracks) => {
          if (!alive) return;
          setResults(tracks);
          setCursor(0);
          setError(null);
        })
        .catch(() => {
          if (!alive) return;
          setResults([]);
          setError('Pencarian gagal. Cek koneksi atau konfigurasi Spotify.');
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 340);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const hint = useMemo(() => {
    if (query.trim().length < 2) return 'Ketik minimal 2 huruf.';
    if (loading) return 'Mencari…';
    if (error) return error;
    if (results.length === 0) return 'Tidak ada hasil.';
    return `${results.length} hasil`;
  }, [error, loading, query, results.length]);

  if (!open) return null;

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Cari lagu di Spotify"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="search">
        <div className="search__head">
          <IconSearch size={19} />
          <input
            ref={inputRef}
            className="search__input"
            type="search"
            placeholder="Cari lagu, artis, atau album…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setCursor((previous) => Math.min(results.length - 1, previous + 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setCursor((previous) => Math.max(0, previous - 1));
              } else if (event.key === 'Enter') {
                const track = results[cursor];
                if (track) onPlay(track, results, cursor);
              }
            }}
            aria-label="Kata kunci pencarian"
          />
          <span className="search__hint">ESC</span>
        </div>

        <div className="search__results">
          <div
            style={{
              padding: '6px 10px 10px',
              fontSize: 11,
              color: 'var(--muted-dim)',
              letterSpacing: '0.04em',
            }}
          >
            {hint}
          </div>

          {results.map((track, index) => (
            <div
              key={track.id}
              className={`result${index === cursor ? ' is-cursor' : ''}`}
              style={{ display: 'flex' }}
            >
              <button
                type="button"
                onClick={() => onPlay(track, results, index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'left',
                }}
                aria-label={`Putar ${track.title} oleh ${track.artist}`}
              >
                <Artwork
                  className="result__thumb"
                  src={track.artworkSmall ?? track.artwork}
                  seed={track.id}
                  alt={track.album}
                />
                <span className="result__body">
                  <span className="result__title" style={{ display: 'block' }}>
                    {track.title}
                    {track.explicit ? <span className="result__tag"> · explicit</span> : null}
                  </span>
                  <span className="result__sub" style={{ display: 'block' }}>
                    {track.artist} · {track.album}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onQueue(track)}
                aria-label={`Tambah ${track.title} ke antrean`}
                title="Tambah ke antrean"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--muted)',
                  flexShrink: 0,
                }}
              >
                <IconPlus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
