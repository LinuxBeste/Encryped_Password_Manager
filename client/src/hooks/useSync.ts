import { useEffect, useCallback, useState } from 'react';
import { syncService } from '@/services/sync.service';
import type { SyncStatus } from '@/types';

// Hook that subscribes to sync status and triggers periodic syncs
export function useSync(userId: string | null, intervalMs: number = 5 * 60 * 1000) {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());
  const [syncing, setSyncing] = useState(false);

  // Subscribe to sync service status updates
  useEffect(() => {
    const unsubscribe = syncService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  // Trigger a vault sync for the given user
  const sync = useCallback(async () => {
    if (!userId || syncing) return;
    setSyncing(true);
    await syncService.syncVault(userId);
    setSyncing(false);
  }, [userId, syncing]);

  // Run initial sync and set up periodic interval
  useEffect(() => {
    if (!userId || intervalMs <= 0) return;
    sync();
    const timer = setInterval(sync, intervalMs);
    return () => clearInterval(timer);
  }, [userId, intervalMs, sync]);

  return { status, syncing, sync };
}
