import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Raw SQL query function for compatibility with existing code
export async function query(sql: string, params: any[] = []) {
  try {
    const result = await db.$queryRawUnsafe(sql, ...params)
    return { rows: Array.isArray(result) ? result : [result] }
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}