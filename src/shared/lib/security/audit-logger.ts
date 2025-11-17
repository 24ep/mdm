import { query } from '@/lib/db'
import { sendLogToElasticsearch } from '@/lib/elasticsearch-client'

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
    const result = await query(
      `INSERT INTO audit_logs (
        user_id, action, resource, resource_id, space_id, details, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, created_at`,
      [
        entry.userId,
        entry.action,
        entry.resource,
        entry.resourceId || null,
        entry.spaceId || null,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
      ]
    )

    // Send to Elasticsearch (fire and forget)
    if (result.rows && result.rows.length > 0) {
      sendLogToElasticsearch('security', {
        id: result.rows[0].id,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        spaceId: entry.spaceId,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        createdAt: result.rows[0].created_at
      }).catch(() => {}) // Silently fail
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

