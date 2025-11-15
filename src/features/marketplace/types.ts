export interface PluginDefinition {
  id: string
  name: string
  slug: string
  description?: string
  version: string
  provider: string
  providerUrl?: string
  category: PluginCategory
  status: PluginStatus
  capabilities?: Record<string, any>
  apiBaseUrl?: string
  apiAuthType?: 'oauth2' | 'api_key' | 'bearer' | 'none'
  apiAuthConfig?: Record<string, any>
  uiType?: 'iframe' | 'react_component' | 'web_component'
  uiConfig?: Record<string, any>
  webhookSupported?: boolean
  webhookEvents?: string[]
  iconUrl?: string
  screenshots?: string[]
  documentationUrl?: string
  supportUrl?: string
  pricingInfo?: Record<string, any>
  installationCount?: number
  rating?: number
  reviewCount?: number
  verified?: boolean
  securityAudit?: Record<string, any>
}

export type PluginCategory = 
  | 'business-intelligence' 
  | 'service-management' 
  | 'data-integration'
  | 'automation'
  | 'analytics'
  | 'other'

export type PluginStatus = 'pending' | 'approved' | 'rejected' | 'deprecated'

export interface PluginInstallation {
  id: string
  serviceId: string
  spaceId?: string
  installedBy?: string
  config?: Record<string, any>
  credentials?: Record<string, any>
  status: 'active' | 'inactive' | 'error'
  lastHealthCheck?: Date
  healthStatus?: string
  permissions?: Record<string, any>
  installedAt: Date
  updatedAt: Date
}

export interface UseMarketplacePluginsOptions {
  category?: PluginCategory
  spaceId?: string | null
  filters?: {
    status?: PluginStatus
    verified?: boolean
    serviceType?: string
  }
}

