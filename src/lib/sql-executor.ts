import { PrismaClient } from '@prisma/client'

export interface QueryExecutionResult {
  success: boolean
  data?: any[]
  columns?: string[]
  rowCount?: number
  executionTime?: number
  error?: string
  query?: string
}

export interface QueryExecutionOptions {
  limit?: number
  timeout?: number
  dryRun?: boolean
}

export class SQLExecutor {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async executeQuery(
    sql: string, 
    options: QueryExecutionOptions = {}
  ): Promise<QueryExecutionResult> {
    const startTime = Date.now()
    
    try {
      // Validate SQL query
      if (!this.isValidSQL(sql)) {
        return {
          success: false,
          error: 'Invalid SQL query. Only SELECT statements are allowed.'
        }
      }

      // Add LIMIT if not present and limit is specified
      let processedSQL = sql
      if (options.limit && !sql.toLowerCase().includes('limit')) {
        processedSQL = `${sql} LIMIT ${options.limit}`
      }

      // Execute the query
      const result = await this.prisma.$queryRawUnsafe(processedSQL)
      
      const executionTime = Date.now() - startTime

      // Process the result
      const data = Array.isArray(result) ? result : [result]
      const columns = data.length > 0 ? Object.keys(data[0]) : []

      return {
        success: true,
        data,
        columns,
        rowCount: data.length,
        executionTime,
        query: processedSQL
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime
      
      return {
        success: false,
        error: this.formatError(error),
        executionTime,
        query: sql
      }
    }
  }

  async executeQueryWithConnection(
    sql: string,
    connectionId: string,
    options: QueryExecutionOptions = {}
  ): Promise<QueryExecutionResult> {
    // In a real implementation, this would:
    // 1. Get the external connection details
    // 2. Establish connection to the external database
    // 3. Execute the query on the external database
    // 4. Return the results

    // Mock implementation
    return {
      success: true,
      data: [
        { id: 1, name: 'Sample Data', value: 100 },
        { id: 2, name: 'Another Row', value: 200 }
      ],
      columns: ['id', 'name', 'value'],
      rowCount: 2,
      executionTime: 150,
      query: sql
    }
  }

  private isValidSQL(sql: string): boolean {
    const trimmedSQL = sql.trim().toLowerCase()
    
    // Only allow SELECT statements
    if (!trimmedSQL.startsWith('select')) {
      return false
    }

    // Block dangerous operations
    const dangerousKeywords = [
      'drop', 'delete', 'insert', 'update', 'create', 'alter',
      'truncate', 'grant', 'revoke', 'exec', 'execute',
      'sp_', 'xp_', '--', '/*', '*/'
    ]

    return !dangerousKeywords.some(keyword => trimmedSQL.includes(keyword))
  }

  private formatError(error: any): string {
    if (error.code) {
      return `Database Error (${error.code}): ${error.message}`
    }
    return error.message || 'Unknown database error'
  }

  async getQueryPlan(sql: string): Promise<QueryExecutionResult> {
    try {
      // Get query execution plan
      const planSQL = `EXPLAIN ${sql}`
      const result = await this.prisma.$queryRawUnsafe(planSQL)
      
      return {
        success: true,
        data: Array.isArray(result) ? result : [result],
        query: planSQL
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
        query: sql
      }
    }
  }

  async validateQuery(sql: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Try to parse the query without executing it
      if (!this.isValidSQL(sql)) {
        return {
          valid: false,
          error: 'Invalid SQL syntax or dangerous operations detected'
        }
      }

      // In a real implementation, you might use a SQL parser here
      return { valid: true }
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      }
    }
  }

  async getTableSchema(tableName: string): Promise<QueryExecutionResult> {
    try {
      const sql = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `
      
      const result = await this.prisma.$queryRawUnsafe(sql)
      
      return {
        success: true,
        data: Array.isArray(result) ? result : [result],
        columns: ['column_name', 'data_type', 'is_nullable', 'column_default', 'character_maximum_length']
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error)
      }
    }
  }

  async getAvailableTables(): Promise<QueryExecutionResult> {
    try {
      const sql = `
        SELECT 
          table_name,
          table_type,
          table_schema
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_name
      `
      
      const result = await this.prisma.$queryRawUnsafe(sql)
      
      return {
        success: true,
        data: Array.isArray(result) ? result : [result],
        columns: ['table_name', 'table_type', 'table_schema']
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error)
      }
    }
  }
}
