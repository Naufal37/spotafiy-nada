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
import { getAccessToken } from './auth';
import { storage } from './storage';

export type Engine = 'idle' | 'preview' | 'spotify';
export type SdkStatus = 'off' | 'loading' | 'ready' | 'error' | 'no-premium';

export interface PlayerApi {
  queue: Track[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  engine: Engine;
  sdkStatus: SdkStatus;
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
  clientId: string | null;
  premium: boolean;
  onTrackStart?: (track: Track) => void;
  children: ReactNode;
}

export function PlayerProvider({ clientId, premium, onTrackStart, children }: PlayerProviderProps) {
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
  const [sdkStatus, setSdkStatus] = useState<SdkStatus>('off');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<Engine>('idle');
  const queueRef = useRef<Track[]>([]);
  const sdkPlayerRef = useRef<SpotifySdkPlayer | null>(null);
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
  // Pemutar fallback: <audio> biasa untuk preview 30 detik.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onTime = () => {
      if (engineRef.current !== 'preview') return;
      setPositionMs(audio.currentTime * 1000);
    };
    const onMeta = () => {
      if (engineRef.current !== 'preview') return;
      if (Number.isFinite(audio.duration)) setDurationMs(audio.duration * 1000);
    };
    const onEnd = () => {
      if (engineRef.current !== 'preview') return;
      setIsPlaying(false);
      nextRef.current();
    };
    const onError = () => {
      if (engineRef.current !== 'preview') return;
      setError('Preview lagu ini gagal dimuat.');
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
    sdkPlayerRef.current?.setVolume(volume).catch(() => undefined);
  }, [audio, volume]);

  // -------------------------------------------------------------------------
  // Web Playback SDK (butuh Premium)
  // -------------------------------------------------------------------------
  const sdkEnabled = Boolean(clientId) && premium;

  useEffect(() => {
    if (!sdkEnabled || !clientId) {
      setSdkStatus('off');
      return;
    }

    let disposed = false;

    const init = () => {
      if (disposed) return;
      if (!window.Spotify) {
        window.onSpotifyWebPlaybackSDKReady = init;
        return;
      }
      setSdkStatus('loading');
      const player = new window.Spotify.Player({
        name: 'Nada Web Player',
        getOAuthToken: (callback) => {
          void getAccessToken(clientId).then((token) => {
            if (token) callback(token);
          });
        },
        volume: storage.loadVolume(),
      });
      sdkPlayerRef.current = player;

      player.addListener('ready', ((payload: { device_id: string }) => {
        if (disposed) return;
        setDeviceId(payload.device_id);
        setSdkStatus('ready');
      }) as never);

      player.addListener('not_ready', (() => {
        if (disposed) return;
        setDeviceId(null);
      }) as never);

      player.addListener('initialization_error', ((payload: SpotifySdkError) => {
        setSdkStatus('error');
        setError(`Pemutar Spotify gagal dimuat: ${payload.message}`);
      }) as never);

      player.addListener('authentication_error', (() => {
        setSdkStatus('error');
        setError('Sesi Spotify kedaluwarsa. Coba login ulang.');
      }) as never);

      player.addListener('account_error', (() => {
        setSdkStatus('no-premium');
      }) as never);

      player.addListener('player_state_changed', ((state: SpotifySdkState | null) => {
        if (disposed || !state) return;
        setPositionMs(state.position);
        setDurationMs(state.duration);
        setIsPlaying(!state.paused);
        const uri = state.track_window.current_track.uri;
        const found = queueRef.current.findIndex((track) => track.uri === uri);
        if (found >= 0) setIndex(found);
      }) as never);

      void player.connect();
    };

    const existing = document.getElementById('spotify-player-sdk');
    if (existing) {
      init();
    } else {
      window.onSpotifyWebPlaybackSDKReady = init;
      const script = document.createElement('script');
      script.id = 'spotify-player-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      disposed = true;
      sdkPlayerRef.current?.disconnect();
      sdkPlayerRef.current = null;
    };
  }, [clientId, sdkEnabled]);

  // -------------------------------------------------------------------------
  // Kontrol
  // -------------------------------------------------------------------------
  const spotifyAvailable = Boolean(premium && sdkStatus === 'ready' && deviceId && clientId);

  const playThroughSpotify = useCallback(
    async (tracks: Track[]): Promise<boolean> => {
      const uris = tracks.map((track) => track.uri).filter((uri): uri is string => Boolean(uri));
      if (!clientId || !deviceId || uris.length === 0) return false;

      const token = await getAccessToken(clientId);
      if (!token) return false;

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris }),
        },
      );

      if (!response.ok) return false;
      setEngine('spotify');
      setIsPlaying(true);
      return true;
    },
    [clientId, deviceId],
  );

  const playPreview = useCallback(
    async (track: Track): Promise<boolean> => {
      if (!track.previewUrl) return false;
      try {
        setEngine('preview');
        setDurationMs(track.durationMs);
        setPositionMs(0);
        audio.src = track.previewUrl;
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

        if (spotifyAvailable) {
          const ok = await playThroughSpotify(tracks.slice(startIndex));
          if (ok) return;
        }

        const ok = await playPreview(track);
        if (!ok) {
          setIsPlaying(false);
          setEngine('idle');
          setError(
            track.previewUrl
              ? 'Lagu ini gagal diputar.'
              : 'Lagu ini tidak punya preview, dan pemutar Premium belum aktif. Login Spotify Premium untuk memutar lagu utuh.',
          );
        }
      } finally {
        startingRef.current = false;
      }
    },
    [audio, playPreview, playThroughSpotify, spotifyAvailable],
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
      if (engineRef.current === 'preview') audio.pause();
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
      if (engineRef.current === 'preview') audio.currentTime = 0;
      else void sdkPlayerRef.current?.seek(0);
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

    if (engineRef.current === 'preview') {
      if (audio.paused) {
        void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (engineRef.current === 'spotify' && sdkPlayerRef.current) {
      void sdkPlayerRef.current.togglePlay();
      return;
    }

    playAt(index);
  }, [audio, current, index, playAt, queue.length]);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(ms, durationMs || ms));
      setPositionMs(clamped);
      if (engineRef.current === 'preview') {
        audio.currentTime = clamped / 1000;
      } else if (engineRef.current === 'spotify') {
        void sdkPlayerRef.current?.seek(clamped);
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

  // Polling posisi (SDK tidak mengirim progress tiap detik).
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      if (engineRef.current === 'preview') {
        setPositionMs(audio.currentTime * 1000);
        return;
      }
      const player = sdkPlayerRef.current;
      if (engineRef.current === 'spotify' && player) {
        void player.getCurrentState().then((state) => {
          if (!state) return;
          setPositionMs(state.position);
          setDurationMs(state.duration);
          setIsPlaying(!state.paused);
        });
      }
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
      sdkStatus,
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
      sdkStatus,
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
