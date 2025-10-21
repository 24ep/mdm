// Legacy database connection - kept for backward compatibility
import { Pool } from 'pg'
import { prisma } from './prisma'

let pool: Pool | null = null

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
    console.log('🔗 PostgreSQL Database connection string:', connectionString)
    pool = new Pool({ 
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
    })
  }
  return pool
}

// Legacy query function - kept for backward compatibility
export async function query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[] }>{
  const client = await getDbPool().connect()
  try {
    const res = await client.query(text, params)
    return { rows: res.rows as T[] }
  } finally {
    client.release()
  }
}

// Export Prisma client for new ORM usage
export { prisma }


