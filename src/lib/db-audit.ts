/**
 * Enhanced Database Audit Logging System
 * Tracks all database operations with detailed audit trails
 */

import { query } from './db'

export type AuditAction = 
  | 'SELECT' 
  | 'INSERT' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'CREATE_TABLE' 
  | 'ALTER_TABLE' 
  | 'DROP_TABLE' 
  | 'CREATE_INDEX' 
  | 'DROP_INDEX'
  | 'EXECUTE_QUERY'
  | 'SCHEMA_CHANGE'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'

export interface AuditLog {
  id?: string
  userId: string
  userName?: string
  userEmail?: string
  action: AuditAction
  resourceType: string // 'table', 'query', 'schema', etc.
  resourceId?: string
  resourceName?: string
  sqlQuery?: string
  connectionId?: string
  spaceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  executionTime?: number
  rowCount?: number
  success: boolean
  errorMessage?: string
  timestamp: Date
}

export interface AuditLogQuery {
  userId?: string
  action?: AuditAction
  resourceType?: string
  spaceId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

class DatabaseAuditLogger {
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // Create audit_logs table if it doesn't exist
      await query(`
        CREATE TABLE IF NOT EXISTS public.audit_logs (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL,
          user_name TEXT,
          user_email TEXT,
          action TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT,
          resource_name TEXT,
          sql_query TEXT,
          connection_id TEXT,
          space_id UUID,
          metadata JSONB,
          ip_address TEXT,
          user_agent TEXT,
          execution_time INTEGER,
          row_count INTEGER,
          success BOOLEAN NOT NULL DEFAULT true,
          error_message TEXT,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          
          -- Indexes for common queries
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_space_id ON public.audit_logs(space_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON public.audit_logs(success);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action);
      `)
      
      // Add missing columns if table already exists (migration)
      try {
        await query(`
          DO $$ 
          BEGIN
            -- Add user_name column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'user_name'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN user_name TEXT;
            END IF;
            
            -- Add user_email column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'user_email'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN user_email TEXT;
            END IF;
            
            -- Add resource_type column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'resource_type'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN resource_type TEXT;
            END IF;
            
            -- Add resource_id column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'resource_id'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN resource_id TEXT;
            END IF;
            
            -- Add resource_name column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'resource_name'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN resource_name TEXT;
            END IF;
            
            -- Add metadata column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'metadata'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN metadata JSONB;
            END IF;
            
            -- Add success column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'success'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN success BOOLEAN NOT NULL DEFAULT true;
            END IF;
            
            -- Add ip_address column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'ip_address'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN ip_address TEXT;
            END IF;
            
            -- Add user_agent column if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'audit_logs' 
              AND column_name = 'user_agent'
            ) THEN
              ALTER TABLE public.audit_logs ADD COLUMN user_agent TEXT;
            END IF;
          END $$;
        `)
      } catch (migrationError) {
        // Log but don't fail - columns might already exist
        console.warn('Migration check for audit_logs columns:', migrationError)
      }
      
      this.initialized = true
      console.log('✅ Audit logging system initialized')
    } catch (error) {
      console.error('❌ Failed to initialize audit logging:', error)
      // Don't throw - allow system to continue without audit logging
    }
  }

  async log(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string | null> {
    await this.initialize()

    try {
      const result = await query(`
        INSERT INTO public.audit_logs (
          user_id, user_name, user_email, action, resource_type, resource_id, 
          resource_name, sql_query, connection_id, space_id, metadata, 
          ip_address, user_agent, execution_time, row_count, success, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `, [
        auditLog.userId,
        auditLog.userName || null,
        auditLog.userEmail || null,
        auditLog.action,
        auditLog.resourceType,
        auditLog.resourceId || null,
        auditLog.resourceName || null,
        auditLog.sqlQuery || null,
        auditLog.connectionId || null,
        auditLog.spaceId || null,
        auditLog.metadata ? JSON.stringify(auditLog.metadata) : null,
        auditLog.ipAddress || null,
        auditLog.userAgent || null,
        auditLog.executionTime || null,
        auditLog.rowCount || null,
        auditLog.success,
        auditLog.errorMessage || null
      ])

      return result.rows[0]?.id || null
    } catch (error) {
      console.error('❌ Failed to log audit entry:', error)
      return null
    }
  }

  async queryLogs(queryParams: AuditLogQuery): Promise<AuditLog[]> {
    await this.initialize()

    try {
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (queryParams.userId) {
        conditions.push(`user_id = $${paramIndex++}`)
        params.push(queryParams.userId)
      }

      if (queryParams.action) {
        conditions.push(`action = $${paramIndex++}`)
        params.push(queryParams.action)
      }

      if (queryParams.resourceType) {
        conditions.push(`resource_type = $${paramIndex++}`)
        params.push(queryParams.resourceType)
      }

      if (queryParams.spaceId) {
        conditions.push(`space_id = $${paramIndex++}`)
        params.push(queryParams.spaceId)
      }

      if (queryParams.startDate) {
        conditions.push(`timestamp >= $${paramIndex++}`)
        params.push(queryParams.startDate)
      }

      if (queryParams.endDate) {
        conditions.push(`timestamp <= $${paramIndex++}`)
        params.push(queryParams.endDate)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limit = queryParams.limit || 100
      const offset = queryParams.offset || 0

      const result = await query(`
        SELECT * FROM public.audit_logs
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, [...params, limit, offset])

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        action: row.action as AuditAction,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        resourceName: row.resource_name,
        sqlQuery: row.sql_query,
        connectionId: row.connection_id,
        spaceId: row.space_id,
        metadata: row.metadata,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        executionTime: row.execution_time,
        rowCount: row.row_count,
        success: row.success,
        errorMessage: row.error_message,
        timestamp: new Date(row.timestamp)
      }))
    } catch (error) {
      console.error('❌ Failed to query audit logs:', error)
      return []
    }
  }

  async getLogCount(queryParams: Omit<AuditLogQuery, 'limit' | 'offset'>): Promise<number> {
    await this.initialize()

    try {
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (queryParams.userId) {
        conditions.push(`user_id = $${paramIndex++}`)
        params.push(queryParams.userId)
      }

      if (queryParams.action) {
        conditions.push(`action = $${paramIndex++}`)
        params.push(queryParams.action)
      }

      if (queryParams.resourceType) {
        conditions.push(`resource_type = $${paramIndex++}`)
        params.push(queryParams.resourceType)
      }

      if (queryParams.spaceId) {
        conditions.push(`space_id = $${paramIndex++}`)
        params.push(queryParams.spaceId)
      }

      if (queryParams.startDate) {
        conditions.push(`timestamp >= $${paramIndex++}`)
        params.push(queryParams.startDate)
      }

      if (queryParams.endDate) {
        conditions.push(`timestamp <= $${paramIndex++}`)
        params.push(queryParams.endDate)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const result = await query(`
        SELECT COUNT(*) as count FROM public.audit_logs
        ${whereClause}
      `, params)

      return parseInt(result.rows[0]?.count || '0', 10)
    } catch (error) {
      console.error('❌ Failed to get audit log count:', error)
      return 0
    }
  }

  async getRecentActivity(userId?: string, limit = 50): Promise<AuditLog[]> {
    return this.queryLogs({ userId, limit })
  }

  async getFailedOperations(limit = 50): Promise<AuditLog[]> {
    const logs = await this.queryLogs({ limit })
    return logs.filter(log => !log.success)
  }
}

// Export singleton instance
export const auditLogger = new DatabaseAuditLogger()

