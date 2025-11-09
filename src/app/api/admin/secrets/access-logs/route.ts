import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/admin/secrets/access-logs
 * Get secret access audit logs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId')
    const secretPath = searchParams.get('secretPath')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const offset = (page - 1) * limit

    // Build WHERE clause
    const conditions: string[] = ["resource_type = 'secret'"]
    const params: any[] = []
    let paramIndex = 1

    if (userId) {
      conditions.push(`user_id = $${paramIndex}::uuid`)
      params.push(userId)
      paramIndex++
    }

    if (secretPath) {
      conditions.push(`resource_name LIKE $${paramIndex}`)
      params.push(`%${secretPath}%`)
      paramIndex++
    }

    if (action) {
      conditions.push(`action = $${paramIndex}`)
      params.push(action)
      paramIndex++
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex}::timestamptz`)
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex}::timestamptz`)
      params.push(endDate)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.audit_logs ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    // Get logs
    params.push(limit, offset)
    const logsResult = await query(
      `SELECT 
        id, user_id, user_name, user_email, action, resource_type, resource_id,
        resource_name, ip_address, user_agent, metadata, success, timestamp
       FROM public.audit_logs
       ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )

    const logs = logsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      secretPath: row.resource_name, // Alias for clarity
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      success: row.success,
      timestamp: row.timestamp,
    }))

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching secret access logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch secret access logs', details: error.message },
      { status: 500 }
    )
  }
}

