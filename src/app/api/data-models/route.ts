import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'
import { requireAnySpaceAccess } from '@/lib/space-access'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
    limit: z.string().optional().transform((val) => parseInt(val || '10')).pipe(z.number().int().positive().max(100)).optional().default(10),
    search: z.string().optional().default(''),
    space_id: commonSchemas.id.optional(),
  }))

  if (!queryValidation.success) {
    return queryValidation.response
  }

  const { page, limit, search = '', space_id } = queryValidation.data
  let spaceId = space_id

  if (!spaceId) {
    // Fallback to user's default space
    const { rows: defaultSpace } = await query(
      `SELECT s.id FROM public.spaces s 
         JOIN public.space_members sm ON sm.space_id = s.id AND sm.user_id::text = $1
         WHERE s.is_default = true AND s.deleted_at IS NULL
         ORDER BY s.created_at DESC LIMIT 1`,
      [session.user.id]
    )
    spaceId = defaultSpace[0]?.id || null
    if (!spaceId) {
      logger.warn('Space ID is required', { userId: session.user.id })
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }
  }

  logger.apiRequest('GET', '/api/data-models', { userId: session.user.id, page, limit, search, spaceId })

  const offset = (page - 1) * limit
  const params: any[] = [spaceId]
  const filters: string[] = ['dm.deleted_at IS NULL', 'dms.space_id::text = $1']

  if (search) {
    params.push(`%${search}%`, `%${search}%`)
    filters.push('(dm.name ILIKE $' + (params.length - 1) + ' OR dm.description ILIKE $' + params.length + ')')
  }

  const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

  const listSql = `
      SELECT DISTINCT dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
             dm.is_active, dm.sort_order, dm.created_by,
             ARRAY_AGG(s.slug) as space_slugs,
             ARRAY_AGG(s.name) as space_names
      FROM public.data_models dm
      JOIN public.data_model_spaces dms ON dms.data_model_id::uuid = dm.id
      JOIN public.spaces s ON s.id = dms.space_id::uuid
      ${where}
      GROUP BY dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
               dm.is_active, dm.sort_order, dm.created_by
      ORDER BY dm.sort_order ASC, dm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

  const countSql = `
      SELECT COUNT(DISTINCT dm.id)::int AS total 
      FROM public.data_models dm
      JOIN public.data_model_spaces dms ON dms.data_model_id::uuid = dm.id
      ${where}
    `

  const [{ rows: dataModels }, { rows: totalRows }] = await Promise.all([
    query(listSql, params),
    query(countSql, params),
  ])

  const total = totalRows[0]?.total || 0
  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/data-models', 200, duration, { total })
  return NextResponse.json({
    dataModels: dataModels || [],
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/data-models')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    name: z.string().min(1, 'Name is required'),
    display_name: z.string().optional(),
    description: z.string().optional(),
    space_ids: z.array(commonSchemas.id).min(1, 'At least one space ID is required'),
  }))

  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { name, description, space_ids } = bodyValidation.data
  logger.apiRequest('POST', '/api/data-models', { userId: session.user.id, name, spaceIds: space_ids })

  // Check if user has access to all spaces
  const accessResult = await requireAnySpaceAccess(space_ids, session.user.id!)
  if (!accessResult.success) return accessResult.response

  // Create the data model
  const insertSql = `INSERT INTO public.data_models (name, description, created_by, is_active, sort_order)
                       VALUES ($1, $2, $3, $4, $5) RETURNING *`
  const { rows } = await query(insertSql, [
    name,
    description ?? null,
    session.user.id,
    true,
    0
  ])

  const dataModel = rows[0]

  // Associate the data model with all specified spaces
  for (const spaceId of space_ids) {
    await query(
      'INSERT INTO public.data_model_spaces (data_model_id, space_id) VALUES ($1, $2)',
      [dataModel.id, spaceId]
    )
  }

  const duration = Date.now() - startTime
  logger.apiResponse('POST', '/api/data-models', 201, duration, { dataModelId: dataModel.id })
  return NextResponse.json({ dataModel }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/data-models')


