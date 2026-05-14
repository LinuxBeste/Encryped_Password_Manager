import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { rateLimitVault } from '../middleware/rateLimit.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getVault, exportVault } from '../../services/vault.service';
import { syncEntries } from '../../services/entry.service';
import { logAuditEvent } from '../../services/audit.service';
import { SyncRequest } from '../../types';

const router = Router();

const syncSchema = z.object({
  lastSyncAt: z.number(),
  deletedIds: z.array(z.string().uuid()).optional().default([]),
});

router.get('/', authenticate, rateLimitVault, (req: AuthRequest, res: Response) => {
  const result = getVault(req.userId!);

  logAuditEvent(
    req.userId!,
    'vault.get',
    req.ip || '',
    req.headers['user-agent'] || '',
  );

  res.json(result);
});

router.post(
  '/sync',
  authenticate,
  rateLimitVault,
  validate(syncSchema),
  (req: AuthRequest, res: Response) => {
    const syncReq: SyncRequest = {
      lastSyncAt: req.body.lastSyncAt,
      deletedIds: req.body.deletedIds,
    };
    const result = syncEntries(req.userId!, syncReq);

    logAuditEvent(
      req.userId!,
      'vault.sync',
      req.ip || '',
      req.headers['user-agent'] || '',
    );

    res.json(result);
  },
);

router.get('/export', authenticate, rateLimitVault, (req: AuthRequest, res: Response) => {
  const result = exportVault(req.userId!);

  logAuditEvent(
    req.userId!,
    'vault.export',
    req.ip || '',
    req.headers['user-agent'] || '',
  );

  res.json(result);
});

export { router as vaultRouter };
