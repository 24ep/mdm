import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, resource_type, resource_id, details } = body

    if (!action || !resource_type) {
      return NextResponse.json({ error: 'Action and resource_type are required' }, { status: 400 })
    }

    const sql = `
      INSERT INTO report_audit_logs (
        user_id, action, resource_type, resource_id, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const result = await query(sql, [
      session.user.id,
      action,
      resource_type,
      resource_id || null,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent
    ])

    return NextResponse.json({ log: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resource_type')
    const resourceId = searchParams.get('resource_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const params: any[] = [session.user.id, limit, offset]
    const filters: string[] = []

    if (resourceType) {
      params.push(resourceType)
      filters.push('resource_type = $' + params.length)
    }

    if (resourceId) {
      params.push(resourceId)
      filters.push('resource_id = $' + params.length)
    }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

    const sql = `
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM report_audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `

    const result = await query(sql, params)

    return NextResponse.json({ logs: result.rows || [] })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

