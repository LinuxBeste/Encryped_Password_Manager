import { rateLimitAuth, rateLimitVault, rateLimitDefault, getRateLimitBuckets } from '../rateLimit.middleware';
import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

// Creates mock request/response with configurable IP and userId
function mockReqRes(overrides: Partial<Request> = {}): { req: Request; res: Response; next: NextFunction } {
  const req = {
    ip: '127.0.0.1',
    ...overrides,
  } as unknown as Request;

  let statusCode = 200;
  let body: any;
  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      body = data;
      return res;
    },
    _getStatusCode: () => statusCode,
    _getBody: () => body,
  } as unknown as Response & { _getStatusCode: () => number; _getBody: () => any };

  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => {
  getRateLimitBuckets().clear();
});

describe('RateLimitMiddleware — auth (5 req/15min)', () => {
  it('allows requests under the limit', () => {
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = mockReqRes();
      rateLimitAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      (next as jest.Mock).mockClear();
    }
  });

  it('blocks requests at the limit', () => {
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = mockReqRes();
      rateLimitAuth(req, res, next);
    }
    const { req, res, next } = mockReqRes();
    rateLimitAuth(req, res, next);
    expect((res as any)._getStatusCode()).toBe(429);
    expect(next).not.toHaveBeenCalled();
  });

  it('tracks separate buckets per IP', () => {
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = mockReqRes({ ip: '1.1.1.1' });
      rateLimitAuth(req, res, next);
    }
    const { req, res, next } = mockReqRes({ ip: '2.2.2.2' });
    rateLimitAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('RateLimitMiddleware — vault (30 req/min)', () => {
  it('allows requests under vault limit', () => {
    for (let i = 0; i < 30; i++) {
      const { req, res, next } = mockReqRes({ userId: 'u1' } as any);
      rateLimitVault(req, res, next);
      expect(next).toHaveBeenCalled();
      (next as jest.Mock).mockClear();
    }
  });

  it('blocks at vault limit', () => {
    for (let i = 0; i < 30; i++) {
      const { req, res, next } = mockReqRes({ userId: 'u2' } as any);
      rateLimitVault(req, res, next);
    }
    const { req, res, next } = mockReqRes({ userId: 'u2' } as any);
    rateLimitVault(req, res, next);
    expect((res as any)._getStatusCode()).toBe(429);
  });

  it('separates vault buckets per user', () => {
    for (let i = 0; i < 35; i++) {
      const { req: r1, res: rs1, next: n1 } = mockReqRes({ userId: 'user-a' } as any);
      rateLimitVault(r1, rs1, n1);
    }
    const { req, res, next } = mockReqRes({ userId: 'user-b' } as any);
    rateLimitVault(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('RateLimitMiddleware — default (100 req/min)', () => {
  it('allows requests under default limit', () => {
    for (let i = 0; i < 100; i++) {
      const { req, res, next } = mockReqRes({ userId: 'd1' } as any);
      rateLimitDefault(req, res, next);
      expect(next).toHaveBeenCalled();
      (next as jest.Mock).mockClear();
    }
  });

  it('blocks at default limit', () => {
    for (let i = 0; i < 100; i++) {
      const { req, res, next } = mockReqRes({ userId: 'd2' } as any);
      rateLimitDefault(req, res, next);
    }
    const { req, res, next } = mockReqRes({ userId: 'd2' } as any);
    rateLimitDefault(req, res, next);
    expect((res as any)._getStatusCode()).toBe(429);
  });
});

describe('RateLimitMiddleware — edge cases', () => {
  it('uses IP when userId is missing', () => {
    for (let i = 0; i < 100; i++) {
      const { req, res, next } = mockReqRes();
      rateLimitDefault(req, res, next);
    }
    const { req, res, next } = mockReqRes();
    rateLimitDefault(req, res, next);
    expect((res as any)._getStatusCode()).toBe(429);
  });

  it('handles nullish IP gracefully', () => {
    const { req, res, next } = mockReqRes({ ip: undefined } as any);
    expect(() => rateLimitAuth(req, res, next)).not.toThrow();
  });

  it('buckets reset after window expires', () => {
    jest.useFakeTimers();
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = mockReqRes();
      rateLimitAuth(req, res, next);
    }
    // Advance past window (15 min)
    jest.advanceTimersByTime(15 * 60 * 1000 + 1);
    const { req, res, next } = mockReqRes();
    rateLimitAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
