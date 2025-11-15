import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery } from '@/lib/api-validation'
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

    // Validate query parameters
    const queryValidation = validateQuery(request, z.object({
      page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().optional().transform((val) => parseInt(val || '50')).pipe(z.number().int().positive().max(100)).optional().default(50),
      search: z.string().optional().default(''),
    }))
    
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }
    
    const { page, limit = 50, search = '' } = queryValidation.data
    logger.apiRequest('GET', '/api/business-profiles', { userId: session.user.id, page, limit, search })

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

    // BusinessProfile model doesn't exist in Prisma schema
    // Returning empty results for now
    const businessProfiles: any[] = []
    const total = 0

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/business-profiles', 200, duration, { total })
    return addSecurityHeaders(NextResponse.json({
      businessProfiles: businessProfiles || [],
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) },
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/business-profiles', 500, duration)
    return handleApiError(error, 'Business Profiles API GET')
  }
}


