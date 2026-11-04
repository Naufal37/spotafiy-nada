import type { Track } from '../types';
import { Artwork } from './Artwork';
import { IconPlay } from './Icons';

interface TrackGridProps {
  tracks: Track[];
  onPlay: (index: number) => void;
}

export function TrackGrid({ tracks, onPlay }: TrackGridProps) {
  return (
    <div className="track-grid">
      {tracks.map((track, index) => (
        <button
          key={track.id}
          type="button"
          className="track-card"
          onClick={() => onPlay(index)}
          aria-label={`Putar ${track.title} oleh ${track.artist}`}
        >
          <Artwork
            className="track-card__art"
            src={track.artwork}
            seed={track.id}
            alt={track.album}
          />
          <span className="track-card__title" style={{ display: 'block' }}>
            {track.title}
          </span>
          <span className="track-card__sub" style={{ display: 'block' }}>
            {track.artist}
          </span>
          <span className="track-card__play" aria-hidden="true">
            <IconPlay size={16} />
          </span>
        </button>
      ))}
    </div>
  );
}
