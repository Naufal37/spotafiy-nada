import type { Track } from '../types';

interface LocalStemEntry {
  vocals: string;
  instrumental: string;
}

interface LocalTrackEntry {
  id: string;
  title: string;
  artist: string;
  album?: string;
  file: string;
  durationMs?: number;
  stems?: LocalStemEntry;
  /** true = efek sudah ada di file, putar apa adanya tanpa Web Audio. */
  preserveEffects?: boolean;
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

function audioUrl(file: string): string {
  return `/audio/imports/${encodeURIComponent(file)}`;
}

function toLocalTrack(entry: LocalTrackEntry): Track {
  const stems = entry.stems;
  const validStems =
    stems && typeof stems.vocals === 'string' && typeof stems.instrumental === 'string'
      ? { vocals: audioUrl(stems.vocals), instrumental: audioUrl(stems.instrumental) }
      : null;

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
    streamUrl: audioUrl(entry.file),
    stems: validStems,
    preserveEffects: entry.preserveEffects === true,
    explicit: false,
    popularity: 0,
    releaseYear: null,
  };
}
