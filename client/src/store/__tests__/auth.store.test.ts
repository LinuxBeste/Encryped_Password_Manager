import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../auth.store';

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      isLocked: true,
      isFirstRun: true,
      user: null,
      sessionToken: null,
      refreshToken: null,
    });
  });

  it('starts with default state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLocked).toBe(true);
    expect(state.isFirstRun).toBe(true);
    expect(state.user).toBeNull();
  });

  describe('login', () => {
    it('sets authenticated state with user and tokens', () => {
      const user = { id: '1', email: 'test@test.com', encryptedVaultKey: '', createdAt: Date.now() };
      useAuthStore.getState().login(user, 'token123', 'refresh456');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLocked).toBe(false);
      expect(state.isFirstRun).toBe(false);
      expect(state.user).toEqual(user);
      expect(state.sessionToken).toBe('token123');
      expect(state.refreshToken).toBe('refresh456');
    });
  });

  describe('logout', () => {
    it('clears all auth state', () => {
      const user = { id: '1', email: 'test@test.com', encryptedVaultKey: '', createdAt: Date.now() };
      useAuthStore.getState().login(user, 'token123', 'refresh456');
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLocked).toBe(true);
      expect(state.user).toBeNull();
      expect(state.sessionToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('lock / unlock', () => {
    it('locks the vault', () => {
      useAuthStore.getState().login(
        { id: '1', email: 'test@test.com', encryptedVaultKey: '', createdAt: Date.now() },
        'token', 'refresh'
      );
      useAuthStore.getState().lock();
      expect(useAuthStore.getState().isLocked).toBe(true);
    });

    it('unlocks the vault', () => {
      useAuthStore.getState().lock();
      useAuthStore.getState().unlock();
      expect(useAuthStore.getState().isLocked).toBe(false);
    });
  });

  describe('setFirstRun', () => {
    it('updates first run flag', () => {
      useAuthStore.getState().setFirstRun(false);
      expect(useAuthStore.getState().isFirstRun).toBe(false);

      useAuthStore.getState().setFirstRun(true);
      expect(useAuthStore.getState().isFirstRun).toBe(true);
    });
  });

  describe('setUser', () => {
    it('updates user without changing auth state', () => {
      useAuthStore.getState().login(
        { id: '1', email: 'old@test.com', encryptedVaultKey: '', createdAt: Date.now() },
        'token', 'refresh'
      );
      const newUser = { id: '2', email: 'new@test.com', encryptedVaultKey: '', createdAt: Date.now() };
      useAuthStore.getState().setUser(newUser);
      expect(useAuthStore.getState().user?.email).toBe('new@test.com');
    });
  });
});
