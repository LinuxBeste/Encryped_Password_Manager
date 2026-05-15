import dotenv from 'dotenv';

// Load .env file if present
dotenv.config();

// Read string env var with fallback
function envStr(key: string, def: string): string {
  return process.env[key] || def;
}

// Read integer env var with fallback
function envInt(key: string, def: number): number {
  const v = process.env[key];
  return v ? parseInt(v, 10) : def;
}

const SECRET_DEFAULTS = ['change-me-in-production', 'change-me-csrf-secret'];

// Validate critical config at startup; exits in production if secrets are default values
export function validateConfig(): void {
  if (config.nodeEnv !== 'production') return;

  const failures: string[] = [];
  if (SECRET_DEFAULTS.includes(config.jwtSecret)) {
    failures.push('JWT_SECRET must be set to a strong random value in production');
  }
  if (SECRET_DEFAULTS.includes(config.csrfSecret)) {
    failures.push('CSRF_SECRET must be set to a strong random value in production');
  }
  if (failures.length > 0) {
    for (const msg of failures) {
      console.error(`FATAL: ${msg}`);
    }
    process.exit(1);
  }
}

// Application configuration from environment
export const config = {
  port: envInt('PORT', 3000),
  nodeEnv: envStr('NODE_ENV', 'development'),

  jwtSecret: envStr('JWT_SECRET', 'change-me-in-production'),
  jwtExpiresIn: envStr('JWT_EXPIRES_IN', '15m'),
  refreshTokenExpiresInMs: envInt('REFRESH_TOKEN_EXPIRES_IN_MS', 7 * 24 * 60 * 60 * 1000),

  corsOrigin: envStr('CORS_ORIGIN', 'http://localhost:3000'),

  dbPath: envStr('DB_PATH', './data/vaultlock.db'),

  argon2Memory: envInt('ARGON2_MEMORY', 65536),
  argon2Iterations: envInt('ARGON2_ITERATIONS', 3),
  argon2Parallelism: envInt('ARGON2_PARALLELISM', 4),

  rateLimitAuth: envInt('RATE_LIMIT_AUTH', 5),
  rateLimitAuthWindow: envInt('RATE_LIMIT_AUTH_WINDOW', 15 * 60 * 1000),
  rateLimitVault: envInt('RATE_LIMIT_VAULT', 30),
  rateLimitVaultWindow: envInt('RATE_LIMIT_VAULT_WINDOW', 60 * 1000),
  rateLimitDefault: envInt('RATE_LIMIT_DEFAULT', 100),
  rateLimitDefaultWindow: envInt('RATE_LIMIT_DEFAULT_WINDOW', 60 * 1000),

  totpEnabled: envStr('TOTP_ENABLED', 'true') === 'true',
  csrfSecret: envStr('CSRF_SECRET', 'change-me-csrf-secret'),

  version: '1.0.0',
};
