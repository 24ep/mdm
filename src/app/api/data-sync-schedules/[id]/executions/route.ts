import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get existing schedule to check access
    const { rows: existing } = await query(
      'SELECT space_id FROM public.data_sync_schedules WHERE id = $1 AND deleted_at IS NULL',
      [params.id]
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Sync schedule not found' }, { status: 404 })
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2',
      [existing[0].space_id, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Get executions
    const { rows } = await query(
      `SELECT * FROM public.data_sync_executions
       WHERE sync_schedule_id = $1
       ORDER BY started_at DESC
       LIMIT $2 OFFSET $3`,
      [params.id, limit, offset]
    )

    // Get total count
    const { rows: countRows } = await query(
      `SELECT COUNT(*) as total FROM public.data_sync_executions
       WHERE sync_schedule_id = $1`,
      [params.id]
    )

    return NextResponse.json({
      executions: rows,
      total: parseInt(countRows[0].total),
      limit,
      offset
    })
  } catch (error) {
    console.error('GET /data-sync-schedules/[id]/executions error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

