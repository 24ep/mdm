import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
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

    logger.apiRequest('GET', '/api/sources', { userId: session.user.id })

    const querySchema = z.object({
      page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default(20),
      search: z.string().optional().default(''),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { page, limit, search } = queryValidation.data
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {
      deletedAt: null
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Note: Source model doesn't exist in Prisma schema
    // Returning empty result for now
    const sources: any[] = []
    const total = 0

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/sources', 200, duration, {
      count: sources.length,
      page,
      limit,
    })
    return addSecurityHeaders(NextResponse.json({
      sources: sources || [],
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) },
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/sources', 500, duration)
    return handleApiError(error, 'Sources API')
  }
}


