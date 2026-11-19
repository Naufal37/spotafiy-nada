import type { ViewId } from '../types';
import {
  IconLibrary,
  IconListen,
  IconMoods,
  IconRadio,
  IconSearch,
} from './Icons';
import { GlassNav } from './GlassNav';

interface TopNavigationProps {
  view: ViewId;
  onViewChange: (view: ViewId) => void;
  onOpenSearch: () => void;
  moodSync: boolean;
  onToggleMoodSync: () => void;
}

const NAV_ITEMS = [
  { id: 'listen', label: 'Listen now', icon: <IconListen size={19} /> },
  { id: 'moods', label: 'Moods', icon: <IconMoods size={19} /> },
  { id: 'library', label: 'Library', icon: <IconLibrary size={19} /> },
  { id: 'radio', label: 'Radio', icon: <IconRadio size={19} /> },
];

export function TopNavigation({
  view,
  onViewChange,
  onOpenSearch,
  moodSync,
  onToggleMoodSync,
}: TopNavigationProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#listen" onClick={(event) => { event.preventDefault(); onViewChange('listen'); }}>
        <span className="brand__mark" aria-hidden="true">n</span>
        nada<span className="brand__dot">.</span>
      </a>

      <div className="nav-slot">
        <GlassNav
          items={NAV_ITEMS}
          activeItem={view}
          onItemChange={(id) => onViewChange(id as ViewId)}
          activeColor="rgba(24, 13, 22, 0.92)"
          inactiveColor="rgba(24, 13, 22, 0.66)"
          style={{
            background: 'rgba(255, 248, 240, 0.58)',
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            boxShadow:
              '0 18px 44px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
          }}
        />
      </div>

      <div className="topbar__actions">
        <button
          type="button"
          className="sync"
          aria-pressed={moodSync}
          onClick={onToggleMoodSync}
          title="Mood sync hanya mengubah suasana tampilan, belum menganalisis audio."
        >
          <span className="sync__dot" aria-hidden="true" />
          <span>Mood sync</span>
        </button>

        <button type="button" className="icon-btn" onClick={onOpenSearch} aria-label="Cari lagu">
          <IconSearch size={19} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={() => onViewChange('library')}
          aria-label="Buka library"
        >
          <IconLibrary size={19} />
        </button>

        <a
          className="icon-btn"
          href="https://www.jamendo.com"
          target="_blank"
          rel="noreferrer"
          title="Katalog musik oleh Jamendo"
          aria-label="Buka Jamendo"
        >
          <IconRadio size={18} />
        </a>
      </div>
    </header>
  );
}
