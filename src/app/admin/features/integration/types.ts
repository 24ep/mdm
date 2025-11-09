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

// API Client Types (Postman-like)
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey' | 'oauth2'

export interface HTTPHeader {
  key: string
  value: string
  enabled: boolean
}

export interface AuthConfig {
  type: AuthType
  bearerToken?: string
  basicUsername?: string
  basicPassword?: string
  apiKeyName?: string
  apiKeyValue?: string
  apiKeyLocation?: 'header' | 'query'
  oauth2Config?: {
    tokenUrl: string
    clientId: string
    clientSecret: string
    scopes: string[]
  }
}

export interface RequestBody {
  type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary'
  json?: string
  formData?: Array<{ key: string; value: string; type: 'text' | 'file'; enabled: boolean }>
  urlEncoded?: Array<{ key: string; value: string; enabled: boolean }>
  raw?: string
  rawType?: 'text' | 'javascript' | 'json' | 'html' | 'xml'
}

export interface APITest {
  name: string
  type: 'status' | 'header' | 'body' | 'json' | 'time' | 'custom'
  condition: string
  expected?: any
  expression?: string
}

export interface APIRequest {
  id: string
  name: string
  method: HTTPMethod
  url: string
  headers: HTTPHeader[]
  auth?: AuthConfig
  body?: RequestBody
  preRequestScript?: string
  tests?: APITest[]
  description?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface APIResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  size: number
  time: number
  timestamp: Date
  testResults?: Array<{
    name: string
    passed: boolean
    error?: string
  }>
}

export interface RequestHistory {
  id: string
  requestId: string
  request: APIRequest
  response?: APIResponse
  error?: string
  timestamp: Date
}

export interface RequestCollection {
  id: string
  name: string
  description?: string
  requests: APIRequest[]
  createdAt: Date
  updatedAt: Date
}

export interface Environment {
  id: string
  name: string
  variables: Array<{ key: string; value: string; enabled: boolean }>
  createdAt: Date
  updatedAt: Date
}

export interface APITemplate {
  id: string
  name: string
  description?: string
  category: string
  method?: string
  url?: string
  headers: HTTPHeader[]
  auth?: AuthConfig
  body?: RequestBody
  preRequestScript?: string
  tests?: APITest[]
  tags: string[]
  isPublic: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}
