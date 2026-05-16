import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../middleware/validate.middleware';
import { rateLimitDefault } from '../middleware/rateLimit.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getDb } from '../../db/db';
import { logAuditEvent } from '../../services/audit.service';
import { Folder } from '../../types';

const router = Router();

// Schema: vault ID + encrypted name + optional parent folder
const createFolderSchema = z.object({
  vault_id: z.string().uuid(),
  name_encrypted: z.instanceof(Buffer).or(z.string().transform((s) => Buffer.from(s, 'base64'))),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().optional().default(0),
});

// Schema: new encrypted name for renaming a folder
const renameFolderSchema = z.object({
  name_encrypted: z.instanceof(Buffer).or(z.string().transform((s) => Buffer.from(s, 'base64'))),
});

// Schema: array of folder IDs with new sort positions
const reorderSchema = z.object({
  folders: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int(),
    }),
  ),
});

// Schema: validate UUID path param
const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

// List all folders for the authenticated user with entry counts
router.get('/', authenticate, rateLimitDefault, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const folders = db
    .prepare(
      `SELECT f.*, (SELECT COUNT(*) FROM entries e WHERE e.folder_id = f.id AND e.deleted_at IS NULL) as entry_count
       FROM folders f
       WHERE f.user_id = ?
       ORDER BY f.sort_order ASC, f.created_at ASC`,
    )
    .all(req.userId!) as (Folder & { entry_count: number })[];

  res.json({ success: true, data: folders });
});

// Create a new folder in a vault
router.post(
  '/',
  authenticate,
  rateLimitDefault,
  validate(createFolderSchema),
  (req: AuthRequest, res: Response) => {
    const db = getDb();
    const id = uuidv4();
    const now = Date.now();

    db.prepare(
      `INSERT INTO folders (id, vault_id, user_id, name_encrypted, parent_id, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.body.vault_id,
      req.userId!,
      req.body.name_encrypted,
      req.body.parent_id || null,
      req.body.sort_order,
      now,
    );

    logAuditEvent(req.userId!, 'folder.create', req.ip || '', req.headers['user-agent'] || '', {
      folderId: id,
    });

    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: folder });
  },
);

// Rename a folder
router.put(
  '/:id',
  authenticate,
  rateLimitDefault,
  validate(uuidParamSchema, 'params'),
  validate(renameFolderSchema),
  (req: AuthRequest, res: Response) => {
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId!);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Folder not found' });
      return;
    }

    db.prepare('UPDATE folders SET name_encrypted = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
      req.body.name_encrypted,
      Date.now(),
      req.params.id,
      req.userId!,
    );

    logAuditEvent(req.userId!, 'folder.rename', req.ip || '', req.headers['user-agent'] || '', {
      folderId: req.params.id,
    });

    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: folder });
  },
);

// Delete a folder and unlink its entries (set folder_id to null)
router.delete(
  '/:id',
  authenticate,
  rateLimitDefault,
  validate(uuidParamSchema, 'params'),
  (req: AuthRequest, res: Response) => {
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId!);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Folder not found' });
      return;
    }

    const folderId = req.params.id;
    db.transaction(() => {
      db.prepare(
        'UPDATE entries SET folder_id = NULL, updated_at = ? WHERE folder_id = ? AND user_id = ?',
      ).run(Date.now(), folderId, req.userId!);
      db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').run(folderId, req.userId!);
    })();

    logAuditEvent(req.userId!, 'folder.delete', req.ip || '', req.headers['user-agent'] || '', {
      folderId,
    });

    res.json({ success: true });
  },
);

// Reorder folders by updating their sort_order values
router.patch(
  '/reorder',
  authenticate,
  rateLimitDefault,
  validate(reorderSchema),
  (req: AuthRequest, res: Response) => {
    const db = getDb();

    db.transaction(() => {
      for (const folder of req.body.folders) {
        db.prepare('UPDATE folders SET sort_order = ? WHERE id = ? AND user_id = ?').run(
          folder.sort_order,
          folder.id,
          req.userId!,
        );
      }
    })();

    logAuditEvent(req.userId!, 'folder.reorder', req.ip || '', req.headers['user-agent'] || '');

    res.json({ success: true });
  },
);

export { router as foldersRouter };
