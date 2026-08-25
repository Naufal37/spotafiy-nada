const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Cek keberadaan file database SQLite lokal
const dbPath = path.join(__dirname, 'data', 'music.db');
let db = null;

if (fs.existsSync(dbPath)) {
  db = new sqlite3.Database(dbPath);
}

// Data lagu fallback dengan 8 cover dari folder uploads
let songs = [
  { id: 1, title: "Style", artist: "Hearts2Hearts", src: "/uploads/songs/style.mp3", cover: "/uploads/covers/cover-1787649460687-573669513.jpg" },
  { id: 2, title: "FOCUS", artist: "Hearts2Hearts", src: "/uploads/songs/focus.mp3", cover: "/uploads/covers/cover-1787649530595-699239019.jpg" },
  { id: 3, title: "Rude", artist: "Hearts2Hearts", src: "/uploads/songs/rude.mp3", cover: "/uploads/covers/cover-1787649582387-150939654.jpg" },
  { id: 4, title: "Shape of My Heart", artist: "Backstreet Boys", src: "/uploads/songs/shape.mp3", cover: "/uploads/covers/cover-1787649644138-701692605.jpg" },
  { id: 5, title: "Lemon Tang", artist: "Hearts2Hearts", src: "/uploads/songs/lemontang.mp3", cover: "/uploads/covers/cover-1787649695655-556731487.jpg" },
  { id: 6, title: "GO", artist: "CORTIS", src: "/uploads/songs/go.mp3", cover: "/uploads/covers/cover-1787649846839-249785928.jpg" },
  { id: 7, title: "FASHION", artist: "CORTIS", src: "/uploads/songs/fashion.mp3", cover: "/uploads/covers/cover-1787649893183-873762554.jpg" },
  { id: 8, title: "ICONIC HEART", artist: "Hearts2Hearts", src: "/uploads/songs/iconic.mp3", cover: "/uploads/covers/cover-1787649929171-527971163.jpg" }
];

let playlists = [];

module.exports = {
  all: (sql, params, callback) => {
    if (typeof params === 'function') callback = params;
    if (db) {
      return db.all(sql, params, callback);
    }
    if (sql && sql.includes('playlists')) return callback(null, playlists);
    callback(null, songs);
  },
  run: function (sql, params, callback) {
    if (typeof params === 'function') callback = params;
    if (db) {
      return db.run(sql, params, callback);
    }
    if (sql && sql.includes('INSERT INTO playlists')) {
      const newPlaylist = { id: Date.now(), name: params[0] };
      playlists.push(newPlaylist);
      if (callback) callback.call({ lastID: newPlaylist.id }, null);
    } else {
      if (callback) callback(null);
    }
  }
};