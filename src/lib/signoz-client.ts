import { query } from './db'

interface SigNozConfig {
  url?: string
  otlpEndpoint?: string
  apiKey?: string
  serviceName?: string
  environment?: string
}

let cachedConfig: SigNozConfig | null = null
let configCacheTime: number = 0
const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get SigNoz configuration from database
 */
async function getSigNozConfig(): Promise<SigNozConfig | null> {
  try {
    // Check cache first
    const now = Date.now()
    if (cachedConfig && (now - configCacheTime) < CONFIG_CACHE_TTL) {
      return cachedConfig
    }

    const sql = `
      SELECT config, status, is_enabled
      FROM platform_integrations
      WHERE type = 'signoz'
        AND deleted_at IS NULL
        AND status = 'active'
        AND is_enabled = true
      ORDER BY updated_at DESC
      LIMIT 1
    `

    const result = await query(sql, [], 30000, { skipTracing: true })

    if (result.rows.length === 0) {
      cachedConfig = null
      return null
    }

    const config = result.rows[0].config as SigNozConfig
    cachedConfig = config
    configCacheTime = now
    return config
  } catch (error: any) {
    // If table doesn't exist (42P01) or query fails, return null (graceful degradation)
    const isTableMissing = error?.code === '42P01' ||
      error?.meta?.code === '42P01' ||
      (typeof error?.message === 'string' && error.message.includes('does not exist'))

    if (!isTableMissing) {
      console.error('Error fetching SigNoz config:', error)
    }

    cachedConfig = null
    return null
  }
}

/**
 * Check if SigNoz is enabled and configured
 */
export async function isSigNozEnabled(): Promise<boolean> {
  const config = await getSigNozConfig()
  return config !== null && !!config.url
}

/**
 * Get SigNoz configuration
 */
export async function getSigNozConfigPublic(): Promise<SigNozConfig | null> {
  return await getSigNozConfig()
}

/**
 * Send trace data to SigNoz via OTLP
 */
export async function sendTraceToSigNoz(
  traceData: {
    traceId: string
    spanId: string
    parentSpanId?: string
    name: string
    kind: 'SERVER' | 'CLIENT' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER'
    startTime: number
    endTime: number
    attributes?: Record<string, any>
    status?: { code: number; message?: string }
  }
): Promise<void> {
  try {
    const config = await getSigNozConfig()
    if (!config || !config.url) {
      return // SigNoz not configured
    }

    // Only run on server-side
    if (typeof window !== 'undefined') {
      return
    }

    const otlpEndpoint = config.otlpEndpoint || `${config.url.replace(/\/$/, '')}/v1/traces`
    const serviceName = config.serviceName || 'mdm-platform'
    const environment = config.environment || 'production'

    // Prepare OTLP trace payload
    const resourceAttributes = {
      'service.name': serviceName,
      'service.environment': environment,
      'deployment.environment': environment
    }

    const span = {
      traceId: traceData.traceId,
      spanId: traceData.spanId,
      parentSpanId: traceData.parentSpanId,
      name: traceData.name,
      kind: traceData.kind,
      startTimeUnixNano: traceData.startTime * 1000000, // Convert to nanoseconds
      endTimeUnixNano: traceData.endTime * 1000000,
      attributes: Object.entries({
        ...traceData.attributes,
        ...resourceAttributes
      }).map(([key, value]) => ({
        key,
        value: {
          stringValue: typeof value === 'string' ? value : JSON.stringify(value)
        }
      })),
      status: traceData.status ? {
        code: traceData.status.code,
        message: traceData.status.message || ''
      } : { code: 1 } // OK
    }

    const payload = {
      resourceSpans: [{
        resource: {
          attributes: Object.entries(resourceAttributes).map(([key, value]) => ({
            key,
            value: {
              stringValue: String(value)
            }
          }))
        },
        scopeSpans: [{
          spans: [span]
        }]
      }]
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    // Send to SigNoz (fire and forget - don't block on errors)
    fetch(otlpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }).catch((error) => {
      // Silently fail - don't break application if SigNoz is down
      console.error('Failed to send trace to SigNoz:', error)
    })
  } catch (error) {
    // Silently fail - graceful degradation
    console.error('Error sending trace to SigNoz:', error)
  }
}

/**
 * Send metric data to SigNoz via OTLP
 */
export async function sendMetricToSigNoz(
  metricData: {
    name: string
    value: number
    unit?: string
    type: 'counter' | 'gauge' | 'histogram'
    attributes?: Record<string, any>
    timestamp?: number
  }
): Promise<void> {
  try {
    const config = await getSigNozConfig()
    if (!config || !config.url) {
      return // SigNoz not configured
    }

    // Only run on server-side
    if (typeof window !== 'undefined') {
      return
    }

    const otlpEndpoint = config.otlpEndpoint || `${config.url.replace(/\/$/, '')}/v1/metrics`
    const serviceName = config.serviceName || 'mdm-platform'
    const environment = config.environment || 'production'
    const timestamp = metricData.timestamp || Date.now()

    const resourceAttributes = {
      'service.name': serviceName,
      'service.environment': environment,
      'deployment.environment': environment
    }

    const metric = {
      name: metricData.name,
      unit: metricData.unit || '',
      description: '',
      dataPoints: [{
        attributes: Object.entries({
          ...metricData.attributes,
          ...resourceAttributes
        }).map(([key, value]) => ({
          key,
          value: {
            stringValue: typeof value === 'string' ? value : JSON.stringify(value)
          }
        })),
        startTimeUnixNano: timestamp * 1000000,
        timeUnixNano: timestamp * 1000000,
        ...(metricData.type === 'gauge' ? {
          asDouble: metricData.value
        } : {
          asInt: Math.round(metricData.value)
        })
      }]
    }

    const payload = {
      resourceMetrics: [{
        resource: {
          attributes: Object.entries(resourceAttributes).map(([key, value]) => ({
            key,
            value: {
              stringValue: String(value)
            }
          }))
        },
        scopeMetrics: [{
          metrics: [metric]
        }]
      }]
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    // Send to SigNoz (fire and forget)
    fetch(otlpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }).catch((error) => {
      console.error('Failed to send metric to SigNoz:', error)
    })
  } catch (error) {
    console.error('Error sending metric to SigNoz:', error)
  }
}

/**
 * Send log data to SigNoz via OTLP
 */
export async function sendLogToSigNoz(
  logData: {
    severity: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
    message: string
    attributes?: Record<string, any>
    timestamp?: number
  }
): Promise<void> {
  try {
    const config = await getSigNozConfig()
    if (!config || !config.url) {
      return // SigNoz not configured
    }

    // Only run on server-side
    if (typeof window !== 'undefined') {
      return
    }

    const otlpEndpoint = config.otlpEndpoint || `${config.url.replace(/\/$/, '')}/v1/logs`
    const serviceName = config.serviceName || 'mdm-platform'
    const environment = config.environment || 'production'
    const timestamp = logData.timestamp || Date.now()

    const resourceAttributes = {
      'service.name': serviceName,
      'service.environment': environment,
      'deployment.environment': environment
    }

    const severityNumber = {
      'TRACE': 1,
      'DEBUG': 5,
      'INFO': 9,
      'WARN': 13,
      'ERROR': 17,
      'FATAL': 21
    }[logData.severity] || 9

    const logRecord = {
      timeUnixNano: timestamp * 1000000,
      severityNumber,
      severityText: logData.severity,
      body: {
        stringValue: logData.message
      },
      attributes: Object.entries({
        ...logData.attributes,
        ...resourceAttributes
      }).map(([key, value]) => ({
        key,
        value: {
          stringValue: typeof value === 'string' ? value : JSON.stringify(value)
        }
      }))
    }

    const payload = {
      resourceLogs: [{
        resource: {
          attributes: Object.entries(resourceAttributes).map(([key, value]) => ({
            key,
            value: {
              stringValue: String(value)
            }
          }))
        },
        scopeLogs: [{
          logRecords: [logRecord]
        }]
      }]
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    // Send to SigNoz (fire and forget)
    fetch(otlpEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }).catch((error) => {
      console.error('Failed to send log to SigNoz:', error)
    })
  } catch (error) {
    console.error('Error sending log to SigNoz:', error)
  }
}

/**
 * Clear cached configuration (useful after config updates)
 */
export function clearSigNozCache(): void {
  cachedConfig = null
  configCacheTime = 0
}

