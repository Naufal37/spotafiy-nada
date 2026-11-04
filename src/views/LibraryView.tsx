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

      <section className="panel panel--pad">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <div>
            <h3 className="section-title" style={{ fontSize: 19 }}>
              Favorit
            </h3>
            <p className="section-sub">{favorites.length} lagu disimpan</p>
          </div>
        </div>

        {favorites.length > 0 ? (
          <TrackGrid tracks={favorites} onPlay={(index) => onPlay(favorites, index)} />
        ) : (
          <div className="empty" style={{ minHeight: 160 }}>
            <span className="empty__icon" aria-hidden="true">♡</span>
            <span className="empty__title">Belum ada favorit</span>
            <span>Tekan ikon hati di panel Now Playing untuk menyimpan lagu.</span>
          </div>
        )}
      </section>

      <section className="panel panel--pad">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <div>
            <h3 className="section-title" style={{ fontSize: 19 }}>
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
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitPlaylist();
              }}
              placeholder={`Playlist ${playlists.length + 1}`}
              aria-label="Nama playlist"
              style={{
                flex: 1,
                minWidth: 180,
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'rgba(20,13,20,0.5)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
            <button
              type="button"
              className="link-btn"
              onClick={submitPlaylist}
              style={{
                border: '1px solid var(--line)',
                color: 'var(--text)',
                padding: '9px 16px',
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              Simpan {queue.length} lagu
            </button>
          </div>
        ) : null}

        {playlists.length > 0 ? (
          <div style={{ display: 'grid', gap: 10 }}>
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
          <div className="empty" style={{ minHeight: 150 }}>
            <span className="empty__icon" aria-hidden="true">
              <IconPlaylist size={18} />
            </span>
            <span className="empty__title">Belum ada playlist</span>
            <span>Putar lagu, lalu simpan antreannya sebagai playlist.</span>
          </div>
        )}
      </section>

      <section className="panel panel--pad">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <div>
            <h3 className="section-title" style={{ fontSize: 19 }}>
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
                  onClick={() => onPlay(recent, index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                  }}
                  aria-label={`Putar ${track.title}`}
                >
                  <Artwork
                    className="queue-item__thumb"
                    src={track.artworkSmall ?? track.artwork}
                    seed={track.id}
                    alt={track.album}
                  />
                  <span className="queue-item__body">
                    <span className="queue-item__title" style={{ display: 'block' }}>
                      {track.title}
                    </span>
                    <span className="queue-item__sub" style={{ display: 'block' }}>
                      {track.artist}
                    </span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ minHeight: 140 }}>
            <span className="empty__title">Belum ada riwayat</span>
            <span>Lagu yang kamu putar akan muncul di sini.</span>
          </div>
        )}
      </section>
    </div>
  );
}
