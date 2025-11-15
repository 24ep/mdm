/**
 * Integration Feature Types
 * Centralized type definitions for the integration feature
 */

export interface Integration {
  id: string
  name: string
  type: 'oauth' | 'webhook' | 'api' | 'database' | 'sso'
  provider: string
  status: 'active' | 'inactive' | 'error' | 'pending'
  isEnabled: boolean
  config: Record<string, any>
  lastSync?: Date
  errorCount: number
  createdAt: Date
  updatedAt: Date
}

export interface OAuthProvider {
  id: string
  name: string
  icon: string
  description: string
  isSupported: boolean
  endpoints: {
    auth: string
    token: string
    userInfo: string
  }
}

export interface WebhookIntegration {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string
  lastTriggered?: Date
  successCount: number
  failureCount: number
}

export interface APIKey {
  id: string
  name: string
  key: string
  secret: string
  permissions: string[]
  rateLimit: {
    requests: number
    window: string
  }
  isActive: boolean
  lastUsed?: Date
  createdAt: Date
  expiresAt?: Date
  description?: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string
  lastTriggered?: Date
  successCount: number
  failureCount: number
  createdAt: Date
}

export interface APIUsage {
  endpoint: string
  method: string
  requests: number
  avgResponseTime: number
  errorRate: number
  lastUsed: Date
}

export interface RateLimit {
  id: string
  name: string
  requests: number
  window: string
  isActive: boolean
  description?: string
}

