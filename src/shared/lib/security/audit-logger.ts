import { query } from '@/lib/db'
import { randomUUID } from 'crypto'

// Dynamic import for Elasticsearch (server-side only)
const getElasticsearchLogger = async () => {
  if (typeof window === 'undefined') {
    try {
      const { sendLogToElasticsearch } = await import('@/lib/elasticsearch-client')
      return sendLogToElasticsearch
    } catch (error) {
      return () => Promise.resolve()
    }
  }
  return () => Promise.resolve()
}

export interface AuditLogEntry {
  userId: string
  action: string
  resource: string
  resourceId?: string
  spaceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Map to Prisma schema: entity_type, entity_id, new_value (for metadata/details)
    // Note: space_id is not in the schema, so we'll include it in the metadata
    // entity_id must be a UUID, so if resourceId is not a UUID, store it in metadata
    const isUUID = (str: string | null | undefined): boolean => {
      if (!str) return false
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(str)
    }
    
    const metadata = {
      ...(entry.details || {}),
      ...(entry.spaceId ? { spaceId: entry.spaceId } : {}),
      // If resourceId is not a UUID, store it in metadata
      ...(entry.resourceId && !isUUID(entry.resourceId) ? { originalResourceId: entry.resourceId } : {}),
    }
    
    // Use resourceId if it's a valid UUID, otherwise generate one
    // entity_id is required, so we always need a UUID
    const entityId = entry.resourceId && isUUID(entry.resourceId) 
      ? entry.resourceId 
      : randomUUID()
    
    const result = await query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, new_value, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, created_at as timestamp`,
      [
        entry.userId,
        entry.action,
        entry.resource,
        entityId,
        Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
      ]
    )

    // Send to Elasticsearch (fire and forget)
    if (result.rows && result.rows.length > 0) {
      getElasticsearchLogger().then(sendLog => {
        sendLog('security', {
          id: result.rows[0].id,
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          spaceId: entry.spaceId,
          details: entry.details,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          createdAt: result.rows[0].timestamp
        }).catch(() => {}) // Silently fail
      })
    }
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Log API request
 */
export async function logAPIRequest(
  userId: string,
  method: string,
  path: string,
  statusCode: number,
  spaceId?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'api_request',
    resource: 'api',
    resourceId: `${method} ${path}`,
    spaceId,
    details: {
      method,
      path,
      statusCode,
    },
  })
}

