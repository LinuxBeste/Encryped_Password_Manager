import { hashPassword, verifyPassword } from '../crypto.service';

describe('crypto.service (argon2id)', () => {
  const testPassword = 'MyV3ryStr0ngM4st3rP@ss!';

  it('should hash a password successfully', async () => {
    const hash = await hashPassword(testPassword);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('should verify correct password against hash', async () => {
    const hash = await hashPassword(testPassword);
    const valid = await verifyPassword(hash, testPassword);
    expect(valid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash = await hashPassword(testPassword);
    const valid = await verifyPassword(hash, 'WrongPassword123!');
    expect(valid).toBe(false);
  });

  it('should produce different hashes for same password', async () => {
    const hash1 = await hashPassword(testPassword);
    const hash2 = await hashPassword(testPassword);
    expect(hash1).not.toBe(hash2);
  });

  it('should reject empty hash gracefully', async () => {
    const valid = await verifyPassword('', testPassword);
    expect(valid).toBe(false);
  });

  it('should reject invalid hash format gracefully', async () => {
    const valid = await verifyPassword('not-a-valid-hash', testPassword);
    expect(valid).toBe(false);
  });
});
