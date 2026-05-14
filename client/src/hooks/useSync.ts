import { useEffect, useCallback, useState } from 'react';
import { syncService } from '@/services/sync.service';
import type { SyncStatus } from '@/types';

export function useSync(userId: string | null, intervalMs: number = 5 * 60 * 1000) {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  const sync = useCallback(async () => {
    if (!userId || syncing) return;
    setSyncing(true);
    await syncService.syncVault(userId);
    setSyncing(false);
  }, [userId, syncing]);

  useEffect(() => {
    if (!userId || intervalMs <= 0) return;
    sync();
    const timer = setInterval(sync, intervalMs);
    return () => clearInterval(timer);
  }, [userId, intervalMs, sync]);

  return { status, syncing, sync };
}
