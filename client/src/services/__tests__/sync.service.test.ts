import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService } from '../sync.service';

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
};

vi.mock('../api.service', () => ({
  getApi: () => mockApi,
}));

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(() => {
    service = new SyncService();
    mockApi.get.mockReset();
    mockApi.post.mockReset();
  });

  describe('getStatus', () => {
    it('returns idle status initially', () => {
      const status = service.getStatus();
      expect(status.status).toBe('idle');
      expect(status.lastSync).toBeNull();
      expect(status.error).toBeNull();
      expect(status.events).toEqual([]);
    });
  });

  describe('subscribe', () => {
    it('notifies listeners on status changes', async () => {
      const listener = vi.fn();
      service.subscribe(listener);

      mockApi.get.mockResolvedValue({ data: { success: true } });

      await service.syncVault('user1');
      expect(listener).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();
      service['notify']();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('syncVault', () => {
    it('sets syncing status and returns true on success', async () => {
      mockApi.get.mockResolvedValue({ data: { success: true } });

      const result = await service.syncVault('user1');
      expect(result).toBe(true);
      expect(service.getStatus().status).toBe('success');
      expect(service.getStatus().lastSync).not.toBeNull();
    });

    it('sets error status and returns false on failure', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      const result = await service.syncVault('user1');
      expect(result).toBe(false);
      expect(service.getStatus().status).toBe('error');
      expect(service.getStatus().error).toBe('Network error');
    });

    it('adds events to history', async () => {
      mockApi.get.mockResolvedValue({ data: { success: true } });

      await service.syncVault('user1');
      const events = service.getStatus().events;
      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events[1].type).toBe('sync-start');
      expect(events[0].type).toBe('sync-success');
    });

    it('caps events at 10', async () => {
      mockApi.get.mockResolvedValue({ data: { success: true } });

      for (let i = 0; i < 15; i++) {
        await service.syncVault('user1');
      }
      expect(service.getStatus().events.length).toBeLessThanOrEqual(10);
    });
  });

  describe('resolveConflict', () => {
    it('returns true on successful conflict resolution', async () => {
      mockApi.post.mockResolvedValue({ data: { success: true } });

      const result = await service.resolveConflict('entry1', 'server-wins');
      expect(result).toBe(true);
    });

    it('returns false on failure', async () => {
      mockApi.post.mockRejectedValue(new Error('fail'));

      const result = await service.resolveConflict('entry1', 'server-wins');
      expect(result).toBe(false);
    });
  });

  describe('resetStatus', () => {
    it('resets to idle state', () => {
      service['status'] = {
        lastSync: Date.now(),
        status: 'success',
        error: null,
        events: [{ timestamp: Date.now(), type: 'sync-success', message: 'ok' }],
      };

      service.resetStatus();
      const status = service.getStatus();
      expect(status.status).toBe('idle');
      expect(status.lastSync).toBeNull();
      expect(status.events).toEqual([]);
    });
  });
});
