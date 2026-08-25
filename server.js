const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware parsing body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve folder static
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.get('/api/songs', (req, res) => {
  db.all('SELECT * FROM songs', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/playlists', (req, res) => {
  db.all('SELECT * FROM playlists', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/playlists', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO playlists (name) VALUES (?)', [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

app.delete('/api/playlists/:id', (req, res) => {
  const playlistId = req.params.id;
  db.run('DELETE FROM playlists WHERE id = ?', [playlistId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Playlist berhasil dihapus', id: playlistId });
  });
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