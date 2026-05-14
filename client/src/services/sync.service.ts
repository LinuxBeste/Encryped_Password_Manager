import { getApi } from './api.service';
import type { VaultEntry, VaultFolder, SyncStatus, SyncEvent } from '@/types';

export class SyncService {
  private status: SyncStatus = {
    lastSync: null,
    status: 'idle',
    error: null,
    events: [],
  };

  private listeners: Array<(status: SyncStatus) => void> = [];

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.status }));
  }

  private addEvent(type: SyncEvent['type'], message: string) {
    this.status.events.unshift({ timestamp: Date.now(), type, message });
    if (this.status.events.length > 10) {
      this.status.events = this.status.events.slice(0, 10);
    }
  }

  async syncVault(userId: string): Promise<boolean> {
    this.status.status = 'syncing';
    this.addEvent('sync-start', 'Sync started');
    this.notify();

    try {
      const api = getApi();
      const response = await api.get(`/vault/sync?userId=${userId}`);

      if (response.data.success) {
        this.status.status = 'success';
        this.status.lastSync = Date.now();
        this.status.error = null;
        this.addEvent('sync-success', 'Vault synced successfully');
        this.notify();
        return true;
      } else {
        throw new Error(response.data.error || 'Sync failed');
      }
    } catch (err) {
      this.status.status = 'error';
      this.status.error = err instanceof Error ? err.message : 'Sync failed';
      this.addEvent('sync-error', this.status.error);
      this.notify();
      return false;
    }
  }

  async resolveConflict(
    entryId: string,
    resolution: 'server-wins' | 'client-wins'
  ): Promise<boolean> {
    try {
      const api = getApi();
      await api.post('/vault/sync/conflict', { entryId, resolution });
      this.addEvent('conflict', `Conflict resolved: ${resolution} for ${entryId}`);
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  resetStatus() {
    this.status = {
      lastSync: null,
      status: 'idle',
      error: null,
      events: [],
    };
    this.notify();
  }
}

export const syncService = new SyncService();
