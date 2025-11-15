import { encrypt, decrypt } from '@/lib/encryption'
import { query } from '@/lib/db'

/**
 * Encrypt and store credentials securely
 * Stores in service_installations table for marketplace plugins
 */
export async function storeCredentials(
  key: string,
  credentials: Record<string, any>
): Promise<void> {
  try {
    const encrypted = encrypt(JSON.stringify(credentials))
    
    // Store in service_installations table
    // The key should be in format: "installation:{installationId}" or "service:{serviceId}"
    const keyParts = key.split(':')
    
    if (keyParts[0] === 'installation' && keyParts[1]) {
      // Update existing installation credentials
      await query(
        `UPDATE service_installations 
         SET credentials = $1::jsonb, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify({ encrypted }), keyParts[1]]
      )
    } else if (keyParts[0] === 'service' && keyParts[1]) {
      // Store in service_registry credentials field
      await query(
        `UPDATE service_registry 
         SET credentials = $1::jsonb, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify({ encrypted }), keyParts[1]]
      )
    } else {
      // Generic storage - create a credentials table entry if needed
      // For now, log a warning
      console.warn(`Unknown credential key format: ${key}`)
    }
  } catch (error) {
    console.error('Error storing credentials:', error)
    throw new Error('Failed to store credentials')
  }
}

/**
 * Retrieve and decrypt credentials
 */
export async function retrieveCredentials(
  key: string
): Promise<Record<string, any> | null> {
  try {
    const keyParts = key.split(':')
    let result: any

    if (keyParts[0] === 'installation' && keyParts[1]) {
      // Retrieve from service_installations
      result = await query(
        `SELECT credentials 
         FROM service_installations 
         WHERE id = $1`,
        [keyParts[1]]
      )
    } else if (keyParts[0] === 'service' && keyParts[1]) {
      // Retrieve from service_registry
      result = await query(
        `SELECT credentials 
         FROM service_registry 
         WHERE id = $1`,
        [keyParts[1]]
      )
    } else {
      console.warn(`Unknown credential key format: ${key}`)
      return null
    }

    if (result.rows.length === 0 || !result.rows[0].credentials) {
      return null
    }

    const creds = result.rows[0].credentials
    
    // Handle both encrypted and plain credentials
    if (creds.encrypted) {
      const decrypted = decrypt(creds.encrypted)
      return JSON.parse(decrypted)
    } else if (typeof creds === 'object') {
      // Already decrypted or plain JSON
      return creds
    }

    return null
  } catch (error) {
    console.error('Error retrieving credentials:', error)
    return null
  }
}

/**
 * Delete credentials
 */
export async function deleteCredentials(key: string): Promise<void> {
  try {
    const keyParts = key.split(':')

    if (keyParts[0] === 'installation' && keyParts[1]) {
      // Clear credentials from service_installations
      await query(
        `UPDATE service_installations 
         SET credentials = NULL, updated_at = NOW()
         WHERE id = $1`,
        [keyParts[1]]
      )
    } else if (keyParts[0] === 'service' && keyParts[1]) {
      // Clear credentials from service_registry
      await query(
        `UPDATE service_registry 
         SET credentials = NULL, updated_at = NOW()
         WHERE id = $1`,
        [keyParts[1]]
      )
    } else {
      console.warn(`Unknown credential key format: ${key}`)
    }
  } catch (error) {
    console.error('Error deleting credentials:', error)
    throw new Error('Failed to delete credentials')
  }
}

/**
 * Rotate credentials
 */
export async function rotateCredentials(
  key: string,
  newCredentials: Record<string, any>
): Promise<void> {
  await deleteCredentials(key)
  await storeCredentials(key, newCredentials)
}

