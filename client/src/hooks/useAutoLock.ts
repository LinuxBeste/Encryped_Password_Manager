import { useEffect, useRef, useCallback } from 'react';

interface UseAutoLockOptions {
  timeout: number;
  onLock: () => void;
  enabled?: boolean;
}

// Hook that locks the vault after a period of user inactivity
export function useAutoLock({ timeout, onLock, enabled = true }: UseAutoLockOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastActivityRef = useRef(Date.now());

  // Reset the inactivity timer on user activity
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled && timeout > 0) {
      timerRef.current = setTimeout(() => {
        onLock();
      }, timeout);
    }
  }, [timeout, onLock, enabled]);

  // Listen for user activity events and reset timer
  useEffect(() => {
    resetTimer();
    const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll'];

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        resetTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return { resetTimer, lastActivity: lastActivityRef };
}
