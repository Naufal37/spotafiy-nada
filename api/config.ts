import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Konfigurasi publik untuk frontend. Jamendo tidak memakai OAuth di aplikasi
 * ini — Client ID hanya dipakai server untuk memanggil API, jadi yang dikirim
 * ke browser cukup status sudah terkonfigurasi atau belum.
 * File ini sengaja tanpa import lokal agar aman di fungsi serverless.
 */
export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  const clientId = (process.env.JAMENDO_CLIENT_ID ?? '').trim();

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ jamendoConfigured: Boolean(clientId) }));
}
