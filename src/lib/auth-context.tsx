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
import {
  beginLogin,
  completeLogin,
  fetchMe,
  getAccessToken,
  logout as clearAuth,
  type SpotifyMe,
} from './auth';

interface AuthApi {
  ready: boolean;
  spotifyConfigured: boolean;
  clientId: string | null;
  me: SpotifyMe | null;
  premium: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthApi | null>(null);

interface ServerConfig {
  spotifyConfigured: boolean;
  clientId: string | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<ServerConfig>({
    spotifyConfigured: false,
    clientId: null,
  });
  const [me, setMe] = useState<SpotifyMe | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let alive = true;

    void (async () => {
      let serverConfig: ServerConfig = { spotifyConfigured: false, clientId: null };
      try {
        const response = await fetch('/api/config');
        if (response.ok) serverConfig = (await response.json()) as ServerConfig;
      } catch {
        /* offline / preview statis: tetap jalan tanpa Spotify */
      }

      if (!alive) return;
      setConfig(serverConfig);

      if (serverConfig.clientId) {
        try {
          const redirected = await completeLogin(serverConfig.clientId);
          if (redirected) {
            const token = await getAccessToken(serverConfig.clientId);
            if (token && alive) setMe(await fetchMe(token));
          } else {
            const token = await getAccessToken(serverConfig.clientId);
            if (token && alive) setMe(await fetchMe(token));
          }
        } catch {
          /* token gagal: biarkan user jalan tanpa login */
        }
      }

      if (alive) setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(() => {
    if (!config.clientId) return;
    void beginLogin(config.clientId);
  }, [config.clientId]);

  const logout = useCallback(() => {
    clearAuth();
    setMe(null);
  }, []);

  const value = useMemo<AuthApi>(
    () => ({
      ready,
      spotifyConfigured: config.spotifyConfigured,
      clientId: config.clientId,
      me,
      premium: me?.product === 'premium',
      login,
      logout,
    }),
    [ready, config, me, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return context;
}
