import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPerformanceTracker } from '@/lib/query-performance'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('GET', '/api/admin/query-performance', { userId: session.user.id })

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      logger.warn('Insufficient permissions for query performance', { userId: session.user.id, role: session.user.role })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }))
    }

    const querySchema = z.object({
      type: z.enum(['slow', 'stats', 'trends', 'top-by-time', 'most-frequent', 'recent']).optional().default('recent'),
      limit: z.string().transform(Number).pipe(z.number().int().positive().max(1000)).optional().default('50'),
      days: z.string().transform(Number).pipe(z.number().int().positive().max(365)).optional().default('7'),
      queryHash: z.string().optional(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { type, limit, days, queryHash } = queryValidation.data

    let data: any
    switch (type) {
      case 'slow':
        data = await queryPerformanceTracker.getSlowQueries(limit)
        break

      case 'stats':
        data = await queryPerformanceTracker.getQueryStats(queryHash, days)
        break

      case 'trends':
        data = await queryPerformanceTracker.getPerformanceTrends(days)
        break

      case 'top-by-time':
        data = await queryPerformanceTracker.getTopQueriesByExecutionTime(limit)
        break

      case 'most-frequent':
        data = await queryPerformanceTracker.getMostFrequentQueries(limit)
        break

      case 'recent':
      default:
        data = await queryPerformanceTracker.getRecentQueries(limit)
        break
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/admin/query-performance', 200, duration, { type })
    return addSecurityHeaders(NextResponse.json({ success: true, data }))
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/admin/query-performance', 500, duration)
    return handleApiError(error, 'Query Performance API GET')
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('POST', '/api/admin/query-performance', { userId: session.user.id })

    const bodySchema = z.object({
      query: z.string().min(1),
      executionTime: z.number().nonnegative(),
      rowCount: z.number().int().nonnegative().optional(),
      status: z.string().optional(),
      errorMessage: z.string().optional().nullable(),
      spaceId: z.string().uuid().optional().nullable(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const {
      query: sqlQuery,
      executionTime,
      rowCount,
      status,
      errorMessage,
      spaceId
    } = bodyValidation.data

    await queryPerformanceTracker.recordQueryExecution({
      query: sqlQuery,
      executionTime,
      rowCount: rowCount || 0,
      timestamp: new Date(),
      userId: session.user.id,
      userName: session.user.name || undefined,
      spaceId: spaceId || null,
      status: status || 'success',
      errorMessage: errorMessage || null
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/admin/query-performance', 200, duration)
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/admin/query-performance', 500, duration)
    return handleApiError(error, 'Query Performance API POST')
  }
}









