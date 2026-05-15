import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, validateConfig } from './utils/config';
import { logger } from './utils/logger';
import { initDb, getDb, closeDb } from './db/db';
import { errorHandler } from './api/middleware/error.middleware';
import { csrfProtection } from './api/middleware/csrf.middleware';
import { authenticate, AuthRequest } from './api/middleware/auth.middleware';
import { rateLimitDefault } from './api/middleware/rateLimit.middleware';
import { authRouter } from './api/routes/auth.routes';
import { vaultRouter } from './api/routes/vault.routes';
import { entriesRouter } from './api/routes/entries.routes';
import { foldersRouter } from './api/routes/folders.routes';
import { settingsRouter } from './api/routes/settings.routes';
import { getAuditLogs } from './services/audit.service';
import { ApiResponse } from './types';

// Create Express application
const app = express();

// Set security headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    xContentTypeOptions: true,
  }),
);

// Configure CORS for the frontend origin
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  }),
);

// Parse cookies, JSON bodies, and add CSRF protection
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(csrfProtection);

// Record server start timestamp
const startTime = Date.now();

// Health check: returns server status and DB connectivity
app.get('/api/health', (_req, res) => {
  let dbOk = false;
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const response: ApiResponse = {
    success: true,
    data: {
      status: 'ok',
      version: config.version,
      uptime: Date.now() - startTime,
      dbOk,
    },
  };
  res.json(response);
});

// Mount all API route groups
app.use('/api/auth', authRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/settings', settingsRouter);

// Paginated audit log endpoint (requires auth + rate limit)
app.get('/api/audit', authenticate, rateLimitDefault, (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  const result = getAuditLogs(req.userId!, page, limit);
  res.json({ success: true, data: result });
});

// Global error handler (last middleware)
app.use(errorHandler);

// Initialize DB and start HTTP server
function start(): void {
  validateConfig();
  initDb();

  const port = config.port;
  app.listen(port, () => {
    logger.info(`VaultLock API listening on port ${port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

// Graceful shutdown on SIGINT
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  closeDb();
  process.exit(0);
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  closeDb();
  process.exit(0);
});

start();

export default app;
