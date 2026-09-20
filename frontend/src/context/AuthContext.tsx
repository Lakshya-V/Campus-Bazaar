import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types/market';
import { INITIAL_USERS } from '../data/mockMarketData';
import {
  AUTH_LOGOUT_EVENT,
  axiosInstance,
  clearAuthTokens,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from '../api/axios';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  switchUser: (userId: string) => void;
  logout: () => Promise<void>;
  demoUsers: User[];
}

interface ProfileResponse {
  id: number;
  username: string;
  university_email: string;
  is_verified_student: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = 'campus_bazaar_active_user_v2';

function toUser(profile: ProfileResponse): User {
  return {
    User_ID: String(profile.id),
    Name: profile.username,
    InstitutionalEmail: profile.university_email,
    Role: 'Student • Verified Campus Peer',
    AvatarSeed: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.username)}`,
    Rating: 5,
    RatingCount: 0,
    IsVerified: profile.is_verified_student,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessTokenState] = useState<string | null>(getAccessToken);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(
    () => localStorage.getItem('campus_bazaar_refresh_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  const applyTokens = useCallback((access: string, refresh?: string) => {
    setAccessToken(access);
    setAccessTokenState(access);
    if (refresh) {
      setRefreshToken(refresh);
      setRefreshTokenState(refresh);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const { data } = await axiosInstance.get<ProfileResponse>('/auth/profile/');
    const nextUser = toUser(data);
    setUser(nextUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    return nextUser;
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      if (!getAccessToken()) {
        if (active) setIsLoading(false);
        return;
      }
      try {
        await fetchProfile();
      } catch {
        clearAuthTokens();
        if (active) {
          setUser(null);
          setAccessTokenState(null);
          setRefreshTokenState(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void restoreSession();
    return () => {
      active = false;
    };
  }, [fetchProfile]);

  useEffect(() => {
    const handleForcedLogout = () => {
      clearAuthTokens();
      setUser(null);
      setAccessTokenState(null);
      setRefreshTokenState(null);
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const { data } = await axiosInstance.post<{ access: string; refresh: string }>(
          '/auth/login/',
          { username: email.trim().toLowerCase(), password }
        );
        applyTokens(data.access, data.refresh);
        await fetchProfile();
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [applyTokens, fetchProfile]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        await axiosInstance.post('/auth/register/', {
          username: name.trim(),
          university_email: email.trim().toLowerCase(),
          password,
        });
        return await login(email, password);
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  const switchUser = useCallback((userId: string) => {
    const target = INITIAL_USERS.find((candidate) => candidate.User_ID === userId);
    if (target) setUser(target);
  }, []);

  const logout = useCallback(async () => {
    clearAuthTokens();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setAccessTokenState(null);
    setRefreshTokenState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      signup,
      switchUser,
      logout,
      demoUsers: INITIAL_USERS,
    }),
    [user, accessToken, refreshToken, isLoading, login, signup, switchUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
