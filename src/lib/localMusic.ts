import type { Track } from '../types';

interface LocalTrackEntry {
  id: string;
  title: string;
  artist: string;
  album?: string;
  file: string;
  durationMs?: number;
}

/**
 * Daftar lagu import dibaca dari manifest di folder public supaya menambah
 * lagu tidak perlu mengubah kode — cukup taruh MP3 dan edit manifest.json.
 */
export async function loadLocalTracks(): Promise<Track[]> {
  try {
    const response = await fetch('/audio/imports/manifest.json', { cache: 'no-store' });
    if (!response.ok) return [];
    const entries: unknown = await response.json();
    if (!Array.isArray(entries)) return [];
    return entries.filter(isEntry).map(toLocalTrack);
  } catch {
    return [];
  }
}

function isEntry(value: unknown): value is LocalTrackEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<LocalTrackEntry>;
  return typeof entry.id === 'string' && typeof entry.title === 'string' && typeof entry.file === 'string';
}

function toLocalTrack(entry: LocalTrackEntry): Track {
  return {
    id: `local:${entry.id}`,
    uri: null,
    title: entry.title,
    artist: entry.artist ?? 'Lagu import',
    artistId: null,
    album: entry.album ?? 'Koleksi lokal',
    albumId: null,
    artwork: null,
    artworkSmall: null,
    durationMs: entry.durationMs ?? 0,
    previewUrl: null,
    streamUrl: `/audio/imports/${encodeURIComponent(entry.file)}`,
    explicit: false,
    popularity: 0,
    releaseYear: null,
  };
}
