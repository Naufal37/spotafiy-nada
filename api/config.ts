import type { IncomingMessage, ServerResponse } from 'node:http';
import { isSpotifyConfigured, readCreds } from '../server/spotify';

/**
 * Konfigurasi publik untuk frontend. Client ID Spotify memang publik (wajib
 * ada di URL authorize PKCE), tapi Client Secret tidak pernah ikut ke sini.
 */
export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  const creds = readCreds();
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify({
      spotifyConfigured: isSpotifyConfigured(),
      clientId: creds?.id ?? null,
    }),
  );
}
