/**
 * ShopBook Pro — AES-256 Field-Level Encryption Utility
 *
 * Strategy:
 * - User's password + Firestore-stored salt → PBKDF2 → AES-256 key (CryptoKey)
 * - Sensitive fields are encrypted before writing to Firestore
 * - Encrypted fields are named with "_enc" suffix in Firestore documents
 * - Key is held ONLY in session memory (AuthContext) — never persisted
 */

import CryptoJS from 'crypto-js';

// ─── Types ─────────────────────────────────────────────────────────────────

export type EncryptedValue = string; // Base64-encoded AES ciphertext

export interface EncryptedDoc {
  [key: string]: string | number | boolean | null | EncryptedDoc;
}

// ─── Key Management ─────────────────────────────────────────────────────────

/**
 * Derives a deterministic AES key from password + salt using PBKDF2.
 * The derived key string is used for AES encryption/decryption.
 */
export function deriveKey(password: string, salt: string): string {
  const iterations = Number(import.meta.env.VITE_PBKDF2_ITERATIONS) || 310000;
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256-bit key
    iterations,
    hasher: CryptoJS.algo.SHA256,
  });
  return key.toString(); // hex string
}

/**
 * Generates a cryptographically random salt for a new user.
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

// ─── Encrypt / Decrypt ──────────────────────────────────────────────────────

/**
 * Encrypts a plaintext string value using AES-256-CBC.
 * Returns a Base64-encoded ciphertext string.
 */
export function encryptValue(plaintext: string | number, key: string): EncryptedValue {
  if (plaintext === null || plaintext === undefined) return '';
  return CryptoJS.AES.encrypt(String(plaintext), key).toString();
}

/**
 * Decrypts an AES-256-CBC encrypted value.
 * Returns the original plaintext string, or '' on failure.
 */
export function decryptValue(ciphertext: EncryptedValue, key: string): string {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8) || '';
  } catch {
    return '';
  }
}

/**
 * Decrypts a numeric encrypted field and returns a number.
 */
export function decryptNumber(ciphertext: EncryptedValue, key: string): number {
  const val = decryptValue(ciphertext, key);
  return val ? parseFloat(val) : 0;
}

// ─── Document-Level Helpers ─────────────────────────────────────────────────

/**
 * Encrypts specified fields of a plain document object.
 * Non-specified fields are passed through unchanged.
 *
 * @example
 *   const enc = encryptDocument(txn, ['amount', 'notes'], sessionKey);
 *   // enc.amount_enc = "U2FsdGVkX1..."
 */
export function encryptDocument<T extends Record<string, unknown>>(
  doc: T,
  sensitiveFields: (keyof T)[],
  key: string
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...doc };
  for (const field of sensitiveFields) {
    const raw = doc[field];
    if (raw !== undefined && raw !== null) {
      result[`${String(field)}_enc`] = encryptValue(String(raw), key);
      delete result[String(field)]; // remove plaintext field
    }
  }
  return result;
}

/**
 * Decrypts "_enc" suffixed fields back to their original names.
 */
export function decryptDocument<T extends Record<string, unknown>>(
  doc: Record<string, unknown>,
  sensitiveFields: string[],
  key: string
): T {
  const result: Record<string, unknown> = { ...doc };
  for (const field of sensitiveFields) {
    const encKey = `${field}_enc`;
    if (result[encKey] !== undefined) {
      result[field] = decryptValue(result[encKey] as string, key);
      delete result[encKey];
    }
  }
  return result as T;
}

// ─── Field Lists Per Collection ─────────────────────────────────────────────

export const ENCRYPTED_FIELDS = {
  transactions: ['amount', 'notes', 'reference', 'balance'],
  customers: ['phone', 'email', 'address', 'balance', 'gstin'],
  vendors: ['phone', 'email', 'bankAccount', 'balance', 'gstin'],
  invoices: ['totalAmount', 'taxAmount', 'lineItems', 'discount'],
  inventory: ['costPrice', 'sellingPrice'],
  accounts: ['balance'],
  orders: ['totalAmount', 'items'],
} as const;
