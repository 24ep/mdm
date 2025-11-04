import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { DataSyncExecutor } from '@/lib/data-sync-executor'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get existing schedule to check access
    const { rows: existing } = await query(
      'SELECT space_id FROM public.data_sync_schedules WHERE id = $1::uuid AND deleted_at IS NULL',
      [params.id]
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Sync schedule not found' }, { status: 404 })
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [existing[0].space_id, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Check if sync is already running
    const { rows: running } = await query(
      `SELECT id FROM public.data_sync_schedules 
       WHERE id = $1::uuid AND last_run_status = 'RUNNING'`,
      [params.id]
    )

    if (running.length > 0) {
      return NextResponse.json({ 
        error: 'Sync is already running',
        status: 'RUNNING'
      }, { status: 409 })
    }

    // Execute sync
    const executor = new DataSyncExecutor()
    const result = await executor.executeSync(params.id)

    return NextResponse.json({
      success: result.success,
      result: {
        records_fetched: result.records_fetched,
        records_processed: result.records_processed,
        records_inserted: result.records_inserted,
        records_updated: result.records_updated,
        records_deleted: result.records_deleted,
        records_failed: result.records_failed,
        duration_ms: result.duration_ms
      },
      error: result.error
    })
  } catch (error: any) {
    console.error('POST /data-sync-schedules/[id]/execute error', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

