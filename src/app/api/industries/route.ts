import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
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
    logger.apiRequest('GET', '/api/industries', { userId: session.user.id, page, limit, search })

    const offset = (page - 1) * limit

    const filters: string[] = ['deleted_at IS NULL']
    const params: any[] = []
    if (search) {
      params.push(`%${search}%`)
      filters.push(`name ILIKE $${params.length}`)
    }
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

    const dataSql = `
      SELECT id, name, description, parent_id
      FROM industries
      ${where}
      ORDER BY name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const countSql = `SELECT COUNT(*)::int AS total FROM industries ${where}`

    const [{ rows: industries }, { rows: totals }] = await Promise.all([
      query(dataSql, [...params, limit, offset]),
      query(countSql, params),
    ])

    const total = totals[0]?.total || 0

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/industries', 200, duration, { total })
    return addSecurityHeaders(NextResponse.json({
      industries: industries || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/industries', 500, duration)
    return handleApiError(error, 'Industries API GET')
  }
}


