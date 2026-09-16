// src/context/AuthContext.tsx
//
// In-memory mock authentication context for Campus Bazaar.
// Stores the active student user session in localStorage, with email validation,
// demo student account switching, and logout capabilities.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { User } from '../types/market';
import { INITIAL_USERS } from '../data/mockMarketData';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<boolean>;
  signup: (name: string, email: string) => Promise<boolean>;
  switchUser: (userId: string) => void;
  logout: () => Promise<void>;
  demoUsers: User[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'campus_bazaar_active_user_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    // Default to null so Route "/" when logged out renders ONLY the login page as required by Phase 1 Auth Gate
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate natural 300ms network verification
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanEmail = email.trim().toLowerCase();

    // Check if matches an existing mock user
    const existing = INITIAL_USERS.find(
      (u) => u.InstitutionalEmail.toLowerCase() === cleanEmail
    );

    if (existing) {
      setUser(existing);
      setIsLoading(false);
      return true;
    }

    // Auto-provision a verified student account for any valid campus email
    const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Campus Student';

    const newUser: User = {
      User_ID: `user_${Date.now()}`,
      Name: formattedName,
      InstitutionalEmail: cleanEmail,
      Role: 'Student • Verified Campus Peer',
      AvatarSeed: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      Rating: 5.0,
      RatingCount: 1,
      IsVerified: true,
    };

    setUser(newUser);
    setIsLoading(false);
    return true;
  }, []);

  const signup = useCallback(async (name: string, email: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate natural 300ms network verification
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'Campus Student';

    const newUser: User = {
      User_ID: `user_${Date.now()}`,
      Name: cleanName,
      InstitutionalEmail: cleanEmail,
      Role: 'Student • Verified Campus Peer',
      AvatarSeed: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      Rating: 5.0,
      RatingCount: 0,
      IsVerified: true,
    };

    setUser(newUser);
    setIsLoading(false);
    return true;
  }, []);

  const switchUser = useCallback((userId: string) => {
    const target = INITIAL_USERS.find((u) => u.User_ID === userId);
    if (target) {
      setUser(target);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      signup,
      switchUser,
      logout,
      demoUsers: INITIAL_USERS,
    }),
    [user, isLoading, login, signup, switchUser, logout]
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