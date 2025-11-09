/**
 * Encryption utility for sensitive data like API keys
 * Uses AES-256-GCM encryption with a key derived from environment variable
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for AES
const SALT_LENGTH = 64 // 64 bytes for salt
const TAG_LENGTH = 16 // 16 bytes for GCM tag
const KEY_LENGTH = 32 // 32 bytes for AES-256
const ITERATIONS = 100000 // PBKDF2 iterations

/**
 * Get encryption key from environment variable
 * Falls back to a default key if not set (WARNING: Not secure for production)
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY
  
  if (!envKey) {
    console.warn('⚠️  ENCRYPTION_KEY not set. Using default key (NOT SECURE FOR PRODUCTION)')
    // Default key - MUST be changed in production
    return crypto.pbkdf2Sync('default-key-change-in-production', 'salt', 1000, KEY_LENGTH, 'sha256')
  }
  
  // If key is provided as hex string, convert it
  if (envKey.length === 64) {
    return Buffer.from(envKey, 'hex')
  }
  
  // Otherwise derive key from the environment variable
  return crypto.pbkdf2Sync(envKey, 'encryption-salt', ITERATIONS, KEY_LENGTH, 'sha256')
}

/**
 * Encrypt a string value
 * Returns a hex-encoded string containing: salt + iv + tag + encrypted data
 */
export function encrypt(value: string): string {
  if (!value) {
    return value
  }

  try {
    const key = getEncryptionKey()
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Derive a key from the master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256')
    
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)
    
    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combine: salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ])
    
    return combined.toString('hex')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt value')
  }
}

/**
 * Decrypt a hex-encoded encrypted string
 * Expects format: salt + iv + tag + encrypted data
 */
export function decrypt(encryptedValue: string): string {
  if (!encryptedValue) {
    return encryptedValue
  }

  // Check if the value appears to be encrypted before attempting decryption
  if (!isEncrypted(encryptedValue)) {
    // Not encrypted, return as-is (plain text for backward compatibility)
    return encryptedValue
  }

  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedValue, 'hex')
    
    // Validate buffer length
    const minLength = SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    if (combined.length < minLength) {
      // Too short to be encrypted, return as plain text
      return encryptedValue
    }
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    // Derive the same key using the salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    // If decryption fails, it might be plain text (for backward compatibility)
    // Return as-is without logging error (it's expected for plain text values)
    return encryptedValue
  }
}

/**
 * Check if a value appears to be encrypted (hex string of expected length)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false
  
  // Encrypted values are hex strings with minimum length
  // salt (64) + iv (16) + tag (16) + at least some encrypted data = ~96+ bytes = 192+ hex chars
  const minEncryptedLength = (SALT_LENGTH + IV_LENGTH + TAG_LENGTH) * 2 // Convert bytes to hex chars
  
  return /^[0-9a-f]+$/i.test(value) && value.length >= minEncryptedLength
}

/**
 * Encrypt API key if not already encrypted
 */
export function encryptApiKey(apiKey: string | null | undefined): string | null {
  if (!apiKey) return null
  
  // If already encrypted, return as-is
  if (isEncrypted(apiKey)) {
    return apiKey
  }
  
  return encrypt(apiKey)
}

/**
 * Decrypt API key, with fallback for plain text (backward compatibility)
 */
export function decryptApiKey(encryptedApiKey: string | null | undefined): string | null {
  if (!encryptedApiKey) return null
  
  // If it appears to be encrypted, try to decrypt
  if (isEncrypted(encryptedApiKey)) {
    try {
      return decrypt(encryptedApiKey)
    } catch (error) {
      console.error('Failed to decrypt API key:', error)
      return null
    }
  }
  
  // Otherwise, assume it's plain text (for backward compatibility)
  return encryptedApiKey
}


