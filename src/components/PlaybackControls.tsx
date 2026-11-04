import { useRef } from 'react';
import { IconNext, IconPause, IconPlay, IconPrev, IconVolume, IconVolumeOff } from './Icons';

interface PlaybackControlsProps {
  isPlaying: boolean;
  disabled: boolean;
  volume: number;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onVolume: (value: number) => void;
}

export function PlaybackControls({
  isPlaying,
  disabled,
  volume,
  onToggle,
  onPrevious,
  onNext,
  onVolume,
}: PlaybackControlsProps) {
  const lastVolume = useRef(volume > 0 ? volume : 0.75);

  if (volume > 0) lastVolume.current = volume;

  const toggleMute = () => {
    onVolume(volume === 0 ? lastVolume.current : 0);
  };

  return (
    <div className="controls">
      <div className="controls__main">
        <button
          type="button"
          className="ctrl-btn"
          onClick={onPrevious}
          disabled={disabled}
          aria-label="Lagu sebelumnya"
        >
          <IconPrev size={19} />
        </button>

        <button
          type="button"
          className="play-btn"
          onClick={onToggle}
          disabled={disabled}
          aria-label={isPlaying ? 'Jeda' : 'Putar'}
        >
          {isPlaying ? <IconPause size={22} /> : <IconPlay size={22} />}
        </button>

        <button
          type="button"
          className="ctrl-btn"
          onClick={onNext}
          disabled={disabled}
          aria-label="Lagu berikutnya"
        >
          <IconNext size={19} />
        </button>
      </div>

      <div className="controls__side">
        <div className="volume">
          <button
            type="button"
            className="ctrl-btn"
            onClick={toggleMute}
            aria-label={volume === 0 ? 'Nyalakan suara' : 'Bisukan'}
            aria-pressed={volume === 0}
          >
            {volume === 0 ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(event) => onVolume(Number(event.target.value) / 100)}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
