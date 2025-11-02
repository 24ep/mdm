import { query } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'
import { PrismaClient } from '@prisma/client'
import { NotificationService } from '@/lib/notifications'

const prisma = new PrismaClient()

export interface SyncExecutionResult {
  success: boolean
  records_fetched: number
  records_processed: number
  records_inserted: number
  records_updated: number
  records_deleted: number
  records_failed: number
  error?: string
  error_details?: any
  execution_log?: any[]
  duration_ms: number
}

export interface SyncSchedule {
  id: string
  space_id: string
  data_model_id: string
  external_connection_id: string
  name: string
  schedule_type: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM_CRON' | 'MANUAL'
  sync_strategy: 'FULL_REFRESH' | 'INCREMENTAL' | 'APPEND'
  incremental_key?: string
  incremental_timestamp_column?: string
  clear_existing_data: boolean
  source_query?: string
  data_mapping?: any
  max_records_per_sync?: number
  rate_limit_per_minute?: number
  retry_enabled?: boolean
  max_retries?: number
  retry_delay_seconds?: number
  retry_backoff_multiplier?: number
  current_retry_count?: number
  notify_on_success?: boolean
  notify_on_failure?: boolean
  notification_emails?: string[]
  external_connection?: {
    connection_type: 'database' | 'api'
    db_type?: string
    host?: string
    port?: number
    database?: string
    username?: string
    password?: string
    api_url?: string
    api_method?: string
    api_headers?: any
    api_auth_type?: string
    api_auth_token?: string
    api_auth_username?: string
    api_auth_password?: string
    api_auth_apikey_name?: string
    api_auth_apikey_value?: string
    api_body?: string
    api_response_path?: string
  }
  data_model?: {
    external_schema?: string
    external_table?: string
    external_primary_key?: string
  }
}

export class DataSyncExecutor {
  /**
   * Execute a data synchronization for a given schedule
   */
  async executeSync(scheduleId: string): Promise<SyncExecutionResult> {
    const startTime = Date.now()
    const executionLog: any[] = []
    
    try {
      // Load sync schedule with related data
      const schedule = await this.loadSyncSchedule(scheduleId)
      if (!schedule) {
        throw new Error('Sync schedule not found')
      }

      executionLog.push({ step: 'schedule_loaded', timestamp: new Date().toISOString() })

      // Update schedule status to RUNNING
      await query(
        `UPDATE public.data_sync_schedules 
         SET last_run_status = 'RUNNING', last_run_at = NOW()
         WHERE id = $1`,
        [scheduleId]
      )

      let result: SyncExecutionResult

      // Attempt error recovery if needed (before sync)
      // Get last run error from database if previous run failed
      const { rows: lastRunRows } = await query(
        `SELECT last_run_status, last_run_error FROM public.data_sync_schedules WHERE id = $1`,
        [scheduleId]
      )
      const lastRunStatus = lastRunRows[0]?.last_run_status
      const lastRunError = lastRunRows[0]?.last_run_error
      
      let recoveryAttempted = false
      if (lastRunStatus === 'FAILED' && lastRunError) {
        const recovery = await this.attemptErrorRecovery(scheduleId, lastRunError, schedule)
        if (recovery.recovered && recovery.recoveryAction === 'fallback_query') {
          recoveryAttempted = true
        }
      }

      // Execute sync based on connection type
      if (schedule.external_connection?.connection_type === 'api') {
        result = await this.syncFromAPI(schedule, executionLog)
      } else {
        result = await this.syncFromDatabase(schedule, executionLog)
      }

      // If sync failed, attempt recovery
      if (!result.success && !recoveryAttempted) {
        const recovery = await this.attemptErrorRecovery(scheduleId, result.error || '', schedule)
        if (recovery.recovered && recovery.recoveryAction === 'fallback_query') {
          // Retry with fallback query
          if (schedule.external_connection?.connection_type === 'api') {
            result = await this.syncFromAPI(schedule, executionLog)
          } else {
            result = await this.syncFromDatabase(schedule, executionLog)
          }
        }
      }

      const duration = Date.now() - startTime
      result.duration_ms = duration
      result.execution_log = executionLog

      // Update schedule status
      await query(
        `UPDATE public.data_sync_schedules 
         SET last_run_status = $1, 
             last_run_error = $2,
             next_run_at = $3
         WHERE id = $4`,
        [
          result.success ? 'COMPLETED' : 'FAILED',
          result.error || null,
          this.calculateNextRunTime(schedule.schedule_type, schedule.schedule_config),
          scheduleId
        ]
      )

      // Update data model sync status
      if (result.success) {
        await query(
          `UPDATE public.data_models 
           SET last_synced_at = NOW(), sync_status = 'COMPLETED'
           WHERE id = $1`,
          [schedule.data_model_id]
        )

        // Reset retry count on success
        await query(
          `UPDATE public.data_sync_schedules 
           SET current_retry_count = 0 
           WHERE id = $1`,
          [scheduleId]
        )

        // Trigger dependent workflows if configured
        await this.triggerDependentWorkflows(scheduleId, true)

        // Send success notifications
        if (schedule.notify_on_success && schedule.notification_emails && schedule.notification_emails.length > 0) {
          const executionId = await this.saveExecutionLog(scheduleId, result)
          await NotificationService.sendSyncSuccessNotification(
            schedule.name,
            schedule.notification_emails,
            {
              records_fetched: result.records_fetched,
              records_inserted: result.records_inserted,
              records_updated: result.records_updated,
              duration_ms: result.duration_ms,
              execution_id: executionId
            }
          )
        }
      } else {
        // Handle retry logic for failures
        const shouldRetry = await this.handleRetryLogic(scheduleId, schedule, result)
        
        if (!shouldRetry) {
          // Trigger workflows on failure if configured
          await this.triggerDependentWorkflows(scheduleId, false)

          // Send failure notifications
          if (schedule.notify_on_failure && schedule.notification_emails && schedule.notification_emails.length > 0) {
            const executionId = await this.saveExecutionLog(scheduleId, result)
            await NotificationService.sendSyncFailureNotification(
              schedule.name,
              schedule.notification_emails,
              {
                error: result.error || 'Unknown error',
                error_details: result.error_details,
                records_fetched: result.records_fetched,
                execution_id: executionId
              }
            )
          }

          // Check and trigger alerts
          await this.checkAndTriggerAlerts(scheduleId, result)
        }
      }

      // Save execution log (if not already saved)
      if (!result.success || !schedule.notify_on_success) {
        await this.saveExecutionLog(scheduleId, result)
      }

      return result
    } catch (error: any) {
      const duration = Date.now() - startTime
      const result: SyncExecutionResult = {
        success: false,
        records_fetched: 0,
        records_processed: 0,
        records_inserted: 0,
        records_updated: 0,
        records_deleted: 0,
        records_failed: 0,
        error: error.message,
        error_details: error,
        execution_log: executionLog,
        duration_ms: duration
      }

      await query(
        `UPDATE public.data_sync_schedules 
         SET last_run_status = 'FAILED', last_run_error = $1
         WHERE id = $2`,
        [error.message, scheduleId]
      )

      await this.saveExecutionLog(scheduleId, result)

      return result
    }
  }

  /**
   * Sync data from API endpoint
   */
  private async syncFromAPI(schedule: SyncSchedule, executionLog: any[]): Promise<SyncExecutionResult> {
    const conn = schedule.external_connection!
    executionLog.push({ step: 'api_sync_started', url: conn.api_url })

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(conn.api_headers || {})
    }

    // Add authentication
    if (conn.api_auth_type === 'bearer' && conn.api_auth_token) {
      headers['Authorization'] = `Bearer ${conn.api_auth_token}`
    } else if (conn.api_auth_type === 'basic' && conn.api_auth_username && conn.api_auth_password) {
      const credentials = Buffer.from(`${conn.api_auth_username}:${conn.api_auth_password}`).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    } else if (conn.api_auth_type === 'apikey' && conn.api_auth_apikey_name && conn.api_auth_apikey_value) {
      headers[conn.api_auth_apikey_name] = conn.api_auth_apikey_value
    }

    // Make API request
    const fetchOptions: RequestInit = {
      method: conn.api_method || 'GET',
      headers
    }

    if ((conn.api_method === 'POST' || conn.api_method === 'PUT' || conn.api_method === 'PATCH') && conn.api_body) {
      fetchOptions.body = typeof conn.api_body === 'string' ? conn.api_body : JSON.stringify(conn.api_body)
    }

    const response = await fetch(conn.api_url!, fetchOptions)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    let data: any
    const responseText = await response.text()
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new Error('API response is not valid JSON')
    }

    // Extract data using response path if specified
    if (conn.api_response_path) {
      const pathParts = conn.api_response_path.split('.')
      for (const part of pathParts) {
        data = data?.[part]
      }
    }

    // Ensure data is an array
    if (!Array.isArray(data)) {
      data = data ? [data] : []
    }

    executionLog.push({ step: 'api_data_fetched', record_count: data.length })

    // Process and insert data
    return await this.processAndInsertData(schedule, data, executionLog)
  }

  /**
   * Sync data from database
   */
  private async syncFromDatabase(schedule: SyncSchedule, executionLog: any[]): Promise<SyncExecutionResult> {
    const conn = schedule.external_connection!
    executionLog.push({ step: 'database_sync_started', host: conn.host, database: conn.database })

    // Create external database client
    const client = await createExternalClient({
      id: schedule.external_connection_id,
      db_type: conn.db_type as 'postgres' | 'mysql',
      host: conn.host!,
      port: conn.port,
      database: conn.database,
      username: conn.username,
      password: conn.password,
      options: null
    })

    try {
      // Build query
      let sqlQuery: string
      if (schedule.source_query) {
        sqlQuery = schedule.source_query
      } else {
        const schema = schedule.data_model?.external_schema || conn.database
        const table = schedule.data_model?.external_table
        
        if (!table) {
          throw new Error('External table not specified for database sync')
        }

        // For incremental sync, add WHERE clause
        if (schedule.sync_strategy === 'INCREMENTAL' && schedule.incremental_timestamp_column) {
          const lastSync = await this.getLastSyncTimestamp(schedule.id)
          if (lastSync) {
            sqlQuery = `SELECT * FROM ${schema ? `"${schema}".` : ''}"${table}" WHERE "${schedule.incremental_timestamp_column}" > $1 ORDER BY "${schedule.incremental_timestamp_column}"`
          } else {
            sqlQuery = `SELECT * FROM ${schema ? `"${schema}".` : ''}"${table}" ORDER BY "${schedule.incremental_timestamp_column}"`
          }
        } else {
          sqlQuery = `SELECT * FROM ${schema ? `"${schema}".` : ''}"${table}"`
        }
      }

      // Apply limit
      if (schedule.max_records_per_sync) {
        sqlQuery += ` LIMIT ${schedule.max_records_per_sync}`
      }

      executionLog.push({ step: 'database_query_executed', query: sqlQuery })

      // Execute query
      let data: any[]
      if (schedule.sync_strategy === 'INCREMENTAL' && schedule.incremental_timestamp_column) {
        const lastSync = await this.getLastSyncTimestamp(schedule.id)
        const { rows } = lastSync 
          ? await client.query(sqlQuery, [lastSync])
          : await client.query(sqlQuery)
        data = rows
      } else {
        const { rows } = await client.query(sqlQuery)
        data = rows
      }

      executionLog.push({ step: 'database_data_fetched', record_count: data.length })

      // Process and insert data
      return await this.processAndInsertData(schedule, data, executionLog)
    } finally {
      await client.close()
    }
  }

  /**
   * Process fetched data and insert into target data model
   */
  private async processAndInsertData(
    schedule: SyncSchedule,
    data: any[],
    executionLog: any[]
  ): Promise<SyncExecutionResult> {
    const result: SyncExecutionResult = {
      success: true,
      records_fetched: data.length,
      records_processed: 0,
      records_inserted: 0,
      records_updated: 0,
      records_deleted: 0,
      records_failed: 0,
      duration_ms: 0
    }

    if (data.length === 0) {
      executionLog.push({ step: 'no_data_to_process' })
      return result
    }

    // Clear existing data if full refresh
    if (schedule.sync_strategy === 'FULL_REFRESH' && schedule.clear_existing_data) {
      executionLog.push({ step: 'clearing_existing_data' })
      const deleteResult = await query(
        `DELETE FROM public.data_records 
         WHERE data_model_id = $1`,
        [schedule.data_model_id]
      )
      result.records_deleted = deleteResult.rowCount || 0
    }

    // Fetch attributes for the data model to enable proper mapping
    const { rows: attributes } = await query(
      `SELECT id, name, type FROM public.data_model_attributes 
       WHERE data_model_id = $1 AND is_active = true`,
      [schedule.data_model_id]
    )
    
    // Create a map from attribute name to attribute ID for quick lookup
    const attributeMap = new Map<string, string>()
    for (const attr of attributes) {
      attributeMap.set(attr.name, attr.id)
    }

    // Process each record
    for (const record of data) {
      try {
        // Apply data mapping if specified
        let mappedRecord = this.applyDataMapping(record, schedule.data_mapping)

        // Validate record
        const validation = await this.validateRecord(schedule.id, mappedRecord)
        if (!validation.valid) {
          result.records_failed++
          executionLog.push({
            step: 'validation_failed',
            record: mappedRecord,
            errors: validation.errors
          })
          continue
        }

        if (schedule.sync_strategy === 'INCREMENTAL' && schedule.incremental_key) {
          // Find the attribute ID for the incremental key
          const incrementalAttrId = attributeMap.get(schedule.incremental_key) || 
            attributes.find(a => a.name === schedule.incremental_key)?.id
          
          if (incrementalAttrId && mappedRecord[schedule.incremental_key] !== undefined) {
            // Check if record exists by looking for the incremental key value
            const { rows: existingRows } = await query(
              `SELECT dr.id FROM public.data_records dr
               JOIN public.data_record_values drv ON dr.id = drv.data_record_id
               WHERE dr.data_model_id = $1 
               AND drv.attribute_id = $2 
               AND drv.value = $3
               LIMIT 1`,
              [schedule.data_model_id, incrementalAttrId, String(mappedRecord[schedule.incremental_key])]
            )

            if (existingRows.length > 0) {
              // Update existing record
              await this.updateDataRecord(existingRows[0].id, mappedRecord, attributeMap)
              result.records_updated++
            } else {
              // Insert new record
              await this.insertDataRecord(schedule.data_model_id, mappedRecord, attributeMap)
              result.records_inserted++
            }
          } else {
            // No incremental key match found, just insert
            await this.insertDataRecord(schedule.data_model_id, mappedRecord, attributeMap)
            result.records_inserted++
          }
        } else {
          // Insert new record (for FULL_REFRESH or APPEND strategies)
          await this.insertDataRecord(schedule.data_model_id, mappedRecord, attributeMap)
          result.records_inserted++
        }

        result.records_processed++
      } catch (error: any) {
        result.records_failed++
        executionLog.push({ 
          step: 'record_processing_failed', 
          record: record, 
          error: error.message 
        })
      }
    }

    executionLog.push({ 
      step: 'sync_completed',
      summary: {
        inserted: result.records_inserted,
        updated: result.records_updated,
        failed: result.records_failed
      }
    })

    return result
  }

  /**
   * Insert a data record into the target data model using proper EAV structure
   */
  private async insertDataRecord(
    dataModelId: string, 
    record: any, 
    attributeMap: Map<string, string>
  ): Promise<string> {
    // Insert the main record
    const { rows: recordRows } = await query(
      `INSERT INTO public.data_records (data_model_id, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING id`,
      [dataModelId]
    )
    const recordId = recordRows[0].id

    // Insert attribute values
    const values: Array<{ attribute_id: string; value: any }> = []
    for (const [fieldName, fieldValue] of Object.entries(record)) {
      if (fieldValue === null || fieldValue === undefined) continue
      
      const attributeId = attributeMap.get(fieldName)
      if (attributeId) {
        values.push({ attribute_id: attributeId, value: String(fieldValue) })
      }
    }

    if (values.length > 0) {
      const insertValuesSql = `
        INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
        VALUES ${values.map((_, idx) => `($1, $${idx * 2 + 2}, $${idx * 2 + 3})`).join(', ')}
      `
      const flatParams: any[] = [recordId]
      for (const v of values) {
        flatParams.push(v.attribute_id, v.value)
      }
      await query(insertValuesSql, flatParams)
    }

    return recordId
  }

  /**
   * Update an existing data record with new values
   */
  private async updateDataRecord(
    recordId: string,
    record: any,
    attributeMap: Map<string, string>
  ): Promise<void> {
    // Update the record timestamp
    await query(
      `UPDATE public.data_records SET updated_at = NOW() WHERE id = $1`,
      [recordId]
    )

    // Update or insert attribute values
    for (const [fieldName, fieldValue] of Object.entries(record)) {
      if (fieldValue === null || fieldValue === undefined) continue
      
      const attributeId = attributeMap.get(fieldName)
      if (attributeId) {
        await query(
          `INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
           VALUES ($1, $2, $3)
           ON CONFLICT (data_record_id, attribute_id)
           DO UPDATE SET value = $3`,
          [recordId, attributeId, String(fieldValue)]
        )
      }
    }
  }

  /**
   * Apply data mapping transformations
   */
  private applyDataMapping(record: any, mapping?: any): any {
    if (!mapping) return record

    const mapped: any = {}
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      mapped[targetField] = this.getNestedValue(record, sourceField as string)
    }
    return mapped
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  /**
   * Load sync schedule with related data
   */
  private async loadSyncSchedule(scheduleId: string): Promise<SyncSchedule | null> {
    const { rows } = await query(
      `SELECT 
        ds.id, ds.space_id, ds.data_model_id, ds.external_connection_id,
        ds.name, ds.schedule_type, ds.schedule_config, ds.sync_strategy,
        ds.incremental_key, ds.incremental_timestamp_column,
        ds.clear_existing_data, ds.source_query, ds.data_mapping,
        ds.max_records_per_sync, ds.rate_limit_per_minute,
        ds.retry_enabled, ds.max_retries, ds.retry_delay_seconds,
        ds.retry_backoff_multiplier, ds.current_retry_count,
        ds.notify_on_success, ds.notify_on_failure, ds.notification_emails,
        ec.connection_type, ec.db_type, ec.host, ec.port, ec.database,
        ec.username, ec.password, ec.api_url, ec.api_method, ec.api_headers,
        ec.api_auth_type, ec.api_auth_token, ec.api_auth_username,
        ec.api_auth_password, ec.api_auth_apikey_name, ec.api_auth_apikey_value,
        ec.api_body, ec.api_response_path,
        dm.external_schema, dm.external_table, dm.external_primary_key
       FROM public.data_sync_schedules ds
       JOIN public.external_connections ec ON ec.id = ds.external_connection_id
       JOIN public.data_models dm ON dm.id = ds.data_model_id
       WHERE ds.id = $1 AND ds.deleted_at IS NULL`,
      [scheduleId]
    )

    if (rows.length === 0) return null

    const row = rows[0]
    return {
      id: row.id,
      space_id: row.space_id,
      data_model_id: row.data_model_id,
      external_connection_id: row.external_connection_id,
      name: row.name,
      schedule_type: row.schedule_type,
      sync_strategy: row.sync_strategy,
      incremental_key: row.incremental_key,
      incremental_timestamp_column: row.incremental_timestamp_column,
      clear_existing_data: row.clear_existing_data,
      source_query: row.source_query,
      data_mapping: row.data_mapping,
      max_records_per_sync: row.max_records_per_sync,
      rate_limit_per_minute: row.rate_limit_per_minute,
      retry_enabled: row.retry_enabled ?? true,
      max_retries: row.max_retries ?? 3,
      retry_delay_seconds: row.retry_delay_seconds ?? 300,
      retry_backoff_multiplier: row.retry_backoff_multiplier ?? 2.0,
      current_retry_count: row.current_retry_count ?? 0,
      notify_on_success: row.notify_on_success ?? false,
      notify_on_failure: row.notify_on_failure ?? true,
      notification_emails: row.notification_emails || [],
      schedule_config: row.schedule_config,
      external_connection: {
        connection_type: row.connection_type,
        db_type: row.db_type,
        host: row.host,
        port: row.port,
        database: row.database,
        username: row.username,
        password: row.password,
        api_url: row.api_url,
        api_method: row.api_method,
        api_headers: row.api_headers,
        api_auth_type: row.api_auth_type,
        api_auth_token: row.api_auth_token,
        api_auth_username: row.api_auth_username,
        api_auth_password: row.api_auth_password,
        api_auth_apikey_name: row.api_auth_apikey_name,
        api_auth_apikey_value: row.api_auth_apikey_value,
        api_body: row.api_body,
        api_response_path: row.api_response_path
      },
      data_model: {
        external_schema: row.external_schema,
        external_table: row.external_table,
        external_primary_key: row.external_primary_key
      }
    }
  }

  /**
   * Get last sync timestamp for incremental syncs
   */
  private async getLastSyncTimestamp(scheduleId: string): Promise<Date | null> {
    const { rows } = await query(
      `SELECT started_at FROM public.data_sync_executions
       WHERE sync_schedule_id = $1 AND status = 'COMPLETED'
       ORDER BY started_at DESC LIMIT 1`,
      [scheduleId]
    )

    return rows.length > 0 ? rows[0].started_at : null
  }

  /**
   * Calculate next run time based on schedule type
   */
  private calculateNextRunTime(scheduleType: string, scheduleConfig: any): Date {
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
        return next
    }

    return next
  }

  /**
   * Trigger workflows that depend on this sync
   */
  private async triggerDependentWorkflows(scheduleId: string, onSuccess: boolean): Promise<void> {
    try {
      // Find workflows configured to trigger after this sync
      const { rows: workflows } = await query(
        `SELECT w.id, w.name, dst.trigger_on_success, dst.trigger_on_failure
         FROM public.workflows w
         JOIN public.data_sync_workflow_triggers dst ON dst.workflow_id = w.id
         WHERE dst.sync_schedule_id = $1
           AND w.is_active = true
           AND w.status = 'ACTIVE'
           AND (
             (onSuccess = true AND dst.trigger_on_success = true)
             OR
             (onSuccess = false AND dst.trigger_on_failure = true)
           )`,
        [scheduleId]
      )

      // Also check workflow schedules with trigger_on_sync flag
      const { rows: scheduleWorkflows } = await query(
        `SELECT w.id, w.name
         FROM public.workflows w
         JOIN public.workflow_schedules ws ON ws.workflow_id = w.id
         WHERE ws.trigger_on_sync = true
           AND (ws.trigger_on_sync_schedule_id = $1 OR ws.trigger_on_sync_schedule_id IS NULL)
           AND w.data_model_id = (SELECT data_model_id FROM public.data_sync_schedules WHERE id = $1)
           AND w.is_active = true
           AND w.status = 'ACTIVE'`,
        [scheduleId]
      )

      const allWorkflows = [...workflows, ...scheduleWorkflows.map(w => ({ id: w.id, name: w.name }))]

      for (const workflow of allWorkflows) {
        try {
          console.log(`[Data Sync] Triggering workflow ${workflow.name} after sync ${onSuccess ? 'success' : 'failure'}`)
          
          // Import executeWorkflow dynamically to avoid circular dependency
          const { executeWorkflow } = await import('@/lib/workflow-executor')
          await executeWorkflow(workflow.id)
        } catch (error) {
          console.error(`[Data Sync] Error triggering workflow ${workflow.name}:`, error)
        }
      }
    } catch (error) {
      console.error('[Data Sync] Error finding dependent workflows:', error)
    }
  }

  /**
   * Save execution log and return execution ID
   */
  private async saveExecutionLog(scheduleId: string, result: SyncExecutionResult): Promise<string> {
    const { rows } = await query(
      `INSERT INTO public.data_sync_executions
       (sync_schedule_id, status, started_at, completed_at,
        records_fetched, records_processed, records_inserted,
        records_updated, records_deleted, records_failed,
        error_message, error_details, execution_log, duration_ms)
       VALUES ($1, $2, NOW() - (($3::text || ' milliseconds')::interval), NOW(),
               $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        scheduleId,
        result.success ? 'COMPLETED' : 'FAILED',
        result.duration_ms,
        result.records_fetched,
        result.records_processed,
        result.records_inserted,
        result.records_updated,
        result.records_deleted,
        result.records_failed,
        result.error || null,
        result.error_details ? JSON.stringify(result.error_details) : null,
        result.execution_log ? JSON.stringify(result.execution_log) : null,
        result.duration_ms
      ]
    )
    return rows[0]?.id || ''
  }

  /**
   * Handle retry logic for failed syncs
   */
  private async handleRetryLogic(
    scheduleId: string,
    schedule: SyncSchedule,
    result: SyncExecutionResult
  ): Promise<boolean> {
    // Check if retry is enabled
    if (!schedule.retry_enabled) {
      return false
    }

    const maxRetries = schedule.max_retries || 3
    const currentRetries = schedule.current_retry_count || 0

    if (currentRetries >= maxRetries) {
      // Max retries reached, don't retry
      return false
    }

    // Increment retry count
    const newRetryCount = currentRetries + 1
    const retryDelaySeconds = schedule.retry_delay_seconds || 300
    const backoffMultiplier = schedule.retry_backoff_multiplier || 2.0
    
    // Calculate delay with exponential backoff
    const delaySeconds = retryDelaySeconds * Math.pow(backoffMultiplier, currentRetries)
    const nextRetryAt = new Date(Date.now() + delaySeconds * 1000)

    // Update schedule with retry info
    await query(
      `UPDATE public.data_sync_schedules 
       SET current_retry_count = $1, next_run_at = $2
       WHERE id = $3`,
      [newRetryCount, nextRetryAt, scheduleId]
    )

    console.log(`[Data Sync] Scheduling retry ${newRetryCount}/${maxRetries} for ${schedule.name} in ${delaySeconds}s`)
    return true
  }

  /**
   * Validate data record against validation rules
   */
  private async validateRecord(
    scheduleId: string,
    record: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    const { rows: rules } = await query(
      `SELECT field_name, rule_type, rule_config, error_message
       FROM public.data_sync_validation_rules
       WHERE sync_schedule_id = $1 AND is_active = true`,
      [scheduleId]
    )

    const errors: string[] = []

    for (const rule of rules) {
      const fieldValue = record[rule.field_name]
      const config = rule.rule_config || {}

      switch (rule.rule_type) {
        case 'required':
          if (!fieldValue && fieldValue !== 0 && fieldValue !== false) {
            errors.push(rule.error_message || `Field ${rule.field_name} is required`)
          }
          break

        case 'type':
          const expectedType = config.type
          const actualType = typeof fieldValue
          if (expectedType && actualType !== expectedType) {
            errors.push(rule.error_message || `Field ${rule.field_name} must be of type ${expectedType}`)
          }
          break

        case 'format':
          if (fieldValue && config.regex) {
            const regex = new RegExp(config.regex)
            if (!regex.test(String(fieldValue))) {
              errors.push(rule.error_message || `Field ${rule.field_name} format is invalid`)
            }
          }
          break

        case 'range':
          if (fieldValue !== null && fieldValue !== undefined) {
            const numValue = Number(fieldValue)
            if (config.min !== undefined && numValue < config.min) {
              errors.push(rule.error_message || `Field ${rule.field_name} must be at least ${config.min}`)
            }
            if (config.max !== undefined && numValue > config.max) {
              errors.push(rule.error_message || `Field ${rule.field_name} must be at most ${config.max}`)
            }
          }
          break

        case 'custom':
          // Custom validation logic would go here
          break
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Attempt error recovery based on recovery actions
   */
  private async attemptErrorRecovery(
    scheduleId: string,
    error: string,
    schedule: SyncSchedule
  ): Promise<{ recovered: boolean; recoveryAction?: string }> {
    const { rows: recoveryActions } = await query(
      `SELECT error_pattern, recovery_action, recovery_config
       FROM public.data_sync_recovery_actions
       WHERE sync_schedule_id = $1 AND is_active = true
       ORDER BY created_at`,
      [scheduleId]
    )

    for (const action of recoveryActions) {
      // Check if error matches pattern
      const pattern = action.error_pattern
      if (!pattern || error.includes(pattern) || new RegExp(pattern, 'i').test(error)) {
        switch (action.recovery_action) {
          case 'skip':
            console.log(`[Data Sync] Recovery: Skipping record due to error pattern match`)
            return { recovered: true, recoveryAction: 'skip' }

          case 'retry':
            // Already handled by retry logic
            return { recovered: false }

          case 'fallback_query':
            if (action.recovery_config?.fallback_query) {
              schedule.source_query = action.recovery_config.fallback_query
              console.log(`[Data Sync] Recovery: Using fallback query`)
              return { recovered: true, recoveryAction: 'fallback_query' }
            }
            break

          case 'notify_only':
            // Just notify, don't recover
            return { recovered: false }
        }
      }
    }

    return { recovered: false }
  }

  /**
   * Check and trigger alerts based on alert configurations
   */
  private async checkAndTriggerAlerts(
    scheduleId: string,
    result: SyncExecutionResult
  ): Promise<void> {
    try {
      const { rows: alerts } = await query(
        `SELECT id, alert_type, alert_config
         FROM public.data_sync_alerts
         WHERE sync_schedule_id = $1 AND is_active = true`,
        [scheduleId]
      )

      for (const alert of alerts) {
        const config = alert.alert_config || {}
        let shouldTrigger = false
        let severity = 'warning'
        let message = ''

        switch (alert.alert_type) {
          case 'failure_threshold':
            // Check if failure count exceeds threshold
            const { rows: recentFailures } = await query(
              `SELECT COUNT(*) as count
               FROM public.data_sync_executions
               WHERE sync_schedule_id = $1 
                 AND status = 'FAILED'
                 AND started_at > NOW() - INTERVAL '${config.time_window_hours || 24} hours'`,
              [scheduleId]
            )
            const failureCount = parseInt(recentFailures[0]?.count || '0')
            if (failureCount >= (config.threshold || 3)) {
              shouldTrigger = true
              severity = failureCount >= (config.critical_threshold || 5) ? 'critical' : 'error'
              message = `Sync has failed ${failureCount} times in the last ${config.time_window_hours || 24} hours`
            }
            break

          case 'record_count_anomaly':
            // Check if record count deviates significantly from average
            const { rows: avgData } = await query(
              `SELECT 
                 AVG(records_fetched) as avg_fetched,
                 STDDEV(records_fetched) as stddev_fetched
               FROM public.data_sync_executions
               WHERE sync_schedule_id = $1 
                 AND status = 'COMPLETED'
                 AND started_at > NOW() - INTERVAL '7 days'`,
              [scheduleId]
            )
            const avgFetched = parseFloat(avgData[0]?.avg_fetched || '0')
            const stddev = parseFloat(avgData[0]?.stddev_fetched || '0')
            const threshold = config.deviation_threshold || 2.0

            if (avgFetched > 0 && stddev > 0) {
              const deviation = Math.abs(result.records_fetched - avgFetched) / stddev
              if (deviation > threshold) {
                shouldTrigger = true
                severity = deviation > (threshold * 2) ? 'critical' : 'warning'
                message = `Record count anomaly: ${result.records_fetched} fetched (average: ${Math.round(avgFetched)}, deviation: ${deviation.toFixed(2)}σ)`
              }
            }
            break

          case 'duration_anomaly':
            // Check if execution duration is abnormally long
            const maxDuration = config.max_duration_ms || 300000 // 5 minutes default
            if (result.duration_ms > maxDuration) {
              shouldTrigger = true
              severity = result.duration_ms > (maxDuration * 2) ? 'error' : 'warning'
              message = `Sync duration anomaly: ${Math.round(result.duration_ms / 1000)}s (threshold: ${Math.round(maxDuration / 1000)}s)`
            }
            break

          case 'error_rate':
            // Check error/failure rate
            const errorRate = result.records_failed / Math.max(result.records_processed, 1)
            const maxErrorRate = config.max_error_rate || 0.1 // 10% default
            if (errorRate > maxErrorRate) {
              shouldTrigger = true
              severity = errorRate > (maxErrorRate * 2) ? 'error' : 'warning'
              message = `High error rate: ${(errorRate * 100).toFixed(1)}% (${result.records_failed}/${result.records_processed} records failed)`
            }
            break
        }

        if (shouldTrigger) {
          // Create alert history entry
          await query(
            `INSERT INTO public.data_sync_alert_history
             (alert_id, sync_schedule_id, alert_type, severity, message, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              alert.id,
              scheduleId,
              alert.alert_type,
              severity,
              message,
              JSON.stringify({ result: { ...result, execution_log: undefined } })
            ]
          )

          // Send notification if configured
          const { rows: scheduleRows } = await query(
            `SELECT notification_emails, notify_on_failure
             FROM public.data_sync_schedules
             WHERE id = $1`,
            [scheduleId]
          )
          
          if (scheduleRows[0]?.notify_on_failure && scheduleRows[0]?.notification_emails?.length > 0) {
            await NotificationService.sendEmail({
              to: scheduleRows[0].notification_emails,
              subject: `🚨 Alert: ${severity.toUpperCase()} - ${message}`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2 style="color: ${severity === 'critical' ? '#dc2626' : severity === 'error' ? '#f59e0b' : '#f97316'};">${message}</h2>
                  <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
                  <p><strong>Details:</strong></p>
                  <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${JSON.stringify(result, null, 2)}</pre>
                </div>
              `
            })
          }
        }
      }
    } catch (error) {
      console.error('[Data Sync] Error checking alerts:', error)
    }
  }
}

