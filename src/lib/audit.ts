import { query } from './db'

export interface AuditLogData {
  action: string
  entityType: string
  entityId: string
  oldValue?: any
  newValue?: any
  userId: string
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const insertQuery = `
      INSERT INTO audit_logs (action, entity_type, entity_id, old_value, new_value, user_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `

    const result = await query(insertQuery, [
      data.action,
      data.entityType,
      data.entityId,
      data.oldValue ? JSON.stringify(data.oldValue) : null,
      data.newValue ? JSON.stringify(data.newValue) : null,
      data.userId,
      data.ipAddress || null,
      data.userAgent || null
    ])

    return result.rows[0]
  } catch (error) {
    console.error('Error creating audit log:', error)
    throw error
  }
}

export async function getAuditLogs(filters: {
  entityType?: string
  action?: string
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  try {
    const {
      entityType,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters

    const offset = (page - 1) * limit

    let whereConditions = ['1=1']
    let queryParams: any[] = []
    let paramIndex = 1

    if (entityType) {
      whereConditions.push(`entity_type = $${paramIndex}`)
      queryParams.push(entityType)
      paramIndex++
    }

    if (action) {
      whereConditions.push(`action = $${paramIndex}`)
      queryParams.push(action)
      paramIndex++
    }

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`)
      queryParams.push(userId)
      paramIndex++
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`)
      queryParams.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`)
      queryParams.push(endDate)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
    `
    const countResult = await query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    // Get audit logs with user information
    const auditLogsQuery = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_value,
        al.new_value,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const { rows } = await query(auditLogsQuery, queryParams)

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    throw error
  }
}
