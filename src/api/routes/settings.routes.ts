import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { rateLimitDefault } from '../middleware/rateLimit.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getDb } from '../../db/db';
import { getAuditLogs } from '../../services/audit.service';

const router = Router();

const updateSettingsSchema = z.record(z.string(), z.string());

const auditQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(50),
});

router.get('/', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const settings = db
    .prepare('SELECT key, value FROM settings WHERE user_id = ?')
    .all(req.userId!) as { key: string; value: string }[];

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  res.json({ success: true, data: settingsMap });
});

router.put(
  '/',
  authenticate,
  rateLimitDefault,
  validate(updateSettingsSchema),
  (req: AuthRequest, res: Response) => {
    const db = getDb();
    const now = Date.now();

    db.transaction(() => {
      for (const [key, value] of Object.entries(req.body)) {
        db.prepare(
          'INSERT OR REPLACE INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)',
        ).run(req.userId!, key, value, now);
      }
    })();

    res.json({ success: true });
  },
);

router.get(
  '/audit',
  authenticate,
  rateLimitDefault,
  validate(auditQuerySchema, 'query'),
  (req: AuthRequest, res: Response) => {
    const { page, limit } = req.query as any;
    const result = getAuditLogs(req.userId!, page, limit);
    res.json({ success: true, data: result });
  },
);

export { router as settingsRouter };
