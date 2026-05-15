import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCrypto } from '../useCrypto';

describe('useCrypto', () => {
  it('returns crypto operations and loading states', () => {
    const { result } = renderHook(() => useCrypto());
    expect(result.current.deriveMasterKey).toBeDefined();
    expect(result.current.encryptData).toBeDefined();
    expect(result.current.decryptData).toBeDefined();
    expect(result.current.deriving).toBe(false);
    expect(result.current.encrypting).toBe(false);
    expect(result.current.decrypting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.generateSalt).toBeDefined();
  });

  it('derives a key successfully', async () => {
    const { result } = renderHook(() => useCrypto());
    const derived = await result.current.deriveMasterKey('password', 'email@test.com');
    expect(derived).not.toBeNull();
    expect(derived!.key).toBeInstanceOf(CryptoKey);
    expect(derived!.salt).toBeInstanceOf(Uint8Array);
    await waitFor(() => expect(result.current.deriving).toBe(false));
  });

  it('encrypts and decrypts round-trip', async () => {
    const { result } = renderHook(() => useCrypto());
    const salt = result.current.generateSalt();
    const derived = await result.current.deriveMasterKey('password', 'email@test.com', salt);
    const encrypted = await result.current.encryptData('my secret data', derived!.key, salt!);
    expect(encrypted).not.toBeNull();
    expect(encrypted!.ciphertext).toBeDefined();

    const decrypted = await result.current.decryptData(encrypted!, 'password', 'email@test.com');
    await waitFor(() => expect(result.current.decrypting).toBe(false));
    expect(decrypted).toBe('my secret data');
  });

  it('sets error on failed decryption', async () => {
    const { result } = renderHook(() => useCrypto());
    const salt = result.current.generateSalt();
    const derived = await result.current.deriveMasterKey('password', 'email@test.com', salt);
    const encrypted = await result.current.encryptData('secret', derived!.key, salt!);

    const decrypted = await result.current.decryptData(encrypted!, 'wrong-password', 'email@test.com');
    expect(decrypted).toBeNull();
    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it('resets error on new operations', async () => {
    const { result } = renderHook(() => useCrypto());
    const salt = result.current.generateSalt();
    const derived = await result.current.deriveMasterKey('a', 'b@c.com', salt);
    const encrypted = await result.current.encryptData('data', derived!.key, salt!);
    await result.current.decryptData(encrypted!, 'wrong', 'b@c.com');
    await waitFor(() => expect(result.current.error).not.toBeNull());

    await result.current.deriveMasterKey('goodpass', 'good@email.com');
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});
