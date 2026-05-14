import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../../utils/config';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

// Validates CSRF token cookie matches header on mutating requests; sets cookie on safe methods
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (safeMethods.includes(req.method)) {
    if (!req.cookies[CSRF_COOKIE]) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    next();
    return;
  }

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ success: false, error: 'CSRF token mismatch' });
    return;
  }

  next();
}
