const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 600000;
const KEY_LENGTH = 256;

// Convert ArrayBuffer to base64 string
function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

// Ensure we have an ArrayBuffer from a TypedArray
function toArrayBuffer(buf: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (buf instanceof Uint8Array) {
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }
  return buf;
}

// Convert base64 string to ArrayBuffer
function base64ToBuffer(str: string): ArrayBuffer {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0)).buffer;
}

// Generate a cryptographically random salt
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

// Derive an AES-GCM key from password + email using PBKDF2
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
      salt: useSalt as unknown as BufferSource,
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

// Encrypt plaintext with AES-GCM using the derived key
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
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    salt: bufferToBase64(salt.buffer as ArrayBuffer),
  };
}

// Decrypt ciphertext by re-deriving key from password and email
export async function decrypt(
  data: EncryptedData,
  masterPassword: string,
  email: string
): Promise<string> {
  const salt = new Uint8Array(base64ToBuffer(data.salt));
  const { key } = await deriveKey(masterPassword, email, salt);
  const iv = new Uint8Array(base64ToBuffer(data.iv));
  const ciphertext = new Uint8Array(base64ToBuffer(data.ciphertext));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

// Generate a random 32-byte encryption key as base64
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return bufferToBase64(key.buffer);
}

// Derive raw key bits using PBKDF2 (for password verification)
async function deriveBits(
  masterPassword: string,
  email: string,
  salt: Uint8Array,
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword + email),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
}

// Create a password verifier by storing a PBKDF2-derived hash
export async function createPasswordVerifier(
  masterPassword: string,
  email: string,
): Promise<{ verifier: string; salt: string }> {
  const salt = generateSalt();
  const bits = await deriveBits(masterPassword, email, salt);
  return {
    verifier: bufferToBase64(bits),
    salt: bufferToBase64(salt.buffer as ArrayBuffer),
  };
}

// Check a master password by re-deriving the hash and comparing
export async function checkPassword(
  masterPassword: string,
  email: string,
  verifier: string,
  salt: string,
): Promise<boolean> {
  try {
    const saltBytes = new Uint8Array(base64ToBuffer(salt));
    const bits = await deriveBits(masterPassword, email, saltBytes);
    const stored = base64ToBuffer(verifier);
    if (bits.byteLength !== stored.byteLength) return false;
    const a = new Uint8Array(bits);
    const b = new Uint8Array(stored);
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Clear sensitive data from memory (best-effort).
// CryptoKey key material is stored in an opaque backing store inaccessible
// from JavaScript; the algorithm property is metadata only and overwriting
// it does NOT clear the actual key.  For Uint8Array values we zero-fill.
export function zeroKey(key: CryptoKey | null): void {
  if (key) {
    try {
      (key as unknown as Record<string, unknown>).algorithm = {};
    } catch { /* read-only in some runtimes — noop is expected */ }
  }
}

export function zeroSalt(salt: Uint8Array | null): void {
  if (salt) {
    salt.fill(0);
  }
}
