import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSync } from '../useSync';

const mocks = vi.hoisted(() => ({
  syncVault: vi.fn(),
  subscribe: vi.fn(),
  getStatus: vi.fn(),
}));

vi.mock('@/services/sync.service', () => ({
  syncService: {
    syncVault: mocks.syncVault,
    subscribe: mocks.subscribe,
    getStatus: mocks.getStatus,
  },
}));

describe('useSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.syncVault.mockReset();
    mocks.getStatus.mockReturnValue({ lastSync: null, status: 'idle', error: null, events: [] });
    mocks.subscribe.mockImplementation((cb: any) => {
      cb({ lastSync: null, status: 'idle', error: null, events: [] });
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial sync status', () => {
    const { result } = renderHook(() => useSync('user1', 60000));
    expect(result.current.status).toBeDefined();
    expect(result.current.status.status).toBe('idle');
  });

  it('triggers initial sync when userId is provided', () => {
    renderHook(() => useSync('user1', 60000));
    expect(mocks.syncVault).toHaveBeenCalledWith('user1');
  });

  it('does not sync when userId is null', () => {
    renderHook(() => useSync(null, 60000));
    expect(mocks.syncVault).not.toHaveBeenCalled();
  });

  it('sets up periodic sync interval', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    renderHook(() => useSync('user1', 60000));
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
  });

  it('subscribes to sync service', () => {
    renderHook(() => useSync('user1', 60000));
    expect(mocks.subscribe).toHaveBeenCalled();
  });
});
