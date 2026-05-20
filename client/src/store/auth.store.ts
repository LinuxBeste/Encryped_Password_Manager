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
  passwordVerifier: string | null;
  passwordSalt: string | null;
  login: (user: User, sessionToken: string, refreshToken: string) => void;
  logout: () => void;
  lock: () => void;
  unlock: () => void;
  setFirstRun: (val: boolean) => void;
  setUser: (user: User) => void;
  setPasswordVerifier: (verifier: string, salt: string) => void;
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
      passwordVerifier: null,
      passwordSalt: null,

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
          passwordVerifier: null,
          passwordSalt: null,
        }),

      // Toggle locked state
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
      setFirstRun: (val) => set({ isFirstRun: val }),
      setUser: (user) => set({ user }),
      setPasswordVerifier: (verifier, salt) => set({ passwordVerifier: verifier, passwordSalt: salt }),
    }),
    { name: 'vaultlock-auth',
      // Only persist non-sensitive fields; tokens live in api.service.ts memory
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isLocked: state.isLocked,
        isFirstRun: state.isFirstRun,
        user: state.user,
        passwordVerifier: state.passwordVerifier,
        passwordSalt: state.passwordSalt,
      }),
    },
  ),
);
