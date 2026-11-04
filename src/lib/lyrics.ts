import type { LyricLine, Track } from '../types';

interface LrclibResult {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

/**
 * LRCLIB (lrclib.net) — database lirik terbuka, tanpa API key. Kalau lagunya
 * tidak ada, panel menampilkan empty state, bukan lirik karangan.
 */
export async function fetchLyrics(track: Track): Promise<LyricLine[]> {
  const params = new URLSearchParams({
    artist_name: track.artist,
    track_name: track.title,
    album_name: track.album,
    duration: String(Math.round(track.durationMs / 1000)),
  });

  try {
    const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    if (!response.ok) return [];
    const data = (await response.json()) as LrclibResult;
    if (data.syncedLyrics) return parseLrc(data.syncedLyrics);
    if (data.plainLyrics) {
      return data.plainLyrics
        .split('\n')
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({ time: null, text }));
    }
    return [];
  } catch {
    return [];
  }
}

const STAMP = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

function parseLrc(source: string): LyricLine[] {
  const lines: LyricLine[] = [];

  for (const rawLine of source.split('\n')) {
    const stamps = [...rawLine.matchAll(STAMP)];
    if (stamps.length === 0) continue;

    const text = rawLine.replace(STAMP, '').trim();
    if (!text) continue;

    for (const stamp of stamps) {
      const minutes = Number(stamp[1]);
      const seconds = Number(stamp[2]);
      const fraction = stamp[3] ? Number(stamp[3].padEnd(3, '0')) : 0;
      lines.push({
        time: minutes * 60_000 + seconds * 1000 + fraction,
        text,
      });
    }
  }

  return lines.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}

export function activeLyricIndex(lines: LyricLine[], positionMs: number): number {
  if (lines.length === 0) return -1;
  let index = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const time = lines[i].time;
    if (time === null) return -1;
    if (time <= positionMs + 120) index = i;
    else break;
  }
  return index;
}
