import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    dataModel: z.string().optional(),
    isPublic: z.string().transform((val) => val === 'true').optional(),
  }))
  
  if (!queryValidation.success) {
    return queryValidation.response
  }
    
    const { dataModel, isPublic } = queryValidation.data
    logger.apiRequest('GET', '/api/export-profiles', { userId: session.user.id, dataModel })
    
    // Build where clause
    const whereClauses: string[] = []
    const params: any[] = []
    if (dataModel) {
      params.push(dataModel)
      whereClauses.push(`ep.data_model = $${params.length}`)
    }
    if (isPublic !== undefined) {
      params.push(isPublic)
      whereClauses.push(`ep.is_public = $${params.length}`)
    }
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const sql = `
      SELECT
        ep.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', eps.id,
              'sharing_type', eps.sharing_type,
              'target_id', eps.target_id,
              'target_group', eps.target_group
            )
          ) FILTER (WHERE eps.id IS NOT NULL),
          '[]'::json
        ) AS export_profile_sharing
      FROM export_profiles ep
      LEFT JOIN export_profile_sharing eps ON eps.profile_id = ep.id
      ${whereSql}
      GROUP BY ep.id
      ORDER BY ep.created_at DESC
    `

    const { rows } = await query(sql, params)
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/export-profiles', 200, duration, { count: rows.length })
    return NextResponse.json({ profiles: rows })
}

export const GET = withErrorHandling(getHandler, 'GET /api/export-profiles')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    dataModel: z.string().min(1, 'Data model is required'),
    format: z.string().min(1, 'Format is required'),
    columns: z.array(z.any()).optional(),
    filters: z.any().optional(),
    isPublic: z.boolean().optional().default(false),
    sharing: z.any().optional(),
  }))
  
  if (!bodyValidation.success) {
    return bodyValidation.response
  }
  
  logger.apiRequest('POST', '/api/export-profiles', { userId: session.user.id, name: bodyValidation.data.name })

  // ExportProfile model doesn't exist in Prisma schema
  const duration = Date.now() - startTime
  logger.apiResponse('POST', '/api/export-profiles', 501, duration)
  return NextResponse.json(
    { error: 'Export profile model not implemented' },
    { status: 501 }
  )
}

export const POST = withErrorHandling(postHandler, 'POST /api/export-profiles')
