/**
 * Plugin types - shared with main app
 */

export type PluginCategory = 
  | 'business-intelligence'      // BI tools (Power BI, Looker Studio, etc.)
  | 'monitoring-observability'   // Monitoring tools (Grafana, Prometheus, etc.)
  | 'service-management'         // Infrastructure service management
  | 'database-management'        // Database tools (PostgreSQL, Redis, etc.)
  | 'api-gateway'                // API gateway tools (Kong, etc.)
  | 'storage-management'         // Storage tools (MinIO, S3, etc.)
  | 'data-integration'           // Data connectors and ETL
  | 'automation'                 // Workflow automation
  | 'analytics'                  // Analytics platforms
  | 'security'                   // Security tools
  | 'development-tools'          // Developer tools
  | 'other'                      // Other plugins

export type PluginStatus = 'pending' | 'approved' | 'rejected' | 'deprecated'

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
  source?: string
  sourceUrl?: string
}

