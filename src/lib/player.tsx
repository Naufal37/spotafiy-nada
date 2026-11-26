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

export type Engine = 'idle' | 'preview' | 'spotify' | 'local' | 'stems' | 'raw';
export type SdkStatus = 'off' | 'loading' | 'ready' | 'error' | 'no-premium';

interface SpatialGraph {
  ctx: AudioContext;
  dry: GainNode;
  wet: GainNode;
  panner: PannerNode;
  master: GainNode;
  frame: number;
}

interface StemGraph {
  ctx: AudioContext;
  vocalLeft: GainNode;
  vocalRight: GainNode;
  instrumentalLeft: GainNode;
  instrumentalRight: GainNode;
  master: GainNode;
  /** 1 = vokal kiri / instrumen kanan, -1 = sebaliknya. */
  side: number;
  nextSwap: number;
  frame: number;
}

/** Ramp linear yang aman walau ramp sebelumnya masih berjalan. */
function rampParam(param: AudioParam, target: number, now: number, duration: number): void {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(now);
  } else {
    const current = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(current, now);
  }
  param.linearRampToValueAtTime(target, now + duration);
}

/**
 * Mixer 2x2: tiap stem masuk ke kanal kiri/kanan lewat gain terpisah.
 * Swap sisi = crossfade gain, bukan memutar pan — jadi tidak lewat tengah.
 */
function setStemMix(graph: StemGraph, enabled: boolean, duration: number): void {
  const target = enabled
    ? graph.side > 0
      ? { vl: 1, vr: 0, il: 0, ir: 1 }
      : { vl: 0, vr: 1, il: 1, ir: 0 }
    : { vl: 0.5, vr: 0.5, il: 0.5, ir: 0.5 };

  const now = graph.ctx.currentTime;
  const pairs: [GainNode, number][] = [
    [graph.vocalLeft, target.vl],
    [graph.vocalRight, target.vr],
    [graph.instrumentalLeft, target.il],
    [graph.instrumentalRight, target.ir],
  ];

  for (const [node, value] of pairs) {
    if (duration <= 0) node.gain.value = value;
    else rampParam(node.gain, value, now, duration);
  }
}

/**
 * Tukar kanal dengan equal-power crossfade. Cos/sin menjaga volume tetap
 * konstan di tengah transisi, jadi tidak terasa "mentok" lalu lompat.
 */
function swapStemSides(graph: StemGraph): void {
  const from = graph.side;
  const to = -from;
  const now = graph.ctx.currentTime;
  const duration = 1.8;
  const points = 64;
  const fadeOut = new Float32Array(points);
  const fadeIn = new Float32Array(points);
  for (let i = 0; i < points; i += 1) {
    const phase = (i / (points - 1)) * (Math.PI / 2);
    fadeOut[i] = Math.cos(phase);
    fadeIn[i] = Math.sin(phase);
  }

  const wasLeftVocal = from > 0;
  const assign = (param: AudioParam, start: number, end: number) => {
    param.cancelScheduledValues(now);
    if (start === 1 && end === 0) param.setValueCurveAtTime(fadeOut, now, duration);
    else if (start === 0 && end === 1) param.setValueCurveAtTime(fadeIn, now, duration);
    else rampParam(param, end, now, duration);
  };

  assign(graph.vocalLeft.gain, wasLeftVocal ? 1 : 0, wasLeftVocal ? 0 : 1);
  assign(graph.vocalRight.gain, wasLeftVocal ? 0 : 1, wasLeftVocal ? 1 : 0);
  assign(graph.instrumentalLeft.gain, wasLeftVocal ? 0 : 1, wasLeftVocal ? 1 : 0);
  assign(graph.instrumentalRight.gain, wasLeftVocal ? 1 : 0, wasLeftVocal ? 0 : 1);

  graph.side = to;
  graph.nextSwap = now + duration + 10;
}

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
  spatial: boolean;
  error: string | null;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (ms: number) => void;
  setVolume: (value: number) => void;
  toggleSpatial: () => void;
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

  // Elemen terpisah untuk lagu import: sekali dipakai createMediaElementSource,
  // elemen itu tidak bisa dipakai ulang untuk preview Spotify.
  const [localAudio] = useState(() => {
    const element = new Audio();
    element.preload = 'metadata';
    element.volume = 1;
    return element;
  });

  // Dua elemen untuk stem vokal/instrumen yang diputar sinkron.
  const [vocalAudio] = useState(() => {
    const element = new Audio();
    element.preload = 'metadata';
    element.volume = 1;
    return element;
  });
  const [instrumentalAudio] = useState(() => {
    const element = new Audio();
    element.preload = 'metadata';
    element.volume = 1;
    return element;
  });

  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolumeState] = useState(() => storage.loadVolume());
  const [spatial, setSpatial] = useState(() => storage.loadSpatial());
  const [engine, setEngine] = useState<Engine>('idle');
  const [sdkStatus, setSdkStatus] = useState<SdkStatus>('off');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<Engine>('idle');
  const queueRef = useRef<Track[]>([]);
  const sdkPlayerRef = useRef<SpotifySdkPlayer | null>(null);
  const graphRef = useRef<SpatialGraph | null>(null);
  const stemGraphRef = useRef<StemGraph | null>(null);
  const onTrackStartRef = useRef(onTrackStart);
  const startingRef = useRef(false);
  const spatialRef = useRef(spatial);
  const volumeRef = useRef(volume);

  useEffect(() => {
    onTrackStartRef.current = onTrackStart;
  }, [onTrackStart]);

  useEffect(() => {
    spatialRef.current = spatial;
  }, [spatial]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const current = queue[index] ?? null;

  // -------------------------------------------------------------------------
  // Pemutar media: preview 30 detik + lagu import lokal.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const isActive = (element: HTMLAudioElement) =>
      (engineRef.current === 'preview' && element === audio) ||
      (engineRef.current === 'raw' && element === audio) ||
      (engineRef.current === 'local' && element === localAudio) ||
      (engineRef.current === 'stems' && element === vocalAudio) ||
      (engineRef.current === 'stems' && element === instrumentalAudio);

    const handlers = [audio, localAudio, vocalAudio, instrumentalAudio].map((element) => ({
      element,
      time: () => {
        if (!isActive(element)) return;
        setPositionMs(element.currentTime * 1000);
      },
      meta: () => {
        if (!isActive(element)) return;
        if (Number.isFinite(element.duration)) setDurationMs(element.duration * 1000);
      },
      end: () => {
        if (!isActive(element)) return;
        setIsPlaying(false);
        nextRef.current();
      },
      error: () => {
        if (!isActive(element)) return;
        setError(
          engineRef.current === 'local' || engineRef.current === 'raw'
            ? 'Lagu import gagal dimuat. Cek nama file di manifest.json.'
            : engineRef.current === 'stems'
              ? 'Stem vokal/instrumen gagal dimuat. Cek manifest.json.'
              : 'Preview lagu ini gagal dimuat.',
        );
        setIsPlaying(false);
      },
    }));

    for (const handler of handlers) {
      handler.element.addEventListener('timeupdate', handler.time);
      handler.element.addEventListener('loadedmetadata', handler.meta);
      handler.element.addEventListener('ended', handler.end);
      handler.element.addEventListener('error', handler.error);
    }

    return () => {
      for (const handler of handlers) {
        handler.element.removeEventListener('timeupdate', handler.time);
        handler.element.removeEventListener('loadedmetadata', handler.meta);
        handler.element.removeEventListener('ended', handler.end);
        handler.element.removeEventListener('error', handler.error);
      }
    };
  }, [audio, localAudio, vocalAudio, instrumentalAudio]);

  /** Graf Web Audio untuk efek 8D. Dibuat sekali saat lagu lokal pertama diputar. */
  const ensureGraph = useCallback(() => {
    if (graphRef.current) return graphRef.current;
    const Ctor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    const source = ctx.createMediaElementSource(localAudio);
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    // HRTF bikin suara benar-benar berputar mengelilingi kepala, bukan cuma
    // digeser kiri-kanan seperti StereoPanner.
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.rolloffFactor = 0.2;
    const delay = ctx.createDelay(1);
    const feedback = ctx.createGain();
    const master = ctx.createGain();

    source.connect(dry);
    dry.connect(master);
    source.connect(panner);
    panner.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);
    master.connect(ctx.destination);

    dry.gain.value = spatialRef.current ? 0 : 1;
    wet.gain.value = spatialRef.current ? 1 : 0;
    feedback.gain.value = 0.16;
    delay.delayTime.value = 0.12;
    master.gain.value = volumeRef.current;

    const graph: SpatialGraph = { ctx, dry, wet, panner, master, frame: 0 };
    graphRef.current = graph;

    const startedAt = ctx.currentTime;
    const animate = () => {
      const active = graphRef.current;
      if (!active) return;
      const elapsed = active.ctx.currentTime - startedAt;
      const angle = (elapsed * Math.PI * 2) / 6;
      const now = active.ctx.currentTime;
      // Orbit mengelilingi listener; setTargetAtTime menghaluskan tiap frame.
      active.panner.positionX.setTargetAtTime(Math.cos(angle) * 1.1, now, 0.04);
      active.panner.positionY.setTargetAtTime(Math.sin(angle * 2) * 0.3, now, 0.04);
      active.panner.positionZ.setTargetAtTime(Math.sin(angle) * 1.1, now, 0.04);
      active.frame = requestAnimationFrame(animate);
    };
    graph.frame = requestAnimationFrame(animate);
    return graph;
  }, [localAudio]);

  /** Graf untuk vokal/instrumen terpisah: mixer 2x2 dengan hard L/R. */
  const ensureStemGraph = useCallback(() => {
    if (stemGraphRef.current) return stemGraphRef.current;
    const Ctor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    const vocalSource = ctx.createMediaElementSource(vocalAudio);
    const instrumentalSource = ctx.createMediaElementSource(instrumentalAudio);
    const merger = ctx.createChannelMerger(2);
    const vocalLeft = ctx.createGain();
    const vocalRight = ctx.createGain();
    const instrumentalLeft = ctx.createGain();
    const instrumentalRight = ctx.createGain();
    const master = ctx.createGain();

    // Stereo otomatis di-downmix ke satu kanal saat masuk input merger.
    vocalSource.connect(vocalLeft);
    vocalSource.connect(vocalRight);
    instrumentalSource.connect(instrumentalLeft);
    instrumentalSource.connect(instrumentalRight);
    vocalLeft.connect(merger, 0, 0);
    vocalRight.connect(merger, 0, 1);
    instrumentalLeft.connect(merger, 0, 0);
    instrumentalRight.connect(merger, 0, 1);
    merger.connect(master);
    master.connect(ctx.destination);
    master.gain.value = volumeRef.current;

    const graph: StemGraph = {
      ctx,
      vocalLeft,
      vocalRight,
      instrumentalLeft,
      instrumentalRight,
      master,
      side: 1,
      nextSwap: ctx.currentTime + 10,
      frame: 0,
    };
    stemGraphRef.current = graph;

    setStemMix(graph, spatialRef.current, 0);

    const animate = () => {
      const active = stemGraphRef.current;
      if (!active) return;
      if (spatialRef.current && active.ctx.currentTime >= active.nextSwap) {
        swapStemSides(active);
      }
      active.frame = requestAnimationFrame(animate);
    };
    graph.frame = requestAnimationFrame(animate);
    return graph;
  }, [instrumentalAudio, vocalAudio]);

  useEffect(
    () => () => {
      const graph = graphRef.current;
      if (graph) {
        cancelAnimationFrame(graph.frame);
        void graph.ctx.close();
        graphRef.current = null;
      }
      const stem = stemGraphRef.current;
      if (stem) {
        cancelAnimationFrame(stem.frame);
        void stem.ctx.close();
        stemGraphRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    audio.volume = volume;
    sdkPlayerRef.current?.setVolume(volume).catch(() => undefined);
    const graph = graphRef.current;
    if (graph) graph.master.gain.setTargetAtTime(volume, graph.ctx.currentTime, 0.05);
    const stem = stemGraphRef.current;
    if (stem) stem.master.gain.setTargetAtTime(volume, stem.ctx.currentTime, 0.05);
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

  /**
   * Lagu import yang efeknya sudah tertanam di file (mis. 10D): diputar apa
   * adanya lewat elemen audio biasa, tidak di-routing ke graf Web Audio.
   */
  const playRaw = useCallback(
    async (track: Track): Promise<boolean> => {
      if (!track.streamUrl) return false;
      try {
        setEngine('raw');
        setDurationMs(track.durationMs);
        setPositionMs(0);
        audio.src = track.streamUrl;
        audio.currentTime = 0;
        await audio.play();
        setIsPlaying(true);
        return true;
      } catch {
        return false;
      }
    },
    [audio],
  );

  const playLocal = useCallback(
    async (track: Track): Promise<boolean> => {
      if (!track.streamUrl) return false;
      const graph = ensureGraph();
      if (!graph) return false;
      try {
        await graph.ctx.resume();
        localAudio.src = track.streamUrl;
        localAudio.currentTime = 0;
        const fadeStart = graph.ctx.currentTime;
        graph.master.gain.cancelScheduledValues(fadeStart);
        graph.master.gain.setValueAtTime(0, fadeStart);
        graph.master.gain.linearRampToValueAtTime(volumeRef.current, fadeStart + 0.35);
        setEngine('local');
        setDurationMs(track.durationMs);
        setPositionMs(0);
        await localAudio.play();
        setIsPlaying(true);
        return true;
      } catch {
        return false;
      }
    },
    [ensureGraph, localAudio],
  );

  const playStems = useCallback(
    async (track: Track): Promise<boolean> => {
      if (!track.stems) return false;
      const graph = ensureStemGraph();
      if (!graph) return false;
      try {
        await graph.ctx.resume();
        vocalAudio.src = track.stems.vocals;
        instrumentalAudio.src = track.stems.instrumental;
        vocalAudio.currentTime = 0;
        instrumentalAudio.currentTime = 0;
        graph.side = 1;
        graph.nextSwap = graph.ctx.currentTime + 10;
        setStemMix(graph, spatialRef.current, 0.05);
        const fadeStart = graph.ctx.currentTime;
        graph.master.gain.cancelScheduledValues(fadeStart);
        graph.master.gain.setValueAtTime(0, fadeStart);
        graph.master.gain.linearRampToValueAtTime(volumeRef.current, fadeStart + 0.35);
        setEngine('stems');
        setDurationMs(track.durationMs);
        setPositionMs(0);
        await Promise.all([vocalAudio.play(), instrumentalAudio.play()]);
        setIsPlaying(true);
        return true;
      } catch {
        return false;
      }
    },
    [ensureStemGraph, instrumentalAudio, vocalAudio],
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
        localAudio.pause();
        vocalAudio.pause();
        instrumentalAudio.pause();

        // File yang sudah punya efek sendiri diputar apa adanya.
        if (track.preserveEffects && track.streamUrl) {
          const ok = await playRaw(track);
          if (ok) return;
        }

        // Stem yang sudah dipisah diputar bergantian kiri–kanan.
        if (track.stems) {
          const ok = await playStems(track);
          if (ok) return;
        }

        // Lagu import lain lewat jalur lokal supaya efek 8D bisa diproses.
        if (track.streamUrl) {
          const ok = await playLocal(track);
          if (ok) return;
        }

        if (spotifyAvailable) {
          const ok = await playThroughSpotify(tracks.slice(startIndex));
          if (ok) return;
        }

        const ok = await playPreview(track);
        if (!ok) {
          setIsPlaying(false);
          setEngine('idle');
          setError(
            track.streamUrl
              ? 'Lagu import gagal diputar. Cek file di folder public/audio/imports.'
              : track.previewUrl
                ? 'Lagu ini gagal diputar.'
                : 'Lagu ini tidak punya preview, dan pemutar Premium belum aktif. Login Spotify Premium untuk memutar lagu utuh.',
          );
        }
      } finally {
        startingRef.current = false;
      }
    },
    [
      audio,
      instrumentalAudio,
      localAudio,
      playLocal,
      playPreview,
      playRaw,
      playStems,
      playThroughSpotify,
      spotifyAvailable,
      vocalAudio,
    ],
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
      if (engineRef.current === 'preview' || engineRef.current === 'raw') audio.pause();
      if (engineRef.current === 'local') localAudio.pause();
      if (engineRef.current === 'stems') {
        vocalAudio.pause();
        instrumentalAudio.pause();
      }
      return;
    }
    void startAt(tracks, target);
  }, [audio, index, instrumentalAudio, localAudio, startAt, vocalAudio]);

  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const previous = useCallback(() => {
    const tracks = queueRef.current;
    if (tracks.length === 0) return;
    if (positionMs > 4000) {
      if (engineRef.current === 'preview' || engineRef.current === 'raw') audio.currentTime = 0;
      else if (engineRef.current === 'local') localAudio.currentTime = 0;
      else if (engineRef.current === 'stems') {
        vocalAudio.currentTime = 0;
        instrumentalAudio.currentTime = 0;
      } else void sdkPlayerRef.current?.seek(0);
      setPositionMs(0);
      return;
    }
    void startAt(tracks, Math.max(0, index - 1));
  }, [audio, index, instrumentalAudio, localAudio, positionMs, startAt, vocalAudio]);

  const toggle = useCallback(() => {
    if (!current) {
      if (queue.length > 0) playAt(0);
      return;
    }

    if (engineRef.current === 'stems') {
      if (vocalAudio.paused) {
        if (stemGraphRef.current) void stemGraphRef.current.ctx.resume();
        void Promise.all([vocalAudio.play(), instrumentalAudio.play()])
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        vocalAudio.pause();
        instrumentalAudio.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (
      engineRef.current === 'preview' ||
      engineRef.current === 'raw' ||
      engineRef.current === 'local'
    ) {
      const element = engineRef.current === 'local' ? localAudio : audio;
      if (element.paused) {
        if (engineRef.current === 'local' && graphRef.current) {
          void graphRef.current.ctx.resume();
        }
        void element
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        element.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (engineRef.current === 'spotify' && sdkPlayerRef.current) {
      void sdkPlayerRef.current.togglePlay();
      return;
    }

    playAt(index);
  }, [audio, current, index, instrumentalAudio, localAudio, playAt, queue.length, vocalAudio]);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(ms, durationMs || ms));
      setPositionMs(clamped);
      if (engineRef.current === 'preview' || engineRef.current === 'raw') {
        audio.currentTime = clamped / 1000;
      } else if (engineRef.current === 'local') {
        localAudio.currentTime = clamped / 1000;
      } else if (engineRef.current === 'stems') {
        vocalAudio.currentTime = clamped / 1000;
        instrumentalAudio.currentTime = clamped / 1000;
      } else if (engineRef.current === 'spotify') {
        void sdkPlayerRef.current?.seek(clamped);
      }
    },
    [audio, durationMs, instrumentalAudio, localAudio, vocalAudio],
  );

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    storage.saveVolume(clamped);
  }, []);

  const toggleSpatial = useCallback(() => {
    const next = !spatialRef.current;
    spatialRef.current = next;
    setSpatial(next);
    storage.saveSpatial(next);

    const graph = graphRef.current;
    if (graph) {
      // Crossfade kering → basah supaya efek nyala/mati tanpa klik.
      const now = graph.ctx.currentTime;
      rampParam(graph.dry.gain, next ? 0 : 1, now, 0.4);
      rampParam(graph.wet.gain, next ? 1 : 0, now, 0.4);
    }

    const stem = stemGraphRef.current;
    if (stem) {
      // Matikan efek = kedua stem kembali ke tengah (mix normal).
      setStemMix(stem, next, 0.45);
    }
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
      if (engineRef.current === 'preview' || engineRef.current === 'raw') {
        setPositionMs(audio.currentTime * 1000);
        return;
      }
      if (engineRef.current === 'local') {
        setPositionMs(localAudio.currentTime * 1000);
        return;
      }
      if (engineRef.current === 'stems') {
        setPositionMs(vocalAudio.currentTime * 1000);
        // Koreksi drift kecil supaya vokal tidak keluar dari beat instrumen.
        if (Math.abs(vocalAudio.currentTime - instrumentalAudio.currentTime) > 0.08) {
          instrumentalAudio.currentTime = vocalAudio.currentTime;
        }
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
  }, [audio, instrumentalAudio, isPlaying, localAudio, vocalAudio]);

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
      spatial,
      error,
      playQueue,
      playAt,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleSpatial,
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
      spatial,
      error,
      playQueue,
      playAt,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleSpatial,
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
