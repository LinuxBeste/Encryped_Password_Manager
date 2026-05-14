import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { rateLimitDefault } from '../middleware/rateLimit.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getDb } from '../../db/db';

const router = Router();

// Schema: arbitrary key-value string pairs
const updateSettingsSchema = z.record(z.string(), z.string());

// Get all settings for the authenticated user as a key-value map
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

// Upsert multiple settings at once for the authenticated user
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

export { router as settingsRouter };
