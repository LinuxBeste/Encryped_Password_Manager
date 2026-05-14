describe('Config — environment defaults', () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it('has default port 3000', () => {
    delete process.env.PORT;
    const { config } = require('../config');
    expect(config.port).toBe(3000);
  });

  it('reads PORT from env', () => {
    process.env.PORT = '4000';
    const { config } = require('../config');
    expect(config.port).toBe(4000);
  });

  it('defaults NODE_ENV to development', () => {
    delete process.env.NODE_ENV;
    const { config } = require('../config');
    expect(config.nodeEnv).toBe('development');
  });

  it('reads CORS_ORIGIN from env', () => {
    process.env.CORS_ORIGIN = 'https://example.com';
    const { config } = require('../config');
    expect(config.corsOrigin).toBe('https://example.com');
  });

  it('defaults argon2 memory to 65536', () => {
    delete process.env.ARGON2_MEMORY;
    const { config } = require('../config');
    expect(config.argon2Memory).toBe(65536);
  });

  it('reads argon2 parameters from env', () => {
    process.env.ARGON2_MEMORY = '131072';
    process.env.ARGON2_ITERATIONS = '5';
    process.env.ARGON2_PARALLELISM = '8';
    const { config } = require('../config');
    expect(config.argon2Memory).toBe(131072);
    expect(config.argon2Iterations).toBe(5);
    expect(config.argon2Parallelism).toBe(8);
  });

  it('defaults rate limits correctly', () => {
    delete process.env.RATE_LIMIT_AUTH;
    delete process.env.RATE_LIMIT_VAULT;
    delete process.env.RATE_LIMIT_DEFAULT;
    const { config } = require('../config');
    expect(config.rateLimitAuth).toBe(5);
    expect(config.rateLimitVault).toBe(30);
    expect(config.rateLimitDefault).toBe(100);
  });

  it('has JWT_EXPIRES_IN default of 15m', () => {
    delete process.env.JWT_EXPIRES_IN;
    const { config } = require('../config');
    expect(config.jwtExpiresIn).toBe('15m');
  });

  it('has TOTP enabled by default', () => {
    delete process.env.TOTP_ENABLED;
    const { config } = require('../config');
    expect(config.totpEnabled).toBe(true);
  });

  it('reads JWT_SECRET from env', () => {
    process.env.JWT_SECRET = 'my-custom-secret';
    const { config } = require('../config');
    expect(config.jwtSecret).toBe('my-custom-secret');
  });

  it('reads DB_PATH from env', () => {
    process.env.DB_PATH = '/custom/db.sqlite';
    const { config } = require('../config');
    expect(config.dbPath).toBe('/custom/db.sqlite');
  });
});

describe('Config — constants', () => {
  it('has version string', () => {
    const { config } = require('../config');
    expect(config.version).toBe('1.0.0');
  });
});
