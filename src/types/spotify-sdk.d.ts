export {};

declare global {
  interface SpotifySdkState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: {
        uri: string;
        id: string | null;
        name: string;
        artists: { name: string }[];
      };
    };
  }

  interface SpotifySdkError {
    message: string;
  }

  interface SpotifySdkPlayer {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (payload: never) => void): boolean;
    removeListener(event: string, callback?: (payload: never) => void): boolean;
    getCurrentState(): Promise<SpotifySdkState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position: number): Promise<void>;
  }

  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume?: number;
      }) => SpotifySdkPlayer;
    };
  }
}
