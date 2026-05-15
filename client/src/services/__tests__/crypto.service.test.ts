import { describe, it, expect, beforeAll } from 'vitest';
import { generateSalt, deriveKey, encrypt, decrypt, generateEncryptionKey, zeroKey } from '../crypto.service';

describe('crypto.service', () => {
  const testPassword = 'MySecureMasterPassword123!';
  const testEmail = 'user@example.com';

  describe('generateSalt', () => {
    it('generates a 32-byte salt', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32);
    });

    it('generates unique salts each time', () => {
      const a = generateSalt();
      const b = generateSalt();
      expect(a).not.toEqual(b);
    });
  });

  describe('deriveKey', () => {
    it('derives an AES-GCM CryptoKey', async () => {
      const { key, salt } = await deriveKey(testPassword, testEmail);
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.algorithm).toMatchObject({ name: 'AES-GCM' });
      expect(salt.length).toBe(32);
    });

    it('uses provided salt when given', async () => {
      const salt = generateSalt();
      const result = await deriveKey(testPassword, testEmail, salt);
      expect(result.salt).toEqual(salt);
    });
  });

  describe('encrypt / decrypt', () => {
    it('encrypts and decrypts a message correctly', async () => {
      const { key, salt } = await deriveKey(testPassword, testEmail);
      const plaintext = 'MySecretPassword123!';

      const encrypted = await encrypt(plaintext, key, salt);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.ciphertext).not.toBe(plaintext);

      const decrypted = await decrypt(encrypted, testPassword, testEmail);
      expect(decrypted).toBe(plaintext);
    });

    it('produces different ciphertexts for same plaintext', async () => {
      const { key, salt } = await deriveKey(testPassword, testEmail);
      const plaintext = 'SameText';

      const a = await encrypt(plaintext, key, salt);
      const b = await encrypt(plaintext, key, salt);
      expect(a.ciphertext).not.toBe(b.ciphertext);
      expect(a.iv).not.toBe(b.iv);
    });

    it('fails to decrypt with wrong password', async () => {
      const { key, salt } = await deriveKey(testPassword, testEmail);
      const encrypted = await encrypt('secret', key, salt);

      await expect(decrypt(encrypted, 'WrongPassword', testEmail)).rejects.toThrow();
    });
  });

  describe('generateEncryptionKey', () => {
    it('generates a base64-encoded 32-byte key', () => {
      const key = generateEncryptionKey();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(40);
      const decoded = atob(key);
      expect(decoded.length).toBe(32);
    });
  });

  describe('zeroKey', () => {
    it('does not throw with null input', () => {
      expect(() => zeroKey(null)).not.toThrow();
    });

    it('runs without error on CryptoKey (no-op)', async () => {
      const { key } = await deriveKey(testPassword, testEmail);
      expect(() => zeroKey(key)).not.toThrow();
    });
  });
});
