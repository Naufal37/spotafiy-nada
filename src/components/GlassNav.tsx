import { Component, useMemo, type CSSProperties, type ReactNode } from 'react';
import { LiquidGlassNav } from 'webgl-liquid-glass';

export interface GlassNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface GlassNavProps {
  items: GlassNavItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
}

/**
 * WebGL tidak selalu tersedia (GPU dinonaktifkan, remote desktop, browser
 * lama) dan shader liquid glass bisa gagal dikompilasi. Kalau itu terjadi,
 * seluruh aplikasi tidak boleh ikut mati — jadi navbar punya fallback CSS.
 */
function webglAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    if (!context) return false;
    const lose = (context as WebGLRenderingContext).getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

class NavBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Jangan spam console di produksi, tapi tetap berguna saat debug.
    if (import.meta.env.DEV) {
      console.warn('Navbar liquid glass gagal, memakai fallback CSS.', error);
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FallbackNav({ items, activeItem, onItemChange }: GlassNavProps) {
  return (
    <nav className="glass-fallback" aria-label="Navigasi utama">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={item.id === activeItem ? 'page' : undefined}
          onClick={() => onItemChange(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function GlassNav({ items, activeItem, onItemChange, activeColor, inactiveColor, style }: GlassNavProps & {
  activeColor: string;
  inactiveColor: string;
  style?: CSSProperties;
}) {
  const supported = useMemo(webglAvailable, []);

  if (!supported) {
    return <FallbackNav items={items} activeItem={activeItem} onItemChange={onItemChange} />;
  }

  return (
    <NavBoundary fallback={<FallbackNav items={items} activeItem={activeItem} onItemChange={onItemChange} />}>
      <LiquidGlassNav
        items={items}
        activeItem={activeItem}
        onItemChange={onItemChange}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
        style={style}
      />
    </NavBoundary>
  );
}
