import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Playlist, Track } from '../types';
import { storage } from './storage';

interface LibraryApi {
  favorites: Track[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (track: Track) => void;
  recent: Track[];
  pushRecent: (track: Track) => void;
  playlists: Playlist[];
  createPlaylist: (name: string, tracks: Track[]) => Playlist;
  deletePlaylist: (id: string) => void;
  moodSync: boolean;
  setMoodSync: (value: boolean) => void;
}

const LibraryContext = createContext<LibraryApi | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Track[]>(() => storage.loadFavorites());
  const [recent, setRecent] = useState<Track[]>(() => storage.loadRecent());
  const [playlists, setPlaylists] = useState<Playlist[]>(() => storage.loadPlaylists());
  const [moodSync, setMoodSyncState] = useState(() => {
    try {
      return localStorage.getItem('nada.v2.moodsync') !== 'off';
    } catch {
      return true;
    }
  });

  useEffect(() => storage.saveFavorites(favorites), [favorites]);
  useEffect(() => storage.saveRecent(recent), [recent]);
  useEffect(() => storage.savePlaylists(playlists), [playlists]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((track) => track.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((track: Track) => {
    setFavorites((previous) =>
      previous.some((item) => item.id === track.id)
        ? previous.filter((item) => item.id !== track.id)
        : [track, ...previous],
    );
  }, []);

  const pushRecent = useCallback((track: Track) => {
    setRecent((previous) => [track, ...previous.filter((item) => item.id !== track.id)].slice(0, 30));
  }, []);

  const createPlaylist = useCallback((name: string, tracks: Track[]): Playlist => {
    const playlist: Playlist = {
      id: `pl-${Date.now().toString(36)}`,
      name: name.trim() || 'Playlist baru',
      tracks,
      createdAt: Date.now(),
    };
    setPlaylists((previous) => [playlist, ...previous]);
    return playlist;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((previous) => previous.filter((playlist) => playlist.id !== id));
  }, []);

  const setMoodSync = useCallback((value: boolean) => {
    setMoodSyncState(value);
    try {
      localStorage.setItem('nada.v2.moodsync', value ? 'on' : 'off');
    } catch {
      /* abaikan */
    }
  }, []);

  const value = useMemo<LibraryApi>(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      recent,
      pushRecent,
      playlists,
      createPlaylist,
      deletePlaylist,
      moodSync,
      setMoodSync,
    }),
    [
      favorites,
      isFavorite,
      toggleFavorite,
      recent,
      pushRecent,
      playlists,
      createPlaylist,
      deletePlaylist,
      moodSync,
      setMoodSync,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryApi {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary harus dipakai di dalam <LibraryProvider>');
  return context;
}
