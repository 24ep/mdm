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

    const insertAuditLog = async (userIdToUse: string | null) => {
      // If we have a userId, we want to ensure it exists to avoid FK violations (which throw errors and spam logs).
      // We use INSERT ... SELECT ... WHERE EXISTS pattern for checking user existence in the same query.
      if (userIdToUse) {
        const result = await query(
          `INSERT INTO audit_logs (
            id, user_id, action, entity_type, entity_id, new_value, ip_address, user_agent, created_at
          )
          SELECT gen_random_uuid(), $1::uuid, $2, $3, $4::uuid, $5, $6, $7, NOW()
          WHERE EXISTS (SELECT 1 FROM users WHERE id = $1::uuid)
          RETURNING id, created_at as timestamp`,
          [
            userIdToUse,
            entry.action,
            entry.resource,
            entityId,
            Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
            entry.ipAddress || null,
            entry.userAgent || null,
          ]
        )
        return result
      } else {
        // If userIdToUse is null, just insert directly (no FK check needed for null)
        return await query(
          `INSERT INTO audit_logs (
            id, user_id, action, entity_type, entity_id, new_value, ip_address, user_agent, created_at
          ) VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4::uuid, $5, $6, $7, NOW())
          RETURNING id, created_at as timestamp`,
          [
            null,
            entry.action,
            entry.resource,
            entityId,
            Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
            entry.ipAddress || null,
            entry.userAgent || null,
          ]
        )
      }
    }

    let result
    try {
      result = await insertAuditLog(entry.userId)

      // If we tried to insert with a userId but got no rows back, it means the user doesn't exist.
      // Retry with null userId.
      if (entry.userId && (!result.rows || result.rows.length === 0)) {
        result = await insertAuditLog(null)
      }
    } catch (error: any) {
      // Still catch unexpected errors, or if the retry fails
      console.error('Failed to log audit event:', error)
      return
    }

    // Send to Elasticsearch (fire and forget)
    if (result && result.rows && result.rows.length > 0) {
      getElasticsearchLogger().then(sendLog => {
        sendLog('security', {
          id: result.rows[0].id,
          userId: entry.userId, // Keep original ID in ES for tracing attempt
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          spaceId: entry.spaceId,
          details: {
            ...entry.details,
            originalUserId: entry.userId // Add note that this was the attempted ID
          },
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          createdAt: result.rows[0].timestamp
        }).catch(() => { }) // Silently fail
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

