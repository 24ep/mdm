/**
 * Query Performance Tracking and Analysis
 * Tracks query execution performance and identifies slow queries
 */

import { query } from '@/lib/db'

export interface QueryPerformanceRecord {
  id: string
  query: string
  queryHash: string
  executionTime: number
  rowCount: number
  timestamp: Date
  userId?: string
  userName?: string
  spaceId?: string
  status: 'success' | 'error'
  errorMessage?: string
  isSlow: boolean
}

export interface QueryPerformanceStats {
  queryHash: string
  query: string
  executionCount: number
  avgExecutionTime: number
  minExecutionTime: number
  maxExecutionTime: number
  totalExecutionTime: number
  avgRowCount: number
  slowQueryCount: number
  lastExecuted: Date
  firstExecuted: Date
}

export interface PerformanceTrend {
  date: string
  avgExecutionTime: number
  queryCount: number
  slowQueryCount: number
}

class QueryPerformanceTracker {
  private slowQueryThreshold: number = 1000 // 1 second in milliseconds

  async recordQueryExecution(record: Omit<QueryPerformanceRecord, 'id' | 'queryHash' | 'isSlow'>): Promise<void> {
    try {
      const queryHash = this.hashQuery(record.query)
      const isSlow = record.executionTime > this.slowQueryThreshold

      await query(`
        INSERT INTO query_performance (
          id, query, query_hash, execution_time, row_count, 
          timestamp, user_id, user_name, space_id, status, 
          error_message, is_slow
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, 
          $5, $6, $7, $8, $9, $10, $11
        )
      `, [
        record.query,
        queryHash,
        record.executionTime,
        record.rowCount,
        record.timestamp,
        record.userId || null,
        record.userName || null,
        record.spaceId || null,
        record.status,
        record.errorMessage || null,
        isSlow
      ])
    } catch (error) {
      console.error('Failed to record query performance:', error)
      // Don't throw - performance tracking shouldn't break query execution
    }
  }

  async getSlowQueries(limit: number = 50): Promise<QueryPerformanceRecord[]> {
    try {
      const { rows } = await query(`
        SELECT 
          id, query, query_hash, execution_time, row_count,
          timestamp, user_id, user_name, space_id, status,
          error_message, is_slow
        FROM query_performance
        WHERE is_slow = true
        ORDER BY execution_time DESC
        LIMIT $1
      `, [limit])

      return rows.map(this.mapRowToRecord)
    } catch (error) {
      console.error('Failed to get slow queries:', error)
      return []
    }
  }

  async getQueryStats(queryHash?: string, days: number = 7): Promise<QueryPerformanceStats[]> {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      let sql = `
        SELECT 
          query_hash,
          MAX(query) as query,
          COUNT(*) as execution_count,
          AVG(execution_time)::numeric(10,2) as avg_execution_time,
          MIN(execution_time) as min_execution_time,
          MAX(execution_time) as max_execution_time,
          SUM(execution_time) as total_execution_time,
          AVG(row_count)::numeric(10,2) as avg_row_count,
          SUM(CASE WHEN is_slow THEN 1 ELSE 0 END) as slow_query_count,
          MAX(timestamp) as last_executed,
          MIN(timestamp) as first_executed
        FROM query_performance
        WHERE timestamp >= $1
      `
      const params: any[] = [since]

      if (queryHash) {
        sql += ` AND query_hash = $2`
        params.push(queryHash)
      }

      sql += `
        GROUP BY query_hash
        ORDER BY execution_count DESC, avg_execution_time DESC
        LIMIT 100
      `

      const { rows } = await query(sql, params)

      return rows.map(row => ({
        queryHash: row.query_hash,
        query: row.query,
        executionCount: parseInt(row.execution_count),
        avgExecutionTime: parseFloat(row.avg_execution_time),
        minExecutionTime: parseInt(row.min_execution_time),
        maxExecutionTime: parseInt(row.max_execution_time),
        totalExecutionTime: parseInt(row.total_execution_time),
        avgRowCount: parseFloat(row.avg_row_count),
        slowQueryCount: parseInt(row.slow_query_count),
        lastExecuted: new Date(row.last_executed),
        firstExecuted: new Date(row.first_executed)
      }))
    } catch (error) {
      console.error('Failed to get query stats:', error)
      return []
    }
  }

  async getPerformanceTrends(days: number = 30): Promise<PerformanceTrend[]> {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { rows } = await query(`
        SELECT 
          DATE(timestamp) as date,
          AVG(execution_time)::numeric(10,2) as avg_execution_time,
          COUNT(*) as query_count,
          SUM(CASE WHEN is_slow THEN 1 ELSE 0 END) as slow_query_count
        FROM query_performance
        WHERE timestamp >= $1
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `, [since])

      return rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        avgExecutionTime: parseFloat(row.avg_execution_time),
        queryCount: parseInt(row.query_count),
        slowQueryCount: parseInt(row.slow_query_count)
      }))
    } catch (error) {
      console.error('Failed to get performance trends:', error)
      return []
    }
  }

  async getRecentQueries(limit: number = 100): Promise<QueryPerformanceRecord[]> {
    try {
      const { rows } = await query(`
        SELECT 
          id, query, query_hash, execution_time, row_count,
          timestamp, user_id, user_name, space_id, status,
          error_message, is_slow
        FROM query_performance
        ORDER BY timestamp DESC
        LIMIT $1
      `, [limit])

      return rows.map(this.mapRowToRecord)
    } catch (error) {
      console.error('Failed to get recent queries:', error)
      return []
    }
  }

  async getTopQueriesByExecutionTime(limit: number = 20): Promise<QueryPerformanceStats[]> {
    const stats = await this.getQueryStats(undefined, 7)
    return stats
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
      .slice(0, limit)
  }

  async getMostFrequentQueries(limit: number = 20): Promise<QueryPerformanceStats[]> {
    const stats = await this.getQueryStats(undefined, 7)
    return stats
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, limit)
  }

  private hashQuery(query: string): string {
    // Simple hash function - in production, use a proper hash like SHA-256
    let hash = 0
    const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ')
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private mapRowToRecord(row: any): QueryPerformanceRecord {
    return {
      id: row.id,
      query: row.query,
      queryHash: row.query_hash,
      executionTime: parseInt(row.execution_time),
      rowCount: parseInt(row.row_count),
      timestamp: new Date(row.timestamp),
      userId: row.user_id,
      userName: row.user_name,
      spaceId: row.space_id,
      status: row.status as 'success' | 'error',
      errorMessage: row.error_message,
      isSlow: row.is_slow
    }
  }

  async initializeTable(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS query_performance (
          id TEXT PRIMARY KEY,
          query TEXT NOT NULL,
          query_hash TEXT NOT NULL,
          execution_time INTEGER NOT NULL,
          row_count INTEGER NOT NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          user_id TEXT,
          user_name TEXT,
          space_id TEXT,
          status TEXT NOT NULL,
          error_message TEXT,
          is_slow BOOLEAN NOT NULL DEFAULT FALSE
        )
      `)

      // Create indexes for better query performance
      await query(`
        CREATE INDEX IF NOT EXISTS idx_query_performance_timestamp 
        ON query_performance(timestamp DESC)
      `)

      await query(`
        CREATE INDEX IF NOT EXISTS idx_query_performance_query_hash 
        ON query_performance(query_hash)
      `)

      await query(`
        CREATE INDEX IF NOT EXISTS idx_query_performance_is_slow 
        ON query_performance(is_slow) WHERE is_slow = true
      `)

      await query(`
        CREATE INDEX IF NOT EXISTS idx_query_performance_execution_time 
        ON query_performance(execution_time DESC)
      `)
    } catch (error) {
      console.error('Failed to initialize query_performance table:', error)
    }
  }

  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold
  }

  getSlowQueryThreshold(): number {
    return this.slowQueryThreshold
  }
}

// Export singleton instance
export const queryPerformanceTracker = new QueryPerformanceTracker()

// Initialize table on module load
if (typeof window === 'undefined') {
  queryPerformanceTracker.initializeTable().catch(console.error)
}

