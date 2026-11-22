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

/**
 * Endpoint /search Spotify sekarang menolak limit > 10 ("Invalid limit").
 * Clamp di sini supaya semua pemanggil aman, termasuk pencarian lama yang
 * masih meminta 12/22/24 lagu.
 */
const SEARCH_LIMIT = 10;

export async function searchTracks(query: string, limit = SEARCH_LIMIT): Promise<Track[]> {
  const result = await api<SearchResponse>('search', {
    q: query,
    type: 'track',
    limit: Math.max(1, Math.min(SEARCH_LIMIT, Math.floor(limit))),
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

export async function getAlbum(id: string): Promise<SpotifyAlbum> {
  return api<SpotifyAlbum>(`albums/${id}`, { market: MARKET });
}

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
    LISTEN_NOW_QUERIES.map((query) => searchTracks(query, SEARCH_LIMIT)),
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
