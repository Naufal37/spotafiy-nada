import type { Playlist, Track } from '../types';

const PREFIX = 'nada.v2';
const FAVORITES_KEY = `${PREFIX}.favorites`;
const RECENT_KEY = `${PREFIX}.recent`;
const PLAYLISTS_KEY = `${PREFIX}.playlists`;
const VOLUME_KEY = `${PREFIX}.volume`;
const QUEUE_KEY = `${PREFIX}.queue`;

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage penuh atau mode privat — abaikan, aplikasi tetap jalan */
  }
}

/**
 * Data dari versi Jamendo punya `streamUrl` tapi tidak punya `uri`, jadi tidak
 * bisa diputar oleh pemutar Spotify. Saring supaya favorit/playlist lama tidak
 * bikin error saat dibuka kembali setelah balik ke Spotify.
 */
function isSpotifyTrack(value: unknown): value is Track {
  if (!value || typeof value !== 'object') return false;
  const track = value as Partial<Track>;
  return typeof track.uri === 'string' && track.uri.length > 0;
}

function loadTracks(key: string): Track[] {
  return readJson<Track[]>(key, []).filter(isSpotifyTrack);
}

export const storage = {
  loadFavorites: (): Track[] => loadTracks(FAVORITES_KEY),
  saveFavorites: (tracks: Track[]) => writeJson(FAVORITES_KEY, tracks.slice(0, 200)),

  loadRecent: (): Track[] => loadTracks(RECENT_KEY),
  saveRecent: (tracks: Track[]) => writeJson(RECENT_KEY, tracks.slice(0, 30)),

  loadPlaylists: (): Playlist[] =>
    readJson<Playlist[]>(PLAYLISTS_KEY, []).map((playlist) => ({
      ...playlist,
      tracks: Array.isArray(playlist.tracks) ? playlist.tracks.filter(isSpotifyTrack) : [],
    })),
  savePlaylists: (playlists: Playlist[]) => writeJson(PLAYLISTS_KEY, playlists),

  loadVolume: (): number => {
    const value = readJson<number>(VOLUME_KEY, 0.75);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.75;
  },
  saveVolume: (value: number) => writeJson(VOLUME_KEY, value),

  loadQueue: (): Track[] => loadTracks(QUEUE_KEY),
  saveQueue: (tracks: Track[]) => writeJson(QUEUE_KEY, tracks.slice(0, 80)),
};
