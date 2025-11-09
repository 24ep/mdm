/**
 * Database Query Helpers
 * Enhanced query utilities building on top of Prisma
 */

import { db, query } from './db'
import { Prisma } from '@prisma/client'

/**
 * Query result with metadata
 */
export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
  executionTime: number
}

/**
 * Query options
 */
export interface QueryOptions {
  timeout?: number
  logQuery?: boolean
}

/**
 * Enhanced query function with better error handling and logging
 */
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = [],
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const startTime = Date.now()
  const { timeout = 30000, logQuery = true } = options

  try {
    if (logQuery && process.env.NODE_ENV === 'development') {
      console.log('[DB Query]', {
        sql: sql.substring(0, 200),
        params: params.length,
        timeout,
      })
    }

    const result = await query(sql, params, timeout)
    const executionTime = Date.now() - startTime

    return {
      rows: result.rows as T[],
      rowCount: result.rows?.length || 0,
      executionTime,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('[DB Query Error]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sql: sql.substring(0, 200),
      params: params.length,
      executionTime,
    })
    throw error
  }
}

/**
 * Execute a transaction
 */
export async function executeTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await db.$transaction(callback, {
    maxWait: 5000,
    timeout: 10000,
  })
}

/**
 * Check if a record exists
 */
export async function recordExists(
  table: string,
  where: Record<string, any>
): Promise<boolean> {
  const conditions = Object.entries(where)
    .map(([key, value], index) => `${key}::text = $${index + 1}`)
    .join(' AND ')

  const values = Object.values(where)
  const sql = `SELECT 1 FROM ${table} WHERE ${conditions} LIMIT 1`

  try {
    const result = await query(sql, values)
    return (result.rows?.length || 0) > 0
  } catch (error) {
    console.error(`[recordExists] Error checking ${table}:`, error)
    return false
  }
}

/**
 * Get count of records
 */
export async function getRecordCount(
  table: string,
  where?: Record<string, any>
): Promise<number> {
  let sql = `SELECT COUNT(*) as count FROM ${table}`
  const params: any[] = []

  if (where && Object.keys(where).length > 0) {
    const conditions = Object.entries(where)
      .map(([key, value], index) => {
        params.push(value)
        return `${key}::text = $${index + 1}`
      })
      .join(' AND ')
    sql += ` WHERE ${conditions}`
  }

  try {
    const result = await query(sql, params)
    return parseInt(result.rows?.[0]?.count || '0', 10)
  } catch (error) {
    console.error(`[getRecordCount] Error counting ${table}:`, error)
    return 0
  }
}

/**
 * Paginate query results
 */
export interface PaginationOptions {
  page: number
  pageSize: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export async function paginateQuery<T = any>(
  baseSql: string,
  params: any[] = [],
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page, pageSize, orderBy, orderDirection = 'ASC' } = options
  const offset = (page - 1) * pageSize

  // Count query
  const countSql = `SELECT COUNT(*) as count FROM (${baseSql}) as subquery`
  const countResult = await query(countSql, params)
  const total = parseInt(countResult.rows?.[0]?.count || '0', 10)

  // Data query
  let dataSql = baseSql
  if (orderBy) {
    dataSql += ` ORDER BY ${orderBy} ${orderDirection}`
  }
  dataSql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  const dataParams = [...params, pageSize, offset]

  const dataResult = await query(dataSql, dataParams)

  const totalPages = Math.ceil(total / pageSize)

  return {
    data: dataResult.rows as T[],
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Batch insert helper
 */
export async function batchInsert<T extends Record<string, any>>(
  table: string,
  records: T[],
  batchSize: number = 100
): Promise<number> {
  if (records.length === 0) return 0

  const columns = Object.keys(records[0])
  let inserted = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const values: any[] = []
    const placeholders: string[] = []

    batch.forEach((record, batchIndex) => {
      const recordPlaceholders: string[] = []
      columns.forEach((col, colIndex) => {
        const paramIndex = batchIndex * columns.length + colIndex + 1
        recordPlaceholders.push(`$${paramIndex}`)
        values.push(record[col])
      })
      placeholders.push(`(${recordPlaceholders.join(', ')})`)
    })

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`
    await query(sql, values)
    inserted += batch.length
  }

  return inserted
}

