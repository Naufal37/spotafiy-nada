import type { IncomingMessage, ServerResponse } from 'node:http';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

interface CachedToken {
  value: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

export function readCreds(): { id: string; secret: string } | null {
  const id = (process.env.SPOTIFY_CLIENT_ID ?? '').trim();
  const secret = (process.env.SPOTIFY_CLIENT_SECRET ?? '').trim();
  if (!id || !secret) return null;
  return { id, secret };
}

export function isSpotifyConfigured(): boolean {
  return readCreds() !== null;
}

/**
 * Token level aplikasi (Client Credentials). Dipakai murni untuk katalog:
 * pencarian, metadata, artwork. Tidak pernah dikirim ke browser.
 */
async function appToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.value;
  }

  const creds = readCreds();
  if (!creds) throw new Error('SPOTIFY_NOT_CONFIGURED');

  const basic = Buffer.from(`${creds.id}:${creds.secret}`).toString('base64');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`TOKEN_${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return tokenCache.value;
}

/**
 * Daftar endpoint Spotify yang boleh dipanggil dari browser. Sengaja
 * allowlist, bukan proxy bebas, supaya endpoint ini tidak bisa dipakai
 * untuk memanggil URL sembarangan.
 */
const ID = '[A-Za-z0-9]{8,40}';
const ALLOWED: RegExp[] = [
  /^search$/,
  new RegExp(`^tracks/${ID}$`),
  new RegExp(`^several-tracks$`),
  new RegExp(`^artists/${ID}$`),
  new RegExp(`^artists/${ID}/top-tracks$`),
  new RegExp(`^artists/${ID}/albums$`),
  new RegExp(`^artists/${ID}/related-artists$`),
  new RegExp(`^albums/${ID}$`),
  new RegExp(`^albums/${ID}/tracks$`),
  new RegExp(`^playlists/${ID}$`),
  new RegExp(`^playlists/${ID}/tracks$`),
  /^browse\/new-releases$/,
  /^browse\/featured-playlists$/,
  /^browse\/categories$/,
];

function isAllowed(endpoint: string): boolean {
  return ALLOWED.some((pattern) => pattern.test(endpoint));
}

function send(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const endpoint = (url.searchParams.get('endpoint') ?? '').replace(/^\/+/, '').trim();

  if (!endpoint || !isAllowed(endpoint)) {
    send(res, 400, {
      error: 'bad_endpoint',
      message: 'Endpoint Spotify tidak diizinkan.',
    });
    return;
  }

  const params = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key !== 'endpoint') params.set(key, value);
  });

  try {
    const token = await appToken();
    const query = params.toString();
    const target = `${API_BASE}/${endpoint}${query ? `?${query}` : ''}`;

    const response = await fetch(target, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const body = await response.text();

    res.statusCode = response.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      response.ok
        ? 'public, s-maxage=120, stale-while-revalidate=600'
        : 'no-store',
    );
    res.end(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';

    if (message === 'SPOTIFY_NOT_CONFIGURED') {
      send(res, 503, {
        error: 'spotify_not_configured',
        message:
          'SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET belum diisi. Tambahkan di .env.local atau Environment Variables Vercel.',
      });
      return;
    }

    send(res, 502, { error: 'spotify_failed', message });
  }
}
