import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const offset = (page - 1) * limit

    // Check if user has access to this space
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build query conditions
    let whereConditions = ['al.space_id = $1::uuid']
    let queryParams = [spaceId]
    let paramIndex = 2

    if (action) {
      whereConditions.push(`al.action = $${paramIndex}`)
      queryParams.push(action)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get audit log entries
    const auditLogs = await query(`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset])

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `, queryParams)

    const total = parseInt(countResult.rows[0].total)
    const hasMore = offset + limit < total

    return NextResponse.json({
      auditLogs: auditLogs.rows,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    })
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const body = await request.json()
    const { action, description, metadata, ip_address, user_agent } = body

    if (!action || !description) {
      return NextResponse.json({ error: 'Action and description are required' }, { status: 400 })
    }

    // Log the activity
    const result = await query(`
      INSERT INTO audit_logs (
        space_id, 
        user_id, 
        action, 
        description, 
        metadata, 
        ip_address, 
        user_agent, 
        created_at
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      spaceId,
      session.user.id,
      action,
      description,
      JSON.stringify(metadata || {}),
      ip_address || null,
      user_agent || null
    ])

    return NextResponse.json({
      success: true,
      logId: result.rows[0].id
    })
  } catch (error) {
    console.error('Error creating audit log entry:', error)
    return NextResponse.json(
      { error: 'Failed to create audit log entry' },
      { status: 500 }
    )
  }
}
