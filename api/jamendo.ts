import type { IncomingMessage, ServerResponse } from 'node:http';

/*
 * Endpoint ini sengaja mandiri (tanpa import file lokal lain) supaya aman di
 * bundle serverless Vercel. Client ID Jamendo disimpan di server, browser
 * hanya memanggil /api/jamendo.
 */

const API_BASE = 'https://api.jamendo.com/v3.0';
const ALLOWED_PATHS = new Set([
  'tracks',
  'tracks/similar',
  'artists',
  'albums',
  'charts/track',
]);

function readClientId(): string {
  return (process.env.JAMENDO_CLIENT_ID ?? '').trim();
}

function send(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

type JamendoResult = Record<string, unknown>;

/** Waveform itu ~1000 angka per lagu dan tidak dipakai UI — buang di server. */
function trimResult(result: JamendoResult): JamendoResult {
  const { waveform: _waveform, audiodownload: _audiodownload, ...rest } = result;
  void _waveform;
  void _audiodownload;
  return rest;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = (url.searchParams.get('path') ?? '')
    .replace(/^\/+|\/+$/g, '')
    .trim();

  if (!ALLOWED_PATHS.has(path)) {
    send(res, 400, {
      error: 'bad_path',
      message: 'Endpoint Jamendo tidak diizinkan.',
    });
    return;
  }

  const clientId = readClientId();
  if (!clientId) {
    send(res, 503, {
      error: 'jamendo_not_configured',
      message:
        'JAMENDO_CLIENT_ID belum diisi. Tambahkan di .env.local (lokal) atau Environment Variables Vercel.',
    });
    return;
  }

  const params = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key !== 'path') params.set(key, value);
  });
  params.set('client_id', clientId);
  params.set('format', 'json');

  // Opsi ini hanya relevan untuk method tracks; diabaikan method lain.
  if (path.startsWith('tracks')) {
    params.set('audioformat', 'mp32');
    if (!params.has('imagesize')) params.set('imagesize', '400');
  }

  try {
    const response = await fetch(`${API_BASE}/${path}/?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    const text = await response.text();

    let payload: { headers?: { status?: string; error_message?: string }; results?: JamendoResult[] };
    try {
      payload = JSON.parse(text) as typeof payload;
    } catch {
      send(res, 502, {
        error: 'jamendo_bad_response',
        message: text.trim().slice(0, 300) || 'Jamendo mengembalikan respons bukan JSON.',
      });
      return;
    }

    if (Array.isArray(payload.results)) {
      payload.results = payload.results.map(trimResult);
    }

    res.statusCode = response.ok ? 200 : response.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      response.ok ? 'public, s-maxage=300, stale-while-revalidate=600' : 'no-store',
    );
    res.end(JSON.stringify(payload));
  } catch (error) {
    send(res, 502, {
      error: 'jamendo_failed',
      message: error instanceof Error ? error.message : 'unknown_error',
    });
  }
}
