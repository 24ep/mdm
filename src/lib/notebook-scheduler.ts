/**
 * Notebook Scheduler
 * Handles execution of scheduled notebooks
 */

import { query } from '@/lib/db'
import { notebookEngine } from '@/lib/notebook-engine'

export interface NotebookScheduleExecutionResult {
  success: boolean
  execution_id?: string
  error?: string
  cells_executed?: number
  cells_succeeded?: number
  cells_failed?: number
  duration_ms?: number
}

/**
 * Execute a notebook schedule
 */
export async function executeNotebookSchedule(
  scheduleId: string
): Promise<NotebookScheduleExecutionResult> {
  const startTime = Date.now()

  try {
    // Get schedule details
    const { rows: scheduleRows } = await query(
      `SELECT 
        ns.*,
        nv.notebook_data
      FROM public.notebook_schedules ns
      LEFT JOIN public.notebook_versions nv ON 
        nv.notebook_id = ns.notebook_id AND nv.is_current = true
      WHERE ns.id = $1`,
      [scheduleId]
    )

    if (scheduleRows.length === 0) {
      throw new Error('Schedule not found')
    }

    const schedule = scheduleRows[0]

    if (!schedule.notebook_data) {
      throw new Error('Notebook not found or no current version')
    }

    const notebookData = typeof schedule.notebook_data === 'string'
      ? JSON.parse(schedule.notebook_data)
      : schedule.notebook_data

    // Create execution record
    const { rows: execRows } = await query(
      `INSERT INTO public.notebook_schedule_executions
       (schedule_id, notebook_id, status, triggered_by)
       VALUES ($1, $2, 'running', 'schedule')
       RETURNING id`,
      [scheduleId, schedule.notebook_id]
    )

    const executionId = execRows[0].id

    let cellsExecuted = 0
    let cellsSucceeded = 0
    let cellsFailed = 0
    const executionLog: any[] = []
    const outputs: any[] = []

    try {
      // Execute notebook cells
      if (schedule.execute_all_cells) {
        // Execute all code cells
        const codeCells = (notebookData.cells || []).filter(
          (cell: any) => cell.type === 'code' || cell.type === 'sql'
        )

        for (const cell of codeCells) {
          cellsExecuted++
          try {
            if (cell.type === 'sql') {
              // Execute SQL cell via API
              const sqlResponse = await fetch('/api/notebook/execute-sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: cell.sqlQuery || cell.content,
                  connection: cell.sqlConnection || 'default',
                  spaceId: schedule.space_id
                })
              })

              if (!sqlResponse.ok) {
                throw new Error('SQL execution failed')
              }

              const sqlResult = await sqlResponse.json()
              outputs.push({
                cell_id: cell.id,
                type: 'sql',
                success: true,
                output: sqlResult
              })
              cellsSucceeded++
            } else {
              // Execute code cell using notebook engine
              // Note: This requires kernel/engine implementation
              executionLog.push({
                step: 'execute_cell',
                cell_id: cell.id,
                status: 'skipped',
                message: 'Code execution requires kernel implementation'
              })
            }
          } catch (error: any) {
            cellsFailed++
            executionLog.push({
              step: 'execute_cell',
              cell_id: cell.id,
              status: 'error',
              error: error.message
            })
            outputs.push({
              cell_id: cell.id,
              type: cell.type,
              success: false,
              error: error.message
            })
          }
        }
      } else if (schedule.cell_ids && schedule.cell_ids.length > 0) {
        // Execute specific cells
        for (const cellId of schedule.cell_ids) {
          const cell = (notebookData.cells || []).find((c: any) => c.id === cellId)
          if (!cell) continue

          cellsExecuted++
          try {
            if (cell.type === 'sql') {
              const sqlResponse = await fetch('/api/notebook/execute-sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: cell.sqlQuery || cell.content,
                  connection: cell.sqlConnection || 'default',
                  spaceId: schedule.space_id
                })
              })

              if (!sqlResponse.ok) {
                throw new Error('SQL execution failed')
              }

              const sqlResult = await sqlResponse.json()
              outputs.push({
                cell_id: cell.id,
                type: 'sql',
                success: true,
                output: sqlResult
              })
              cellsSucceeded++
            }
          } catch (error: any) {
            cellsFailed++
            executionLog.push({
              step: 'execute_cell',
              cell_id: cell.id,
              status: 'error',
              error: error.message
            })
          }
        }
      }

      const duration = Date.now() - startTime
      const success = cellsFailed === 0

      // Update execution record
      await query(
        `UPDATE public.notebook_schedule_executions
         SET status = $1,
             completed_at = NOW(),
             duration_ms = $2,
             cells_executed = $3,
             cells_succeeded = $4,
             cells_failed = $5,
             output_data = $6,
             execution_log = $7
         WHERE id = $8`,
        [
          success ? 'completed' : 'failed',
          duration,
          cellsExecuted,
          cellsSucceeded,
          cellsFailed,
          JSON.stringify(outputs),
          JSON.stringify(executionLog),
          executionId
        ]
      )

      return {
        success,
        execution_id: executionId,
        cells_executed: cellsExecuted,
        cells_succeeded: cellsSucceeded,
        cells_failed: cellsFailed,
        duration_ms: duration
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      await query(
        `UPDATE public.notebook_schedule_executions
         SET status = 'failed',
             completed_at = NOW(),
             duration_ms = $1,
             error_message = $2,
             error_details = $3
         WHERE id = $4`,
        [
          duration,
          error.message,
          JSON.stringify({ error: error.toString() }),
          executionId
        ]
      )

      throw error
    }
  } catch (error: any) {
    console.error('Error executing notebook schedule:', error)
    return {
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    }
  }
}

