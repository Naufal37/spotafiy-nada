# nada.

Pemutar musik malam hari: panel Now Playing besar, panel lirik/antrean, dan
navbar liquid glass. Katalog lagu dan **streaming MP3 penuh** diambil dari
**Jamendo API** (lisensi Creative Commons, gratis, tanpa akun Premium), lirik
dari **LRCLIB**, dan semua data pribadi (favorit, playlist, riwayat, volume,
mood sync) disimpan di `localStorage` browser — tanpa akun sendiri, tanpa
database.

Desain mengikuti spesifikasi **Nocturne** (`design.md`): gelap, neon dusk,
panel kaca, aksen oranye/pink.

## Stack

- React 19 + Vite 6 + TypeScript
- `webgl-liquid-glass` untuk navbar (fallback CSS otomatis kalau WebGL tidak tersedia)
- Jamendo Web API lewat proxy serverless `/api/jamendo` (Client ID aman di server)
- Pemutar `<audio>` biasa untuk streaming MP3 Jamendo — **tidak perlu Spotify Premium, tidak perlu login**
- LRCLIB untuk lirik (tanpa API key)

## Menjalankan lokal

1. Install dependency:

   ```powershell
   & "C:\Program Files\nodejs\npm.cmd" install
   ```

2. Dapatkan `client_id` Jamendo (gratis):

   - Buka <https://devportal.jamendo.com>, daftar developer account.
   - Buat **application** (plan *read only* sudah cukup untuk semua fitur di sini).
   - Salin **Client ID** aplikasi tersebut.
   - Catatan: Jamendo menyediakan `709fa152` hanya untuk **testing read API** —
     boleh dipakai untuk mencoba, tapi sebaiknya pakai ID aplikasi sendiri untuk deploy.

3. Salin `.env.example` menjadi `.env.local`, lalu isi:

   ```env
   JAMENDO_CLIENT_ID=client_id_dari_devportal
   ```

4. Jalankan:

   ```powershell
   & "C:\Program Files\nodejs\npm.cmd" run dev
   ```

   Buka <http://127.0.0.1:5173>.

> Di PowerShell, `npm` bisa diblokir execution policy. Pakai `npm.cmd` seperti
> contoh di atas, atau `cmd /c npm run dev`.

## Kenapa berhenti pakai Spotify?

Sejak 2026 Spotify menolak permintaan **katalog** dari aplikasi yang dibuat
dengan akun Free (HTTP 403 "Active premium subscription required"). Web Playback
SDK juga hanya bisa memutar lagu utuh di akun Premium, sementara `preview_url`
sering kosong. Jamendo tidak punya syarat itu: endpoint baca gratis dan setiap
track punya URL `audio` MP3 yang bisa diputar penuh.

Konsekuensinya, katalog sekarang berisi musik indie/CC dari Jamendo — bukan lagi
lagu-lagu mainstream Spotify. Itu trade-off yang disengaja supaya aplikasi tetap
legal dan bisa dipakai tanpa berlangganan.

## Build & deploy

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build   # tsc --noEmit + vite build
& "C:\Program Files\nodejs\npm.cmd" run preview # cek hasil build
```

Vercel:

1. Import repo, Framework Preset **Vite** (sudah diatur di `vercel.json`).
2. Tambahkan Environment Variable `JAMENDO_CLIENT_ID`.
3. Deploy.
4. `/api/config` dipakai frontend untuk tahu apakah Jamendo sudah dikonfigurasi;
   `/api/jamendo` adalah proxy dengan allowlist path (`tracks`,
   `tracks/similar`, `artists`, `albums`), cache 300 detik, dan pembersihan
   field `waveform` supaya respons lebih ringan.

## Batasan yang disengaja

- Tidak ada login, upload MP3, atau database sendiri. Favorit/playlist/riwayat
  tetap tersimpan di browser masing-masing.
- Hanya lagu dengan lisensi Creative Commons/Pro dari Jamendo yang muncul.
- Tidak ada lirik karangan: kalau LRCLIB tidak punya lagunya, panel kosong.
- Tidak ada tombol dekoratif: semua kontrol berfungsi, dan yang belum ada
  sumbernya diberi label jelas.
- Angka Energy/Warmth/Tempo di panel "The vibe" adalah **perkiraan dari metadata**
  (tahun rilis dan durasi), bukan analisis audio.
- Mood sync hanya mengubah suasana visual (aurora latar), bukan menganalisis audio.
- `prefers-reduced-motion` dihormati; navbar dan kontrol punya label `aria`.

## Struktur

```
api/            endpoint serverless (config + proxy Jamendo), mandiri tanpa import lokal
src/
  components/   navbar, Now Playing, side panel, search, visualizer, dll.
  lib/          jamendo client, player, library, storage, lyrics, vibe
  views/        Listen now, Moods, Library, Radio
  styles/       token & seluruh styling Nocturne
```
