import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoLock } from '../useAutoLock';

describe('useAutoLock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('locks after timeout period of inactivity', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock({ timeout: 5000, onLock, enabled: true }));

    vi.advanceTimersByTime(5000);
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('does not lock when disabled', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock({ timeout: 5000, onLock, enabled: false }));

    vi.advanceTimersByTime(5000);
    expect(onLock).not.toHaveBeenCalled();
  });

  it('does not lock with zero timeout', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock({ timeout: 0, onLock, enabled: true }));

    vi.advanceTimersByTime(100000);
    expect(onLock).not.toHaveBeenCalled();
  });

  it('resets timer on user activity', () => {
    const onLock = vi.fn();

    renderHook(() => useAutoLock({ timeout: 5000, onLock, enabled: true }));

    vi.advanceTimersByTime(3000);

    window.dispatchEvent(new MouseEvent('mousedown'));

    vi.advanceTimersByTime(3000);
    expect(onLock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('returns resetTimer function', () => {
    const onLock = vi.fn();
    const { result } = renderHook(() => useAutoLock({ timeout: 5000, onLock, enabled: true }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.resetTimer();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onLock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onLock).toHaveBeenCalledTimes(1);
  });
});
