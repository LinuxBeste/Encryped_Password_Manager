import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../middleware/validate.middleware';
import { rateLimitAuth } from '../middleware/rateLimit.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { verifyEmail2faAndLogin } from '../../services/auth.service';
import { logAuditEvent } from '../../services/audit.service';
import { getDb } from '../../db/db';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';
import { sendEmail, createEmail2faCode, buildEmail2faBody } from '../../services/email.service';
import { Email2faCode } from '../../types';

const router = Router();

const sendCodeSchema = z.object({
  userId: z.string(),
});

const verifyCodeSchema = z.object({
  userId: z.string(),
  code: z.string().min(1),
});

const enableSchema = z.object({
  code: z.string().min(1),
});

const EMAIL_2FA_COOLDOWN_MS = 30_000;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function cleanupExpiredCodes(userId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM email_2fa_codes WHERE user_id = ? AND expires_at < ?').run(
    userId,
    Date.now(),
  );
}

router.post(
  '/email-2fa/send',
  rateLimitAuth,
  validate(sendCodeSchema),
  async (req, res: Response) => {
    const { userId } = req.body;

    if (!config.email2faEnabled) {
      res.status(400).json({ success: false, error: 'Email 2FA is not enabled on this server' });
      return;
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, email_2fa_enabled FROM users WHERE id = ?').get(userId) as
      | { id: string; email: string; email_2fa_enabled: number }
      | undefined;

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (!user.email_2fa_enabled) {
      res.status(400).json({ success: false, error: 'Email 2FA is not enabled on this account' });
      return;
    }

    cleanupExpiredCodes(userId);

    const recent = db
      .prepare(
        'SELECT created_at FROM email_2fa_codes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      )
      .get(userId) as { created_at: number } | undefined;

    if (recent && Date.now() - recent.created_at < EMAIL_2FA_COOLDOWN_MS) {
      const remaining = Math.ceil(
        (EMAIL_2FA_COOLDOWN_MS - (Date.now() - recent.created_at)) / 1000,
      );
      res.status(429).json({
        success: false,
        error: `Please wait ${remaining}s before requesting a new code`,
      });
      return;
    }

    const code = createEmail2faCode();
    const codeHash = hashCode(code);
    const id = uuidv4();
    const now = Date.now();

    db.prepare(
      'INSERT INTO email_2fa_codes (id, user_id, code_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    ).run(id, userId, codeHash, now + config.email2faCodeExpiryMs, now);

    const { text, html } = buildEmail2faBody(code);
    await sendEmail({
      to: user.email,
      subject: 'Your VaultLock verification code',
      text,
      html,
    });

    logger.info(`Email 2FA code sent to ${user.email} (user ${userId})`);

    res.json({ success: true, data: { message: 'Verification code sent to your email' } });
  },
);

router.post(
  '/email-2fa/verify',
  rateLimitAuth,
  validate(verifyCodeSchema),
  (req, res: Response) => {
    const { userId, code } = req.body;

    const db = getDb();
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId) as
      | { id: string; email: string }
      | undefined;

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    cleanupExpiredCodes(userId);

    const codeHash = hashCode(code);
    const row = db
      .prepare(
        'SELECT * FROM email_2fa_codes WHERE user_id = ? AND code_hash = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      )
      .get(userId, codeHash, Date.now()) as Email2faCode | undefined;

    if (!row) {
      logAuditEvent(userId, 'auth.email2fa.failed', req.ip || '', req.headers['user-agent'] || '');
      res.json({ success: false, error: 'Invalid or expired verification code' });
      return;
    }

    db.prepare('UPDATE email_2fa_codes SET used = 1 WHERE id = ?').run(row.id);

    const result = verifyEmail2faAndLogin(userId);

    if (!result.success) {
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

    logAuditEvent(userId, 'auth.email2fa.verify', req.ip || '', req.headers['user-agent'] || '');
    logger.info(`Email 2FA login complete for ${user.email}`);

    res.json(result);
  },
);

router.post(
  '/email-2fa/enable',
  authenticate,
  rateLimitAuth,
  validate(enableSchema),
  async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    const userId = req.userId!;

    const db = getDb();

    if (!config.email2faEnabled) {
      res.status(400).json({ success: false, error: 'Email 2FA is not enabled on this server' });
      return;
    }

    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId) as
      | { id: string; email: string }
      | undefined;

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const existing = db
      .prepare('SELECT email_2fa_enabled FROM users WHERE id = ?')
      .get(userId) as { email_2fa_enabled: number } | undefined;

    if (existing?.email_2fa_enabled) {
      res.status(400).json({ success: false, error: 'Email 2FA is already enabled' });
      return;
    }

    const codeHash = hashCode(code);
    const row = db
      .prepare(
        'SELECT * FROM email_2fa_codes WHERE user_id = ? AND code_hash = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1',
      )
      .get(userId, codeHash, Date.now()) as Email2faCode | undefined;

    if (!row) {
      res.json({ success: false, error: 'Invalid or expired verification code. Request a new one.' });
      return;
    }

    db.prepare('UPDATE email_2fa_codes SET used = 1 WHERE id = ?').run(row.id);
    db.prepare('UPDATE users SET email_2fa_enabled = 1 WHERE id = ?').run(userId);

    logAuditEvent(userId, 'auth.email2fa.enable', req.ip || '', req.headers['user-agent'] || '');
    logger.info(`Email 2FA enabled for user ${userId}`);

    res.json({ success: true, data: { message: 'Email 2FA enabled' } });
  },
);

router.delete(
  '/email-2fa',
  authenticate,
  rateLimitAuth,
  (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const db = getDb();

    db.prepare('UPDATE users SET email_2fa_enabled = 0 WHERE id = ?').run(userId);
    db.prepare('DELETE FROM email_2fa_codes WHERE user_id = ?').run(userId);

    logAuditEvent(userId, 'auth.email2fa.disable', req.ip || '', req.headers['user-agent'] || '');
    logger.info(`Email 2FA disabled for user ${userId}`);

    res.json({ success: true });
  },
);

router.get('/email-2fa/send-enable', authenticate, rateLimitAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const db = getDb();

  if (!config.email2faEnabled) {
    res.status(400).json({ success: false, error: 'Email 2FA is not enabled on this server' });
    return;
  }

  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId) as
    | { id: string; email: string }
    | undefined;

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  cleanupExpiredCodes(userId);

  const recent = db
    .prepare(
      'SELECT created_at FROM email_2fa_codes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    )
    .get(userId) as { created_at: number } | undefined;

  if (recent && Date.now() - recent.created_at < EMAIL_2FA_COOLDOWN_MS) {
    const remaining = Math.ceil(
      (EMAIL_2FA_COOLDOWN_MS - (Date.now() - recent.created_at)) / 1000,
    );
    res.status(429).json({
      success: false,
      error: `Please wait ${remaining}s before requesting a new code`,
    });
    return;
  }

  const code = createEmail2faCode();
  const codeHash = hashCode(code);
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    'INSERT INTO email_2fa_codes (id, user_id, code_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
  ).run(id, userId, codeHash, now + config.email2faCodeExpiryMs, now);

  const { text, html } = buildEmail2faBody(code);
  await sendEmail({
    to: user.email,
    subject: 'Your VaultLock verification code',
    text,
    html,
  });

  logger.info(`Email 2FA enable code sent to ${user.email} (user ${userId})`);

  res.json({ success: true, data: { message: 'Verification code sent to your email' } });
});

export { router as email2faRouter };
