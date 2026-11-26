# Lagu import lokal (efek 10D)

Folder ini dipakai aplikasi **nada.** untuk lagu-lagu yang diputar lewat jalur
lokal, bukan Spotify. Jalur lokal bisa diproses Web Audio, jadi efek 10D
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

Lagu dengan `stems` diputar dari kedua file secara sinkron: vokal **hard-left**,
instrumen **hard-right**, lalu kedua sisi ditukar tiap 10 detik lewat
*equal-power crossfade* 1,8 detik (cos/sin, volume tidak turun di tengah).
Tombol di pemutar
berubah dari **8D** jadi **Split** dan bisa mematikan efek supaya kembali ke mix
normal.

Untuk lagu tanpa stem, efek 10D memakai `PannerNode` HRTF yang mengorbit
mengelilingi kepala tiap ~8 detik, bukan sekadar StereoPanner.

## Efek sudah tertanam di file

Kalau audio sudah diproses di luar aplikasi (misalnya file 10D), tambahkan
`"preserveEffects": true`. Lagu diputar apa adanya lewat elemen audio biasa,
tanpa `AudioContext` / HRTF / stem, dan tombol efek di pemutar dinonaktifkan:

```json
{
  "id": "a2o-lite-neon-10d",
  "title": "NEON",
  "artist": "A2O LITE",
  "file": "a2o-lite-neon-10d.mp3",
  "durationMs": 208820,
  "preserveEffects": true
}
```

Aplikasi membaca daftar ini dari `/audio/imports/manifest.json`. Karena satu
origin dengan halaman, tidak ada masalah CORS dan file bisa langsung masuk
`AudioContext`.

## Efek 10D (di-model dari NEON – A2O LITE)

Parameter efek diukur dari file referensi `a2o-lite-neon-10d.mp3`:

- Modulasi keseimbangan kiri/kanan ~0,128 Hz → **satu putaran ~8 detik**.
- ITD (perbedaan waktu antar telinga) mencapai **±0,7–1 ms** dan berubah tanda,
  ciri khas *binaural panner* HRTF yang berputar.
- Bass di bawah ~200 Hz hampir mono (korelasi L/R ~0,92), jadi crossover
  **lowpass 200 Hz** dilewatkan lurus dan hanya mid/high yang di-orbitkan.
- Tidak ada slapback/echo 120 ms yang jelas; delay sengaja dikecilkan jadi
  early reflection ~35 ms dengan feedback 0,08 supaya tidak mengganggu bass.

Tombol **10D** di bilah pemutar mengaktifkan/mematikan efek. Perpindahannya
pakai `setTargetAtTime` (crossfade kering–basah), jadi tidak ada suara "klik"
atau lompatan mendadak. Status tombol disimpan di `localStorage`.

File yang efek 10D-nya sudah tertanam (seperti NEON) tetap diputar apa adanya
dan tombolnya dinonaktifkan — efek di atas dipakai untuk lagu import lainnya.

Untuk mengukur lagu referensi lain:

```bash
python -m pip install numpy imageio-ffmpeg
python scripts/analyze_spatial.py public/audio/imports/nama-lagu.mp3
```

> Vite menyalin seluruh isi `public/` ke `dist/` saat build. File di sini ikut
> ter-deploy ke Vercel — jangan taruh file privat di folder ini.
