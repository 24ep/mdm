import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')
    const dataModelId = searchParams.get('data_model_id')

    if (!spaceId) return NextResponse.json({ error: 'space_id is required' }, { status: 400 })

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let sqlQuery = `
      SELECT 
        ds.*,
        ec.name as connection_name,
        ec.connection_type,
        dm.display_name as data_model_name
      FROM public.data_sync_schedules ds
      LEFT JOIN public.external_connections ec ON ec.id = ds.external_connection_id
      LEFT JOIN public.data_models dm ON dm.id = ds.data_model_id
      WHERE ds.space_id = $1 AND ds.deleted_at IS NULL
    `
    const params: any[] = [spaceId]

    if (dataModelId) {
      sqlQuery += ' AND ds.data_model_id = $2'
      params.push(dataModelId)
    }

    sqlQuery += ' ORDER BY ds.created_at DESC'

    const { rows } = await query(sqlQuery, params)
    return NextResponse.json({ schedules: rows })
  } catch (error) {
    console.error('GET /data-sync-schedules error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      space_id,
      data_model_id,
      external_connection_id,
      name,
      description,
      schedule_type = 'MANUAL',
      schedule_config,
      sync_strategy = 'FULL_REFRESH',
      incremental_key,
      incremental_timestamp_column,
      clear_existing_data = true,
      source_query,
      data_mapping,
      max_records_per_sync,
      rate_limit_per_minute,
      is_active = true,
      notify_on_success = false,
      notify_on_failure = true,
      notification_emails = []
    } = body

    if (!space_id || !data_model_id || !external_connection_id || !name) {
      return NextResponse.json({ 
        error: 'space_id, data_model_id, external_connection_id, and name are required' 
      }, { status: 400 })
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2',
      [space_id, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Calculate next run time
    const nextRunAt = calculateNextRunTime(schedule_type, schedule_config)

    const { rows } = await query(
      `INSERT INTO public.data_sync_schedules
        (space_id, data_model_id, external_connection_id, name, description,
         schedule_type, schedule_config, sync_strategy, incremental_key,
         incremental_timestamp_column, clear_existing_data, source_query,
         data_mapping, max_records_per_sync, rate_limit_per_minute,
         is_active, notify_on_success, notify_on_failure, notification_emails,
         next_run_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        space_id, data_model_id, external_connection_id, name, description,
        schedule_type, schedule_config ? JSON.stringify(schedule_config) : null, sync_strategy,
        incremental_key || null, incremental_timestamp_column || null,
        clear_existing_data, source_query || null,
        data_mapping ? JSON.stringify(data_mapping) : null,
        max_records_per_sync || null, rate_limit_per_minute || null,
        is_active, notify_on_success, notify_on_failure, notification_emails || [],
        nextRunAt, session.user.id
      ]
    )

    return NextResponse.json({ schedule: rows[0] }, { status: 201 })
  } catch (error) {
    console.error('POST /data-sync-schedules error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateNextRunTime(scheduleType: string, scheduleConfig: any): Date | null {
  if (scheduleType === 'MANUAL') return null

  const now = new Date()
  const next = new Date(now)

  switch (scheduleType) {
    case 'HOURLY':
      next.setHours(next.getHours() + 1, 0, 0, 0)
      break
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      next.setHours(scheduleConfig?.hour || 0, scheduleConfig?.minute || 0, 0, 0)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      next.setHours(scheduleConfig?.hour || 0, scheduleConfig?.minute || 0, 0, 0)
      break
    default:
      return null
  }

  return next
}

