import { query } from './db'

// Dynamic import for Elasticsearch Client (server-side only)
type ElasticsearchClient = any // Using any to avoid static import of Client type

interface ElasticsearchConfig {
  url?: string
  cloudId?: string
  username?: string
  password?: string
  apiKey?: string
  indexPrefix?: string
}

let elasticsearchClient: ElasticsearchClient | null = null
let ElasticsearchClientClass: any = null
let cachedConfig: ElasticsearchConfig | null = null
let configCacheTime: number = 0
const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get Elasticsearch configuration from database
 */
async function getElasticsearchConfig(): Promise<ElasticsearchConfig | null> {
  try {
    // Check cache first
    const now = Date.now()
    if (cachedConfig && (now - configCacheTime) < CONFIG_CACHE_TTL) {
      return cachedConfig
    }

    const sql = `
      SELECT config, status, is_enabled
      FROM platform_integrations
      WHERE type = 'elasticsearch'
        AND deleted_at IS NULL
        AND status = 'active'
        AND is_enabled = true
      ORDER BY updated_at DESC
      LIMIT 1
    `

    const result = await query(sql)
    
    if (result.rows.length === 0) {
      cachedConfig = null
      return null
    }

    const config = result.rows[0].config as ElasticsearchConfig
    cachedConfig = config
    configCacheTime = now
    return config
  } catch (error: any) {
    // If table doesn't exist (42P01) or query fails, return null (graceful degradation)
    // Don't log expected errors like missing table - this is normal if migrations haven't run
    const isTableMissing = error?.code === '42P01' || 
                         error?.meta?.code === '42P01' ||
                         (typeof error?.message === 'string' && error.message.includes('does not exist'))
    
    if (!isTableMissing) {
      // Only log unexpected errors
      console.error('Error fetching Elasticsearch config:', error)
    }
    
    cachedConfig = null
    return null
  }
}

/**
 * Load Elasticsearch Client class dynamically
 */
async function loadElasticsearchClient(): Promise<any> {
  if (ElasticsearchClientClass) {
    return ElasticsearchClientClass
  }

  // Only load on server-side
  if (typeof window !== 'undefined') {
    return null
  }

  try {
    const elasticsearchModule = await import('@elastic/elasticsearch')
    ElasticsearchClientClass = elasticsearchModule.Client
    return ElasticsearchClientClass
  } catch (error) {
    console.error('Failed to load Elasticsearch client:', error)
    return null
  }
}

/**
 * Initialize Elasticsearch client from configuration
 */
async function initializeClient(): Promise<ElasticsearchClient | null> {
  const config = await getElasticsearchConfig()
  
  if (!config) {
    elasticsearchClient = null
    return null
  }

  // Check if we have required connection info
  if (!config.url && !config.cloudId) {
    console.warn('Elasticsearch: URL or Cloud ID is required')
    return null
  }

  try {
    // Load Elasticsearch Client class
    const Client = await loadElasticsearchClient()
    if (!Client) {
      return null
    }

    const clientOptions: any = {}

    // Set connection
    if (config.cloudId) {
      clientOptions.cloud = {
        id: config.cloudId
      }
    } else if (config.url) {
      clientOptions.node = config.url
    }

    // Set authentication
    if (config.apiKey) {
      clientOptions.auth = {
        apiKey: config.apiKey
      }
    } else if (config.username && config.password) {
      clientOptions.auth = {
        username: config.username,
        password: config.password
      }
    }

    // Additional options
    clientOptions.maxRetries = 3
    clientOptions.requestTimeout = 30000
    clientOptions.pingTimeout = 3000

    const client = new Client(clientOptions)
    
    // Test connection
    try {
      await client.ping()
      elasticsearchClient = client
      return client
    } catch (pingError) {
      console.error('Elasticsearch connection test failed:', pingError)
      elasticsearchClient = null
      return null
    }
  } catch (error) {
    console.error('Error initializing Elasticsearch client:', error)
    elasticsearchClient = null
    return null
  }
}

/**
 * Get Elasticsearch client instance
 */
export async function getElasticsearchClient(): Promise<ElasticsearchClient | null> {
  // If client exists, return it
  if (elasticsearchClient) {
    return elasticsearchClient
  }

  // Otherwise, try to initialize
  return await initializeClient()
}

/**
 * Check if Elasticsearch is enabled and configured
 */
export async function isElasticsearchEnabled(): Promise<boolean> {
  const config = await getElasticsearchConfig()
  return config !== null && (!!config.url || !!config.cloudId)
}

/**
 * Send log entry to Elasticsearch
 */
export async function sendLogToElasticsearch(
  logType: 'application' | 'monitoring' | 'audit' | 'db-audit' | 'security',
  logData: Record<string, any>
): Promise<void> {
  try {
    const client = await getElasticsearchClient()
    if (!client) {
      return // Elasticsearch not configured or unavailable
    }

    const config = await getElasticsearchConfig()
    if (!config) {
      return
    }

    // Get index prefix (default: mdm-logs)
    const prefix = config.indexPrefix || 'mdm-logs'
    
    // Create index name with date pattern: {prefix}-{log-type}-{YYYY.MM.DD}
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '.')
    const indexName = `${prefix}-${logType}-${dateStr}`

    // Add timestamp if not present
    if (!logData['@timestamp']) {
      logData['@timestamp'] = now.toISOString()
    }

    // Send to Elasticsearch (fire and forget - don't block on errors)
    client.index({
      index: indexName,
      body: logData
    }).catch((error: unknown) => {
      // Silently fail - don't break application if ES is down
      console.error('Failed to send log to Elasticsearch:', error)
    })
  } catch (error) {
    // Silently fail - graceful degradation
    console.error('Error sending log to Elasticsearch:', error)
  }
}

/**
 * Clear cached configuration (useful after config updates)
 */
export function clearElasticsearchCache(): void {
  cachedConfig = null
  configCacheTime = 0
  elasticsearchClient = null
}

/**
 * Bulk send logs to Elasticsearch (for better performance)
 */
export async function bulkSendLogsToElasticsearch(
  logType: 'application' | 'monitoring' | 'audit' | 'db-audit' | 'security',
  logs: Array<Record<string, any>>
): Promise<void> {
  if (logs.length === 0) {
    return
  }

  try {
    const client = await getElasticsearchClient()
    if (!client) {
      return
    }

    const config = await getElasticsearchConfig()
    if (!config) {
      return
    }

    const prefix = config.indexPrefix || 'mdm-logs'
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '.')
    const indexName = `${prefix}-${logType}-${dateStr}`

    // Prepare bulk operations
    const body = logs.flatMap(log => {
      // Add timestamp if not present
      if (!log['@timestamp']) {
        log['@timestamp'] = new Date().toISOString()
      }
      
      return [
        { index: { _index: indexName } },
        log
      ]
    })

    // Send bulk request (fire and forget)
    client.bulk({ body }).catch((error: unknown) => {
      console.error('Failed to bulk send logs to Elasticsearch:', error)
    })
  } catch (error) {
    console.error('Error bulk sending logs to Elasticsearch:', error)
  }
}

