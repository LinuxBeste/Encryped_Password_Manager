import { describe, it, expect } from 'vitest';
import { scorePassword, generatePassword, generatePassphrase } from '../password';

describe('scorePassword', () => {
  it('returns very weak for simple passwords', () => {
    const result = scorePassword('password');
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.label).toBeDefined();
    expect(result.color).toBeDefined();
    expect(result.crackTime).toBeDefined();
  });

  it('returns strong for complex passwords', () => {
    const result = scorePassword('k9$mP2#vL8xQ!wR3&nJ5');
    expect(result.score).toBeGreaterThanOrEqual(3);
  });
});

describe('generatePassword', () => {
  it('generates a password of specified length', () => {
    const result = generatePassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeAmbiguous: false,
    });
    expect(result.password).toHaveLength(16);
    expect(result.score).toBeDefined();
  });

  it('uses all requested character sets', () => {
    const result = generatePassword(50, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    });
    expect(result.password).toHaveLength(50);
    expect(/[A-Z]/.test(result.password)).toBe(true);
    expect(/[a-z]/.test(result.password)).toBe(true);
    expect(/[0-9]/.test(result.password)).toBe(true);
    expect(/[!@#$%^&*]/.test(result.password)).toBe(true);
  });

  it('excludes ambiguous characters when requested', () => {
    const result = generatePassword(100, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeAmbiguous: true,
    });
    expect(result.password).not.toContain('0');
    expect(result.password).not.toContain('O');
    expect(result.password).not.toContain('l');
    expect(result.password).not.toContain('I');
  });

  it('falls back when no char sets selected', () => {
    const result = generatePassword(10, {
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
      excludeAmbiguous: false,
    });
    expect(result.password).toHaveLength(10);
  });

  it('produces different outputs on successive calls', () => {
    const a = generatePassword(32, { uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false });
    const b = generatePassword(32, { uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false });
    expect(a.password).not.toBe(b.password);
  });
});

describe('generatePassphrase', () => {
  it('generates a passphrase with correct word count', () => {
    const result = generatePassphrase({ wordCount: 4, separator: '-', capitalize: false, includeNumber: false });
    const words = result.password.split('-');
    expect(words).toHaveLength(4);
  });

  it('capitalizes words when requested', () => {
    const result = generatePassphrase({ wordCount: 3, separator: '-', capitalize: true, includeNumber: false });
    const words = result.password.split('-');
    words.forEach((w) => {
      expect(w[0]).toBe(w[0].toUpperCase());
    });
  });

  it('appends a number when includeNumber is true', () => {
    const result = generatePassphrase({ wordCount: 3, separator: '-', capitalize: false, includeNumber: true });
    const parts = result.password.split('-');
    const last = parts[parts.length - 1];
    expect(/^\d+$/.test(last) || parts.length === 4).toBe(true);
  });

  it('uses custom separator', () => {
    const result = generatePassphrase({ wordCount: 3, separator: '_', capitalize: false, includeNumber: false });
    expect(result.password.split('_')).toHaveLength(3);
  });
});
