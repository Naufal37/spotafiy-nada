import type { CSSProperties } from 'react';
import type { Engine, SdkStatus } from '../lib/player';
import type { Track } from '../types';
import { formatTime } from '../lib/format';
import { Artwork } from './Artwork';
import type { SideTab } from './SidePanel';
import {
  IconHeart,
  IconInfo,
  IconLyrics,
  IconNext,
  IconPause,
  IconPlay,
  IconPlus,
  IconPrev,
  IconQueue,
  IconShare,
  IconVolume,
  IconVolumeOff,
} from './Icons';

interface PlayerBarProps {
  track: Track | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  engine: Engine;
  sdkStatus: SdkStatus;
  spatial: boolean;
  favorite: boolean;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (ms: number) => void;
  onVolume: (value: number) => void;
  onToggleSpatial: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onAddToQueue: () => void;
  onOpenPanel: (tab: SideTab) => void;
}

function progressStyle(value: number): CSSProperties {
  return { '--progress': `${Math.max(0, Math.min(100, value * 100))}%` } as CSSProperties;
}

export function PlayerBar({
  track,
  isPlaying,
  positionMs,
  durationMs,
  volume,
  engine,
  sdkStatus,
  spatial,
  favorite,
  onToggle,
  onPrevious,
  onNext,
  onSeek,
  onVolume,
  onToggleSpatial,
  onToggleFavorite,
  onShare,
  onAddToQueue,
  onOpenPanel,
}: PlayerBarProps) {
  const duration = durationMs || track?.durationMs || 0;
  const progress = duration > 0 ? Math.min(1, positionMs / duration) : 0;
  const disabled = !track;
  const hasStems = Boolean(track?.stems);
  const modeLabel = hasStems ? 'Split' : '8D';
  const engineLabel =
    engine === 'spotify'
      ? sdkStatus === 'ready'
        ? 'Spotify Premium'
        : 'Menyiapkan pemutar…'
      : engine === 'stems'
        ? spatial
          ? 'Vokal ↔ Instrumen'
          : 'Stem (split mati)'
        : engine === 'local'
          ? spatial
            ? '8D · Lagu import'
            : 'Lagu import'
          : engine === 'preview'
            ? 'Preview 30 detik'
            : 'Pemutar siap';

  return (
    <footer className="player-bar" aria-label="Pemutar">
      <div className="player-bar__left">
        <Artwork
          className="player-bar__art"
          src={track?.artworkSmall ?? track?.artwork ?? null}
          seed={track?.id ?? 'empty'}
          alt={track?.album ?? 'Belum ada lagu'}
        />
        <div className="player-bar__meta">
          <strong className="player-bar__title">{track?.title ?? 'Belum ada lagu'}</strong>
          <span className="player-bar__artist">
            {track ? `${track.artist} · ${engineLabel}` : 'Pilih lagu untuk mulai mendengarkan'}
          </span>
        </div>
        <button
          type="button"
          className={`icon-btn icon-btn--sm${favorite ? ' is-active' : ''}`}
          onClick={onToggleFavorite}
          disabled={disabled}
          aria-pressed={favorite}
          aria-label={favorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
          title={favorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
        >
          <IconHeart size={17} filled={favorite} />
        </button>
      </div>

      <div className="player-bar__center">
        <div className="transport">
          <button
            type="button"
            className="ctrl-btn"
            onClick={onPrevious}
            disabled={disabled}
            aria-label="Lagu sebelumnya"
          >
            <IconPrev size={18} />
          </button>
          <button
            type="button"
            className="play-btn"
            onClick={onToggle}
            disabled={disabled}
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? <IconPause size={19} /> : <IconPlay size={19} />}
          </button>
          <button
            type="button"
            className="ctrl-btn"
            onClick={onNext}
            disabled={disabled}
            aria-label="Lagu berikutnya"
          >
            <IconNext size={18} />
          </button>
        </div>

        <div className="progress-row">
          <span className="time">{formatTime(positionMs)}</span>
          <input
            type="range"
            className="range range--progress"
            min={0}
            max={Math.max(1, duration)}
            value={Math.min(positionMs, duration)}
            onChange={(event) => onSeek(Number(event.target.value))}
            disabled={disabled}
            style={progressStyle(progress)}
            aria-label="Posisi lagu"
          />
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-bar__right">
        <button
          type="button"
          className="ctrl-btn"
          onClick={onAddToQueue}
          disabled={disabled}
          aria-label="Tambah ke antrean"
          title="Tambah ke antrean"
        >
          <IconPlus size={18} />
        </button>
        <button
          type="button"
          className="ctrl-btn"
          onClick={onShare}
          disabled={disabled}
          aria-label="Bagikan lagu"
          title="Bagikan lagu"
        >
          <IconShare size={16} />
        </button>
        <button
          type="button"
          className="ctrl-btn"
          onClick={() => onOpenPanel('lyrics')}
          aria-label="Buka lirik"
          title="Lirik"
        >
          <IconLyrics size={18} />
        </button>
        <button
          type="button"
          className="ctrl-btn"
          onClick={() => onOpenPanel('queue')}
          aria-label="Buka antrean"
          title="Antrean"
        >
          <IconQueue size={18} />
        </button>
        <button
          type="button"
          className="ctrl-btn"
          onClick={() => onOpenPanel('credits')}
          aria-label="Buka kredit lagu"
          title="Kredit lagu"
        >
          <IconInfo size={18} />
        </button>

        <div className="volume">
          <button
            type="button"
            className="ctrl-btn"
            onClick={() => onVolume(volume === 0 ? 0.75 : 0)}
            aria-label={volume === 0 ? 'Nyalakan suara' : 'Bisukan'}
            aria-pressed={volume === 0}
          >
            {volume === 0 ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
          </button>
          <input
            type="range"
            className="range range--volume"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(event) => onVolume(Number(event.target.value) / 100)}
            style={progressStyle(volume)}
            aria-label="Volume"
          />
        </div>

        <button
          type="button"
          className={`spatial-toggle${spatial ? ' is-active' : ''}`}
          onClick={onToggleSpatial}
          disabled={!track?.streamUrl && !hasStems}
          aria-pressed={spatial}
          aria-label={spatial ? `Matikan efek ${modeLabel}` : `Nyalakan efek ${modeLabel}`}
          title={
            hasStems
              ? 'Vokal kiri, instrumen kanan — bergantian tiap 10 detik'
              : track?.streamUrl
                ? 'Efek 8D (spatial binaural) untuk lagu import'
                : 'Efek 8D hanya untuk lagu import'
          }
        >
          {modeLabel}
        </button>
      </div>
    </footer>
  );
}
