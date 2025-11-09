/**
 * Kong Admin API Client
 * Provides utilities to interact with Kong Gateway Admin API
 */

export interface KongService {
  id?: string
  name: string
  url: string
  protocol?: string
  host?: string
  port?: number
  path?: string
  retries?: number
  connect_timeout?: number
  write_timeout?: number
  read_timeout?: number
  tags?: string[]
}

export interface KongRoute {
  id?: string
  name: string
  service: { id: string } | string
  protocols?: string[]
  methods?: string[]
  hosts?: string[]
  paths?: string[]
  strip_path?: boolean
  preserve_host?: boolean
  tags?: string[]
}

export interface KongPlugin {
  id?: string
  name: string
  service?: { id: string } | string
  route?: { id: string } | string
  consumer?: { id: string } | string
  config?: Record<string, any>
  enabled?: boolean
  tags?: string[]
}

export interface KongConsumer {
  id?: string
  username?: string
  custom_id?: string
  tags?: string[]
}

export interface KongApiKey {
  id?: string
  key?: string
  consumer?: { id: string } | string
  tags?: string[]
}

export class KongClient {
  private adminUrl: string
  private apiKey?: string
  private timeout: number

  constructor(adminUrl: string, apiKey?: string, timeout: number = 10000) {
    // Ensure adminUrl doesn't end with /
    this.adminUrl = adminUrl.replace(/\/$/, '')
    this.apiKey = apiKey
    this.timeout = timeout
  }

  private async request(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `${this.adminUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['Kong-Admin-Token'] = this.apiKey
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Kong API error: ${response.status} ${response.statusText} - ${errorText}`
        )
      }

      // Kong Admin API returns empty body for some operations
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return null
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - Kong Admin API did not respond')
      }
      throw error
    }
  }

  /**
   * Test connection to Kong Admin API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('GET', '/')
      return true
    } catch (error) {
      console.error('Kong connection test failed:', error)
      return false
    }
  }

  /**
   * Get Kong node information
   */
  async getNodeInfo(): Promise<any> {
    return this.request('GET', '/')
  }

  /**
   * Services Management
   */
  async getServices(): Promise<{ data: KongService[] }> {
    return this.request('GET', '/services')
  }

  async getService(id: string): Promise<KongService> {
    return this.request('GET', `/services/${id}`)
  }

  async createService(service: KongService): Promise<KongService> {
    return this.request('POST', '/services', service)
  }

  async updateService(id: string, service: Partial<KongService>): Promise<KongService> {
    return this.request('PATCH', `/services/${id}`, service)
  }

  async deleteService(id: string): Promise<void> {
    return this.request('DELETE', `/services/${id}`)
  }

  /**
   * Routes Management
   */
  async getRoutes(): Promise<{ data: KongRoute[] }> {
    return this.request('GET', '/routes')
  }

  async getRoute(id: string): Promise<KongRoute> {
    return this.request('GET', `/routes/${id}`)
  }

  async createRoute(route: KongRoute): Promise<KongRoute> {
    return this.request('POST', '/routes', route)
  }

  async updateRoute(id: string, route: Partial<KongRoute>): Promise<KongRoute> {
    return this.request('PATCH', `/routes/${id}`, route)
  }

  async deleteRoute(id: string): Promise<void> {
    return this.request('DELETE', `/routes/${id}`)
  }

  /**
   * Plugins Management
   */
  async getPlugins(): Promise<{ data: KongPlugin[] }> {
    return this.request('GET', '/plugins')
  }

  async getPlugin(id: string): Promise<KongPlugin> {
    return this.request('GET', `/plugins/${id}`)
  }

  async createPlugin(plugin: KongPlugin): Promise<KongPlugin> {
    return this.request('POST', '/plugins', plugin)
  }

  async updatePlugin(id: string, plugin: Partial<KongPlugin>): Promise<KongPlugin> {
    return this.request('PATCH', `/plugins/${id}`, plugin)
  }

  async deletePlugin(id: string): Promise<void> {
    return this.request('DELETE', `/plugins/${id}`)
  }

  /**
   * Consumers Management
   */
  async getConsumers(): Promise<{ data: KongConsumer[] }> {
    return this.request('GET', '/consumers')
  }

  async getConsumer(idOrUsername: string): Promise<KongConsumer> {
    return this.request('GET', `/consumers/${idOrUsername}`)
  }

  async createConsumer(consumer: KongConsumer): Promise<KongConsumer> {
    return this.request('POST', '/consumers', consumer)
  }

  async updateConsumer(
    idOrUsername: string,
    consumer: Partial<KongConsumer>
  ): Promise<KongConsumer> {
    return this.request('PATCH', `/consumers/${idOrUsername}`, consumer)
  }

  async deleteConsumer(idOrUsername: string): Promise<void> {
    return this.request('DELETE', `/consumers/${idOrUsername}`)
  }

  /**
   * API Keys Management
   */
  async getApiKeys(consumerId?: string): Promise<{ data: KongApiKey[] }> {
    const endpoint = consumerId
      ? `/consumers/${consumerId}/key-auth`
      : '/key-auths'
    return this.request('GET', endpoint)
  }

  async createApiKey(consumerId: string, key?: string): Promise<KongApiKey> {
    return this.request('POST', `/consumers/${consumerId}/key-auth`, {
      key,
    })
  }

  async deleteApiKey(consumerId: string, keyId: string): Promise<void> {
    return this.request('DELETE', `/consumers/${consumerId}/key-auth/${keyId}`)
  }
}

