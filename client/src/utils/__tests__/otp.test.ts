import { describe, it, expect } from 'vitest';
import { generateTOTPUri, formatTOTPCode } from '../otp';

describe('generateTOTPUri', () => {
  it('generates a valid otpauth URI', () => {
    const uri = generateTOTPUri('JBSWY3DPEHPK3PXP', 'VaultLock', 'user@example.com');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=VaultLock');
    expect(uri).toContain('user%40example.com');
  });
});

describe('formatTOTPCode', () => {
  it('formats 6-digit code as XXX XXX', () => {
    expect(formatTOTPCode('123456')).toBe('123 456');
  });

  it('returns non-6-digit strings unchanged', () => {
    expect(formatTOTPCode('12345')).toBe('12345');
    expect(formatTOTPCode('1234567')).toBe('1234567');
    expect(formatTOTPCode('')).toBe('');
  });
});
