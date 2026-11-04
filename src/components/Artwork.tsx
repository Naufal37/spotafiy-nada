import { useEffect, useState } from 'react';
import { artworkGradient } from '../lib/vibe';

interface ArtworkProps {
  src: string | null;
  seed: string;
  alt: string;
  className?: string;
  rounded?: number;
}

/** <img> dengan fallback gradien kalau artwork kosong atau gagal dimuat. */
export function Artwork({ src, seed, alt, className, rounded }: ArtworkProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const style = rounded ? { borderRadius: rounded } : undefined;

  if (!src || failed) {
    return (
      <div
        className={className}
        style={{
          background: artworkGradient(seed),
          display: 'grid',
          placeItems: 'center',
          ...style,
        }}
        role="img"
        aria-label={`${alt} (sampul tidak tersedia)`}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6em', opacity: 0.35 }}>
          ♪
        </span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={style}
    />
  );
}
