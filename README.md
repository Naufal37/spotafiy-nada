# nada.

Pemutar musik dengan antarmuka gelap ala **Spotify Web Player**: sidebar
navigasi, bilah pemutar bawah, panel lirik/antrean, pencarian, Home, dan
Playlists. Katalog lagu diambil dari **Spotify Web API**, lirik dari **LRCLIB**,
dan semua data pribadi (favorit, playlist, riwayat, volume) disimpan di
`localStorage` browser — tanpa akun sendiri, tanpa database.

Desain mengikuti spesifikasi Spotify (`design.md`): kanvas `#121212`,
color-blocking tanpa shadow, tombol pill, tipografi dan skala spacing yang
konsisten.

## Stack

- React 19 + Vite 6 + TypeScript
- Spotify Web API lewat proxy serverless `/api/spotify` (Client Secret aman di server)
- Web Playback SDK (butuh Spotify Premium) + fallback preview 30 detik
- LRCLIB untuk lirik (tanpa API key)
- Lagu import lokal dari `public/audio/imports/` + efek 8D (Web Audio API);
  file yang efeknya sudah ada (10D) diputar apa adanya

## Menjalankan lokal

1. Install dependency:

   ```powershell
   & "C:\Program Files\nodejs\npm.cmd" install
   ```

2. Salin `.env.example` menjadi `.env.local`, lalu isi:

   ```env
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   ```

3. Jalankan:

   ```powershell
   & "C:\Program Files\nodejs\npm.cmd" run dev
   ```

   Buka <http://127.0.0.1:5173>.

> Di PowerShell, `npm` bisa diblokir execution policy. Pakai `npm.cmd` seperti
> contoh di atas, atau `cmd /c npm run dev`.

## Membuat aplikasi Spotify

1. Buka <https://developer.spotify.com/dashboard> → **Create app**.
2. Isi nama bebas (mis. `nada player`) dan Redirect URI:
   - `http://127.0.0.1:5173/` untuk lokal (Spotify menolak `localhost` sejak April 2025)
   - `https://<domain-vercel-kamu>/` untuk produksi
3. Salin **Client ID** dan **Client Secret**.
4. Di dashboard Spotify, buka **Settings → User Management** dan tambahkan akun
   Spotify yang akan dipakai (Developer mode membatasi 25 user).

Catatan:

- Katalog, pencarian, dan artwork **tidak butuh login** — cukup Client ID +
  Secret di server (Client Credentials).
- Login Spotify (PKCE) hanya untuk memutar lagu **utuh** lewat Web Playback SDK.
  Akun harus **Premium**; akun Free hanya dapat preview 30 detik kalau lagunya
  menyediakan `preview_url` (Spotify sering mengosongkannya).
- Spotify **Audio Features** sudah ditutup untuk aplikasi baru, jadi angka
  Energy/Warmth/Tempo di panel "The vibe" adalah **perkiraan dari metadata**
  (populeritas, tahun rilis, durasi) — bukan analisis audio. Labelnya sudah
  ditulis jujur di UI.

## Build & deploy

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build   # tsc --noEmit + vite build
& "C:\Program Files\nodejs\npm.cmd" run preview # cek hasil build
```

Vercel:

1. Import repo, Framework Preset **Vite** (sudah diatur di `vercel.json`).
2. Tambahkan Environment Variables `SPOTIFY_CLIENT_ID` dan `SPOTIFY_CLIENT_SECRET`.
3. Deploy. Tambahkan domain hasil deploy ke Redirect URI aplikasi Spotify.
4. `/api/config` dipakai frontend untuk tahu apakah Spotify sudah dikonfigurasi;
   `/api/spotify` adalah proxy dengan allowlist endpoint dan cache 120 detik.

## Batasan yang disengaja

- Tidak ada login admin, upload via browser, atau database sendiri. Lagu import
  ditaruh manual di `public/audio/imports/` lalu didaftarkan di `manifest.json`.
- Tidak ada lirik karangan: kalau LRCLIB tidak punya lagunya, panel kosong.
- Tidak ada tombol dekoratif: semua kontrol berfungsi, dan yang belum ada
  sumbernya diberi label jelas.
- Mood sync hanya mengubah suasana visual, bukan menganalisis audio.
- Efek 8D (HRTF orbit) hanya berlaku untuk lagu import: Spotify SDK tidak bisa
  di-routing ke Web Audio, jadi efek tidak dipaksakan ke lagu Spotify.
- Mode Split memakai crossfade gain antar kanal kiri/kanan, bukan pan biasa.
- Entri manifest dengan `preserveEffects: true` tidak melewati Web Audio sama
  sekali (dipakai untuk file yang efek 10D-nya sudah tertanam).
- Stem vokal/instrumen hasil Demucs disimpan lokal di `public/audio/imports/`
  dan tidak otomatis di-commit kalau tidak mau dipublish.
- `prefers-reduced-motion` dihormati; semua kontrol punya label `aria`.

## Struktur

```
api/            endpoint serverless (config + proxy Spotify), mandiri tanpa import lokal
src/
  components/   sidebar, player bar, side panel, search, cards, icons
  lib/          auth PKCE, player, library, storage, lyrics, vibe, spotify client
  views/        Home, Library (Playlists)
  styles/       token & seluruh styling Spotify-inspired
```

Data lama (MP3/cover versi sebelumnya) dipindahkan ke
`D:\nada-fullstack-backup\uploads` sebelum dihapus dari repo.
