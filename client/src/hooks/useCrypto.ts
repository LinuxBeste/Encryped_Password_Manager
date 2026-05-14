import { useState, useCallback } from 'react';
import { deriveKey, encrypt, decrypt, generateSalt } from '@/services/crypto.service';
import type { EncryptedData } from '@/services/crypto.service';

// Hook wrapping crypto operations with loading/error state
export function useCrypto() {
  const [deriving, setDeriving] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive master key from password and email
  const deriveMasterKey = useCallback(async (password: string, email: string, salt?: Uint8Array) => {
    setDeriving(true);
    setError(null);
    try {
      const result = await deriveKey(password, email, salt);
      setDeriving(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Key derivation failed');
      setDeriving(false);
      return null;
    }
  }, []);

  // Encrypt plaintext with derived key and salt
  const encryptData = useCallback(async (plaintext: string, key: CryptoKey, salt: Uint8Array) => {
    setEncrypting(true);
    setError(null);
    try {
      const result = await encrypt(plaintext, key, salt);
      setEncrypting(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed');
      setEncrypting(false);
      return null;
    }
  }, []);

  // Decrypt data using password and email to re-derive key
  const decryptData = useCallback(async (data: EncryptedData, password: string, email: string) => {
    setDecrypting(true);
    setError(null);
    try {
      const result = await decrypt(data, password, email);
      setDecrypting(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed');
      setDecrypting(false);
      return null;
    }
  }, []);

  return { deriveMasterKey, encryptData, decryptData, deriving, encrypting, decrypting, error, generateSalt };
}
