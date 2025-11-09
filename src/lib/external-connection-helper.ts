/**
 * Helper functions for external connections with Vault integration
 */

import { getSecretsManager } from './secrets-manager'
import { decryptApiKey } from './encryption'
import { createExternalClient, ExternalConnectionConfig } from './external-db'

/**
 * Retrieve database credentials from Vault or decrypt from database
 */
export async function getDatabaseCredentials(connectionId: string, password: string | null): Promise<string | null> {
  if (!password) return null

  // Check if stored in Vault
  if (password.startsWith('vault://')) {
    const secretsManager = getSecretsManager()
    const creds = await secretsManager.getDatabaseCredentials(connectionId)
    return creds?.password || null
  }

  // Decrypt if stored in database
  return decryptApiKey(password) || password
}

/**
 * Retrieve external API credentials from Vault or decrypt from database
 */
export async function getExternalApiCredentials(
  connectionId: string,
  authToken: string | null,
  authPassword: string | null,
  apiKeyValue: string | null
): Promise<{
  authToken: string | null
  authPassword: string | null
  apiKeyValue: string | null
}> {
  const secretsManager = getSecretsManager()
  const useVault = secretsManager.getBackend() === 'vault'

  let token = authToken
  let password = authPassword
  let apiKey = apiKeyValue

  if (useVault && (authToken?.startsWith('vault://') || authPassword?.startsWith('vault://') || apiKeyValue?.startsWith('vault://'))) {
    const vaultCreds = await secretsManager.getExternalApiCredentials(connectionId)
    if (vaultCreds) {
      if (authToken?.startsWith('vault://')) {
        token = vaultCreds.authToken || null
      }
      if (authPassword?.startsWith('vault://')) {
        password = vaultCreds.password || null
      }
      if (apiKeyValue?.startsWith('vault://')) {
        apiKey = vaultCreds.apiKey || null
      }
    }
  } else {
    // Decrypt if stored in database
    if (token) token = decryptApiKey(token) || token
    if (password) password = decryptApiKey(password) || password
    if (apiKey) apiKey = decryptApiKey(apiKey) || apiKey
  }

  return { authToken: token, authPassword: password, apiKeyValue: apiKey }
}

/**
 * Create external database client with automatic credential retrieval
 */
export async function createExternalClientWithCredentials(
  config: ExternalConnectionConfig & { password?: string | null }
): Promise<ReturnType<typeof createExternalClient>> {
  let password = config.password

  // Retrieve password from Vault if needed
  if (password && config.id) {
    password = await getDatabaseCredentials(config.id, password)
  }

  return createExternalClient({
    ...config,
    password: password || undefined,
  })
}

