import { Component, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
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
 * Probe ini ikut mengompilasi shader sederhana supaya kasus "context ada tapi
 * shader gagal" sudah terdeteksi sebelum library dipasang.
 */
function webglAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;

    const vertex = gl.createShader(gl.VERTEX_SHADER);
    const fragment = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vertex || !fragment) return false;

    gl.shaderSource(vertex, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }');
    gl.compileShader(vertex);
    gl.shaderSource(fragment, 'precision mediump float; void main(){ gl_FragColor = vec4(1.0); }');
    gl.compileShader(fragment);

    const ok =
      gl.getShaderParameter(vertex, gl.COMPILE_STATUS) &&
      gl.getShaderParameter(fragment, gl.COMPILE_STATUS);

    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(ok);
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
  const hostRef = useRef<HTMLDivElement>(null);

  /*
   * Library-nya tidak menandai tab aktif untuk screen reader, jadi kita
   * tempelkan aria-current ke tombol yang sesuai. React tidak mengelola
   * atribut ini, jadi nilainya bertahan sampai tab lain dipilih.
   */
  useEffect(() => {
    const nav = hostRef.current?.querySelector('nav');
    if (!nav) return;
    const buttons = Array.from(nav.querySelectorAll('button'));
    buttons.forEach((button, index) => {
      if (items[index]?.id === activeItem) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }, [activeItem, items]);

  if (!supported) {
    return <FallbackNav items={items} activeItem={activeItem} onItemChange={onItemChange} />;
  }

  return (
    <NavBoundary fallback={<FallbackNav items={items} activeItem={activeItem} onItemChange={onItemChange} />}>
      <div ref={hostRef} style={{ display: 'contents' }}>
        <LiquidGlassNav
          items={items}
          activeItem={activeItem}
          onItemChange={onItemChange}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          style={style}
        />
      </div>
    </NavBoundary>
  );
}
