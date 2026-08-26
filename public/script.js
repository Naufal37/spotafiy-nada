/* ==========================================================
   NADA — Spotify Style Music Player — script.js
   ========================================================== */

// 1. Inisialisasi Supabase
const SUPABASE_URL = 'https://pmoxyvqqaupzlkqldtwv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pYIiD94eQVX-MsR919hP6A_WOLwOI9t';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============ STATE ============ */
const state = {
  songs: [],
  playlists: [],
  currentId: null,
  isPlaying: false,
  shuffle: false,
  repeat: false,
  activePlaylistId: null,
  activePlaylistSongs: []
};

/* ============ DOM SHORTCUTS ============ */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const audioEl = $('#audioEl');

function getSong(id) {
  return state.songs.find(s => s.id === Number(id));
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ============ SUPABASE API CALLS ============ */
async function fetchSongs() {
  try {
    const { data, error } = await supabaseClient
      .from('songs')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    state.songs = data || [];
  } catch (err) {
    console.error('Gagal mengambil daftar lagu:', err);
  }
}

async function fetchPlaylists() {
  try {
    const { data, error } = await supabaseClient
      .from('playlists')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    state.playlists = data || [];
  } catch (err) {
    console.error('Gagal mengambil playlist:', err);
  }
}

async function toggleFavoriteAPI(id) {
  try {
    const song = getSong(id);
    if (!song) return;

    const newFavStatus = !song.isFavorite;

    const { data, error } = await supabaseClient
      .from('songs')
      .update({ isFavorite: newFavStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const idx = state.songs.findIndex(s => s.id === id);
    if (idx > -1) state.songs[idx] = data;
  } catch (err) {
    console.error('Gagal memperbarui status favorit:', err);
  }
}

async function deleteSongAPI(id) {
  try {
    const { error } = await supabaseClient
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    state.songs = state.songs.filter(s => s.id !== id);
    if (state.currentId === id) {
      state.currentId = null;
      if (audioEl) {
        audioEl.pause();
        audioEl.src = '';
      }
      resetPlayerUI();
    }
  } catch (err) {
    console.error('Gagal menghapus lagu:', err);
  }
}

/* ============ CARD RENDERING ============ */
function songCardHTML(song) {
  const isCurrent = state.currentId === song.id;
  return `
    <div class="song-card ${isCurrent ? 'playing' : ''}" data-id="${song.id}">
      <div class="card-cover ${song.cover ? '' : 'cover-fallback'}">
        ${song.cover ? `<img src="${song.cover}" alt="${escapeHtml(song.title)}" loading="lazy">` : `<svg class="cover-note" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`}
        <button class="card-heart ${song.isFavorite ? 'active' : ''}" data-action="favorite" data-id="${song.id}" title="Favorit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${song.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 6 3.5 4 7.5C19 16.65 12 21 12 21z"/></svg>
        </button>
        <button class="card-delete" data-action="delete" data-id="${song.id}" title="Hapus lagu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
        </button>
        <button class="card-play-btn" data-action="play" data-id="${song.id}" title="Putar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <p class="card-title">${escapeHtml(song.title)}</p>
      <p class="card-artist">${escapeHtml(song.artist)}</p>
    </div>
  `;
}

function renderGrid(containerId, songs) {
  const el = $(containerId);
  if (!el) return;
  el.innerHTML = songs.length
    ? songs.map(songCardHTML).join('')
    : '';
}

function attachGlobalListeners() {
  document.body.addEventListener('click', async (e) => {
    const favBtn = e.target.closest('[data-action="favorite"]');
    if (favBtn) {
      e.stopPropagation();
      await toggleFavoriteAPI(Number(favBtn.dataset.id));
      refreshAllRenders();
      updatePlayerHeart();
      return;
    }

    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn) {
      e.stopPropagation();
      if (confirm('Hapus lagu ini dari koleksi?')) {
        await deleteSongAPI(Number(delBtn.dataset.id));
        refreshAllRenders();
      }
      return;
    }

    const playBtn = e.target.closest('[data-action="play"]');
    if (playBtn) {
      e.stopPropagation();
      playSong(Number(playBtn.dataset.id));
      return;
    }

    const card = e.target.closest('.song-card');
    if (card) {
      playSong(Number(card.dataset.id));
      return;
    }
  });
}

/* ============ RENDER SECTIONS ============ */
function renderHome() {
  const recent = [...state.songs].slice(0, 6);
  renderGrid('#recentGrid', recent);
  renderGrid('#popularGrid', state.songs);
  toggleEmpty('#recentEmpty', recent.length === 0);
}

function renderRekomendasi() {
  renderGrid('#allSongsGrid', state.songs);
  toggleEmpty('#allSongsEmpty', state.songs.length === 0);
}

function renderFavorit() {
  const favSongs = state.songs.filter(s => s.isFavorite);
  renderGrid('#favoritGrid', favSongs);
  toggleEmpty('#favoritEmpty', favSongs.length === 0);
}

function toggleEmpty(selector, isEmpty) {
  const el = $(selector);
  if (el) el.style.display = isEmpty ? 'block' : 'none';
}

/* ============ PLAYLIST FUNCTIONS ============ */
async function renderPlaylists() {
  await fetchPlaylists();

  const mainList = $('#playlistList');
  const homeList = $('#playlistListHome');

  if (!state.playlists || state.playlists.length === 0) {
    const emptyHtml = '<p class="empty-msg">Belum ada playlist.</p>';
    if (mainList) mainList.innerHTML = emptyHtml;
    if (homeList) homeList.innerHTML = emptyHtml;
    return;
  }

  const htmlContent = state.playlists.map(p => {
    const initials = (p.name || '?').trim().charAt(0).toUpperCase();
    const coverInner = p.cover
      ? `<img class="playlist-item-cover" src="${p.cover}" alt="">`
      : `<div class="playlist-item-cover" style="display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-weight:800;color:var(--muted);">${initials}</div>`;
    return `
      <div class="playlist-item ${state.activePlaylistId === p.id ? 'active' : ''}" onclick="selectPlaylist(${p.id})">
        ${coverInner}
        <div style="min-width:0;">
          <div class="playlist-item-name">${escapeHtml(p.name)}</div>
        </div>
      </div>
    `;
  }).join('');

  if (mainList) mainList.innerHTML = htmlContent;
  if (homeList) homeList.innerHTML = htmlContent;
}

async function selectPlaylist(id) {
  state.activePlaylistId = id;
  const pl = state.playlists.find(p => p.id === id);
  if (!pl) return;

  const details = [
    $('#playlistDetail'),
    $('#playlistDetailHome')
  ].filter(Boolean);

  try {
    // Ambil lagu-lagu dalam playlist lewat tabel playlist_songs
    const { data: relations, error: relErr } = await supabaseClient
      .from('playlist_songs')
      .select('song_id')
      .eq('playlist_id', id);

    if (relErr) throw relErr;

    const songIds = (relations || []).map(r => r.song_id);
    
    if (songIds.length > 0) {
      const { data: songsData, error: songsErr } = await supabaseClient
        .from('songs')
        .select('*')
        .in('id', songIds);
      
      if (songsErr) throw songsErr;
      state.activePlaylistSongs = songsData || [];
    } else {
      state.activePlaylistSongs = [];
    }

    const playlistCover = pl.cover || '';
    const coverImgHtml = playlistCover
      ? `<img class="pl-banner-cover" id="playlistCoverImg-${id}" src="${playlistCover}" alt="" title="Klik untuk ganti sampul" onclick="document.getElementById('playlistCoverInput-${id}').click()">`
      : `<div class="pl-banner-cover" id="playlistCoverImg-${id}" title="Klik untuk pasang sampul" onclick="document.getElementById('playlistCoverInput-${id}').click()" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2A2338,#1A1624);font-family:'Sora',sans-serif;font-weight:800;font-size:40px;color:var(--muted);cursor:pointer;">${escapeHtml((pl.name||'?').trim().charAt(0).toUpperCase())}</div>`;

    const totalDuration = state.activePlaylistSongs.reduce((sum, s) => sum + (s.duration || 0), 0);

    const rowsHtml = state.activePlaylistSongs.length === 0
      ? `<div class="track-list-empty">Playlist ini masih kosong. Klik <strong>+ Tambah Lagu</strong> buat mulai isi.</div>`
      : state.activePlaylistSongs.map((s, index) => {
          const isThisPlaying = state.currentId === s.id && state.isPlaying;
          const numOrEq = isThisPlaying
            ? `<span class="eq-bars"><span></span><span></span><span></span></span>`
            : String(index + 1).padStart(2, '0');
          return `
            <div class="track-row ${isThisPlaying ? 'playing' : ''}" onclick="playPlaylistSong(${index})">
              <div class="track-num">${numOrEq}</div>
              <div class="track-info">
                ${s.cover ? `<img class="track-thumb" src="${s.cover}" alt="">` : `<div class="track-thumb"></div>`}
                <div class="track-text">
                  <div class="track-title">${escapeHtml(s.title)}</div>
                  <div class="track-artist">${escapeHtml(s.artist)}</div>
                </div>
              </div>
              <div class="track-album">${escapeHtml(s.album || s.title)}</div>
              <div class="track-time">
                ${fmtTime(s.duration || 0)}
                <button class="track-remove" onclick="event.stopPropagation(); removeSongFromPlaylist(${id}, ${s.id})" title="Hapus dari playlist">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
                </button>
              </div>
            </div>
          `;
        }).join('');

    const playPauseIcon = (state.isPlaying && state.activePlaylistSongs.some(s => s.id === state.currentId))
      ? `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`
      : `<path d="M8 5v14l11-7z"/>`;

    const detailHtml = `
      <div class="pl-banner">
        ${coverImgHtml}
        <input type="file" id="playlistCoverInput-${id}" accept="image/*" style="display:none;" onchange="uploadPlaylistCover(event, ${id})">
        <div style="min-width:0;">
          <p class="pl-eyebrow">Playlist</p>
          <h1 class="pl-title">${escapeHtml(pl.name)}</h1>
          <p class="pl-meta"><strong>${state.activePlaylistSongs.length}</strong> lagu ${totalDuration ? `· ${fmtTime(totalDuration)}` : ''}</p>
        </div>
      </div>

      <div class="pl-toolbar">
        <button class="pl-play-btn" onclick="togglePlayPlaylist()" title="Putar semua">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">${playPauseIcon}</svg>
        </button>
        <button class="pl-toolbar-btn" onclick="openAddSongModal(${id})">+ Tambah Lagu</button>
        <button class="pl-toolbar-btn" onclick="renamePlaylist(${id}, '${escapeHtml(pl.name).replace(/'/g, "\\'")}')">Ganti Nama</button>
        <button class="pl-toolbar-btn danger" onclick="deletePlaylist(${id})">Hapus Playlist</button>
      </div>

      <div class="track-list">
        ${state.activePlaylistSongs.length ? `
        <div class="track-list-head">
          <div>#</div>
          <div>Judul</div>
          <div class="col-album">Album</div>
          <div style="text-align:right;">Durasi</div>
        </div>` : ''}
        ${rowsHtml}
      </div>
    `;

    details.forEach(el => { el.innerHTML = detailHtml; });
  } catch (err) {
    console.error('Error memuat detail playlist:', err);
  }
}

function togglePlayPlaylist() {
  if (!state.activePlaylistSongs || state.activePlaylistSongs.length === 0) return;

  const currentPlayingInPlaylist = state.activePlaylistSongs.find(s => s.id === state.currentId);

  if (currentPlayingInPlaylist) {
    if (audioEl.paused) {
      audioEl.play().catch(() => {});
    } else {
      audioEl.pause();
    }
  } else {
    playPlaylistSong(0);
  }
}

async function uploadPlaylistCover(event, playlistId) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `playlist-covers/${playlistId}_${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabaseClient.storage
      .from('media')
      .upload(filePath, file);

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabaseClient.storage
      .from('media')
      .getPublicUrl(filePath);

    const { error: updateErr } = await supabaseClient
      .from('playlists')
      .update({ cover: urlData.publicUrl })
      .eq('id', playlistId);

    if (updateErr) throw updateErr;

    await renderPlaylists();
    await selectPlaylist(playlistId);
  } catch (err) {
    console.error('Gagal mengunggah foto playlist:', err);
  }
}

function openAddSongModal(playlistId) {
  let overlay = $('#addSongModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'addSongModal';
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  const optionsHtml = state.songs.map(s => `
    <div class="modal-song-row" onclick="addSongToPlaylist(${playlistId}, ${s.id})">
      <div class="modal-song-info">
        ${s.cover ? `<img class="modal-song-thumb" src="${s.cover}" alt="">` : `<div class="modal-song-thumb"></div>`}
        <div style="min-width:0;">
          <div class="modal-song-title">${escapeHtml(s.title)}</div>
          <div class="modal-song-artist">${escapeHtml(s.artist)}</div>
        </div>
      </div>
      <button class="modal-add-btn">+ Add</button>
    </div>
  `).join('');

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-head">
        <h3>Tambahkan Lagu ke Playlist</h3>
        <button class="modal-close" onclick="$('#addSongModal').remove()">✕</button>
      </div>
      <div class="modal-list">
        ${optionsHtml.length ? optionsHtml : '<p class="modal-empty">Belum ada lagu terdaftar.</p>'}
      </div>
    </div>
  `;
}

async function addSongToPlaylist(playlistId, songId) {
  try {
    const { error } = await supabaseClient
      .from('playlist_songs')
      .insert({ playlist_id: playlistId, song_id: songId });

    if (error) throw error;

    if ($('#addSongModal')) $('#addSongModal').remove();
    await selectPlaylist(playlistId);
  } catch (err) {
    console.error('Gagal menambahkan lagu ke playlist:', err);
  }
}

async function removeSongFromPlaylist(playlistId, songId) {
  try {
    const { error } = await supabaseClient
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);

    if (error) throw error;

    await selectPlaylist(playlistId);
  } catch (err) {
    console.error('Gagal menghapus lagu dari playlist:', err);
  }
}

function playPlaylistSong(index) {
  if (!state.activePlaylistSongs || state.activePlaylistSongs.length === 0) return;
  const songToPlay = state.activePlaylistSongs[index];
  if (songToPlay) {
    playSong(songToPlay.id);
  }
}

async function renamePlaylist(id, oldName) {
  const newName = prompt('Masukkan nama playlist baru:', oldName);
  if (!newName || newName.trim() === '' || newName === oldName) return;

  try {
    const { error } = await supabaseClient
      .from('playlists')
      .update({ name: newName.trim() })
      .eq('id', id);

    if (error) throw error;

    await renderPlaylists();
    await selectPlaylist(id);
  } catch (err) {
    console.error('Gagal mengubah nama playlist:', err);
  }
}

async function deletePlaylist(id) {
  if (!confirm('Apakah kamu yakin ingin menghapus playlist ini?')) return;

  try {
    const { error } = await supabaseClient
      .from('playlists')
      .delete()
      .eq('id', id);

    if (error) throw error;

    state.activePlaylistId = null;
    await renderPlaylists();

    const emptyMsg = '<p class="empty-msg">Pilih playlist untuk melihat isinya.</p>';
    if ($('#playlistDetail')) $('#playlistDetail').innerHTML = emptyMsg;
    if ($('#playlistDetailHome')) $('#playlistDetailHome').innerHTML = emptyMsg;
  } catch (err) {
    console.error('Gagal menghapus playlist:', err);
  }
}

function setupPlaylistForm(formId, inputId) {
  const form = $(`#${formId}`);
  if (!form) return;

  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $(`#${inputId}`);
    if (!input) return;

    const name = input.value.trim();
    if (!name) return;

    try {
      const { error } = await supabaseClient
        .from('playlists')
        .insert({ name });

      if (error) throw error;

      input.value = '';
      await renderPlaylists();
    } catch (err) {
      console.error('Gagal membuat playlist:', err);
    }
  });
}

/* ============ UPLOAD LAGU KE SUPABASE ============ */
function setupUploadForm() {
  const form = $('#uploadForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = $('#uploadStatus');
    const submitBtn = $('#uploadSubmitBtn');

    const title = form.querySelector('[name="title"]')?.value || 'Tanpa Judul';
    const artist = form.querySelector('[name="artist"]')?.value || 'Anonim';
    const audioFile = form.querySelector('[name="audio"]')?.files[0];
    const coverFile = form.querySelector('[name="cover"]')?.files[0];

    if (!audioFile) {
      if (statusEl) { statusEl.textContent = 'Pilih file lagu (.mp3)!'; statusEl.style.color = '#ff6b6b'; }
      return;
    }

    if (statusEl) { statusEl.textContent = 'Mengunggah lagu ke Supabase...'; statusEl.style.color = '#b3b3b3'; }
    if (submitBtn) submitBtn.disabled = true;

    try {
      // 1. Upload File MP3 ke Supabase Storage (Bucket "media")
      const audioPath = `songs/${Date.now()}_${audioFile.name}`;
      const { error: audioErr } = await supabaseClient.storage
        .from('media')
        .upload(audioPath, audioFile);

      if (audioErr) throw audioErr;

      const { data: audioUrlData } = supabaseClient.storage
        .from('media')
        .getPublicUrl(audioPath);

      let coverUrl = null;

      // 2. Upload Gambar Sampul (jika ada)
      if (coverFile) {
        const coverPath = `covers/${Date.now()}_${coverFile.name}`;
        const { error: coverErr } = await supabaseClient.storage
          .from('media')
          .upload(coverPath, coverFile);

        if (!coverErr) {
          const { data: coverUrlData } = supabaseClient.storage
            .from('media')
            .getPublicUrl(coverPath);
          coverUrl = coverUrlData.publicUrl;
        }
      }

      // 3. Simpan data ke Database Supabase
      const { data: songData, error: dbErr } = await supabaseClient
        .from('songs')
        .insert({
          title,
          artist,
          src: audioUrlData.publicUrl,
          cover: coverUrl
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      if (statusEl) { statusEl.textContent = `"${songData.title}" berhasil ditambahkan!`; statusEl.style.color = '#1ed760'; }
      form.reset();
      await fetchSongs();
      refreshAllRenders();
    } catch (err) {
      console.error('Gagal mengunggah lagu:', err);
      if (statusEl) { statusEl.textContent = 'Terjadi kesalahan saat mengunggah.'; statusEl.style.color = '#ff6b6b'; }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ============ SEARCH PAGE ============ */
function renderSearch(query) {
  const q = query.trim().toLowerCase();
  const results = q === '' ? [] : state.songs.filter(s =>
    s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
  );
  renderGrid('#searchGrid', results);
  toggleEmpty('#searchEmpty', results.length === 0 && q !== '');
}

function setupSearch() {
  const searchInput = $('#searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    if (q.trim() === '') return;
    showSection('search');
    if ($('#searchQueryText')) $('#searchQueryText').textContent = `Hasil pencarian untuk "${q}"`;
    renderSearch(q);
  });
}

function refreshAllRenders() {
  renderHome();
  renderRekomendasi();
  renderFavorit();
}

/* ============ NAVIGATION ============ */
function showSection(name) {
  $$('.page-section').forEach(sec => sec.classList.remove('active'));
  const target = $(`#section-${name}`);
  if (target) target.classList.add('active');

  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.section === name));
}

$$('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

/* ============ PLAYER CORE ============ */
let isSeeking = false;

function resetPlayerUI() {
  if ($('#playerTitle')) $('#playerTitle').textContent = 'Belum ada lagu';
  if ($('#playerArtist')) $('#playerArtist').textContent = 'Pilih lagu buat mulai';
  if ($('#playerCover')) $('#playerCover').src = '';
  updatePlayButtonIcon(false);
  updatePlayerHeart();
}

function getCurrentQueue() {
  if (
    state.activePlaylistId &&
    state.activePlaylistSongs &&
    state.activePlaylistSongs.some(s => s.id === state.currentId)
  ) {
    return state.activePlaylistSongs;
  }
  return state.songs;
}

function playNext() {
  const queue = getCurrentQueue();
  if (!queue.length) return;

  const idx = queue.findIndex(s => s.id === state.currentId);

  if (state.shuffle && queue.length > 1) {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * queue.length);
    } while (nextIdx === idx);
    playSong(queue[nextIdx].id);
    return;
  }

  const nextIdx = (idx + 1) % queue.length;
  playSong(queue[nextIdx].id);
}

function playPrev() {
  const queue = getCurrentQueue();
  if (!queue.length) return;

  if (audioEl && audioEl.currentTime > 3) {
    audioEl.currentTime = 0;
    return;
  }

  const idx = queue.findIndex(s => s.id === state.currentId);
  const prevIdx = idx <= 0 ? queue.length - 1 : idx - 1;
  playSong(queue[prevIdx].id);
}

function playSong(songInput) {
  const song = typeof songInput === 'object' ? songInput : getSong(songInput);
  if (!song || !audioEl) return;

  state.currentId = song.id;

  audioEl.src = song.src;
  audioEl.play().catch(err => console.error("Error memutar audio:", err));

  updatePlayerUI(song);
}

function updatePlayerUI(song) {
  const playerTitle = $('#playerTitle') || document.querySelector('.now-playing-title');
  const playerArtist = $('#playerArtist') || document.querySelector('.now-playing-artist');
  const playerCover = $('#playerCover') || document.querySelector('.now-playing-img');

  if (playerTitle) playerTitle.textContent = song.title;
  if (playerArtist) playerArtist.textContent = song.artist;
  if (playerCover) {
    playerCover.src = song.cover || '';
    playerCover.style.display = song.cover ? 'block' : 'none';
  }
  updatePlayerHeart();
}

function updatePlayerHeart() {
  const btn = $('#playerHeartBtn');
  if (!btn) return;
  const song = getSong(state.currentId);
  btn.classList.toggle('active', !!(song && song.isFavorite));
}

function updatePlayButtonIcon(isPlaying) {
  const playBtn = $('#playBtn');
  if (!playBtn) return;

  const playIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
  const pauseIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

  playBtn.innerHTML = isPlaying ? pauseIcon : playIcon;
}

$('#playBtn')?.addEventListener('click', () => {
  if (!state.currentId) {
    if (state.songs.length) playSong(state.songs[0].id);
    return;
  }
  if (audioEl.paused) {
    audioEl.play().catch(() => {});
  } else {
    audioEl.pause();
  }
});

$('#nextBtn')?.addEventListener('click', playNext);
$('#prevBtn')?.addEventListener('click', playPrev);

$('#shuffleBtn')?.addEventListener('click', (e) => {
  state.shuffle = !state.shuffle;
  e.currentTarget.classList.toggle('active', state.shuffle);
});

$('#repeatBtn')?.addEventListener('click', (e) => {
  state.repeat = !state.repeat;
  e.currentTarget.classList.toggle('active', state.repeat);
});

$('#playerHeartBtn')?.addEventListener('click', async () => {
  if (!state.currentId) return;
  await toggleFavoriteAPI(state.currentId);
  refreshAllRenders();
  updatePlayerHeart();
});

/* ============ VOLUME ============ */
function setupVolume() {
  const volumeBar = $('#volumeBar');
  if (!volumeBar || !audioEl) return;
  audioEl.volume = Number(volumeBar.value);
  volumeBar.addEventListener('input', () => {
    audioEl.volume = Number(volumeBar.value);
  });
}

/* ============ SEEK BAR ============ */
function setupSeekBar() {
  const seekBarEl = $('#seekBar');
  if (!seekBarEl || !audioEl) return;

  seekBarEl.addEventListener('input', () => {
    isSeeking = true;
    if (audioEl.duration && $('#curTime')) {
      $('#curTime').textContent = fmtTime((seekBarEl.value / 100) * audioEl.duration);
    }
  });

  seekBarEl.addEventListener('change', () => {
    if (audioEl.duration) {
      audioEl.currentTime = (seekBarEl.value / 100) * audioEl.duration;
    }
    isSeeking = false;
  });
}

/* Event Listener Audio */
audioEl?.addEventListener('play', () => {
  state.isPlaying = true;
  updatePlayButtonIcon(true);

  const playerCover = $('#playerCover') || document.querySelector('.now-playing-img');
  if (playerCover) playerCover.classList.add('playing-spin');

  refreshAllRenders();
  if (state.activePlaylistId) selectPlaylist(state.activePlaylistId);
});

audioEl?.addEventListener('pause', () => {
  state.isPlaying = false;
  updatePlayButtonIcon(false);

  const playerCover = $('#playerCover') || document.querySelector('.now-playing-img');
  if (playerCover) playerCover.classList.remove('playing-spin');

  refreshAllRenders();
  if (state.activePlaylistId) selectPlaylist(state.activePlaylistId);
});

audioEl?.addEventListener('ended', () => {
  if (state.repeat) {
    audioEl.currentTime = 0;
    audioEl.play().catch(() => {});
  } else {
    playNext();
  }
});

audioEl?.addEventListener('timeupdate', () => {
  if (!audioEl.duration) return;

  if (!isSeeking) {
    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    const seekBar = $('#seekBar');
    if (seekBar) {
      seekBar.value = pct;
      seekBar.style.setProperty('--pct', pct + '%');
    }
  }
  if ($('#curTime')) $('#curTime').textContent = fmtTime(audioEl.currentTime);
  if ($('#durTime')) $('#durTime').textContent = fmtTime(audioEl.duration);
});

/* ============ INISIALISASI APLIKASI ============ */
async function init() {
  attachGlobalListeners();
  resetPlayerUI();

  await Promise.all([fetchSongs(), fetchPlaylists()]);

  refreshAllRenders();
  await renderPlaylists();

  setupPlaylistForm('newPlaylistForm', 'newPlaylistName');
  setupPlaylistForm('newPlaylistFormHome', 'newPlaylistNameHome');
  setupUploadForm();
  setupSearch();
  setupVolume();
  setupSeekBar();
}

document.addEventListener('DOMContentLoaded', init);

// DOM Auth Elements
const loginBtn = document.getElementById('adminLoginBtn');
const logoutBtn = document.getElementById('adminLogoutBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const navTambahLagu = document.querySelector('[data-section="tambah"]');

// Sembunyikan menu Tambah Lagu secara default
if (navTambahLagu) navTambahLagu.style.display = 'none';

// Cek Sesi Login saat Halaman Dimuat
async function checkAdminAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (navTambahLagu) navTambahLagu.style.display = 'inline-block';
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (navTambahLagu) navTambahLagu.style.display = 'none';
  }
}
checkAdminAuth();

// Event Listeners Modal
if (loginBtn) loginBtn.onclick = () => loginModal.style.display = 'flex';
if (closeLoginBtn) closeLoginBtn.onclick = () => loginModal.style.display = 'none';

// Proses Login
if (submitLoginBtn) {
  submitLoginBtn.onclick = async () => {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Login Gagal: ' + error.message);
    } else {
      loginModal.style.display = 'none';
      checkAdminAuth();
      alert('Berhasil Login sebagai Admin!');
    }
  };
}

// Proses Logout
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    checkAdminAuth();
    alert('Berhasil Logout!');
  };
}