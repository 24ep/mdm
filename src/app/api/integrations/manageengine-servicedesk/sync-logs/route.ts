import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

// Get sync activity logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const space_id = searchParams.get('space_id')
    const ticket_id = searchParams.get('ticket_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!space_id) {
      return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let queryStr = `
      SELECT 
        id, ticket_id, sync_type, event_type, success, details, error_message, created_at
      FROM servicedesk_sync_logs
      WHERE space_id = $1::uuid
    `
    const params: any[] = [space_id]
    let paramIndex = 2

    if (ticket_id) {
      queryStr += ` AND ticket_id = $${paramIndex}::uuid`
      params.push(ticket_id)
      paramIndex++
    }

    if (start_date) {
      queryStr += ` AND created_at >= $${paramIndex}`
      params.push(start_date)
      paramIndex++
    }

    if (end_date) {
      queryStr += ` AND created_at <= $${paramIndex}`
      params.push(end_date)
      paramIndex++
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const { rows } = await query(queryStr, params)

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM servicedesk_sync_logs WHERE space_id = $1::uuid`
    const countParams: any[] = [space_id]
    let countParamIndex = 2

    if (ticket_id) {
      countQuery += ` AND ticket_id = $${countParamIndex}::uuid`
      countParams.push(ticket_id)
      countParamIndex++
    }

    if (start_date) {
      countQuery += ` AND created_at >= $${countParamIndex}`
      countParams.push(start_date)
      countParamIndex++
    }

    if (end_date) {
      countQuery += ` AND created_at <= $${countParamIndex}`
      countParams.push(end_date)
      countParamIndex++
    }

    const { rows: countRows } = await query(countQuery, countParams)
    const total = parseInt(countRows[0]?.total || '0')

    // Get statistics
    const { rows: statsRows } = await query(
      `SELECT 
        COUNT(*) as total_syncs,
        COUNT(*) FILTER (WHERE success = true) as successful_syncs,
        COUNT(*) FILTER (WHERE success = false) as failed_syncs,
        COUNT(DISTINCT ticket_id) as unique_tickets
      FROM servicedesk_sync_logs
      WHERE space_id = $1::uuid
        ${ticket_id ? `AND ticket_id = $2::uuid` : ''}
        ${start_date ? `AND created_at >= $${ticket_id ? '3' : '2'}` : ''}
        ${end_date ? `AND created_at <= $${ticket_id && start_date ? '4' : ticket_id || start_date ? '3' : '2'}` : ''}`,
      [space_id, ...(ticket_id ? [ticket_id] : []), ...(start_date ? [start_date] : []), ...(end_date ? [end_date] : [])]
    )

    return NextResponse.json({
      logs: rows,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      },
      statistics: statsRows[0] || {
        total_syncs: 0,
        successful_syncs: 0,
        failed_syncs: 0,
        unique_tickets: 0
      }
    })
  } catch (error) {
    console.error('GET /integrations/manageengine-servicedesk/sync-logs error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

