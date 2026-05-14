const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 600000;
const KEY_LENGTH = 256;

function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(str: string): ArrayBuffer {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0)).buffer;
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

export async function deriveKey(
  masterPassword: string,
  email: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const useSalt = salt || generateSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword + email),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: useSalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
  return { key, salt: useSalt };
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey,
  salt: Uint8Array
): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

export async function decrypt(
  data: EncryptedData,
  masterPassword: string,
  email: string
): Promise<string> {
  const salt = base64ToBuffer(data.salt);
  const { key } = await deriveKey(masterPassword, email, new Uint8Array(salt));
  const iv = base64ToBuffer(data.iv);
  const ciphertext = base64ToBuffer(data.ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return bufferToBase64(key.buffer);
}

export function zeroKey(key: CryptoKey | null): void {
  if (key) {
    (key as unknown as Record<string, unknown>).algorithm = {};
  }
}
