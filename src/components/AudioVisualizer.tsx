import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  progress: number;
  playing: boolean;
  seed: string;
  onSeek: (ratio: number) => void;
}

function hashText(input: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value >>> 0;
}

/**
 * Visualizer dekoratif: tinggi bar diturunkan dari id lagu (stabil per lagu),
 * warnanya mengikuti posisi playback. Bar yang sudah lewat = orange/pink,
 * sisanya = abu transparan. Dipakai juga sebagai seek bar.
 */
export function AudioVisualizer({ progress, playing, seed, onSeek }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(0);
  const progressRef = useRef(progress);
  const playingRef = useRef(playing);
  const drawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.round(next));
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const height = 64;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seedValue = hashText(seed);
    const count = Math.max(28, Math.floor(width / 7));
    const gap = 3;
    const barWidth = Math.max(2, width / count - gap);

    let frame = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const elapsed = (now - start) / 1000;
      context.clearRect(0, 0, width, height);

      const ratio = Math.max(0, Math.min(1, progressRef.current));
      const activeUntil = ratio * count;

      for (let i = 0; i < count; i += 1) {
        const wave = Math.sin((seedValue % 97) / 13 + i * 0.55);
        const base = 0.22 + Math.abs(wave) * 0.62;
        const wobble = playingRef.current && !reduceMotion
          ? 0.82 + 0.18 * Math.sin(elapsed * 2.4 + i * 0.42)
          : 0.9;
        const barHeight = Math.max(3, base * wobble * height);
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        if (i < activeUntil) {
          const gradient = context.createLinearGradient(0, y, 0, height);
          gradient.addColorStop(0, '#f45a9a');
          gradient.addColorStop(1, '#ffb45b');
          context.fillStyle = gradient;
          context.globalAlpha = 1;
        } else {
          context.fillStyle = 'rgba(183, 166, 178, 0.28)';
          context.globalAlpha = 0.75;
        }

        context.beginPath();
        if (typeof context.roundRect === 'function') {
          context.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        } else {
          context.rect(x, y, barWidth, barHeight);
        }
        context.fill();
      }

      // Penanda posisi
      const playhead = ratio * width;
      context.globalAlpha = 0.9;
      context.fillStyle = 'rgba(255, 248, 240, 0.85)';
      context.fillRect(Math.min(width - 1, playhead), 0, 1.5, height);

      context.globalAlpha = 1;

      if (playingRef.current && !reduceMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    drawRef.current = () => draw(performance.now());

    // draw() menjadwalkan frame berikutnya sendiri saat sedang playing.
    drawRef.current();

    return () => {
      drawRef.current = null;
      cancelAnimationFrame(frame);
    };
  }, [seed, width, playing]);

  // Saat pause, posisi bisa berubah karena seek — gambar ulang sekali.
  useEffect(() => {
    if (!playing) drawRef.current?.();
  }, [progress, playing]);

  return (
    <div className="viz">
      <div style={{ position: 'relative', height: 64 }}>
        <canvas ref={canvasRef} className="viz__canvas" aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(event) => onSeek(Number(event.target.value) / 1000)}
          aria-label="Posisi lagu"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
      </div>
    </div>
  );
}
