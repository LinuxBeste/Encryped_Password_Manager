export interface TOTPConfig {
  secret: string;
  period: number;
  digits: number;
}

// Compute HMAC-SHA1 over given key and data
async function hmacSHA1(key: ArrayBuffer, data: ArrayBuffer): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, data);
}

// Generate a time-based one-time password (TOTP) code
export async function generateTOTP(secret: string, period = 30, digits = 6): Promise<{ code: string; remaining: number }> {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / period);
  const remaining = period - (epoch % period);

  const counterBuf = new ArrayBuffer(8);
  const view = new DataView(counterBuf);
  view.setUint32(4, counter, false);

  const secretBuf = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0)).buffer;
  const hmac = await hmacSHA1(secretBuf, counterBuf);
  const hmacArr = new Uint8Array(hmac);

  const offset = hmacArr[hmacArr.length - 1] & 0x0f;
  const binary =
    ((hmacArr[offset] & 0x7f) << 24) |
    ((hmacArr[offset + 1] & 0xff) << 16) |
    ((hmacArr[offset + 2] & 0xff) << 8) |
    (hmacArr[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  const code = otp.toString().padStart(digits, '0');

  return { code, remaining };
}

// Generate an otpauth:// URI for QR code scanning
export function generateTOTPUri(secret: string, issuer: string, email: string): string {
  const encoded = encodeURIComponent(issuer) + ':' + encodeURIComponent(email);
  return `otpauth://totp/${encoded}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// Format a 6-digit TOTP code as "XXX XXX"
export function formatTOTPCode(code: string): string {
  if (code.length !== 6) return code;
  return code.slice(0, 3) + ' ' + code.slice(3);
}
