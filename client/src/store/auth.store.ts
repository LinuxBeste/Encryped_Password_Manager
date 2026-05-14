import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLocked: boolean;
  isFirstRun: boolean;
  user: User | null;
  sessionToken: string | null;
  refreshToken: string | null;
  login: (user: User, sessionToken: string, refreshToken: string) => void;
  logout: () => void;
  lock: () => void;
  unlock: () => void;
  setFirstRun: (val: boolean) => void;
  setUser: (user: User) => void;
}

// Persisted auth store managing login, lock, and first-run state
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLocked: true,
      isFirstRun: true,
      user: null,
      sessionToken: null,
      refreshToken: null,

      // Set authenticated state with user and tokens
      login: (user, sessionToken, refreshToken) =>
        set({
          isAuthenticated: true,
          isLocked: false,
          isFirstRun: false,
          user,
          sessionToken,
          refreshToken,
        }),

      // Clear all auth state on logout
      logout: () =>
        set({
          isAuthenticated: false,
          isLocked: true,
          user: null,
          sessionToken: null,
          refreshToken: null,
        }),

      // Toggle locked state
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
      setFirstRun: (val) => set({ isFirstRun: val }),
      setUser: (user) => set({ user }),
    }),
    { name: 'vaultlock-auth' },
  ),
);
