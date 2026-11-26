# Lagu import lokal (efek 8D)

Folder ini dipakai aplikasi **nada.** untuk lagu-lagu yang diputar lewat jalur
lokal, bukan Spotify. Jalur lokal bisa diproses Web Audio, jadi efek 8D
(binaural/spatial) benar-benar berlaku di sini.

## Menambah lagu

1. Taruh file audio di folder ini (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`, `.aac`).
2. Pakai nama file lowercase tanpa spasi, misalnya `lagu-binaural-01.mp3`.
3. Tambahkan entri di `manifest.json`:

   ```json
   {
     "id": "lagu-binaural-01",
     "title": "Judul Lagu",
     "artist": "Nama Artis",
     "album": "Album",
     "file": "lagu-binaural-01.mp3"
   }
   ```

`durationMs` tidak wajib — aplikasi membaca durasi dari metadata file.

## Stem vokal / instrumen

Kalau lagu sudah dipisah (misalnya dengan Demucs), tambahkan `stems`:

```json
{
  "id": "illit-magnetic",
  "title": "Magnetic",
  "artist": "ILLIT",
  "file": "illit-magnetic.mp3",
  "stems": {
    "vocals": "illit-magnetic_vocals.mp3",
    "instrumental": "illit-magnetic_no_vocals.mp3"
  }
}
```

Lagu dengan `stems` diputar dari kedua file secara sinkron: vokal di satu
telinga, instrumen di telinga lainnya, lalu kedua sisi ditukar tiap 6 detik
dengan transisi halus. Tombol di pemutar berubah dari **8D** jadi **Split**
dan bisa mematikan efek supaya kembali ke mix normal.

Aplikasi membaca daftar ini dari `/audio/imports/manifest.json`. Karena satu
origin dengan halaman, tidak ada masalah CORS dan file bisa langsung masuk
`AudioContext`.

## Efek 8D

Tombol **8D** di bilah pemutar mengaktifkan/mematikan efek. Perpindahannya
pakai `setTargetAtTime` (crossfade kering–basah) dan perputaran pan mengikuti
gelombang sinus, jadi tidak ada suara "klik" atau lompatan mendadak. Status
tombol disimpan di `localStorage`.

> Vite menyalin seluruh isi `public/` ke `dist/` saat build. File di sini ikut
> ter-deploy ke Vercel — jangan taruh file privat di folder ini.
