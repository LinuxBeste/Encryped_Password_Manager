import { useState, useCallback, useRef } from 'react';

interface UseClipboardOptions {
  autoClearMs?: number;
}

export function useClipboard({ autoClearMs = 30000 }: UseClipboardOptions = {}) {
  const [copied, setCopied] = useState(false);
  const [clearingIn, setClearingIn] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  const copy = useCallback(async (text: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.clipboard.write(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setClearingIn(autoClearMs);

      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);

      timerRef.current = setTimeout(() => {
        clear();
      }, autoClearMs);

      const start = Date.now();
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, autoClearMs - elapsed);
        setClearingIn(remaining);
        if (remaining <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }, 100);

      return true;
    } catch {
      return false;
    }
  }, [autoClearMs]);

  const clear = useCallback(async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.clipboard.clear();
      } else {
        await navigator.clipboard.writeText('');
      }
    } catch { /* ignore */ }
    setCopied(false);
    setClearingIn(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  return { copied, clearingIn, copy, clear };
}
