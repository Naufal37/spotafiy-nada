import { useEffect, useMemo, useRef, useState } from 'react';
import type { SpotifyAlbum, SpotifyArtist, Track } from '../types';
import { activeLyricIndex, fetchLyrics } from '../lib/lyrics';
import { getAlbum, getArtist } from '../lib/spotify';
import { Artwork } from './Artwork';
import { IconClose, IconInfo, IconLyrics, IconQueue } from './Icons';

export type SideTab = 'lyrics' | 'queue' | 'credits';

interface SidePanelProps {
  track: Track | null;
  queue: Track[];
  index: number;
  positionMs: number;
  activeTab: SideTab;
  onTabChange: (tab: SideTab) => void;
  onPlayAt: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
}

export function SidePanel({
  track,
  queue,
  index,
  positionMs,
  activeTab,
  onTabChange,
  onPlayAt,
  onRemoveFromQueue,
}: SidePanelProps) {
  const [lines, setLines] = useState<{ time: number | null; text: string }[]>([]);
  const [lyricsState, setLyricsState] = useState<'idle' | 'loading' | 'empty' | 'ready'>('idle');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!track) {
      setLines([]);
      setLyricsState('idle');
      return;
    }
    let alive = true;
    setLyricsState('loading');
    setLines([]);

    void fetchLyrics(track).then((result) => {
      if (!alive) return;
      setLines(result);
      setLyricsState(result.length > 0 ? 'ready' : 'empty');
    });

    return () => {
      alive = false;
    };
  }, [track]);

  const activeIndex = useMemo(
    () => (lyricsState === 'ready' ? activeLyricIndex(lines, positionMs) : -1),
    [lines, lyricsState, positionMs],
  );

  useEffect(() => {
    if (activeIndex < 0) return;
    const container = scrollRef.current;
    if (!container) return;
    const node = container.querySelector<HTMLElement>(`[data-lyric="${activeIndex}"]`);
    if (!node) return;
    const target = node.offsetTop - container.clientHeight / 2 + node.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [activeIndex]);

  return (
    <aside className="panel side-panel" aria-label="Lirik dan antrean">
      <div className="tabs" role="tablist" aria-label="Panel lagu">
        <button
          type="button"
          role="tab"
          id="tab-lyrics"
          className="tab"
          aria-selected={activeTab === 'lyrics'}
          aria-controls="panel-lyrics"
          onClick={() => onTabChange('lyrics')}
        >
          Lyrics
        </button>
        <button
          type="button"
          role="tab"
          id="tab-queue"
          className="tab"
          aria-selected={activeTab === 'queue'}
          aria-controls="panel-queue"
          onClick={() => onTabChange('queue')}
        >
          Up next
        </button>
        <button
          type="button"
          role="tab"
          id="tab-credits"
          className="tab"
          aria-selected={activeTab === 'credits'}
          aria-controls="panel-credits"
          onClick={() => onTabChange('credits')}
        >
          Credits
        </button>
      </div>

      <div className="tab-panel">
        {activeTab === 'lyrics' ? (
          <div
            className="scroll"
            role="tabpanel"
            id="panel-lyrics"
            aria-labelledby="tab-lyrics"
            ref={scrollRef}
          >
            {lyricsState === 'ready' ? (
              <div className="lyrics">
                {lines.map((line, i) => (
                  <p
                    key={`${line.time ?? 'x'}-${i}`}
                    data-lyric={i}
                    className={`lyric${i === activeIndex ? ' is-active' : ''}${
                      Math.abs(i - activeIndex) === 1 ? ' is-near' : ''
                    }`}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            ) : lyricsState === 'loading' ? (
              <div style={{ padding: '12px 6px', display: 'grid', gap: 14 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="sk" style={{ width: `${62 + ((i * 13) % 34)}%` }} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <span className="empty__icon" aria-hidden="true">
                  <IconLyrics size={18} />
                </span>
                <span className="empty__title">
                  {track ? 'Lirik tidak tersedia' : 'Belum ada lagu'}
                </span>
                <span>
                  {track
                    ? 'Lirik diambil dari LRCLIB. Kalau lagunya tidak ada di sana, panel ini kosong — bukan lirik karangan.'
                    : 'Putar satu lagu dulu untuk melihat liriknya.'}
                </span>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'queue' ? (
          <div className="scroll" role="tabpanel" id="panel-queue" aria-labelledby="tab-queue">
            {queue.length > 0 ? (
              <div className="queue">
                {queue.map((item, i) => (
                  <div
                    key={`${item.id}-${i}`}
                    className={`queue-item${i === index ? ' is-current' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => onPlayAt(i)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                      }}
                      aria-label={`Putar ${item.title} oleh ${item.artist}`}
                    >
                      <Artwork
                        className="queue-item__thumb"
                        src={item.artworkSmall ?? item.artwork}
                        seed={item.id}
                        alt={item.album}
                      />
                      <span className="queue-item__body">
                        <span className="queue-item__title" style={{ display: 'block' }}>
                          {item.title}
                        </span>
                        <span className="queue-item__sub" style={{ display: 'block' }}>
                          {item.artist}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="queue-item__action"
                      onClick={() => onRemoveFromQueue(i)}
                      aria-label={`Hapus ${item.title} dari antrean`}
                      title="Hapus dari antrean"
                    >
                      <IconClose size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <span className="empty__icon" aria-hidden="true">
                  <IconQueue size={18} />
                </span>
                <span className="empty__title">Antrean kosong</span>
                <span>Tambahkan lagu lewat tombol + di panel kiri.</span>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'credits' ? (
          <CreditsPanel track={track} />
        ) : null}
      </div>
    </aside>
  );
}

function CreditsPanel({ track }: { track: Track | null }) {
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!track) return;
    let alive = true;
    setLoading(true);
    setArtist(null);
    setAlbum(null);

    const jobs: Promise<void>[] = [];
    if (track.artistId) {
      jobs.push(
        getArtist(track.artistId)
          .then((result) => {
            if (alive) setArtist(result);
          })
          .catch(() => undefined),
      );
    }
    if (track.albumId) {
      jobs.push(
        getAlbum(track.albumId)
          .then((result) => {
            if (alive) setAlbum(result);
          })
          .catch(() => undefined),
      );
    }

    void Promise.all(jobs).finally(() => {
      if (alive) setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [track]);

  if (!track) {
    return (
      <div className="empty">
        <span className="empty__icon" aria-hidden="true">
          <IconInfo size={18} />
        </span>
        <span className="empty__title">Belum ada lagu</span>
        <span>Kredit artis dan album muncul setelah ada lagu yang diputar.</span>
      </div>
    );
  }

  return (
    <div className="scroll" role="tabpanel" id="panel-credits" aria-labelledby="tab-credits">
      <div className="credits">
        <div className="credits__row">
          <span className="credits__key">Artis</span>
          <span className="credits__value">
            {loading && !artist ? <span className="sk" style={{ width: 120, display: 'block' }} /> : track.artist}
          </span>
        </div>
        <div className="credits__row">
          <span className="credits__key">Album</span>
          <span className="credits__value">{track.album}</span>
        </div>
        <div className="credits__row">
          <span className="credits__key">Rilis</span>
          <span className="credits__value">{album?.release_date ?? track.releaseYear ?? '—'}</span>
        </div>
        <div className="credits__row">
          <span className="credits__key">Label</span>
          <span className="credits__value">{album?.label ?? '—'}</span>
        </div>
        <div className="credits__row">
          <span className="credits__key">Durasi</span>
          <span className="credits__value">{Math.round(track.durationMs / 1000)} detik</span>
        </div>
        {typeof artist?.followers?.total === 'number' ? (
          <div className="credits__row">
            <span className="credits__key">Pengikut</span>
            <span className="credits__value">
              {new Intl.NumberFormat('id-ID').format(artist.followers.total)}
            </span>
          </div>
        ) : null}
        {artist?.genres && artist.genres.length > 0 ? (
          <div className="credits__row">
            <span className="credits__key">Genre</span>
            <span className="credits__value genres">
              {artist.genres.slice(0, 6).map((genre) => (
                <span key={genre} className="genre">
                  {genre}
                </span>
              ))}
            </span>
          </div>
        ) : null}
        {album?.copyrights && album.copyrights.length > 0 ? (
          <div className="credits__row">
            <span className="credits__key">Hak cipta</span>
            <span className="credits__value">{album.copyrights[0].text}</span>
          </div>
        ) : null}
        <div className="credits__row">
          <span className="credits__key">Sumber</span>
          <span className="credits__value">Spotify Web API</span>
        </div>
      </div>
    </div>
  );
}
