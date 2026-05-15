import { Request, Response, NextFunction } from 'express';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

// Pluggable store for rate limit buckets — swap for Redis/etc in multi-instance deployments
export interface RateLimitStore {
  get(key: string): RateLimitBucket | undefined;
  set(key: string, bucket: RateLimitBucket): void;
  clear(): void;
}

class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, RateLimitBucket>();

  get(key: string): RateLimitBucket | undefined {
    return this.buckets.get(key);
  }

  set(key: string, bucket: RateLimitBucket): void {
    this.buckets.set(key, bucket);
  }

  clear(): void {
    this.buckets.clear();
  }
}

let store: RateLimitStore = new MemoryRateLimitStore();

// Replace the default in-memory store with an external implementation
export function setRateLimitStore(custom: RateLimitStore): void {
  store = custom;
}

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count++;
  return true;
}

// Rate limiter for auth routes (login, register)
export function rateLimitAuth(req: Request, res: Response, next: NextFunction): void {
  const key = `auth:${req.ip}`;
  const allowed = rateLimit(key, config.rateLimitAuth, config.rateLimitAuthWindow);

  if (!allowed) {
    logger.warn(`Rate limit exceeded for auth: ${req.ip}`);
    res.status(429).json({ success: false, error: 'Too many requests. Try again later.' });
    return;
  }
  next();
}

// Rate limiter for vault routes (get, sync, export)
export function rateLimitVault(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as any).userId;
  const key = `vault:${userId || req.ip}`;
  const allowed = rateLimit(key, config.rateLimitVault, config.rateLimitVaultWindow);

  if (!allowed) {
    res.status(429).json({ success: false, error: 'Too many requests. Try again later.' });
    return;
  }
  next();
}

// Default rate limiter for all other routes
export function rateLimitDefault(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as any).userId;
  const key = `default:${userId || req.ip}`;
  const allowed = rateLimit(key, config.rateLimitDefault, config.rateLimitDefaultWindow);

  if (!allowed) {
    res.status(429).json({ success: false, error: 'Too many requests. Try again later.' });
    return;
  }
  next();
}

// Exposes store for testing (clear between tests)
export function getRateLimitBuckets(): { clear: () => void } {
  return store;
}
