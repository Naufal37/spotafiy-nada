export interface Track {
  id: string;
  uri: string | null;
  title: string;
  artist: string;
  artistId: string | null;
  album: string;
  albumId: string | null;
  artwork: string | null;
  artworkSmall: string | null;
  durationMs: number;
  previewUrl: string | null;
  explicit: boolean;
  popularity: number;
  releaseYear: string | null;
  mood?: string;
}

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
  followers?: { total: number };
  popularity?: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date?: string;
  release_date_precision?: string;
  label?: string;
  total_tracks?: number;
  artists?: SpotifyArtist[];
  copyrights?: { text: string; type: string }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  preview_url: string | null;
  explicit: boolean;
  popularity: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface LyricLine {
  time: number | null;
  text: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

export type ViewId = 'listen' | 'moods' | 'library' | 'radio';
