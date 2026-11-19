import type {
  JamendoAlbum,
  JamendoArtist,
  JamendoTrack,
  Track,
} from '../types';

export class JamendoApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'JamendoApiError';
  }
}

interface JamendoResponse<T> {
  headers?: { status?: string; error_message?: string; results_count?: number };
  results?: T[];
  message?: string;
  error?: string;
}

function imageUrl(value: string | { url?: string } | undefined, width: number): string | null {
  if (!value) return null;
  const url = typeof value === 'string' ? value : value.url;
  if (!url) return null;
  return url.replace(/width=\d+/, `width=${width}`) || null;
}

function licenseLabel(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/licenses\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return `CC ${match[1].toUpperCase()} ${match[2]}`;
}

export function toTrack(raw: JamendoTrack): Track {
  const genres = raw.musicinfo?.tags?.genres ?? [];
  return {
    id: String(raw.id),
    sourceUrl: raw.shareurl ?? raw.shorturl ?? null,
    title: raw.name,
    artist: raw.artist_name ?? 'Artis Jamendo',
    artistId: raw.artist_id ? String(raw.artist_id) : null,
    album: raw.album_name || 'Single',
    albumId: raw.album_id ? String(raw.album_id) : null,
    artwork: imageUrl(raw.album_image ?? raw.image, 400),
    artworkSmall: imageUrl(raw.album_image ?? raw.image, 100),
    durationMs: Number(raw.duration ?? 0) * 1000,
    streamUrl: raw.audio ?? null,
    popularity: 50,
    releaseYear: raw.releasedate?.slice(0, 4) ?? null,
    genres,
    licenseUrl: raw.license_ccurl ?? null,
    licenseLabel: licenseLabel(raw.license_ccurl),
  };
}

async function api<T>(
  path: 'tracks' | 'tracks/similar' | 'artists' | 'albums' | 'charts/track',
  params: Record<string, string | number | undefined> = {},
): Promise<JamendoResponse<T>> {
  const search = new URLSearchParams({ path });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }

  const response = await fetch(`/api/jamendo?${search.toString()}`);
  const text = await response.text();
  let payload: JamendoResponse<T> = {};
  try {
    payload = (text ? JSON.parse(text) : {}) as JamendoResponse<T>;
  } catch {
    /* ditangani di bawah */
  }

  if (!response.ok) {
    throw new JamendoApiError(
      payload.error ?? `http_${response.status}`,
      payload.message ?? `Jamendo menolak permintaan (${response.status}).`,
    );
  }

  if (payload.headers?.status && payload.headers.status !== 'success') {
    throw new JamendoApiError(
      'jamendo_error',
      payload.headers.error_message || 'Jamendo gagal memproses permintaan.',
    );
  }

  return payload;
}

function resultsOf<T>(payload: JamendoResponse<T>): T[] {
  return Array.isArray(payload.results) ? payload.results : [];
}

async function findTracks(
  params: Record<string, string | number | undefined>,
  limit: number,
): Promise<Track[]> {
  const payload = await api<JamendoTrack>('tracks', {
    ...params,
    limit,
    include: 'musicinfo',
  });
  return resultsOf(payload).map(toTrack);
}

/** Pencarian bebas: judul, artis, album, atau tag/genre. */
export async function searchTracks(query: string, limit = 24): Promise<Track[]> {
  return findTracks({ search: query }, limit);
}

/** Pencarian berbasis genre/tag Jamendo (lebih stabil untuk mood & discovery). */
export async function searchTracksByTags(tags: string, limit = 24): Promise<Track[]> {
  return findTracks({ tags }, limit);
}

export async function getTrack(id: string): Promise<Track> {
  const payload = await api<JamendoTrack>('tracks', {
    id,
    include: 'musicinfo',
  });
  const track = resultsOf(payload)[0];
  if (!track) throw new JamendoApiError('not_found', 'Lagu tidak ditemukan di Jamendo.');
  return toTrack(track);
}

export async function getArtist(id: string): Promise<JamendoArtist | null> {
  const payload = await api<JamendoArtist>('artists', { id });
  return resultsOf(payload)[0] ?? null;
}

export async function getAlbum(id: string): Promise<JamendoAlbum | null> {
  const payload = await api<JamendoAlbum>('albums', { id });
  return resultsOf(payload)[0] ?? null;
}

export async function getArtistTopTracks(id: string, limit = 10): Promise<Track[]> {
  const payload = await api<JamendoTrack>('tracks', {
    artist_id: id,
    order: 'popularity_total_desc',
    limit,
    include: 'musicinfo',
  });
  return resultsOf(payload).map(toTrack);
}

export async function getAlbumTracks(id: string, limit = 12): Promise<Track[]> {
  const payload = await api<JamendoTrack>('tracks', {
    album_id: id,
    limit,
    include: 'musicinfo',
  });
  return resultsOf(payload).map(toTrack);
}

export async function getSimilarTracks(
  track: Pick<Track, 'id' | 'artistId' | 'albumId'>,
  limit = 12,
): Promise<Track[]> {
  const payload = await api<JamendoTrack>('tracks/similar', {
    id: track.id,
    no_artist: track.artistId ?? undefined,
    no_album: track.albumId ?? undefined,
    limit,
    include: 'musicinfo',
  });
  return resultsOf(payload).map(toTrack);
}

export interface Mood {
  id: string;
  label: string;
  query: string;
  description: string;
  accent: string;
}

export const MOODS: Mood[] = [
  {
    id: 'chill',
    label: 'Chill',
    query: 'chill',
    description: 'Gitar akustik, tempo santai, cocok buat sore.',
    accent: '#8B4C83',
  },
  {
    id: 'energised',
    label: 'Energised',
    query: 'rock',
    description: 'Buat yang butuh dorongan buat mulai gerak.',
    accent: '#F45A9A',
  },
  {
    id: 'focus',
    label: 'Focus',
    query: 'instrumental',
    description: 'Instrumental tanpa distraksi buat kerja.',
    accent: '#FFB45B',
  },
  {
    id: 'late-night',
    label: 'Late night',
    query: 'jazz',
    description: 'Lampu mati, headphone nyala.',
    accent: '#6B4CFF',
  },
  {
    id: 'warm',
    label: 'Warm',
    query: 'funk',
    description: 'Brass, groove, dan rasa hangat.',
    accent: '#FF8A5B',
  },
  {
    id: 'neon',
    label: 'Neon',
    query: 'synthwave',
    description: 'Sintesis 80-an, kabut ungu, jalanan basah.',
    accent: '#4CD7E0',
  },
];

const DISCOVERY_TAGS = ['indie', 'lofi', 'jazz', 'electronic', 'funk', 'ambient'];
const DISCOVERY_FALLBACK_WORDS = ['chill', 'jazz', 'rock', 'synthwave', 'ambient', 'instrumental'];

function mergeUnique(batches: Track[][]): Track[] {
  const seen = new Set<string>();
  const merged: Track[] = [];
  for (const batch of batches) {
    for (const track of batch) {
      if (seen.has(track.id) || !track.streamUrl) continue;
      seen.add(track.id);
      merged.push(track);
    }
  }
  return merged;
}

async function settleAll(jobs: Promise<Track[]>[]): Promise<Track[]> {
  const results = await Promise.allSettled(jobs);
  return mergeUnique(
    results
      .filter((result): result is PromiseFulfilledResult<Track[]> => result.status === 'fulfilled')
      .map((result) => result.value),
  );
}

/** Chart trending Jamendo: responsnya hanya ID, jadi diambil satu per satu. */
async function getChartTracks(limit = 8): Promise<Track[]> {
  const payload = await api<{ id: string | number }>('charts/track', { limit });
  const ids = resultsOf(payload)
    .slice(0, limit)
    .map((item) => String(item.id))
    .filter(Boolean);
  const settled = await Promise.allSettled(ids.map((id) => getTrack(id)));
  return mergeUnique([
    settled
      .filter((result): result is PromiseFulfilledResult<Track> => result.status === 'fulfilled')
      .map((result) => result.value),
  ]);
}

/**
 * Isi halaman "Listen now". Jamendo terkadang mengembalikan 0 hasil untuk
 * query tertentu, jadi coba tiga strategi berurutan sebelum menyerah.
 */
export async function loadDiscovery(): Promise<Track[]> {
  const strategies: (() => Promise<Track[]>)[] = [
    () => settleAll(DISCOVERY_TAGS.map((tag) => searchTracksByTags(tag, 12))),
    () => settleAll(DISCOVERY_FALLBACK_WORDS.map((word) => searchTracks(word, 12))),
    () => getChartTracks(8),
  ];

  const failures: unknown[] = [];
  for (const strategy of strategies) {
    try {
      const tracks = await strategy();
      if (tracks.length > 0) return tracks;
    } catch (error) {
      failures.push(error);
    }
  }

  const first = failures[0];
  if (first instanceof JamendoApiError) throw first;
  throw new JamendoApiError(
    'empty_catalog',
    failures.length > 0
      ? 'Jamendo gagal mengembalikan katalog. Coba lagi beberapa saat.'
      : 'Jamendo belum punya lagu untuk ditampilkan. Coba lagi nanti.',
  );
}

/** Radio: lagu serupa dulu, lalu diperluas ke artis & album yang sama. */
export async function loadRadioSeed(track: Track): Promise<Track[]> {
  const tag = track.genres[0] ?? track.artist;
  const buckets = await Promise.allSettled([
    getSimilarTracks(track, 12),
    track.artistId ? getArtistTopTracks(track.artistId, 8) : Promise.resolve([] as Track[]),
    track.albumId ? getAlbumTracks(track.albumId, 8) : Promise.resolve([] as Track[]),
    searchTracksByTags(tag, 8),
  ]);

  const seen = new Set<string>([track.id]);
  const merged: Track[] = [track];
  for (const bucket of buckets) {
    if (bucket.status !== 'fulfilled') continue;
    for (const item of bucket.value) {
      if (seen.has(item.id) || !item.streamUrl) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}
