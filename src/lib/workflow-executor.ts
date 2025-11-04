import { query } from '@/lib/db'

export interface WorkflowExecutionResult {
  success: boolean
  execution_id?: string
  records_processed: number
  records_updated: number
  error?: string
}

export interface WorkflowCondition {
  attribute_id: string
  operator: string
  value: string
  logical_operator: string
  condition_order: number
}

export interface WorkflowAction {
  id?: string
  target_attribute_id?: string
  action_type: string // 'UPDATE_VALUE', 'SET_DEFAULT', 'CALCULATE', 'COPY_FROM', 'EXECUTE_NOTEBOOK', 'CALL_API'
  new_value?: string
  calculation_formula?: string
  source_attribute_id?: string
  action_order: number
  notebook_id?: string // For EXECUTE_NOTEBOOK action
  action_config?: any // Additional configuration (API endpoints, parameters, etc.)
}

export class WorkflowExecutor {
  private workflowId: string
  private dataModelId: string
  private conditions: WorkflowCondition[]
  private actions: WorkflowAction[]

  constructor(workflowId: string, dataModelId: string, conditions: WorkflowCondition[], actions: WorkflowAction[]) {
    this.workflowId = workflowId
    this.dataModelId = dataModelId
    this.conditions = conditions
    this.actions = actions
  }

  async execute(): Promise<WorkflowExecutionResult> {
    try {
      // Create execution record
      const { rows: executionRows } = await query(
        `INSERT INTO public.workflow_executions (workflow_id, execution_type, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [this.workflowId, 'MANUAL', 'RUNNING']
      )
      const executionId = executionRows[0].id

      // Build and execute the query to find matching records
      const matchingRecords = await this.findMatchingRecords()
      
      let recordsUpdated = 0
      const errors: string[] = []

      // Process each matching record
      for (const record of matchingRecords) {
        try {
          const updated = await this.processRecord(record.id, executionId)
          if (updated) {
            recordsUpdated++
          }
        } catch (error) {
          console.error(`Error processing record ${record.id}:`, error)
          errors.push(`Record ${record.id}: ${error}`)
        }
      }

      // Update execution record
      const status = errors.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED'
      await query(
        `UPDATE public.workflow_executions 
         SET status = $1, completed_at = NOW(), records_processed = $2, records_updated = $3,
             error_message = $4
         WHERE id = $5`,
        [status, matchingRecords.length, recordsUpdated, errors.join('; '), executionId]
      )

      return {
        success: true,
        execution_id: executionId,
        records_processed: matchingRecords.length,
        records_updated: recordsUpdated,
        error: errors.length > 0 ? errors.join('; ') : undefined
      }

    } catch (error) {
      console.error('Workflow execution error:', error)
      return {
        success: false,
        records_processed: 0,
        records_updated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async findMatchingRecords(): Promise<Array<{ id: string }>> {
    if (this.conditions.length === 0) {
      // If no conditions, get all records for the data model
      const { rows } = await query(
        `SELECT dr.id 
         FROM public.data_records dr
         WHERE dr.data_model_id = $1::uuid AND dr.is_active = true`,
        [this.dataModelId]
      )
      return rows
    }

    // Build dynamic query based on conditions
    let whereClause = 'dr.data_model_id = $1::uuid AND dr.is_active = true'
    let params: any[] = [this.dataModelId]
    let paramIndex = 2

    for (const condition of this.conditions) {
      const conditionClause = this.buildConditionClause(condition, paramIndex)
      if (conditionClause) {
        whereClause += ` ${condition.logical_operator} ${conditionClause.clause}`
        params.push(...conditionClause.params)
        paramIndex += conditionClause.params.length
      }
    }

    const query = `
      SELECT DISTINCT dr.id
      FROM public.data_records dr
      JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      WHERE ${whereClause}
    `

    const { rows } = await query(query, params)
    return rows
  }

  private buildConditionClause(condition: WorkflowCondition, paramIndex: number): { clause: string; params: any[] } | null {
    const { operator, value, attribute_id } = condition

    switch (operator) {
      case 'EQUALS':
        return {
          clause: `drv.attribute_id = $${paramIndex} AND drv.value = $${paramIndex + 1}`,
          params: [attribute_id, value]
        }
      case 'NOT_EQUALS':
        return {
          clause: `drv.attribute_id = $${paramIndex} AND drv.value != $${paramIndex + 1}`,
          params: [attribute_id, value]
        }
      case 'CONTAINS':
        return {
          clause: `drv.attribute_id = $${paramIndex} AND drv.value ILIKE $${paramIndex + 1}`,
          params: [attribute_id, `%${value}%`]
        }
      case 'NOT_CONTAINS':
        return {
          clause: `drv.attribute_id = $${paramIndex} AND drv.value NOT ILIKE $${paramIndex + 1}`,
          params: [attribute_id, `%${value}%`]
        }
      case 'IS_EMPTY':
        return {
          clause: `drv.attribute_id = $${paramIndex} AND (drv.value IS NULL OR drv.value = '')`,
          params: [attribute_id]
        }
      case 'IS_NOT_EMPTY':
        return {
          clause: `drv.attribute_id = $${paramIndex} AND drv.value IS NOT NULL AND drv.value != ''`,
          params: [attribute_id]
        }
      case 'GREATER_THAN':
        return {
          clause: `drv.attribute_id = $${paramIndex} AND drv.value::numeric > $${paramIndex + 1}`,
          params: [attribute_id, value]
        }
      case 'LESS_THAN':
        return {
          clause: `drv.attribute_id = $${paramIndex} AND drv.value::numeric < $${paramIndex + 1}`,
          params: [attribute_id, value]
        }
      default:
        console.warn(`Unsupported operator: ${operator}`)
        return null
    }
  }

  private async processRecord(recordId: string, executionId: string): Promise<boolean> {
    let updated = false
    const notebookExecutionResults: any[] = []

    for (const action of this.actions) {
      try {
        // Handle notebook execution actions separately
        if (action.action_type === 'EXECUTE_NOTEBOOK') {
          const notebookResult = await this.executeNotebookAction(action, recordId, executionId)
          if (notebookResult) {
            notebookExecutionResults.push(notebookResult)
            updated = true
          }
          continue
        }

        // Handle standard attribute update actions
        const newValue = await this.calculateNewValue(action, recordId)
        
        if (newValue !== null) {
          // Update or insert the value
          await query(
            `INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
             VALUES ($1, $2, $3)
             ON CONFLICT (data_record_id, attribute_id)
             DO UPDATE SET value = $3`,
            [recordId, action.target_attribute_id, newValue]
          )

          // Log the execution result
          await query(
            `INSERT INTO public.workflow_execution_results 
             (execution_id, data_record_id, action_id, new_value, status)
             VALUES ($1, $2, $3, $4, 'SUCCESS')`,
            [executionId, recordId, action.id || action.target_attribute_id, newValue]
          )

          updated = true
        }
      } catch (error) {
        console.error(`Error processing action for record ${recordId}:`, error)
        
        // Log the error
        await query(
          `INSERT INTO public.workflow_execution_results 
           (execution_id, data_record_id, action_id, status, error_message)
           VALUES ($1, $2, $3, 'FAILED', $4)`,
          [executionId, recordId, action.id || action.target_attribute_id, error instanceof Error ? error.message : 'Unknown error']
        )
      }
    }

    // Store notebook execution results in workflow execution
    if (notebookExecutionResults.length > 0) {
      await query(
        `UPDATE public.workflow_executions
         SET notebook_executions = $1
         WHERE id = $2`,
        [JSON.stringify(notebookExecutionResults), executionId]
      )
    }

    return updated
  }

  private async executeNotebookAction(
    action: WorkflowAction,
    recordId: string,
    executionId: string
  ): Promise<any | null> {
    if (!action.notebook_id) {
      console.warn('EXECUTE_NOTEBOOK action missing notebook_id')
      return null
    }

    try {
      // Get notebook data from current version
      const { rows: notebookRows } = await query(
        `SELECT notebook_data 
         FROM public.notebook_versions 
         WHERE notebook_id = $1 AND is_current = true
         LIMIT 1`,
        [action.notebook_id]
      )

      if (notebookRows.length === 0) {
        throw new Error(`Notebook ${action.notebook_id} not found or no current version`)
      }

      const notebookData = typeof notebookRows[0].notebook_data === 'string'
        ? JSON.parse(notebookRows[0].notebook_data)
        : notebookRows[0].notebook_data

      // Execute notebook cells
      const cellsToExecute = action.action_config?.cell_ids || 
        (notebookData.cells || []).filter((cell: any) => cell.type === 'code' || cell.type === 'sql')

      const executionResults: any[] = []
      
      for (const cell of cellsToExecute) {
        try {
          if (cell.type === 'sql') {
            // Execute SQL cell via API endpoint (handles connections and security)
            try {
              const sqlResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notebook/execute-sql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: cell.sqlQuery || cell.content,
                  connection: cell.sqlConnection || 'default',
                  spaceId: action.action_config?.space_id
                })
              })

              if (!sqlResponse.ok) {
                const errorData = await sqlResponse.json()
                throw new Error(errorData.error || 'SQL execution failed')
              }

              const sqlResult = await sqlResponse.json()
              executionResults.push({
                cell_id: cell.id,
                type: 'sql',
                success: true,
                result: sqlResult
              })
            } catch (sqlError: any) {
              throw new Error(`SQL execution failed: ${sqlError.message}`)
            }
          } else {
            // Code cells - would need kernel implementation
            executionResults.push({
              cell_id: cell.id,
              type: 'code',
              success: false,
              error: 'Code execution not yet implemented'
            })
          }
        } catch (error: any) {
          executionResults.push({
            cell_id: cell.id,
            type: cell.type,
            success: false,
            error: error.message
          })
        }
      }

      // Log notebook execution result
      await query(
        `INSERT INTO public.workflow_execution_results 
         (execution_id, data_record_id, action_id, status, error_message)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          executionId,
          recordId,
          action.id || 'notebook_action',
          executionResults.every((r) => r.success) ? 'SUCCESS' : 'COMPLETED_WITH_ERRORS',
          executionResults.some((r) => !r.success) 
            ? `Notebook execution completed with ${executionResults.filter((r) => !r.success).length} errors`
            : null
        ]
      )

      return {
        notebook_id: action.notebook_id,
        record_id: recordId,
        cells_executed: executionResults.length,
        cells_succeeded: executionResults.filter((r) => r.success).length,
        cells_failed: executionResults.filter((r) => !r.success).length,
        results: executionResults
      }
    } catch (error: any) {
      console.error(`Error executing notebook ${action.notebook_id}:`, error)
      
      await query(
        `INSERT INTO public.workflow_execution_results 
         (execution_id, data_record_id, action_id, status, error_message)
         VALUES ($1, $2, $3, 'FAILED', $4)`,
        [executionId, recordId, action.id || 'notebook_action', error.message]
      )

      return null
    }
  }

  private async calculateNewValue(action: WorkflowAction, recordId: string): Promise<string | null> {
    switch (action.action_type) {
      case 'UPDATE_VALUE':
        return action.new_value || ''
      
      case 'SET_DEFAULT':
        // Get default value from attribute definition
        const { rows: attrRows } = await query(
          `SELECT default_value FROM public.data_model_attributes WHERE id = $1`,
          [action.target_attribute_id]
        )
        return attrRows[0]?.default_value || ''
      
      case 'COPY_FROM':
        if (action.source_attribute_id) {
          const { rows: sourceRows } = await query(
            `SELECT value FROM public.data_record_values 
             WHERE data_record_id = $1 AND attribute_id = $2`,
            [recordId, action.source_attribute_id]
          )
          return sourceRows[0]?.value || ''
        }
        return null
      
      case 'CALCULATE':
        if (action.calculation_formula) {
          // Simple calculation support - in production, you'd want a more robust formula engine
          try {
            // This is a simplified example - you'd want proper formula parsing
            return this.evaluateFormula(action.calculation_formula, recordId)
          } catch (error) {
            console.error('Formula evaluation error:', error)
            return null
          }
        }
        return null
      
      default:
        console.warn(`Unsupported action type: ${action.action_type}`)
        return null
    }
  }

  private async evaluateFormula(formula: string, recordId: string): Promise<string> {
    // This is a simplified formula evaluator
    // In production, you'd want a proper formula engine that can:
    // - Reference other attributes by name
    // - Support mathematical operations
    // - Handle data type conversions
    // - Support functions like CONCAT, UPPER, etc.
    
    // For now, just return the formula as-is
    // You could implement a simple template system here
    return formula
  }
}

export async function executeWorkflow(workflowId: string): Promise<WorkflowExecutionResult> {
  try {
    // Get workflow details
    const { rows: workflowRows } = await query(
      `SELECT w.*, w.data_model_id
       FROM public.workflows w
       WHERE w.id = $1 AND w.is_active = true AND w.status = 'ACTIVE'`,
      [workflowId]
    )

    if (workflowRows.length === 0) {
      return {
        success: false,
        records_processed: 0,
        records_updated: 0,
        error: 'Workflow not found or inactive'
      }
    }

    const workflow = workflowRows[0]

    // Get conditions
    const { rows: conditions } = await query(
      `SELECT * FROM public.workflow_conditions 
       WHERE workflow_id = $1
       ORDER BY condition_order`,
      [workflowId]
    )

    // Get actions (including notebook_id and action_config)
    const { rows: actions } = await query(
      `SELECT 
        id,
        workflow_id,
        target_attribute_id,
        action_type,
        new_value,
        calculation_formula,
        source_attribute_id,
        action_order,
        notebook_id,
        action_config
       FROM public.workflow_actions 
       WHERE workflow_id = $1
       ORDER BY action_order`,
      [workflowId]
    )

    // Execute workflow
    const executor = new WorkflowExecutor(
      workflowId,
      workflow.data_model_id,
      conditions,
      actions
    )

    return await executor.execute()

  } catch (error) {
    console.error('Error executing workflow:', error)
    return {
      success: false,
      records_processed: 0,
      records_updated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
