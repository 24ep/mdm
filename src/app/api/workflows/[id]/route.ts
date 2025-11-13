import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workflowId } = await params

    // Get workflow details
    const { rows: workflowRows } = await query(
      `SELECT 
        w.*,
        dm.name as data_model_name,
        dm.display_name as data_model_display_name,
        u.name as created_by_name
       FROM public.workflows w
       LEFT JOIN public.data_models dm ON w.data_model_id = dm.id
       LEFT JOIN public.users u ON w.created_by = u.id
       WHERE w.id = $1::uuid`,
      [workflowId]
    )

    if (workflowRows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const workflow = workflowRows[0]

    // Get conditions
    const { rows: conditions } = await query(
      `SELECT 
        wc.*,
        dma.name as attribute_name,
        dma.display_name as attribute_display_name,
        dma.type as attribute_type
       FROM public.workflow_conditions wc
       JOIN public.data_model_attributes dma ON wc.attribute_id = dma.id
       WHERE wc.workflow_id = $1::uuid
       ORDER BY wc.condition_order`,
      [workflowId]
    )

    // Get actions
    const { rows: actions } = await query(
      `SELECT 
        wa.*,
        dma.name as target_attribute_name,
        dma.display_name as target_attribute_display_name,
        dma.type as target_attribute_type,
        source_dma.name as source_attribute_name,
        source_dma.display_name as source_attribute_display_name
       FROM public.workflow_actions wa
       JOIN public.data_model_attributes dma ON wa.target_attribute_id = dma.id
       LEFT JOIN public.data_model_attributes source_dma ON wa.source_attribute_id = source_dma.id
       WHERE wa.workflow_id = $1::uuid
       ORDER BY wa.action_order`,
      [workflowId]
    )

    // Get schedule
    const { rows: scheduleRows } = await query(
      `SELECT * FROM public.workflow_schedules 
       WHERE workflow_id = $1::uuid AND is_active = true`,
      [workflowId]
    )

    // Get recent executions
    const { rows: executions } = await query(
      `SELECT 
        id, execution_type, status, started_at, completed_at,
        records_processed, records_updated, error_message
       FROM public.workflow_executions 
       WHERE workflow_id = $1::uuid
       ORDER BY started_at DESC
       LIMIT 10`,
      [workflowId]
    )

    return NextResponse.json({
      workflow,
      conditions,
      actions,
      schedule: scheduleRows[0] || null,
      recent_executions: executions
    })

  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workflowId } = await params
    const body = await request.json()
    const {
      name,
      description,
      trigger_type,
      status,
      conditions = [],
      actions = [],
      schedule = null
    } = body

    // Update workflow
    const { rows: workflowRows } = await query(
      `UPDATE public.workflows 
       SET name = $1, description = $2, trigger_type = $3, status = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, trigger_type, status, workflowId]
    )

    if (workflowRows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const workflow = workflowRows[0]

    // Delete existing conditions and actions
    await query('DELETE FROM public.workflow_conditions WHERE workflow_id = $1::uuid', [workflowId])
    await query('DELETE FROM public.workflow_actions WHERE workflow_id = $1::uuid', [workflowId])
    await query('DELETE FROM public.workflow_schedules WHERE workflow_id = $1::uuid', [workflowId])

    // Create new conditions
    if (conditions.length > 0) {
      for (const condition of conditions) {
        await query(
          `INSERT INTO public.workflow_conditions 
           (workflow_id, attribute_id, operator, value, logical_operator, condition_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflowId,
            condition.attribute_id,
            condition.operator,
            condition.value,
            condition.logical_operator || 'AND',
            condition.condition_order || 0
          ]
        )
      }
    }

    // Create new actions
    if (actions.length > 0) {
      for (const action of actions) {
        await query(
          `INSERT INTO public.workflow_actions 
           (workflow_id, target_attribute_id, action_type, new_value, calculation_formula, 
            source_attribute_id, action_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            workflowId,
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

    // Create new schedule if provided (for SCHEDULED workflows) or integration config (for EVENT_BASED)
    if (schedule) {
      if (trigger_type === 'SCHEDULED') {
        // Scheduled workflow with time-based schedule
        await query(
          `INSERT INTO public.workflow_schedules 
           (workflow_id, schedule_type, schedule_config, start_date, end_date, timezone)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflowId,
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
            workflowId,
            'CUSTOM_CRON', // Use as placeholder for event-based
            JSON.stringify(schedule.schedule_config || {}),
            true,
            schedule.schedule_config?.trigger_on_sync_schedule_id || null
          ]
        )
      }
    }

    return NextResponse.json({ workflow })

  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workflowId } = await params

    // Soft delete workflow
    const { rows } = await query(
      `UPDATE public.workflows 
       SET is_active = false, deleted_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [workflowId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Workflow deleted successfully' })

  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
