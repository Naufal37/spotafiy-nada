import { useState } from 'react';
import type { Track } from '../types';
import { useLibrary } from '../lib/library';
import { TrackGrid } from '../components/TrackGrid';
import { Artwork } from '../components/Artwork';
import { IconPlay, IconPlaylist, IconPlus, IconSearch, IconTrash } from '../components/Icons';

interface LibraryViewProps {
  queue: Track[];
  onPlay: (tracks: Track[], index: number) => void;
  onOpenSearch: () => void;
}

export function LibraryView({ queue, onPlay, onOpenSearch }: LibraryViewProps) {
  const { favorites, recent, playlists, createPlaylist, deletePlaylist } = useLibrary();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const submitPlaylist = () => {
    if (queue.length === 0) return;
    createPlaylist(name || `Playlist ${playlists.length + 1}`, queue);
    setName('');
    setCreating(false);
  };

  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h2 className="section-title">Library</h2>
          <p className="section-sub">Semua yang kamu simpan, tersimpan di browser ini.</p>
        </div>
        <button type="button" className="link-btn" onClick={onOpenSearch}>
          <IconSearch size={14} /> Cari lagu baru
        </button>
      </div>

      <section className="content-section">
        <div className="section-head section-head--tight">
          <div>
            <h3 className="section-title section-title--sm">
              Favorit
            </h3>
            <p className="section-sub">{favorites.length} lagu disimpan</p>
          </div>
        </div>

        {favorites.length > 0 ? (
          <TrackGrid tracks={favorites} onPlay={(index) => onPlay(favorites, index)} />
        ) : (
          <div className="empty empty--tall">
            <span className="empty__icon" aria-hidden="true">♡</span>
            <span className="empty__title">Belum ada favorit</span>
            <span>Tekan ikon hati di bilah pemutar untuk menyimpan lagu.</span>
          </div>
        )}
      </section>

      <section className="content-section">
        <div className="section-head section-head--tight">
          <div>
            <h3 className="section-title section-title--sm">
              Playlist saya
            </h3>
            <p className="section-sub">{playlists.length} playlist</p>
          </div>
          <button
            type="button"
            className="link-btn"
            onClick={() => setCreating((value) => !value)}
            disabled={queue.length === 0}
            title={queue.length === 0 ? 'Putar beberapa lagu dulu' : 'Simpan antrean saat ini'}
          >
            <IconPlus size={14} /> Simpan antrean
          </button>
        </div>

        {creating ? (
          <div className="playlist-create">
            <input
              className="playlist-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitPlaylist();
              }}
              placeholder={`Playlist ${playlists.length + 1}`}
              aria-label="Nama playlist"
            />
            <button type="button" className="pill pill--primary" onClick={submitPlaylist}>
              Simpan {queue.length} lagu
            </button>
          </div>
        ) : null}

        {playlists.length > 0 ? (
          <div className="playlist-list">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="playlist-row">
                <span className="playlist-row__thumb" aria-hidden="true">
                  {playlist.name.trim().charAt(0).toUpperCase() || 'P'}
                </span>
                <div className="playlist-row__body">
                  <div className="playlist-row__title">{playlist.name}</div>
                  <div className="playlist-row__sub">{playlist.tracks.length} lagu</div>
                </div>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => onPlay(playlist.tracks, 0)}
                  disabled={playlist.tracks.length === 0}
                  aria-label={`Putar playlist ${playlist.name}`}
                >
                  <IconPlay size={13} /> Putar
                </button>
                <button
                  type="button"
                  className="link-btn link-btn--danger"
                  onClick={() => deletePlaylist(playlist.id)}
                  aria-label={`Hapus playlist ${playlist.name}`}
                >
                  <IconTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty empty--tall">
            <span className="empty__icon" aria-hidden="true">
              <IconPlaylist size={18} />
            </span>
            <span className="empty__title">Belum ada playlist</span>
            <span>Putar lagu, lalu simpan antreannya sebagai playlist.</span>
          </div>
        )}
      </section>

      <section className="content-section">
        <div className="section-head section-head--tight">
          <div>
            <h3 className="section-title section-title--sm">
              Terakhir diputar
            </h3>
            <p className="section-sub">{recent.length} lagu</p>
          </div>
        </div>

        {recent.length > 0 ? (
          <div className="queue">
            {recent.slice(0, 8).map((track, index) => (
              <div key={track.id} className="queue-item">
                <button
                  type="button"
                  className="queue-item__play"
                  onClick={() => onPlay(recent, index)}
                  aria-label={`Putar ${track.title}`}
                >
                  <Artwork
                    className="queue-item__thumb"
                    src={track.artworkSmall ?? track.artwork}
                    seed={track.id}
                    alt={track.album}
                  />
                  <span className="queue-item__body">
                    <span className="queue-item__title">{track.title}</span>
                    <span className="queue-item__sub">{track.artist}</span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty empty--tall">
            <span className="empty__title">Belum ada riwayat</span>
            <span>Lagu yang kamu putar akan muncul di sini.</span>
          </div>
        )}
      </section>
    </div>
  );
}
