import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SQLExecutor } from '@/lib/sql-executor'
import { createExternalClient } from '@/lib/external-db'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const sqlExecutor = new SQLExecutor()

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 30 // 30 queries per minute

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let userId: string | null = null

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    userId = session.user.id

    // Rate limiting
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before executing more queries.',
          rateLimit: { remaining: 0, resetTime: RATE_LIMIT_WINDOW }
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { query: sqlQuery, connection, spaceId } = body

    if (!sqlQuery || !sqlQuery.trim()) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 })
    }

    // Validate query
    const validation = await sqlExecutor.validateQuery(sqlQuery.trim())
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid SQL query' },
        { status: 400 }
      )
    }

    // Set timeout (30 seconds default, configurable)
    const timeout = 30000
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout: Execution exceeded 30 seconds')), timeout)
    })

    let result

    // Execute query based on connection type
    if (!connection || connection === 'default') {
      // Default connection (main database)
      const queryPromise = sqlExecutor.executeQuery(sqlQuery.trim(), {
        limit: 10000, // Max 10k rows
        timeout
      })
      result = await Promise.race([queryPromise, timeoutPromise])
    } else {
      // External connection
      const connectionConfig = await prisma.externalConnection.findFirst({
        where: {
          id: connection,
          isActive: true,
          deletedAt: null,
          OR: [
            { spaceId: null }, // Global connections accessible to all
            ...(spaceId ? [
              { spaceId },
              { space: { members: { some: { userId } } } }
            ] : [])
          ]
        }
      })

      if (!connectionConfig) {
        return NextResponse.json(
          { error: 'External connection not found or inactive' },
          { status: 404 }
        )
      }

      // Create external client with Vault credential retrieval
      const { createExternalClientWithCredentials } = await import('@/lib/external-connection-helper')
      const externalClient = await createExternalClientWithCredentials({
        id: connectionConfig.id,
        db_type: connectionConfig.dbType as 'postgres' | 'mysql',
        host: connectionConfig.host,
        port: connectionConfig.port || undefined,
        database: connectionConfig.database || undefined,
        username: connectionConfig.username,
        password: connectionConfig.password,
        options: connectionConfig.options as any
      })

      try {
        // Validate query for external connection
        const validation = await sqlExecutor.validateQuery(sqlQuery.trim())
        if (!validation.valid) {
          await externalClient.close()
          return NextResponse.json(
            { error: validation.error || 'Invalid SQL query' },
            { status: 400 }
          )
        }

        // Execute with timeout
        const queryPromise = (async () => {
          const queryResult = await externalClient.query(sqlQuery.trim())
          
          // Process result
          const data = queryResult.rows || []
          const columns = data.length > 0 ? Object.keys(data[0]) : []
          const executionTime = Date.now() - startTime

          return {
            success: true,
            data,
            columns,
            rowCount: data.length,
            columnCount: columns.length,
            executionTime,
            query: sqlQuery.trim()
          }
        })()

        result = await Promise.race([queryPromise, timeoutPromise])
      } finally {
        await externalClient.close()
      }
    }

    const executionTime = Date.now() - startTime

    // Format result for frontend
    const formattedResult = {
      data: result.data || [],
      columns: result.columns || [],
      rowCount: result.rowCount || 0,
      columnCount: result.columns?.length || 0,
      preview: {
        columns: result.columns || [],
        data: (result.data || []).slice(0, 100).map((row: any) => 
          result.columns?.map((col: string) => row[col]) || []
        )
      },
      executionTime: result.executionTime || executionTime
    }

    // Log successful execution
    console.log(`[SQL Execution] User: ${userId}, Time: ${executionTime}ms, Rows: ${result.rowCount || 0}, Connection: ${connection || 'default'}`)

    return NextResponse.json({
      success: true,
      ...formattedResult,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetTime: RATE_LIMIT_WINDOW
      }
    })
  } catch (error: any) {
    const executionTime = Date.now() - startTime
    
    // Log error
    console.error(`[SQL Execution Error] User: ${userId}, Time: ${executionTime}ms, Error:`, error)

    // Handle timeout
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Query execution timeout. The query took too long to execute.',
          executionTime
        },
        { status: 408 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'SQL execution failed',
        executionTime
      },
      { status: 500 }
    )
  }
}

