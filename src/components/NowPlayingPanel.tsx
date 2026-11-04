import type { Track } from '../types';
import { formatTime } from '../lib/format';
import { vibeFor } from '../lib/vibe';
import { Artwork } from './Artwork';
import { AudioVisualizer } from './AudioVisualizer';
import { VibeMetrics } from './VibeMetrics';
import { PlaybackControls } from './PlaybackControls';
import { IconHeart, IconMore, IconPlus, IconShare } from './Icons';

interface NowPlayingPanelProps {
  track: Track | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  favorite: boolean;
  disabled: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onAddToQueue: () => void;
  onOpenCredits: () => void;
  onSeek: (ratio: number) => void;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onVolume: (value: number) => void;
}

export function NowPlayingPanel({
  track,
  isPlaying,
  positionMs,
  durationMs,
  volume,
  favorite,
  disabled,
  onToggleFavorite,
  onShare,
  onAddToQueue,
  onOpenCredits,
  onSeek,
  onToggle,
  onPrevious,
  onNext,
  onVolume,
}: NowPlayingPanelProps) {
  const duration = durationMs || track?.durationMs || 0;
  const progress = duration > 0 ? Math.min(1, positionMs / duration) : 0;
  const vibe = track ? vibeFor(track) : null;

  return (
    <section className="panel player-panel" aria-label="Sedang diputar">
      {track && vibe ? (
        <>
          <div className="np">
            <div className="np__art">
              <Artwork className="np__art-media" src={track.artwork} seed={track.id} alt={track.album} />
            </div>

            <div className="np__meta">
              <span className="chip">
                <span className="chip__dot" aria-hidden="true" />
                {vibe.label}
              </span>

              <h1 className="track-title">{track.title}</h1>
              <p className="track-artist">
                <strong>{track.artist}</strong>
                <span aria-hidden="true"> · </span>
                {track.album}
                {track.releaseYear ? <span aria-hidden="true"> · </span> : null}
                {track.releaseYear}
              </p>

              <VibeMetrics vibe={vibe} />

              <div className="np__actions">
                <button
                  type="button"
                  className={`round-btn${favorite ? ' is-active' : ''}`}
                  onClick={onToggleFavorite}
                  aria-pressed={favorite}
                  aria-label={favorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                  title={favorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                >
                  <IconHeart size={18} filled={favorite} />
                </button>

                <button
                  type="button"
                  className="round-btn"
                  onClick={onShare}
                  aria-label="Bagikan lagu"
                  title="Bagikan lagu"
                >
                  <IconShare size={17} />
                </button>

                <button
                  type="button"
                  className="round-btn"
                  onClick={onAddToQueue}
                  aria-label="Tambah ke antrean"
                  title="Tambah ke antrean"
                >
                  <IconPlus size={18} />
                </button>

                <button
                  type="button"
                  className="round-btn"
                  onClick={onOpenCredits}
                  aria-label="Lihat kredit lagu"
                  title="Kredit lagu"
                >
                  <IconMore size={18} />
                </button>
              </div>
            </div>
          </div>

          <AudioVisualizer progress={progress} playing={isPlaying} seed={track.id} onSeek={onSeek} />

          <div className="viz__times">
            <span>{formatTime(positionMs)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <PlaybackControls
            isPlaying={isPlaying}
            disabled={disabled}
            volume={volume}
            onToggle={onToggle}
            onPrevious={onPrevious}
            onNext={onNext}
            onVolume={onVolume}
          />
        </>
      ) : (
        <div className="empty" style={{ minHeight: 420 }}>
          <span className="empty__icon" aria-hidden="true">♪</span>
          <span className="empty__title">Belum ada yang diputar</span>
          <span>
            Pilih lagu dari <strong>Listen now</strong>, cari lewat tombol search,
            atau buka <strong>Moods</strong>.
          </span>
        </div>
      )}
    </section>
  );
}
