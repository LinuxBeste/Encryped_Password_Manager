import { Request, Response, NextFunction } from 'express';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count++;
  return true;
}

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

export function getRateLimitBuckets(): Map<string, RateLimitBucket> {
  return buckets;
}
