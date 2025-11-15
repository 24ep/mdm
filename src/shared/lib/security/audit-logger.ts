import { query } from '@/lib/db'

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
    await query(
      `INSERT INTO audit_logs (
        user_id, action, resource, resource_id, space_id, details, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
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

