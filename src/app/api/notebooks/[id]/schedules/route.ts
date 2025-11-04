import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

// GET: Get all schedules for a notebook
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notebookId = decodeURIComponent(params.id)

    const { rows } = await query(
      `SELECT 
        id,
        notebook_id,
        space_id,
        name,
        description,
        schedule_type,
        schedule_config,
        timezone,
        enabled,
        start_date,
        end_date,
        max_executions,
        execution_count,
        status,
        last_run_at,
        last_run_status,
        last_run_error,
        next_run_at,
        parameters,
        execute_all_cells,
        cell_ids,
        notifications,
        created_by,
        created_at,
        updated_at
      FROM public.notebook_schedules
      WHERE notebook_id = $1::uuid
      ORDER BY created_at DESC`,
      [notebookId]
    )

    // Get creator names
    const schedulesWithCreators = await Promise.all(
      rows.map(async (schedule) => {
        if (schedule.created_by) {
          const { rows: userRows } = await query(
            'SELECT name, email FROM public.users WHERE id = $1::uuid',
            [schedule.created_by]
          )
          if (userRows.length > 0) {
            return {
              ...schedule,
              created_by_name: userRows[0].name || 'Unknown',
              created_by_email: userRows[0].email || ''
            }
          }
        }
        return {
          ...schedule,
          created_by_name: 'Unknown',
          created_by_email: ''
        }
      })
    )

    return NextResponse.json({
      success: true,
      schedules: schedulesWithCreators
    })
  } catch (error: any) {
    console.error('Error fetching notebook schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notebook schedules' },
      { status: 500 }
    )
  }
}

// POST: Create a new schedule
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notebookId = decodeURIComponent(params.id)
    const body = await request.json()
    const {
      name,
      description,
      schedule_type = 'daily',
      schedule_config,
      timezone = 'UTC',
      enabled = true,
      start_date,
      end_date,
      max_executions,
      parameters,
      execute_all_cells = true,
      cell_ids,
      notifications,
      space_id
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Schedule name is required' },
        { status: 400 }
      )
    }

    // Calculate next run time
    const { rows: nextRunRows } = await query(
      `SELECT calculate_notebook_next_run($1, $2, $3) as next_run`,
      [schedule_type, JSON.stringify(schedule_config || {}), timezone]
    )
    const nextRunAt = nextRunRows[0]?.next_run || null

    // Insert schedule
    const { rows } = await query(
      `INSERT INTO public.notebook_schedules 
       (notebook_id, space_id, name, description, schedule_type, schedule_config,
        timezone, enabled, start_date, end_date, max_executions, parameters,
        execute_all_cells, cell_ids, notifications, created_by, next_run_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        notebookId,
        space_id || null,
        name,
        description || null,
        schedule_type,
        JSON.stringify(schedule_config || {}),
        timezone,
        enabled,
        start_date || null,
        end_date || null,
        max_executions || null,
        JSON.stringify(parameters || {}),
        execute_all_cells,
        cell_ids || [],
        JSON.stringify(notifications || { enabled: false }),
        session.user.id,
        nextRunAt
      ]
    )

    return NextResponse.json({
      success: true,
      schedule: rows[0]
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating notebook schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule', details: error.message },
      { status: 500 }
    )
  }
}

