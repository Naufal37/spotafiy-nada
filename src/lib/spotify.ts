import type {
  SpotifyAlbum,
  SpotifyArtist,
  SpotifyImage,
  SpotifyTrack,
  Track,
} from '../types';

export class SpotifyApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'SpotifyApiError';
  }
}

export const MARKET = 'ID';

function pickImage(images: SpotifyImage[] | undefined, size: 'small' | 'large'): string | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return size === 'small' ? sorted[0].url : sorted[sorted.length - 1].url;
}

export function toTrack(track: SpotifyTrack): Track {
  const artist = track.artists[0];
  return {
    id: track.id,
    uri: track.uri,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    artistId: artist?.id ?? null,
    album: track.album.name,
    albumId: track.album.id ?? null,
    artwork: pickImage(track.album.images, 'large'),
    artworkSmall: pickImage(track.album.images, 'small'),
    durationMs: track.duration_ms,
    previewUrl: track.preview_url,
    explicit: track.explicit,
    popularity: track.popularity ?? 0,
    releaseYear: track.album.release_date?.slice(0, 4) ?? null,
  };
}

async function api<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const search = new URLSearchParams({ endpoint });
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') search.set(key, String(value));
    }
  }

  const response = await fetch(`/api/spotify?${search.toString()}`);
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const payloadError = payload as
      | {
          error?: string | { status?: number; message?: string };
          message?: string;
        }
      | null;

    const nested =
      payloadError && typeof payloadError.error === 'object' && payloadError.error !== null
        ? payloadError.error
        : null;
    const code =
      typeof payloadError?.error === 'string'
        ? payloadError.error
        : `http_${response.status}`;
    // Spotify membalas { error: { status, message } }; proxy meneruskannya apa adanya.
    const raw =
      payloadError?.message ??
      nested?.message ??
      (payload === null && text.length < 500 ? text.trim() : '');

    if (response.status === 403 && /premium/i.test(raw)) {
      throw new SpotifyApiError(
        'premium_required',
        'Akun pembuat app Spotify harus Premium. Sejak 2026 Spotify menolak semua permintaan katalog dari app milik akun Free.',
      );
    }

    throw new SpotifyApiError(code, raw || `Spotify menolak permintaan (${response.status}).`);
  }

  return payload as T;
}

export interface SearchResponse {
  tracks: { items: (SpotifyTrack | null)[] };
}

export async function searchTracks(query: string, limit = 24): Promise<Track[]> {
  const result = await api<SearchResponse>('search', {
    q: query,
    type: 'track',
    limit,
    market: MARKET,
  });
  return (result.tracks?.items ?? [])
    .filter((item): item is SpotifyTrack => Boolean(item && item.id))
    .map(toTrack);
}

export async function getTrack(id: string): Promise<Track> {
  return toTrack(await api<SpotifyTrack>(`tracks/${id}`, { market: MARKET }));
}

export async function getArtist(id: string): Promise<SpotifyArtist> {
  return api<SpotifyArtist>(`artists/${id}`);
}

export async function getArtistTopTracks(id: string): Promise<Track[]> {
  const result = await api<{ tracks: SpotifyTrack[] }>(`artists/${id}/top-tracks`, {
    market: MARKET,
  });
  return (result.tracks ?? []).map(toTrack);
}

export async function getArtistAlbums(id: string, limit = 8): Promise<SpotifyAlbum[]> {
  const result = await api<{ items: SpotifyAlbum[] }>(`artists/${id}/albums`, {
    include_groups: 'album,single',
    limit,
    market: MARKET,
  });
  return result.items ?? [];
}

export async function getAlbum(id: string): Promise<SpotifyAlbum> {
  return api<SpotifyAlbum>(`albums/${id}`, { market: MARKET });
}

export async function getAlbumTracks(id: string, limit = 12): Promise<Track[]> {
  const result = await api<{ items: SpotifyTrack[] }>(`albums/${id}/tracks`, {
    limit,
    market: MARKET,
  });
  return (result.items ?? []).map(toTrack);
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
    query: 'chill acoustic',
    description: 'Gitar akustik, tempo santai, cocok buat sore.',
    accent: '#8B4C83',
  },
  {
    id: 'energised',
    label: 'Energised',
    query: 'energetic pop hits',
    description: 'Buat yang butuh dorongan buat mulai gerak.',
    accent: '#F45A9A',
  },
  {
    id: 'focus',
    label: 'Focus',
    query: 'lofi study beats',
    description: 'Instrumental tanpa distraksi buat kerja.',
    accent: '#FFB45B',
  },
  {
    id: 'late-night',
    label: 'Late night',
    query: 'late night rnb',
    description: 'Lampu mati, headphone nyala.',
    accent: '#6B4CFF',
  },
  {
    id: 'warm',
    label: 'Warm',
    query: 'soul jazz',
    description: 'Brass, groove, dan rasa hangat.',
    accent: '#FF8A5B',
  },
  {
    id: 'neon',
    label: 'Neon',
    query: 'synthwave retrowave',
    description: 'Sintesis 80-an, kabut ungu, jalanan basah.',
    accent: '#4CD7E0',
  },
];

const LISTEN_NOW_QUERIES = [
  'indie pop',
  'lofi beats',
  'city pop',
  'rnb soul',
  'synthwave',
  'acoustic cover',
];

/** Isi halaman "Listen now": gabungan beberapa pencarian, tanpa duplikat. */
export async function loadDiscovery(): Promise<Track[]> {
  const results = await Promise.allSettled(
    LISTEN_NOW_QUERIES.map((query) => searchTracks(query, 12)),
  );

  const seen = new Set<string>();
  const merged: Track[] = [];
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const track of result.value) {
      if (seen.has(track.id)) continue;
      seen.add(track.id);
      merged.push(track);
    }
  }

  if (merged.length === 0) {
    const failure = results.find((r) => r.status === 'rejected');
    if (failure && failure.status === 'rejected') throw failure.reason;
  }

  return merged;
}

/** Radio: benih dari satu lagu, lalu melebar ke artis + album terkait. */
export async function loadRadioSeed(track: Track): Promise<Track[]> {
  const buckets: Track[][] = [];

  if (track.artistId) {
    try {
      buckets.push(await getArtistTopTracks(track.artistId));
    } catch {
      /* lanjut ke sumber lain */
    }
  }

  if (track.albumId) {
    try {
      buckets.push(await getAlbumTracks(track.albumId, 10));
    } catch {
      /* lanjut */
    }
  }

  try {
    buckets.push(await searchTracks(`${track.artist} ${track.album}`, 10));
  } catch {
    /* lanjut */
  }

  const seen = new Set<string>([track.id]);
  const merged: Track[] = [track];
  for (const bucket of buckets) {
    for (const item of bucket) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}
