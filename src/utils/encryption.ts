/**
 * Encryption Utility for Data at Rest
 * Encrypts sensitive calendar data stored locally
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_NAME = 'app_encryption_key';
const ALGORITHM = 'AES-GCM';

/**
 * Generate or retrieve encryption key
 */
async function getEncryptionKey(): Promise<string> {
  try {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
    
    if (!key) {
      // Generate new 256-bit key
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key);
    }
    
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw new Error('Failed to retrieve encryption key');
  }
}

/**
 * Simple XOR-based encryption (for Expo compatibility)
 * For production, consider using native crypto modules
 */
function xorEncrypt(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * Convert string to base64
 */
function toBase64(str: string): string {
  return Buffer.from(str, 'binary').toString('base64');
}

/**
 * Convert base64 to string
 */
function fromBase64(str: string): string {
  return Buffer.from(str, 'base64').toString('binary');
}

/**
 * Encrypt data
 * @param data Data to encrypt (will be JSON stringified)
 * @returns Encrypted base64 string
 */
export async function encryptData(data: any): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const jsonString = JSON.stringify(data);
    
    // Add timestamp for additional entropy
    const timestamp = Date.now().toString();
    const dataWithTimestamp = timestamp + '|' + jsonString;
    
    // XOR encryption with key
    const encrypted = xorEncrypt(dataWithTimestamp, key);
    
    // Convert to base64 for safe storage
    return toBase64(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data
 * @param encryptedData Encrypted base64 string
 * @returns Decrypted and parsed data
 */
export async function decryptData<T = any>(encryptedData: string): Promise<T> {
  try {
    const key = await getEncryptionKey();
    
    // Decode from base64
    const encrypted = fromBase64(encryptedData);
    
    // XOR decryption with key
    const decrypted = xorEncrypt(encrypted, key);
    
    // Remove timestamp
    const parts = decrypted.split('|');
    if (parts.length < 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const jsonString = parts.slice(1).join('|');
    
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, for comparison)
 */
export async function hashData(data: string): Promise<string> {
  try {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return digest;
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
}

/**
 * Generate secure random string
 */
export async function generateSecureRandom(length: number = 32): Promise<string> {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Random generation error:', error);
    throw new Error('Failed to generate secure random');
  }
}

/**
 * Clear encryption key (use on app reset/logout)
 */
export async function clearEncryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_NAME);
  } catch (error) {
    console.error('Error clearing encryption key:', error);
  }
}
