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

    const { searchParams } = new URL(request.url)
    const dataModelId = searchParams.get('data_model_id')
    const status = searchParams.get('status')
    const triggerType = searchParams.get('trigger_type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const offset = (page - 1) * limit

    // Build query with filters
    let whereConditions = ['w.is_active = true']
    let params: any[] = []
    let paramIndex = 1

    if (dataModelId) {
      whereConditions.push(`w.data_model_id = $${paramIndex}`)
      params.push(dataModelId)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`w.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (triggerType) {
      whereConditions.push(`w.trigger_type = $${paramIndex}`)
      params.push(triggerType)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get workflows with related data
    const workflowsQuery = `
      SELECT 
        w.id,
        w.name,
        w.description,
        w.trigger_type,
        w.status,
        w.is_active,
        w.created_at,
        w.updated_at,
        dm.name as data_model_name,
        dm.display_name as data_model_display_name,
        u.name as created_by_name,
        COUNT(we.id) as execution_count,
        COUNT(CASE WHEN we.status = 'COMPLETED' THEN 1 END) as successful_executions,
        COUNT(CASE WHEN we.status = 'FAILED' THEN 1 END) as failed_executions
      FROM public.workflows w
      LEFT JOIN public.data_models dm ON w.data_model_id = dm.id
      LEFT JOIN public.users u ON w.created_by = u.id
      LEFT JOIN public.workflow_executions we ON w.id = we.workflow_id
      WHERE ${whereClause}
      GROUP BY w.id, w.name, w.description, w.trigger_type, w.status, w.is_active, 
               w.created_at, w.updated_at, dm.name, dm.display_name, u.name
      ORDER BY w.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const { rows: workflows } = await query(workflowsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM public.workflows w
      WHERE ${whereClause}
    `
    const { rows: countRows } = await query(countQuery, params.slice(0, -2))
    const total = parseInt(countRows[0].total)

    return NextResponse.json({
      workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      data_model_id,
      trigger_type,
      status = 'ACTIVE',
      conditions = [],
      actions = [],
      schedule = null
    } = body

    if (!name || !data_model_id || !trigger_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, data_model_id, trigger_type' 
      }, { status: 400 })
    }

    // Validate trigger type
    const validTriggerTypes = ['SCHEDULED', 'EVENT_BASED', 'MANUAL']
    if (!validTriggerTypes.includes(trigger_type)) {
      return NextResponse.json({ 
        error: 'Invalid trigger_type. Must be one of: ' + validTriggerTypes.join(', ') 
      }, { status: 400 })
    }

    // Create workflow
    const { rows: workflowRows } = await query(
      `INSERT INTO public.workflows (name, description, data_model_id, trigger_type, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, data_model_id, trigger_type, status, session.user.id]
    )
    const workflow = workflowRows[0]

    // Create conditions
    if (conditions.length > 0) {
      for (const condition of conditions) {
        await query(
          `INSERT INTO public.workflow_conditions 
           (workflow_id, attribute_id, operator, value, logical_operator, condition_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflow.id,
            condition.attribute_id,
            condition.operator,
            condition.value,
            condition.logical_operator || 'AND',
            condition.condition_order || 0
          ]
        )
      }
    }

    // Create actions
    if (actions.length > 0) {
      for (const action of actions) {
        await query(
          `INSERT INTO public.workflow_actions 
           (workflow_id, target_attribute_id, action_type, new_value, calculation_formula, 
            source_attribute_id, action_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            workflow.id,
            action.target_attribute_id,
            action.action_type,
            action.new_value,
            action.calculation_formula,
            action.source_attribute_id,
            action.action_order || 0
          ]
        )
      }
    }

    // Create schedule if provided (for SCHEDULED workflows) or integration config (for EVENT_BASED)
    if (schedule) {
      if (trigger_type === 'SCHEDULED') {
        // Scheduled workflow with time-based schedule
        await query(
          `INSERT INTO public.workflow_schedules 
           (workflow_id, schedule_type, schedule_config, start_date, end_date, timezone)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflow.id,
            schedule.schedule_type,
            JSON.stringify(schedule.schedule_config || {}),
            schedule.start_date || null,
            schedule.end_date || null,
            schedule.timezone || 'UTC'
          ]
        )
      } else if (trigger_type === 'EVENT_BASED' && schedule.schedule_config?.trigger_on_sync) {
        // Event-based workflow triggered by data syncs
        await query(
          `INSERT INTO public.workflow_schedules 
           (workflow_id, schedule_type, schedule_config, trigger_on_sync, trigger_on_sync_schedule_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            workflow.id,
            'CUSTOM_CRON', // Use as placeholder for event-based
            JSON.stringify(schedule.schedule_config || {}),
            true,
            schedule.schedule_config?.trigger_on_sync_schedule_id || null
          ]
        )
      }
    }

    return NextResponse.json({ workflow }, { status: 201 })

  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
