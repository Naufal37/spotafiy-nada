const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware parsing body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve folder static
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pastikan folder upload ada
const MUSIC_DIR = path.join(__dirname, 'uploads', 'music');
const COVERS_DIR = path.join(__dirname, 'uploads', 'covers');
[MUSIC_DIR, COVERS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* ============ MULTER (UPLOAD FILE) ============ */
// Upload lagu baru: butuh audio (wajib) + cover (opsional)
const songStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === 'cover' ? COVERS_DIR : MUSIC_DIR);
  },
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'cover' ? 'cover' : 'audio';
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  }
});
const uploadSong = multer({ storage: songStorage });

// Upload cover playlist (foto profil playlist)
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, COVERS_DIR),
  filename: (req, file, cb) => {
    cb(null, `cover-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  }
});
const uploadCover = multer({ storage: coverStorage });

/* ============ API ROUTES: SONGS ============ */
app.get('/api/songs', (req, res) => {
  res.json(db.getAllSongs());
});

app.post('/api/songs', uploadSong.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: 'Judul dan nama artis wajib diisi' });
  }
  const audioFile = req.files?.audio?.[0];
  if (!audioFile) {
    return res.status(400).json({ error: 'File audio wajib diupload' });
  }
  const coverFile = req.files?.cover?.[0];

  const newSong = db.addSong({
    title,
    artist,
    src: `/uploads/music/${audioFile.filename}`,
    cover: coverFile ? `/uploads/covers/${coverFile.filename}` : ''
  });
  res.json(newSong);
});

app.patch('/api/songs/:id/favorite', (req, res) => {
  const updated = db.toggleFavorite(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Lagu tidak ditemukan' });
  res.json(updated);
});

app.delete('/api/songs/:id', (req, res) => {
  const ok = db.deleteSong(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Lagu tidak ditemukan' });
  res.json({ message: 'Lagu berhasil dihapus' });
});

/* ============ API ROUTES: PLAYLISTS ============ */
app.get('/api/playlists', (req, res) => {
  res.json(db.getAllPlaylists());
});

app.post('/api/playlists', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama playlist wajib diisi' });
  }
  const newPlaylist = db.addPlaylist(name.trim());
  res.json(newPlaylist);
});

app.put('/api/playlists/:id', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama playlist wajib diisi' });
  }
  const updated = db.renamePlaylist(req.params.id, name.trim());
  if (!updated) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  res.json(updated);
});

app.delete('/api/playlists/:id', (req, res) => {
  const ok = db.deletePlaylist(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  res.json({ message: 'Playlist berhasil dihapus', id: req.params.id });
});

// Upload/ganti foto cover playlist
app.post('/api/playlists/:id/cover', uploadCover.single('cover'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File cover wajib diupload' });
  const updated = db.setPlaylistCover(req.params.id, `/uploads/covers/${req.file.filename}`);
  if (!updated) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  res.json(updated);
});

// Ambil semua lagu di dalam satu playlist
app.get('/api/playlists/:id/songs', (req, res) => {
  const pl = db.getPlaylistById(req.params.id);
  if (!pl) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  res.json(db.getPlaylistSongs(req.params.id));
});

// Tambah lagu ke playlist
app.post('/api/playlists/:id/songs', (req, res) => {
  const { songId } = req.body;
  if (!songId) return res.status(400).json({ error: 'songId wajib dikirim' });
  const updated = db.addSongToPlaylist(req.params.id, songId);
  if (!updated) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  res.json(updated);
});

// Hapus lagu dari playlist
app.delete('/api/playlists/:id/songs/:songId', (req, res) => {
  const updated = db.removeSongFromPlaylist(req.params.id, req.params.songId);
  if (!updated) return res.status(404).json({ error: 'Playlist tidak ditemukan' });
  res.json(updated);
});

// Fallback route untuk SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Listener khusus lokal (bukan Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
