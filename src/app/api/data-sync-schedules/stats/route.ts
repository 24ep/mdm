import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const spaceId = searchParams.get('space_id')

    if (!spaceId) {
      return NextResponse.json({ error: 'space_id required' }, { status: 400 })
    }

    // Get total and active schedules
    const { rows: scheduleStats } = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE is_active = true) as active,
         COUNT(*) FILTER (WHERE last_run_status = 'RUNNING') as running
       FROM public.data_sync_schedules
       WHERE space_id = $1::uuid AND deleted_at IS NULL`,
      [spaceId]
    )

    // Get today's executions
    const { rows: todayStats } = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
         COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
         COALESCE(SUM(records_fetched), 0) as total_records,
         COALESCE(AVG(duration_ms), 0) as avg_duration
       FROM public.data_sync_executions
       WHERE sync_schedule_id IN (
         SELECT id FROM public.data_sync_schedules WHERE space_id = $1::uuid AND deleted_at IS NULL
       )
       AND started_at >= CURRENT_DATE`,
      [spaceId]
    )

    const stats = {
      total_schedules: parseInt(scheduleStats[0]?.total || '0'),
      active_schedules: parseInt(scheduleStats[0]?.active || '0'),
      running_now: parseInt(scheduleStats[0]?.running || '0'),
      completed_today: parseInt(todayStats[0]?.completed || '0'),
      failed_today: parseInt(todayStats[0]?.failed || '0'),
      total_records_today: parseInt(todayStats[0]?.total_records || '0'),
      avg_duration_ms: parseFloat(todayStats[0]?.avg_duration || '0')
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('GET /data-sync-schedules/stats error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

