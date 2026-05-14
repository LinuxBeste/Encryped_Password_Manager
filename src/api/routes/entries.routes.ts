import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { rateLimitDefault } from '../middleware/rateLimit.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
  getEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  bulkDeleteEntries,
  toggleFavorite,
  moveEntry,
} from '../../services/entry.service';
import { logAuditEvent } from '../../services/audit.service';

const router = Router();

const createEntrySchema = z.object({
  vault_id: z.string().uuid(),
  folder_id: z.string().uuid().nullable().optional(),
  title_encrypted: z.instanceof(Buffer).or(z.string().transform((s) => Buffer.from(s, 'base64'))),
  body_encrypted: z.instanceof(Buffer).or(z.string().transform((s) => Buffer.from(s, 'base64'))),
  iv: z.instanceof(Buffer).or(z.string().transform((s) => Buffer.from(s, 'base64'))),
  auth_tag: z.instanceof(Buffer).or(z.string().transform((s) => Buffer.from(s, 'base64'))),
  type: z.string().optional().default('password'),
  tags_encrypted: z
    .instanceof(Buffer)
    .or(z.string().transform((s) => Buffer.from(s, 'base64')))
    .nullable()
    .optional(),
  favorite: z.boolean().optional().default(false),
});

const updateEntrySchema = z.object({
  title_encrypted: z
    .instanceof(Buffer)
    .or(z.string().transform((s) => Buffer.from(s, 'base64')))
    .optional(),
  body_encrypted: z
    .instanceof(Buffer)
    .or(z.string().transform((s) => Buffer.from(s, 'base64')))
    .optional(),
  iv: z
    .instanceof(Buffer)
    .or(z.string().transform((s) => Buffer.from(s, 'base64')))
    .optional(),
  auth_tag: z
    .instanceof(Buffer)
    .or(z.string().transform((s) => Buffer.from(s, 'base64')))
    .optional(),
  type: z.string().optional(),
  tags_encrypted: z
    .instanceof(Buffer)
    .or(z.string().transform((s) => Buffer.from(s, 'base64')))
    .nullable()
    .optional(),
  favorite: z.boolean().optional(),
  folder_id: z.string().uuid().nullable().optional(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

const moveEntrySchema = z.object({
  folder_id: z.string().uuid().nullable(),
});

router.get('/', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const entries = getEntries(req.userId!);
  res.json({ success: true, data: entries });
});

router.post(
  '/',
  authenticate,
  rateLimitDefault,
  validate(createEntrySchema),
  (req: AuthRequest, res: Response) => {
    const entry = createEntry({
      ...req.body,
      user_id: req.userId!,
      favorite: req.body.favorite ? 1 : 0,
    });

    logAuditEvent(req.userId!, 'entry.create', req.ip || '', req.headers['user-agent'] || '', {
      entryId: entry.id,
    });

    res.status(201).json({ success: true, data: entry });
  },
);

router.get('/:id', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const entry = getEntryById(req.params.id, req.userId!);
  if (!entry) {
    res.status(404).json({ success: false, error: 'Entry not found' });
    return;
  }
  res.json({ success: true, data: entry });
});

router.put(
  '/:id',
  authenticate,
  rateLimitDefault,
  validate(updateEntrySchema),
  (req: AuthRequest, res: Response) => {
    const result = updateEntry(req.params.id, req.userId!, req.body);

    if (result.success) {
      logAuditEvent(req.userId!, 'entry.update', req.ip || '', req.headers['user-agent'] || '', {
        entryId: req.params.id,
      });
    }

    res.json(result);
  },
);

router.delete('/:id', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const result = deleteEntry(req.params.id, req.userId!);

  if (result.success) {
    logAuditEvent(req.userId!, 'entry.delete', req.ip || '', req.headers['user-agent'] || '', {
      entryId: req.params.id,
    });
  }

  res.json(result);
});

router.post(
  '/bulk-delete',
  authenticate,
  rateLimitDefault,
  validate(bulkDeleteSchema),
  (req: AuthRequest, res: Response) => {
    const result = bulkDeleteEntries(req.body.ids, req.userId!);

    if (result.success) {
      logAuditEvent(
        req.userId!,
        'entry.bulk-delete',
        req.ip || '',
        req.headers['user-agent'] || '',
        { count: req.body.ids.length },
      );
    }

    res.json(result);
  },
);

router.patch('/:id/favorite', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const result = toggleFavorite(req.params.id, req.userId!);
  res.json(result);
});

router.post(
  '/:id/move',
  authenticate,
  rateLimitDefault,
  validate(moveEntrySchema),
  (req: AuthRequest, res: Response) => {
    const result = moveEntry(req.params.id, req.userId!, req.body.folder_id);
    res.json(result);
  },
);

export { router as entriesRouter };
