/**
 * Schema Migration Management System
 * Manages database schema changes with version control and rollback support
 */

import { query } from './db'

export type MigrationStatus = 'pending' | 'applied' | 'rolled_back' | 'failed'
export type MigrationType = 'CREATE_TABLE' | 'ALTER_TABLE' | 'DROP_TABLE' | 'CREATE_INDEX' | 'DROP_INDEX' | 'DATA_MIGRATION' | 'CUSTOM'

export interface SchemaMigration {
  id?: string
  version: string
  name: string
  description?: string
  migrationType: MigrationType
  upSql: string
  downSql: string // Rollback SQL
  checksum: string // Hash of upSql for verification
  appliedAt?: Date
  appliedBy?: string
  rolledBackAt?: Date
  rolledBackBy?: string
  status: MigrationStatus
  executionTime?: number
  errorMessage?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface MigrationDiff {
  added: string[]
  removed: string[]
  modified: string[]
  details: Array<{
    type: 'added' | 'removed' | 'modified'
    object: string
    sql?: string
  }>
}

class SchemaMigrationManager {
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // Create schema_migrations table
      await query(`
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          version TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          migration_type TEXT NOT NULL,
          up_sql TEXT NOT NULL,
          down_sql TEXT NOT NULL,
          checksum TEXT NOT NULL,
          applied_at TIMESTAMPTZ,
          applied_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
          rolled_back_at TIMESTAMPTZ,
          rolled_back_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          execution_time INTEGER,
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON public.schema_migrations(version);
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_status ON public.schema_migrations(status);
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON public.schema_migrations(applied_at DESC);
      `)

      // Create migration_history table for tracking
      await query(`
        CREATE TABLE IF NOT EXISTS public.migration_history (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          migration_id UUID REFERENCES public.schema_migrations(id) ON DELETE CASCADE,
          action TEXT NOT NULL, -- 'apply' or 'rollback'
          executed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
          executed_at TIMESTAMPTZ DEFAULT NOW(),
          execution_time INTEGER,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          metadata JSONB
        );

        CREATE INDEX IF NOT EXISTS idx_migration_history_migration_id ON public.migration_history(migration_id);
        CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at ON public.migration_history(executed_at DESC);
      `)

      this.initialized = true
      console.log('✅ Schema migration system initialized')
    } catch (error) {
      console.error('❌ Failed to initialize schema migration system:', error)
    }
  }

  async createMigration(
    migration: Omit<SchemaMigration, 'id' | 'status' | 'createdAt' | 'checksum'>
  ): Promise<string> {
    await this.initialize()

    try {
      // Calculate checksum
      const checksum = this.calculateChecksum(migration.upSql)

      const result = await query(`
        INSERT INTO public.schema_migrations (
          version, name, description, migration_type,
          up_sql, down_sql, checksum, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        migration.version,
        migration.name,
        migration.description || null,
        migration.migrationType,
        migration.upSql,
        migration.downSql,
        checksum,
        migration.metadata ? JSON.stringify(migration.metadata) : null
      ])

      return result.rows[0]?.id
    } catch (error) {
      console.error('❌ Failed to create migration:', error)
      throw error
    }
  }

  async applyMigration(migrationId: string, userId: string): Promise<boolean> {
    await this.initialize()

    try {
      const migration = await this.getMigration(migrationId)
      if (!migration) {
        throw new Error('Migration not found')
      }

      if (migration.status === 'applied') {
        throw new Error('Migration has already been applied')
      }

      const startTime = Date.now()

      try {
        // Execute up SQL
        await query(migration.upSql)

        const executionTime = Date.now() - startTime

        // Update migration status
        await query(`
          UPDATE public.schema_migrations
          SET status = 'applied',
              applied_at = NOW(),
              applied_by = $1,
              execution_time = $2,
              error_message = NULL
          WHERE id = $3
        `, [userId, executionTime, migrationId])

        // Record in history
        await query(`
          INSERT INTO public.migration_history (
            migration_id, action, executed_by, execution_time, success
          ) VALUES ($1, 'apply', $2, $3, true)
        `, [migrationId, userId, executionTime])

        return true
      } catch (error: any) {
        const executionTime = Date.now() - startTime

        // Update migration status with error
        await query(`
          UPDATE public.schema_migrations
          SET status = 'failed',
              execution_time = $1,
              error_message = $2
          WHERE id = $3
        `, [executionTime, error.message, migrationId])

        // Record in history
        await query(`
          INSERT INTO public.migration_history (
            migration_id, action, executed_by, execution_time, success, error_message
          ) VALUES ($1, 'apply', $2, $3, false, $4)
        `, [migrationId, userId, executionTime, error.message])

        throw error
      }
    } catch (error) {
      console.error('❌ Failed to apply migration:', error)
      throw error
    }
  }

  async rollbackMigration(migrationId: string, userId: string): Promise<boolean> {
    await this.initialize()

    try {
      const migration = await this.getMigration(migrationId)
      if (!migration) {
        throw new Error('Migration not found')
      }

      if (migration.status !== 'applied') {
        throw new Error(`Cannot rollback migration with status: ${migration.status}`)
      }

      if (!migration.downSql || !migration.downSql.trim()) {
        throw new Error('Migration does not have rollback SQL')
      }

      const startTime = Date.now()

      try {
        // Execute down SQL
        await query(migration.downSql)

        const executionTime = Date.now() - startTime

        // Update migration status
        await query(`
          UPDATE public.schema_migrations
          SET status = 'rolled_back',
              rolled_back_at = NOW(),
              rolled_back_by = $1,
              execution_time = $2,
              error_message = NULL
          WHERE id = $3
        `, [userId, executionTime, migrationId])

        // Record in history
        await query(`
          INSERT INTO public.migration_history (
            migration_id, action, executed_by, execution_time, success
          ) VALUES ($1, 'rollback', $2, $3, true)
        `, [migrationId, userId, executionTime])

        return true
      } catch (error: any) {
        const executionTime = Date.now() - startTime

        // Record in history
        await query(`
          INSERT INTO public.migration_history (
            migration_id, action, executed_by, execution_time, success, error_message
          ) VALUES ($1, 'rollback', $2, $3, false, $4)
        `, [migrationId, userId, executionTime, error.message])

        throw error
      }
    } catch (error) {
      console.error('❌ Failed to rollback migration:', error)
      throw error
    }
  }

  async getMigration(id: string): Promise<SchemaMigration | null> {
    await this.initialize()

    try {
      const result = await query(`
        SELECT * FROM public.schema_migrations WHERE id = $1
      `, [id])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToMigration(result.rows[0])
    } catch (error) {
      console.error('❌ Failed to get migration:', error)
      return null
    }
  }

  async getMigrations(filters?: {
    status?: MigrationStatus
    limit?: number
    offset?: number
  }): Promise<SchemaMigration[]> {
    await this.initialize()

    try {
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (filters?.status) {
        conditions.push(`status = $${paramIndex++}`)
        params.push(filters.status)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const limit = filters?.limit || 50
      const offset = filters?.offset || 0

      const result = await query(`
        SELECT * FROM public.schema_migrations
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, [...params, limit, offset])

      return result.rows.map(row => this.mapRowToMigration(row))
    } catch (error) {
      console.error('❌ Failed to get migrations:', error)
      return []
    }
  }

  async getAppliedMigrations(): Promise<SchemaMigration[]> {
    return this.getMigrations({ status: 'applied' })
  }

  async getPendingMigrations(): Promise<SchemaMigration[]> {
    return this.getMigrations({ status: 'pending' })
  }

  async compareSchemas(beforeSql: string, afterSql: string): Promise<MigrationDiff> {
    // Simple diff implementation
    // In production, use a proper SQL parser and diff tool
    const beforeObjects = this.extractObjects(beforeSql)
    const afterObjects = this.extractObjects(afterSql)

    const added = afterObjects.filter(obj => !beforeObjects.includes(obj))
    const removed = beforeObjects.filter(obj => !afterObjects.includes(obj))
    const modified: string[] = []

    const details: MigrationDiff['details'] = [
      ...added.map(obj => ({ type: 'added' as const, object: obj })),
      ...removed.map(obj => ({ type: 'removed' as const, object: obj })),
      ...modified.map(obj => ({ type: 'modified' as const, object: obj }))
    ]

    return {
      added,
      removed,
      modified,
      details
    }
  }

  private extractObjects(sql: string): string[] {
    // Extract table and index names from SQL
    const objects: string[] = []
    
    // Extract CREATE TABLE
    const createTableMatches = sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi)
    for (const match of createTableMatches) {
      objects.push(`TABLE:${match[1]}`)
    }

    // Extract CREATE INDEX
    const createIndexMatches = sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi)
    for (const match of createIndexMatches) {
      objects.push(`INDEX:${match[1]}`)
    }

    return objects
  }

  private mapRowToMigration(row: any): SchemaMigration {
    return {
      id: row.id,
      version: row.version,
      name: row.name,
      description: row.description,
      migrationType: row.migration_type as MigrationType,
      upSql: row.up_sql,
      downSql: row.down_sql,
      checksum: row.checksum,
      appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
      appliedBy: row.applied_by,
      rolledBackAt: row.rolled_back_at ? new Date(row.rolled_back_at) : undefined,
      rolledBackBy: row.rolled_back_by,
      status: row.status as MigrationStatus,
      executionTime: row.execution_time,
      errorMessage: row.error_message,
      metadata: row.metadata,
      createdAt: new Date(row.created_at)
    }
  }

  private calculateChecksum(sql: string): string {
    // Simple checksum - in production, use proper hashing
    let hash = 0
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

// Export singleton instance
export const schemaMigration = new SchemaMigrationManager()

