import { PrismaClient, Prisma } from '@prisma/client'
import { createChildSpan } from './tracing-middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Log DATABASE_URL in development (without password)
if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    // Database URL is set
  } else {
    console.warn('⚠️  DATABASE_URL is not set!')
  }
}

export const db = globalForPrisma.prisma ?? new PrismaClient()
export const prisma = db // Alias for compatibility

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Raw SQL query function for compatibility with existing code
 * 
 * IMPORTANT: Prisma's $queryRawUnsafe passes parameters as TEXT type
 * For UUID comparisons, you MUST cast the COLUMN to text, not the parameter:
 * - ✅ CORRECT: WHERE id::text = $1
 * - ❌ WRONG: WHERE id = CAST($1 AS uuid) or WHERE id = $1::uuid
 * 
 * This is due to how Prisma binds parameters. Function indexes have been created
 * (migration 054) to maintain query performance when using column::text = $1 pattern.
 * 
 * The function indexes allow PostgreSQL to use indexes even when columns are cast to text,
 * so this approach is both correct AND performant.
 * 
 * @param sql SQL query with $n placeholders
 * @param params Array of parameters (Prisma passes these as text)
 * @param timeout Query timeout in milliseconds (default: 30000)
 * @param options Additional options
 */
export async function query(
  sql: string,
  params: any[] = [],
  timeout: number = 30000,
  options: { skipTracing?: boolean } = {}
) {
  const startTime = Date.now()
  const queryPreview = sql.substring(0, 200).replace(/\s+/g, ' ').trim()
  const operation = sql.trim().split(/\s+/)[0].toUpperCase() || 'QUERY'

  try {
    // Skip tracing if requested (prevents recursion loops with SigNoz config fetch)
    if (options.skipTracing) {
      const result = await (async () => {
        const queryPromise = db.$queryRawUnsafe(sql, ...params)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
        return await Promise.race([queryPromise, timeoutPromise]) as any
      })()
      return { rows: Array.isArray(result) ? result : [result] }
    }

    // Create a database span for tracing
    const result = await createChildSpan(
      `db.${operation.toLowerCase()}`,
      async () => {
        // Add timeout wrapper
        const queryPromise = db.$queryRawUnsafe(sql, ...params)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )

        return await Promise.race([queryPromise, timeoutPromise]) as any
      },
      {
        attributes: {
          'db.statement': queryPreview,
          'db.statement.length': sql.length,
          'db.params.count': params.length
        }
      }
    )

    const duration = Date.now() - startTime
    const rowCount = Array.isArray(result) ? result.length : (result ? 1 : 0)

    // Send database query metric to SigNoz
    try {
      const { sendMetricToSigNoz, isSigNozEnabled } = await import('./signoz-client')
      const enabled = await isSigNozEnabled()

      if (enabled) {
        // Send query duration metric
        sendMetricToSigNoz({
          name: 'db.query.duration',
          value: duration,
          type: 'histogram',
          unit: 'ms',
          attributes: {
            operation,
            'db.query.type': operation,
            'db.query.length': sql.length,
            'db.query.rows': rowCount
          }
        }).catch(() => { })

        // Send query count metric
        sendMetricToSigNoz({
          name: 'db.query.count',
          value: 1,
          type: 'counter',
          attributes: {
            operation
          }
        }).catch(() => { })
      }
    } catch (error) {
      // Silently fail - don't break queries if tracing fails
    }

    return { rows: Array.isArray(result) ? result : [result] }
  } catch (error: any) {
    const duration = Date.now() - startTime

    // Send error metric to SigNoz
    if (!options.skipTracing) {
      try {
        const { sendMetricToSigNoz, isSigNozEnabled } = await import('./signoz-client')
        const enabled = await isSigNozEnabled()

        if (enabled) {
          sendMetricToSigNoz({
            name: 'db.query.errors',
            value: 1,
            type: 'counter',
            attributes: {
              operation,
              'error.type': error?.code || 'unknown',
              'error.message': error?.message?.substring(0, 100) || 'unknown'
            }
          }).catch(() => { })
        }
      } catch (traceError) {
        // Silently fail
      }
    }

    // Suppress logging for expected "table does not exist" errors (42P01)
    // This is normal when migrations haven't run yet or tables are optional
    const isTableMissing = error?.code === '42P01' ||
      error?.meta?.code === '42P01' ||
      (typeof error?.message === 'string' && error.message.includes('does not exist'))

    if (!isTableMissing) {
      console.error('Database query error:', error)
      console.error('Query:', queryPreview)
      console.error('Params:', params)
      console.error('Duration:', duration, 'ms')
    }
    throw error
  }
}