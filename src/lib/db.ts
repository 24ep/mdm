import { PrismaClient, Prisma } from '@prisma/client'

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
 */
export async function query(sql: string, params: any[] = [], timeout: number = 30000) {
  try {
    // Add timeout wrapper
    const queryPromise = db.$queryRawUnsafe(sql, ...params)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeout)
    )
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any
    return { rows: Array.isArray(result) ? result : [result] }
  } catch (error: any) {
    // Suppress logging for expected "table does not exist" errors (42P01)
    // This is normal when migrations haven't run yet or tables are optional
    const isTableMissing = error?.code === '42P01' || 
                         error?.meta?.code === '42P01' ||
                         (typeof error?.message === 'string' && error.message.includes('does not exist'))
    
    if (!isTableMissing) {
      console.error('Database query error:', error)
      console.error('Query:', sql.substring(0, 200))
      console.error('Params:', params)
    }
    throw error
  }
}