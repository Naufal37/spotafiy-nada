/**
 * Login Spotify pakai OAuth PKCE — tanpa Client Secret di browser.
 * Hanya dibutuhkan kalau mau memutar lagu utuh lewat Web Playback SDK
 * (akun Premium). Katalog tetap jalan tanpa login.
 */

const AUTH_KEY = 'nada.v2.spotify.auth';
const VERIFIER_KEY = 'nada.v2.spotify.verifier';
const STATE_KEY = 'nada.v2.spotify.state';

export const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(length = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes).slice(0, length);
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export function redirectUri(): string {
  return `${window.location.origin}/`;
}

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export async function beginLogin(clientId: string): Promise<void> {
  const verifier = randomString(96);
  const state = randomString(24);
  const challenge = await challengeFor(verifier);

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SCOPES,
    show_dialog: 'false',
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

interface TokenPayload {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function requestToken(body: URLSearchParams, clientId: string): Promise<StoredAuth> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...Object.fromEntries(body), client_id: clientId }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Token Spotify gagal (${response.status}).`);
  }

  const payload = (await response.json()) as TokenPayload;
  const stored: StoredAuth = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? getStoredAuth()?.refreshToken ?? '',
    expiresAt: Date.now() + payload.expires_in * 1000,
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(stored));
  return stored;
}

/** Dipanggil sekali saat app dimuat; menukar ?code= dari URL jadi token. */
export async function completeLogin(clientId: string): Promise<boolean> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    url.searchParams.delete('error');
    url.searchParams.delete('state');
    window.history.replaceState({}, '', url.toString());
    return false;
  }
  if (!code) return false;

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, '', url.toString());

  if (!verifier || !expectedState || state !== expectedState) return false;

  await requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
    clientId,
  );
  return true;
}

/** Token siap pakai; otomatis refresh kalau tinggal <60 detik. */
export async function getAccessToken(clientId: string): Promise<string | null> {
  const stored = getStoredAuth();
  if (!stored) return null;

  if (stored.expiresAt > Date.now() + 60_000) return stored.accessToken;
  if (!stored.refreshToken) return null;

  try {
    const refreshed = await requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: stored.refreshToken,
      }),
      clientId,
    );
    return refreshed.accessToken;
  } catch {
    logout();
    return null;
  }
}

export interface SpotifyMe {
  id: string;
  display_name: string | null;
  product: 'premium' | 'free' | 'open' | string;
  images?: { url: string }[];
}

export async function fetchMe(token: string): Promise<SpotifyMe | null> {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as SpotifyMe;
}
