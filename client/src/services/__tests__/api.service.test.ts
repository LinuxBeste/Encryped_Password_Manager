import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('axios', () => {
  let defaultsState = { baseURL: '', timeout: 0 };
  const mockAxiosInstance = {
    get defaults() { return defaultsState; },
    set defaults(v: any) { defaultsState = v; },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  const mockCreate = vi.fn((config?: any) => {
    if (config) {
      defaultsState = { baseURL: config.baseURL || '', timeout: config.timeout || 0 };
      mockAxiosInstance.defaults = defaultsState;
    }
    return mockAxiosInstance;
  });

  return {
    default: {
      create: mockCreate,
      get: vi.fn(),
      post: vi.fn(),
    },
    create: mockCreate,
    get: vi.fn(),
    post: vi.fn(),
  };
});

describe('api.service', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  describe('initApi / getApi', () => {
    it('creates an axios instance with the base URL', async () => {
      const { initApi } = await import('../api.service');
      const instance = initApi('http://localhost:3000/api');
      expect(instance.defaults.baseURL).toBe('http://localhost:3000/api');
      expect(instance.defaults.timeout).toBe(15000);
    });

    it('throws getApi before init', async () => {
      const { getApi } = await import('../api.service');
      expect(() => getApi()).toThrow('API not initialized');
    });

    it('returns same instance on subsequent calls', async () => {
      const { initApi, getApi } = await import('../api.service');
      const a = initApi('http://localhost:3000/api');
      const b = getApi();
      expect(a).toBe(b);
    });
  });

  describe('token management', () => {
    it('stores and retrieves tokens', async () => {
      const { setTokens, getAccessToken } = await import('../api.service');
      setTokens('access123', 'refresh456');
      expect(getAccessToken()).toBe('access123');
    });

    it('clears tokens', async () => {
      const { setTokens, clearTokens, getAccessToken } = await import('../api.service');
      setTokens('access123', 'refresh456');
      clearTokens();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('testConnection', () => {
    it('returns true when health check succeeds', async () => {
      const { testConnection } = await import('../api.service');
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockResolvedValue({ data: { success: true } });
      const result = await testConnection('http://localhost:3000/api');
      expect(result).toBe(true);
    });

    it('returns false when health check fails', async () => {
      const { testConnection } = await import('../api.service');
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockResolvedValue({ data: { success: false } });
      const result = await testConnection('http://localhost:3000/api');
      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      const { testConnection } = await import('../api.service');
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockRejectedValue(new Error('Network error'));
      const result = await testConnection('http://localhost:3000/api');
      expect(result).toBe(false);
    });
  });
});
