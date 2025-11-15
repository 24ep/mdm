import { NextRequest } from 'next/server'
import { PluginDefinition } from '../types'
import { retrieveCredentials } from '@/shared/lib/security/credential-manager'

/**
 * Plugin Gateway - Routes API requests to plugin endpoints
 */
export class PluginGateway {
  /**
   * Route request to plugin API
   */
  async routeRequest(
    plugin: PluginDefinition,
    installationId: string,
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<Response> {
    if (!plugin.apiBaseUrl) {
      throw new Error(`Plugin ${plugin.id} does not have an API base URL`)
    }

    // Get credentials for this installation
    const credentials = await retrieveCredentials(`plugin:${installationId}`)
    
    // Build target URL
    const targetUrl = `${plugin.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`

    // Prepare headers with authentication
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    }

    // Add authentication based on plugin auth type
    if (plugin.apiAuthType && credentials) {
      switch (plugin.apiAuthType) {
        case 'bearer':
          requestHeaders['Authorization'] = `Bearer ${credentials.token || credentials.accessToken}`
          break
        case 'api_key':
          const apiKeyHeader = plugin.apiAuthConfig?.headerName || 'X-API-Key'
          requestHeaders[apiKeyHeader] = credentials.apiKey || credentials.key
          break
        case 'oauth2':
          // OAuth2 tokens are typically bearer tokens
          requestHeaders['Authorization'] = `Bearer ${credentials.accessToken || credentials.token}`
          break
      }
    }

    // Make request to plugin API
    try {
      const response = await fetch(targetUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      })

      return response
    } catch (error) {
      console.error(`Error routing request to plugin ${plugin.id}:`, error)
      throw new Error(`Failed to route request to plugin: ${error}`)
    }
  }

  /**
   * Validate plugin API configuration
   */
  validatePluginAPI(plugin: PluginDefinition): boolean {
    if (!plugin.apiBaseUrl) {
      return false
    }

    try {
      new URL(plugin.apiBaseUrl)
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
export const pluginGateway = new PluginGateway()

