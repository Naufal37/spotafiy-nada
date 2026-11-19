export interface Track {
  id: string;
  /** Link ke halaman lagu di Jamendo (dipakai tombol share). */
  sourceUrl: string | null;
  title: string;
  artist: string;
  artistId: string | null;
  album: string;
  albumId: string | null;
  artwork: string | null;
  artworkSmall: string | null;
  durationMs: number;
  /** URL streaming MP3 penuh dari Jamendo, bukan preview 30 detik. */
  streamUrl: string | null;
  popularity: number;
  releaseYear: string | null;
  genres: string[];
  licenseUrl: string | null;
  licenseLabel: string | null;
  mood?: string;
}

export interface JamendoImage {
  url?: string;
  width?: number;
  height?: number;
}

export interface JamendoArtist {
  id: string;
  name: string;
  image?: string | JamendoImage;
  joindate?: string;
  shareurl?: string;
  shorturl?: string;
  website?: string;
}

export interface JamendoAlbum {
  id: string;
  name: string;
  releasedate?: string;
  artist_id?: string;
  artist_name?: string;
  image?: string | JamendoImage;
  shareurl?: string;
  shorturl?: string;
}

export interface JamendoTrack {
  id: string;
  name: string;
  duration?: number | string;
  artist_id?: string;
  artist_name?: string;
  album_name?: string;
  album_id?: string;
  releasedate?: string;
  album_image?: string | JamendoImage;
  image?: string | JamendoImage;
  audio?: string;
  license_ccurl?: string;
  shareurl?: string;
  shorturl?: string;
  musicinfo?: {
    tags?: {
      genres?: string[];
      instruments?: string[];
      vartags?: string[];
    };
  };
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
