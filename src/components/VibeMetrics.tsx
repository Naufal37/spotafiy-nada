import type { Vibe } from '../lib/vibe';

interface VibeMetricsProps {
  vibe: Vibe;
}

function Metric({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <div className="metric">
      <div className="metric__label">
        <span>{label}</span>
        <span className="metric__value">{display}</span>
      </div>
      <div className="metric__bar">
        <div className="metric__fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

export function VibeMetrics({ vibe }: VibeMetricsProps) {
  return (
    <div className="vibe">
      <div className="vibe__head">
        <span className="vibe__title">The vibe</span>
        <span className="vibe__note">perkiraan dari metadata</span>
      </div>
      <div className="vibe__grid">
        <Metric label="Energy" value={vibe.energy} display={`${Math.round(vibe.energy * 100)}%`} />
        <Metric label="Warmth" value={vibe.warmth} display={`${Math.round(vibe.warmth * 100)}%`} />
        <Metric label="Tempo" value={Math.min(1, vibe.tempo / 180)} display={`${vibe.tempo} bpm`} />
      </div>
    </div>
  );
}
