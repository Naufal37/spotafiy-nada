import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export function IconListen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <path d="M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Z" />
      <path d="M20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
    </svg>
  );
}

export function IconMoods(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />
      <path d="M18.5 15.5 19.4 18l2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9.9-2.5Z" />
    </svg>
  );
}

export function IconLibrary(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path d="M12 4v16" />
      <path d="M15 4.8 19 5.6l-1.6 14.1-4-.8L15 4.8Z" />
    </svg>
  );
}

export function IconRadio(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.8 16.2a6 6 0 0 1 0-8.4" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M4.9 19.1a10 10 0 0 1 0-14.2" />
      <path d="M19.1 4.9a10 10 0 0 1 0 14.2" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.4-3.4" />
    </svg>
  );
}

export function IconHeart({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(props)} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20.5c-1.2-.9-8-5.4-8-10.6A4.4 4.4 0 0 1 12 6.9a4.4 4.4 0 0 1 8 3c0 5.2-6.8 9.7-8 10.6Z" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconShare(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="6" r="2.6" />
      <circle cx="18" cy="18" r="2.6" />
      <path d="m8.3 10.7 7.4-3.4M8.3 13.3l7.4 3.4" />
    </svg>
  );
}

export function IconMore(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M8 4.8v14.4c0 .8.9 1.3 1.6.9l11-7.2a1 1 0 0 0 0-1.7l-11-7.2c-.7-.5-1.6 0-1.6.8Z" />
    </svg>
  );
}

export function IconPause(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <rect x="6.5" y="4.5" width="4" height="15" rx="1.4" />
      <rect x="13.5" y="4.5" width="4" height="15" rx="1.4" />
    </svg>
  );
}

export function IconPrev(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M18.5 5.6v12.8c0 .8-.9 1.2-1.5.8L8 13.2a1 1 0 0 1 0-1.6l9-6c.6-.4 1.5 0 1.5.8Z" />
      <rect x="4.5" y="5" width="2.6" height="14" rx="1.2" />
    </svg>
  );
}

export function IconNext(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M5.5 5.6v12.8c0 .8.9 1.2 1.5.8l9-6a1 1 0 0 0 0-1.6l-9-6c-.6-.4-1.5 0-1.5.8Z" />
      <rect x="16.9" y="5" width="2.6" height="14" rx="1.2" />
    </svg>
  );
}

export function IconVolume(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6.5 8.8H3v6.4h3.5L11 19V5Z" />
      <path d="M15 9.2a4 4 0 0 1 0 5.6" />
      <path d="M17.8 6.4a8 8 0 0 1 0 11.2" />
    </svg>
  );
}

export function IconVolumeOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 5 6.5 8.8H3v6.4h3.5L11 19V5Z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5L17.5 7" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function IconSpotify(props: IconProps) {
  return (
    <svg {...base(props)} strokeWidth={0} fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.8.8 0 0 1-1.1.2c-3-1.8-6.7-2.2-11.1-1.2a.8.8 0 0 1-.3-1.5c4.8-1.1 8.9-.6 12.2 1.4.4.2.5.7.3 1.1Zm1.2-2.7a1 1 0 0 1-1.3.3c-3.4-2.1-8.5-2.7-12.5-1.5a1 1 0 0 1-.6-1.9c4.6-1.4 10.3-.7 14.2 1.7.4.3.6.9.2 1.4Zm.1-2.8C14.1 8.5 7.7 8.3 4.4 9.3a1.2 1.2 0 0 1-.7-2.3C7.5 5.8 14.6 6 19 8.6a1.2 1.2 0 1 1-1.2 2.3Z" />
    </svg>
  );
}

export function IconLyrics(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16M4 11h10M4 16h13M4 21h6" />
    </svg>
  );
}

export function IconQueue(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h11M4 11h11M4 16h7" />
      <path d="M18 10v8.2a2.3 2.3 0 1 1-1.6-2.2" />
    </svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 11a8 8 0 1 0-2.5 6.4" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

export function IconPlaylist(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h12M3 11h12M3 16h7" />
      <path d="M20 11v7.2a2.3 2.3 0 1 1-1.6-2.2" />
      <path d="M20 11V5" />
    </svg>
  );
}
