import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { initDb, getDb, closeDb } from './db/db';
import { errorHandler } from './api/middleware/error.middleware';
import { authRouter } from './api/routes/auth.routes';
import { vaultRouter } from './api/routes/vault.routes';
import { entriesRouter } from './api/routes/entries.routes';
import { foldersRouter } from './api/routes/folders.routes';
import { settingsRouter } from './api/routes/settings.routes';
import { ApiResponse } from './types';

const app = express();

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

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));

const startTime = Date.now();

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

app.use('/api/auth', authRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/settings', settingsRouter);

app.use(errorHandler);

function start(): void {
  initDb();

  const port = config.port;
  app.listen(port, () => {
    logger.info(`VaultLock API listening on port ${port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  closeDb();
  process.exit(0);
}

start();

export default app;
