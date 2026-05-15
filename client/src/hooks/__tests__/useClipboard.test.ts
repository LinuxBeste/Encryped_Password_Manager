import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipboard } from '../useClipboard';

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with default state', () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copied).toBe(false);
    expect(result.current.clearingIn).toBeNull();
  });

  it('copies text to clipboard and sets copied state', async () => {
    const { result } = renderHook(() => useClipboard({ autoClearMs: 30000 }));
    await act(async () => {
      await result.current.copy('test password');
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test password');
    expect(result.current.copied).toBe(true);
    expect(result.current.clearingIn).toBe(30000);
  });

  it('clears clipboard and resets state', async () => {
    const { result } = renderHook(() => useClipboard());
    await act(async () => {
      await result.current.copy('test');
    });
    await act(async () => {
      await result.current.clear();
    });
    expect(result.current.copied).toBe(false);
    expect(result.current.clearingIn).toBeNull();
  });

  it('auto-clears after timeout', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useClipboard({ autoClearMs: 50 }));
    await act(async () => {
      await result.current.copy('test');
    });
    expect(result.current.copied).toBe(true);

    await waitFor(() => expect(result.current.copied).toBe(false), { timeout: 2000 });
    expect(result.current.clearingIn).toBeNull();
  });

  it('returns false on clipboard error', async () => {
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useClipboard());
    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.copy('test');
    });
    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it('uses electronAPI when available', async () => {
    const mockWrite = vi.fn().mockResolvedValue(true);
    (window as any).electronAPI = {
      clipboard: { write: mockWrite, clear: vi.fn() },
    };

    const { result } = renderHook(() => useClipboard());
    await act(async () => {
      await result.current.copy('test');
    });
    expect(mockWrite).toHaveBeenCalledWith('test');
    expect(result.current.copied).toBe(true);

    delete (window as any).electronAPI;
  });
});
