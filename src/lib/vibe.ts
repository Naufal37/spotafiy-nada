import type { Track } from '../types';

export interface Vibe {
  energy: number;
  warmth: number;
  tempo: number;
  label: string;
}

/** Hash FNV-1a sederhana, dipakai supaya angka vibe stabil per lagu. */
function hash(input: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value >>> 0;
}

/**
 * Spotify menutup endpoint Audio Features untuk aplikasi baru (akhir 2024),
 * jadi energy/warmth/tempo di sini adalah perkiraan dari metadata lagu
 * (popularitas, tahun rilis, panjang lagu) — bukan hasil analisis audio.
 * UI menampilkan ini sebagai "perkiraan", bukan fakta.
 */
export function vibeFor(track: Track): Vibe {
  const seed = hash(`${track.id}:${track.artist}`);
  const popularity = track.popularity || 50;
  const year = Number(track.releaseYear ?? '2000') || 2000;
  const decade = Math.min(3, Math.max(0, Math.floor((year - 1970) / 20)));

  const energy = clamp(0.28 + ((seed >>> 3) % 100) / 165 + popularity / 420, 0.12, 0.97);
  const warmth = clamp(
    0.34 + ((seed >>> 11) % 100) / 190 + (decade === 1 ? 0.14 : 0) - popularity / 1400,
    0.1,
    0.96,
  );
  const tempo = Math.round(72 + (((seed >>> 19) % 78) + popularity / 6));
  const label = vibeLabel(energy, warmth);

  return { energy, warmth, tempo, label };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function vibeLabel(energy: number, warmth: number): string {
  if (energy > 0.68 && warmth > 0.55) return 'Energised';
  if (energy > 0.66) return 'Driving';
  if (energy < 0.34 && warmth < 0.42) return 'Melancholic';
  if (energy < 0.4) return 'Dreamy';
  if (warmth > 0.66) return 'Warm';
  return 'Steady';
}

/** Warna gradien placeholder kalau artwork belum termuat. */
export function artworkGradient(seedText: string): string {
  const seed = hash(seedText);
  const hueA = seed % 360;
  const hueB = (hueA + 42 + (seed % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hueA} 58% 34%), hsl(${hueB} 62% 22%))`;
}
