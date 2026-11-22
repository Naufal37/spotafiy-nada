import type { ViewId } from '../types';
import type { SpotifyMe } from '../lib/auth';
import {
  IconClose,
  IconHeart,
  IconLibrary,
  IconListen,
  IconMoods,
  IconPlus,
  IconRadio,
  IconSearch,
  IconSpotify,
} from './Icons';

interface SidebarProps {
  view: ViewId;
  onViewChange: (view: ViewId) => void;
  onOpenSearch: () => void;
  favoritesCount: number;
  recentCount: number;
  playlists: { id: string; name: string; tracks: unknown[] }[];
  moodSync: boolean;
  onToggleMoodSync: () => void;
  me: SpotifyMe | null;
  canLogin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof IconListen }[] = [
  { id: 'listen', label: 'Home', icon: IconListen },
  { id: 'moods', label: 'Moods', icon: IconMoods },
  { id: 'library', label: 'Your Library', icon: IconLibrary },
  { id: 'radio', label: 'Radio', icon: IconRadio },
];

export function Sidebar({
  view,
  onViewChange,
  onOpenSearch,
  favoritesCount,
  recentCount,
  playlists,
  moodSync,
  onToggleMoodSync,
  me,
  canLogin,
  onLogin,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const changeView = (next: ViewId) => {
    onViewChange(next);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar__scrim"
          onClick={onCloseMobile}
          aria-label="Tutup navigasi"
        />
      ) : null}

      <aside className={`sidebar${mobileOpen ? ' is-open' : ''}`} aria-label="Navigasi utama">
        <div className="sidebar__top">
          <button
            type="button"
            className="brand"
            onClick={() => changeView('listen')}
            aria-label="nada. — beranda"
          >
            <span className="brand__mark" aria-hidden="true">
              <IconSpotify size={20} />
            </span>
            nada<span className="brand__dot">.</span>
          </button>
          <button
            type="button"
            className="icon-btn sidebar__close"
            onClick={onCloseMobile}
            aria-label="Tutup navigasi"
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item${active ? ' is-active' : ''}`}
                onClick={() => changeView(item.id)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button type="button" className="nav-item" onClick={onOpenSearch}>
            <IconSearch size={22} />
            <span>Search</span>
          </button>
        </nav>

        <section className="sidebar__library" aria-label="Library kamu">
          <div className="sidebar__section-head">
            <span>Your Library</span>
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={onOpenSearch}
              aria-label="Cari lagu baru"
              title="Cari lagu baru"
            >
              <IconPlus size={16} />
            </button>
          </div>

          <button
            type="button"
            className={`library-tile${view === 'library' ? ' is-active' : ''}`}
            onClick={() => changeView('library')}
          >
            <span className="library-tile__icon">
              <IconHeart size={18} filled={favoritesCount > 0} />
            </span>
            <span className="library-tile__body">
              <strong>Liked Songs</strong>
              <small>Playlist · {favoritesCount} lagu</small>
            </span>
          </button>

          <button
            type="button"
            className="library-tile"
            onClick={() => changeView('library')}
          >
            <span className="library-tile__icon">
              <IconListen size={18} />
            </span>
            <span className="library-tile__body">
              <strong>Recently played</strong>
              <small>{recentCount} lagu</small>
            </span>
          </button>

          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              className="library-tile"
              onClick={() => changeView('library')}
            >
              <span className="playlist-row__thumb" aria-hidden="true">
                {playlist.name.trim().charAt(0).toUpperCase() || 'P'}
              </span>
              <span className="library-tile__body">
                <strong>{playlist.name}</strong>
                <small>Playlist · {playlist.tracks.length} lagu</small>
              </span>
            </button>
          ))}
        </section>

        <div className="sidebar__bottom">
          <button
            type="button"
            className="sync"
            aria-pressed={moodSync}
            onClick={onToggleMoodSync}
            title="Mood sync hanya mengubah suasana tampilan, bukan analisis audio."
          >
            <span className="sync__dot" aria-hidden="true" />
            Mood sync
          </button>

          {me ? (
            <button
              type="button"
              className="account-btn"
              onClick={onLogout}
              title={`Terhubung sebagai ${me.display_name ?? me.id} — klik untuk keluar`}
            >
              {me.images?.[0]?.url ? (
                <img className="avatar" src={me.images[0].url} alt="" />
              ) : (
                <IconSpotify size={18} />
              )}
              <span className="account-btn__body">
                <strong>{me.display_name ?? 'Akun Spotify'}</strong>
                <small>{me.product === 'premium' ? 'Premium' : 'Free'} · keluar</small>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="account-btn"
              onClick={onLogin}
              disabled={!canLogin}
              title={
                canLogin
                  ? 'Login Spotify Premium untuk memutar lagu utuh'
                  : 'Isi SPOTIFY_CLIENT_ID dulu untuk mengaktifkan login'
              }
            >
              <IconSpotify size={18} />
              <span className="account-btn__body">
                <strong>Login Spotify</strong>
                <small>{canLogin ? 'Putar lagu utuh' : 'Belum dikonfigurasi'}</small>
              </span>
            </button>
          )}

          <p className="sidebar__note">Katalog Spotify · lirik LRCLIB</p>
        </div>
      </aside>
    </>
  );
}
