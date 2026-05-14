import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { validate } from '../middleware/validate.middleware';
import { rateLimitAuth } from '../middleware/rateLimit.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  deleteAccount,
} from '../../services/auth.service';
import { logAuditEvent } from '../../services/audit.service';
import { getDb } from '../../db/db';
import { config } from '../../utils/config';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  masterPassword: z.string().min(8).max(256),
});

const loginSchema = z.object({
  email: z.string().email(),
  masterPassword: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const logoutSchema = z.object({
  refreshToken: z.string(),
});

const deleteAccountSchema = z.object({
  masterPassword: z.string(),
});

router.post('/register', rateLimitAuth, validate(registerSchema), async (req, res: Response) => {
  const { email, masterPassword } = req.body;
  const result = await registerUser(email, masterPassword);

  if (result.success) {
    logAuditEvent(
      result.data!.userId,
      'auth.register',
      req.ip || '',
      req.headers['user-agent'] || '',
    );
  }

  res.status(result.success ? 201 : 409).json(result);
});

router.post('/login', rateLimitAuth, validate(loginSchema), async (req, res: Response) => {
  const { email, masterPassword } = req.body;
  const result = await loginUser(email, masterPassword);

  if (!result.success) {
    logAuditEvent('unknown', 'auth.login.failed', req.ip || '', req.headers['user-agent'] || '', {
      email,
    });
    res.status(401).json(result);
    return;
  }

  if ((result.data as any)?.totpRequired) {
    res.json(result);
    return;
  }

  const data = result.data!;
  res.cookie('token', data.token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  logAuditEvent(data.userId, 'auth.login', req.ip || '', req.headers['user-agent'] || '');
  res.json(result);
});

router.post('/refresh', rateLimitAuth, validate(refreshSchema), (req, res: Response) => {
  const { refreshToken } = req.body;
  const result = refreshAccessToken(refreshToken);

  if (result.success) {
    const data = result.data!;
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
  }

  res.json(result);
});

router.post('/logout', rateLimitAuth, validate(logoutSchema), (req, res: Response) => {
  const { refreshToken } = req.body;
  const result = logoutUser(refreshToken);
  res.clearCookie('token');
  res.json(result);
});

router.delete(
  '/account',
  authenticate,
  rateLimitAuth,
  validate(deleteAccountSchema),
  async (req: AuthRequest, res: Response) => {
    const result = await deleteAccount(req.userId!, req.body.masterPassword);

    if (result.success) {
      logAuditEvent(
        req.userId!,
        'auth.account.delete',
        req.ip || '',
        req.headers['user-agent'] || '',
      );
    }

    res.clearCookie('token');
    res.json(result);
  },
);

router.post('/totp/setup', authenticate, rateLimitAuth, async (req: AuthRequest, res: Response) => {
  const secret = authenticator.generateSecret();
  const serviceName = 'VaultLock';
  const otpauth = authenticator.keyuri(req.userEmail!, serviceName, secret);

  const db = getDb();
  db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret, req.userId);

  const qrCode = await toDataURL(otpauth);

  logAuditEvent(req.userId!, 'auth.totp.setup', req.ip || '', req.headers['user-agent'] || '');

  res.json({ success: true, data: { secret, qrCode, otpauth } });
});

router.post(
  '/totp/verify',
  authenticate,
  rateLimitAuth,
  async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    if (!code || code.length !== 6) {
      res.status(400).json({ success: false, error: 'Invalid TOTP code' });
      return;
    }

    const db = getDb();
    const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(req.userId) as
      | {
          totp_secret: string;
        }
      | undefined;

    if (!user?.totp_secret) {
      res.status(400).json({ success: false, error: 'TOTP not set up' });
      return;
    }

    const isValid = authenticator.check(code, user.totp_secret);
    if (!isValid) {
      res.json({ success: false, error: 'Invalid code' });
      return;
    }

    logAuditEvent(req.userId!, 'auth.totp.verify', req.ip || '', req.headers['user-agent'] || '');

    res.json({ success: true, data: { verified: true } });
  },
);

router.delete('/totp', authenticate, rateLimitAuth, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE users SET totp_secret = NULL WHERE id = ?').run(req.userId);

  logAuditEvent(req.userId!, 'auth.totp.disable', req.ip || '', req.headers['user-agent'] || '');

  res.json({ success: true });
});

export { router as authRouter };
