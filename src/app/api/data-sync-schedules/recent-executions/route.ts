import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const searchParams = request.nextUrl.searchParams
    const spaceId = searchParams.get('space_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!spaceId) {
      return NextResponse.json({ error: 'space_id required' }, { status: 400 })
    }

    const { rows: executions } = await query(
      `SELECT 
         dse.id,
         ds.name as schedule_name,
         dse.status,
         dse.started_at,
         dse.completed_at,
         dse.records_fetched,
         dse.records_inserted,
         dse.records_updated,
         dse.records_failed,
         dse.duration_ms,
         dse.error_message
       FROM public.data_sync_executions dse
       JOIN public.data_sync_schedules ds ON ds.id = dse.sync_schedule_id
       WHERE ds.space_id = $1::uuid AND ds.deleted_at IS NULL
       ORDER BY dse.started_at DESC
       LIMIT $2`,
      [spaceId, limit]
    )

    return NextResponse.json({ executions })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch executions', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/data-sync-schedules/recent-executions')