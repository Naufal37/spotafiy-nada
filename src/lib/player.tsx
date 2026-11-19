import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Track } from '../types';
import { storage } from './storage';

export type Engine = 'idle' | 'jamendo';

export interface PlayerApi {
  queue: Track[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  engine: Engine;
  error: string | null;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (ms: number) => void;
  setVolume: (value: number) => void;
  addToQueue: (track: Track) => boolean;
  removeFromQueue: (index: number) => void;
  clearError: () => void;
}

const PlayerContext = createContext<PlayerApi | null>(null);

interface PlayerProviderProps {
  onTrackStart?: (track: Track) => void;
  children: ReactNode;
}

export function PlayerProvider({ onTrackStart, children }: PlayerProviderProps) {
  const [audio] = useState(() => {
    const element = new Audio();
    element.preload = 'metadata';
    return element;
  });

  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolumeState] = useState(() => storage.loadVolume());
  const [engine, setEngine] = useState<Engine>('idle');
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<Engine>('idle');
  const queueRef = useRef<Track[]>([]);
  const onTrackStartRef = useRef(onTrackStart);
  const startingRef = useRef(false);

  useEffect(() => {
    onTrackStartRef.current = onTrackStart;
  }, [onTrackStart]);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const current = queue[index] ?? null;

  // -------------------------------------------------------------------------
  // Pemutar streaming: MP3 penuh dari Jamendo lewat <audio> biasa.
  // Tidak ada Web Playback SDK, tidak perlu akun Premium, tidak perlu login.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onTime = () => {
      if (engineRef.current !== 'jamendo') return;
      setPositionMs(audio.currentTime * 1000);
    };
    const onMeta = () => {
      if (engineRef.current !== 'jamendo') return;
      if (Number.isFinite(audio.duration)) setDurationMs(audio.duration * 1000);
    };
    const onEnd = () => {
      if (engineRef.current !== 'jamendo') return;
      setIsPlaying(false);
      nextRef.current();
    };
    const onError = () => {
      if (engineRef.current !== 'jamendo') return;
      setError('Streaming lagu ini gagal dimuat. Coba lagu lain.');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, [audio]);

  useEffect(() => {
    audio.volume = volume;
  }, [audio, volume]);

  // -------------------------------------------------------------------------
  // Kontrol
  // -------------------------------------------------------------------------
  const playStream = useCallback(
    async (track: Track): Promise<boolean> => {
      if (!track.streamUrl) return false;
      try {
        setEngine('jamendo');
        setDurationMs(track.durationMs);
        setPositionMs(0);
        audio.src = track.streamUrl;
        await audio.play();
        setIsPlaying(true);
        return true;
      } catch {
        return false;
      }
    },
    [audio],
  );

  const startAt = useCallback(
    async (tracks: Track[], startIndex: number) => {
      if (startingRef.current) return;
      const track = tracks[startIndex];
      if (!track) return;

      startingRef.current = true;
      setError(null);
      setQueue(tracks);
      setIndex(startIndex);
      setPositionMs(0);
      setDurationMs(track.durationMs);
      onTrackStartRef.current?.(track);

      try {
        audio.pause();
        const ok = await playStream(track);
        if (!ok) {
          setIsPlaying(false);
          setEngine('idle');
          setError(
            track.streamUrl
              ? 'Lagu ini gagal diputar. Coba lagu lain.'
              : 'Lagu ini tidak menyediakan URL streaming dari Jamendo.',
          );
        }
      } finally {
        startingRef.current = false;
      }
    },
    [audio, playStream],
  );

  const playQueue = useCallback(
    (tracks: Track[], startIndex = 0) => {
      void startAt(tracks, Math.max(0, Math.min(startIndex, tracks.length - 1)));
    },
    [startAt],
  );

  const playAt = useCallback(
    (target: number) => {
      const tracks = queueRef.current.length > 0 ? queueRef.current : queue;
      void startAt(tracks, target);
    },
    [queue, startAt],
  );

  const next = useCallback(() => {
    const tracks = queueRef.current;
    if (tracks.length === 0) return;
    const target = Math.min(index + 1, tracks.length - 1);
    if (target === index) {
      setIsPlaying(false);
      if (engineRef.current === 'jamendo') audio.pause();
      return;
    }
    void startAt(tracks, target);
  }, [audio, index, startAt]);

  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const previous = useCallback(() => {
    const tracks = queueRef.current;
    if (tracks.length === 0) return;
    if (positionMs > 4000) {
      if (engineRef.current === 'jamendo') audio.currentTime = 0;
      setPositionMs(0);
      return;
    }
    void startAt(tracks, Math.max(0, index - 1));
  }, [audio, index, positionMs, startAt]);

  const toggle = useCallback(() => {
    if (!current) {
      if (queue.length > 0) playAt(0);
      return;
    }

    if (engineRef.current === 'jamendo') {
      if (audio.paused) {
        void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    playAt(index);
  }, [audio, current, index, playAt, queue.length]);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(ms, durationMs || ms));
      setPositionMs(clamped);
      if (engineRef.current === 'jamendo') {
        audio.currentTime = clamped / 1000;
      }
    },
    [audio, durationMs],
  );

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    storage.saveVolume(clamped);
  }, []);

  const addToQueue = useCallback((track: Track): boolean => {
    if (queueRef.current.some((item) => item.id === track.id)) return false;
    setQueue((previousQueue) => {
      if (previousQueue.some((item) => item.id === track.id)) return previousQueue;
      return [...previousQueue, track];
    });
    return true;
  }, []);

  const removeFromQueue = useCallback(
    (target: number) => {
      setQueue((previousQueue) => previousQueue.filter((_, i) => i !== target));
      setIndex((previousIndex) => (target < previousIndex ? previousIndex - 1 : previousIndex));
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  // Progres diperbarui dari <audio> (timeupdate sudah cukup, polling ringan
  // tetap dibutuhkan saat drag seek).
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      if (engineRef.current !== 'jamendo') return;
      if (!Number.isNaN(audio.currentTime)) setPositionMs(audio.currentTime * 1000);
    }, 600);
    return () => window.clearInterval(timer);
  }, [audio, isPlaying]);

  // Simpan antrean supaya tidak hilang saat refresh.
  useEffect(() => {
    if (queue.length > 0) storage.saveQueue(queue);
  }, [queue]);

  const value = useMemo<PlayerApi>(
    () => ({
      queue,
      index,
      current,
      isPlaying,
      positionMs,
      durationMs,
      volume,
      engine,
      error,
      playQueue,
      playAt,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      addToQueue,
      removeFromQueue,
      clearError,
    }),
    [
      queue,
      index,
      current,
      isPlaying,
      positionMs,
      durationMs,
      volume,
      engine,
      error,
      playQueue,
      playAt,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      addToQueue,
      removeFromQueue,
      clearError,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerApi {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer harus dipakai di dalam <PlayerProvider>');
  return context;
}
