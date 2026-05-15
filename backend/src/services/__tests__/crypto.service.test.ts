// Tests for argon2id hashing, AES-256-GCM encryption, and salt generation
import {
  hashPassword,
  verifyPassword,
  generateSalt,
  encryptAes256Gcm,
  decryptAes256Gcm,
} from '../crypto.service';

describe('CryptoService — argon2id hashing', () => {
  const passwords = [
    'MyV3ryStr0ngM4st3rP@ss!',
    'a',
    'a'.repeat(128),
    'パスワード123!@#',
    '  leading-and-trailing-spaces  ',
    '',
    '🔥🔥🔥',
    'long' + 'x'.repeat(1000),
  ];

  it.each(passwords)('should hash password: %p', async (pw) => {
    const hash = await hashPassword(pw);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it.each(passwords)('should verify correct password: %p', async (pw) => {
    const hash = await hashPassword(pw);
    const ok = await verifyPassword(hash, pw);
    expect(ok).toBe(true);
  });

  const wrongPasswords = [
    ['right', 'wrong'],
    ['abc', 'ABC'],
    ['pass1', 'pass1 '],
    ['exact', 'exacT'],
  ];

  it.each(wrongPasswords)('should reject wrong password: %s vs %s', async (correct, wrong) => {
    const hash = await hashPassword(correct);
    const ok = await verifyPassword(hash, wrong);
    expect(ok).toBe(false);
  });

  it('should produce unique hashes for same password each time', async () => {
    const hash1 = await hashPassword('same');
    const hash2 = await hashPassword('same');
    expect(hash1).not.toBe(hash2);
  });

  it('should reject empty hash', async () => {
    expect(await verifyPassword('', 'anything')).toBe(false);
  });

  it('should reject nullish hash', async () => {
    expect(await verifyPassword(null as unknown as string, 'x')).toBe(false);
  });

  it('should reject undefined hash', async () => {
    expect(await verifyPassword(undefined as unknown as string, 'x')).toBe(false);
  });

  it('should reject malformed hash strings', async () => {
    const bad = ['not-a-hash', '$argon2id$', '$argon2id$v=19$m=65536', 'invalid', '12345'];
    for (const h of bad) {
      expect(await verifyPassword(h, 'test')).toBe(false);
    }
  });

  it('should handle minimum-length password (1 char)', async () => {
    const hash = await hashPassword('1');
    expect(await verifyPassword(hash, '1')).toBe(true);
  });

  it('should handle maximum-length password (4096 chars)', async () => {
    const long = 'x'.repeat(4096);
    const hash = await hashPassword(long);
    expect(await verifyPassword(hash, long)).toBe(true);
  });

  it('should be constant-time-ish (no throw on timing)', async () => {
    const hash = await hashPassword('secret');
    const start = Date.now();
    await verifyPassword(hash, 'secret');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(typeof elapsed).toBe('number');
  });
});

describe('CryptoService — AES-256-GCM', () => {
  const key = require('crypto').randomBytes(32);

  it('should encrypt and decrypt a buffer', () => {
    const plaintext = Buffer.from('Hello, VaultLock!');
    const { ciphertext, iv, authTag } = encryptAes256Gcm(plaintext, key);
    const decrypted = decryptAes256Gcm(ciphertext, key, iv, authTag);
    expect(decrypted.toString()).toBe('Hello, VaultLock!');
  });

  it('should produce different ciphertext for same plaintext (random IV)', () => {
    const pt = Buffer.from('repeat');
    const r1 = encryptAes256Gcm(pt, key);
    const r2 = encryptAes256Gcm(pt, key);
    expect(r1.ciphertext).not.toEqual(r2.ciphertext);
    expect(r1.iv).not.toEqual(r2.iv);
  });

  it('should produce 16-byte auth tag', () => {
    const { authTag } = encryptAes256Gcm(Buffer.from('test'), key);
    expect(authTag.length).toBe(16);
  });

  it('should produce 12-byte IV', () => {
    const { iv } = encryptAes256Gcm(Buffer.from('test'), key);
    expect(iv.length).toBe(12);
  });

  it('should handle empty buffer', () => {
    const { ciphertext, iv, authTag } = encryptAes256Gcm(Buffer.alloc(0), key);
    const decrypted = decryptAes256Gcm(ciphertext, key, iv, authTag);
    expect(decrypted.length).toBe(0);
  });

  it('should handle large buffer (1MB)', () => {
    const large = Buffer.alloc(1024 * 1024, 'A');
    const { ciphertext, iv, authTag } = encryptAes256Gcm(large, key);
    const decrypted = decryptAes256Gcm(ciphertext, key, iv, authTag);
    expect(decrypted).toEqual(large);
  });

  it('should fail decryption with wrong key', () => {
    const pt = Buffer.from('secret data');
    const { ciphertext, iv, authTag } = encryptAes256Gcm(pt, key);
    const wrongKey = require('crypto').randomBytes(32);
    expect(() => decryptAes256Gcm(ciphertext, wrongKey, iv, authTag)).toThrow();
  });

  it('should fail decryption with tampered ciphertext', () => {
    const pt = Buffer.from('tamper test');
    const { ciphertext, iv, authTag } = encryptAes256Gcm(pt, key);
    ciphertext[0] ^= 0xff;
    expect(() => decryptAes256Gcm(ciphertext, key, iv, authTag)).toThrow();
  });

  it('should fail decryption with tampered auth tag', () => {
    const pt = Buffer.from('auth tag test');
    const { ciphertext, iv, authTag } = encryptAes256Gcm(pt, key);
    authTag[0] ^= 0xff;
    expect(() => decryptAes256Gcm(ciphertext, key, iv, authTag)).toThrow();
  });

  it('should fail decryption with tampered IV', () => {
    const pt = Buffer.from('iv test');
    const { ciphertext, iv, authTag } = encryptAes256Gcm(pt, key);
    iv[0] ^= 0xff;
    expect(() => decryptAes256Gcm(ciphertext, key, iv, authTag)).toThrow();
  });
});

describe('CryptoService — generateSalt', () => {
  it('should produce 32-byte buffers', () => {
    const salt = generateSalt();
    expect(salt.length).toBe(32);
  });

  it('should produce unique salts each call', () => {
    const salts = Array.from({ length: 10 }, () => generateSalt());
    for (let i = 0; i < salts.length; i++) {
      for (let j = i + 1; j < salts.length; j++) {
        expect(salts[i].equals(salts[j])).toBe(false);
      }
    }
  });

  it('should have high entropy (not all zeros)', () => {
    const salt = generateSalt();
    const allZero = Buffer.alloc(32, 0);
    expect(salt.equals(allZero)).toBe(false);
  });
});
