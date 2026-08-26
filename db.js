const fs = require('fs');
const path = require('path');

/* ==========================================================
   NADA — JSON File Database
   Ganti dari SQLite ke penyimpanan file JSON supaya gak butuh
   build tools C++ di Windows, tapi tetap PERSISTEN (gak ilang
   tiap restart server kayak versi lama).
   ========================================================== */

const DATA_DIR = path.join(__dirname, 'data');
const SONGS_FILE = path.join(DATA_DIR, 'songs.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Data awal (dipakai cuma sekali, waktu songs.json belum ada sama sekali)
const DEFAULT_SONGS = [
  { id: 1, title: "Style", artist: "Hearts2Hearts", src: "/uploads/music/audio-1787649929001-275865192.mp3", cover: "/uploads/covers/cover-1787649929171-527971163.jpg", isFavorite: false, album: "Style", duration: 210, date_added: "2026-08-20" },
  { id: 2, title: "FOCUS", artist: "Hearts2Hearts", src: "/uploads/music/audio-1787649893142-429282888.mp3", cover: "/uploads/covers/cover-1787649893183-873762554.jpg", isFavorite: false, album: "FOCUS", duration: 210, date_added: "2026-08-20" },
  { id: 3, title: "Rude", artist: "Hearts2Hearts", src: "/uploads/music/audio-1787649846765-551189070.mp3", cover: "/uploads/covers/cover-1787649846839-249785928.jpg", isFavorite: false, album: "Rude", duration: 210, date_added: "2026-08-20" },
  { id: 4, title: "Shape of My Heart", artist: "Backstreet Boys", src: "/uploads/music/audio-1787649695371-37103666.mp3", cover: "/uploads/covers/cover-1787649695655-556731487.jpg", isFavorite: false, album: "Shape of My Heart", duration: 210, date_added: "2026-08-20" },
  { id: 5, title: "Lemon Tang", artist: "Hearts2Hearts", src: "/uploads/music/audio-1787649643908-629327001.mp3", cover: "/uploads/covers/cover-1787649644138-701692605.jpg", isFavorite: false, album: "Lemon Tang", duration: 210, date_added: "2026-08-20" },
  { id: 6, title: "GO", artist: "CORTIS", src: "/uploads/music/audio-1787649582223-15040111.mp3", cover: "/uploads/covers/cover-1787649582387-150939654.jpg", isFavorite: false, album: "GO", duration: 210, date_added: "2026-08-20" },
  { id: 7, title: "FASHION", artist: "CORTIS", src: "/uploads/music/audio-1787649530310-163286826.mp3", cover: "/uploads/covers/cover-1787649530595-699239019.jpg", isFavorite: false, album: "FASHION", duration: 210, date_added: "2026-08-20" },
  { id: 8, title: "ICONIC HEART", artist: "Hearts2Hearts", src: "/uploads/music/audio-1787649460600-591136537.mp3", cover: "/uploads/covers/cover-1787649460687-573669513.jpg", isFavorite: false, album: "ICONIC HEART", duration: 210, date_added: "2026-08-20" }
];

function loadJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      saveJSON(file, fallback);
      return JSON.parse(JSON.stringify(fallback));
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Gagal membaca ${file}:`, err.message);
    return fallback;
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

let songs = loadJSON(SONGS_FILE, DEFAULT_SONGS);
// Struktur playlist: { id, name, cover, songIds: [1, 2, 3] }
let playlists = loadJSON(PLAYLISTS_FILE, []);

function saveSongs() { saveJSON(SONGS_FILE, songs); }
function savePlaylists() { saveJSON(PLAYLISTS_FILE, playlists); }

module.exports = {
  /* ============ SONGS ============ */
  getAllSongs() {
    return songs;
  },

  getSongById(id) {
    return songs.find(s => s.id === Number(id));
  },

  addSong({ title, artist, src, cover }) {
    const newSong = {
      id: Date.now(),
      title,
      artist,
      src,
      cover: cover || '',
      isFavorite: false,
      album: title,
      duration: 0,
      date_added: new Date().toISOString().slice(0, 10)
    };
    songs.push(newSong);
    saveSongs();
    return newSong;
  },

  toggleFavorite(id) {
    const song = songs.find(s => s.id === Number(id));
    if (!song) return null;
    song.isFavorite = !song.isFavorite;
    saveSongs();
    return song;
  },

  deleteSong(id) {
    const idx = songs.findIndex(s => s.id === Number(id));
    if (idx === -1) return false;
    songs.splice(idx, 1);
    // Bersihin juga referensinya dari semua playlist
    playlists.forEach(p => {
      p.songIds = p.songIds.filter(sid => sid !== Number(id));
    });
    saveSongs();
    savePlaylists();
    return true;
  },

  /* ============ PLAYLISTS ============ */
  getAllPlaylists() {
    return playlists;
  },

  getPlaylistById(id) {
    return playlists.find(p => p.id === Number(id));
  },

  addPlaylist(name) {
    const newPlaylist = { id: Date.now(), name, cover: '', songIds: [] };
    playlists.push(newPlaylist);
    savePlaylists();
    return newPlaylist;
  },

  renamePlaylist(id, name) {
    const pl = playlists.find(p => p.id === Number(id));
    if (!pl) return null;
    pl.name = name;
    savePlaylists();
    return pl;
  },

  setPlaylistCover(id, coverUrl) {
    const pl = playlists.find(p => p.id === Number(id));
    if (!pl) return null;
    pl.cover = coverUrl;
    savePlaylists();
    return pl;
  },

  deletePlaylist(id) {
    const idx = playlists.findIndex(p => p.id === Number(id));
    if (idx === -1) return false;
    playlists.splice(idx, 1);
    savePlaylists();
    return true;
  },

  getPlaylistSongs(id) {
    const pl = playlists.find(p => p.id === Number(id));
    if (!pl) return [];
    return pl.songIds.map(sid => songs.find(s => s.id === sid)).filter(Boolean);
  },

  addSongToPlaylist(playlistId, songId) {
    const pl = playlists.find(p => p.id === Number(playlistId));
    if (!pl) return null;
    if (!pl.songIds.includes(Number(songId))) pl.songIds.push(Number(songId));
    savePlaylists();
    return pl;
  },

  removeSongFromPlaylist(playlistId, songId) {
    const pl = playlists.find(p => p.id === Number(playlistId));
    if (!pl) return null;
    pl.songIds = pl.songIds.filter(sid => sid !== Number(songId));
    savePlaylists();
    return pl;
  }
};
