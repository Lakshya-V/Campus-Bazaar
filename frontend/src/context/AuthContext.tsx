// src/context/AuthContext.tsx
//
// Auth state for the app. The access token itself lives in axios.ts's
// in-memory store, not here — this context wraps it with the React state
// components actually consume (current user, loading, auth actions) and
// handles the one-time "am I already logged in?" check on app boot.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  axiosInstance,
  setAccessToken,
  AUTH_LOGOUT_EVENT,
} from '../api/axios';
import type { LoginResponse, User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True until the initial boot-time hydration check has finished. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app boot there is no access token in memory yet — a hard reload
  // wipes it, by design. If the user has a valid refresh cookie, calling
  // any protected endpoint here will 401 once, the axios response
  // interceptor will silently exchange the refresh cookie for a new
  // access token, and this request will succeed on retry. If the refresh
  // cookie is missing or expired, it fails and we land in the logged-out
  // state — exactly what we want.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const res = await axiosInstance.get<User>('/auth/profile/');
        if (!cancelled) {
          setUser(res.data);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // If a refresh attempt fails at any point later in the session (not
  // just on boot), axios.ts dispatches this event instead of importing
  // React directly. Catch it here and drop back to the logged-out state.
  useEffect(() => {
    function handleForcedLogout() {
      setUser(null);
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await axiosInstance.post<LoginResponse>('/auth/login/', {
      email,
      password,
    });
    // The backend sets the httpOnly refresh cookie as part of this
    // response (Set-Cookie header) — nothing to do with it here.
    setAccessToken(res.data.access);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Best-effort: lets the backend invalidate/rotate the refresh
      // cookie server-side. Not in the v2 endpoint table yet — safe to
      // no-op there until it exists.
      await axiosInstance.post('/auth/logout/');
    } catch {
      // Ignore — we're logging out either way.
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}