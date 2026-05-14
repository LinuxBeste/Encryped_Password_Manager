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

// Schema: encrypted field data for creating a new entry
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

// Schema: partial encrypted fields for updating an entry
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

// Schema: array of entry IDs for bulk deletion (1-100)
const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

// Schema: target folder ID for moving an entry
const moveEntrySchema = z.object({
  folder_id: z.string().uuid().nullable(),
});

// Get all entries for the authenticated user
router.get('/', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const entries = getEntries(req.userId!);
  res.json({ success: true, data: entries });
});

// Create a new encrypted entry
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

// Get a single entry by ID
router.get('/:id', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const entry = getEntryById(req.params.id, req.userId!);
  if (!entry) {
    res.status(404).json({ success: false, error: 'Entry not found' });
    return;
  }
  res.json({ success: true, data: entry });
});

// Update an existing entry's encrypted fields
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

// Soft-delete an entry by ID
router.delete('/:id', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const result = deleteEntry(req.params.id, req.userId!);

  if (result.success) {
    logAuditEvent(req.userId!, 'entry.delete', req.ip || '', req.headers['user-agent'] || '', {
      entryId: req.params.id,
    });
  }

  res.json(result);
});

// Bulk soft-delete multiple entries
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

// Toggle the favorite flag on an entry
router.patch('/:id/favorite', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const result = toggleFavorite(req.params.id, req.userId!);
  res.json(result);
});

// Move an entry to a different folder (or null for root)
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
