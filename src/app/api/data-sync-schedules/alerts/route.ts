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
    const acknowledged = searchParams.get('acknowledged') === 'true'

    if (!spaceId) {
      return NextResponse.json({ error: 'space_id required' }, { status: 400 })
    }

    let whereClause = `
      WHERE dah.sync_schedule_id IN (
        SELECT id FROM public.data_sync_schedules WHERE space_id = $1::uuid AND deleted_at IS NULL
      )
    `
    const params: any[] = [spaceId]

    if (acknowledged !== undefined) {
      whereClause += ` AND dah.acknowledged = $2`
      params.push(acknowledged)
    }

    const { rows: alerts } = await query(
      `SELECT 
         dah.id,
         dah.sync_schedule_id,
         ds.name as schedule_name,
         dah.alert_type,
         dah.severity,
         dah.message,
         dah.created_at,
         dah.acknowledged
       FROM public.data_sync_alert_history dah
       JOIN public.data_sync_schedules ds ON ds.id = dah.sync_schedule_id
       ${whereClause}
       ORDER BY dah.created_at DESC
       LIMIT 50`,
      params
    )

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('GET /data-sync-schedules/alerts error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

