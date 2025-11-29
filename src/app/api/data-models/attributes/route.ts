import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate query parameters
    const queryValidation = validateQuery(request, z.object({
      data_model_id: commonSchemas.id,
      page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().optional().transform((val) => parseInt(val || '20')).pipe(z.number().int().positive().max(100)).optional().default(20),
    }))
    
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }
    
    const { data_model_id: dataModelId, page, limit = 20 } = queryValidation.data
    logger.apiRequest('GET', '/api/data-models/attributes', { userId: session.user.id, dataModelId, page, limit })

    const offset = (page - 1) * limit
    const listSql = `
      SELECT * FROM public.data_model_attributes
      WHERE data_model_id = $1::uuid AND is_active = TRUE
      ORDER BY "order" ASC
      LIMIT $2 OFFSET $3
    `
    const countSql = `
      SELECT COUNT(*)::int AS total FROM public.data_model_attributes
      WHERE data_model_id = $1::uuid AND is_active = TRUE
    `
    const [{ rows: attributes }, { rows: totals }] = await Promise.all([
      query(listSql, [dataModelId, limit, offset]),
      query(countSql, [dataModelId]),
    ])
    const total = totals[0]?.total || 0
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/data-models/attributes', 200, duration, { total })
  return addSecurityHeaders(NextResponse.json({
    attributes: attributes || [],
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }))
}













export const GET = withErrorHandling(getHandler, 'GET /api/data-models/attributes')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      data_model_id: commonSchemas.id,
      name: z.string().min(1, 'Name is required'),
      display_name: z.string().min(1, 'Display name is required'),
      type: z.string().min(1, 'Type is required'),
      is_required: z.boolean().optional().default(false),
      is_unique: z.boolean().optional().default(false),
      default_value: z.any().optional().nullable(),
      options: z.any().optional().nullable(),
      validation: z.any().optional().nullable(),
      order: z.number().int().nonnegative().optional().default(0),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { data_model_id, name, display_name, type, is_required = false, is_unique = false, default_value, options, validation, order = 0 } = bodyValidation.data
    logger.apiRequest('POST', '/api/data-models/attributes', { userId: session.user.id, dataModelId: data_model_id, name })

    // Map type to uppercase for database enum
    const typeMapping: Record<string, string> = {
      'text': 'TEXT',
      'number': 'NUMBER', 
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'email': 'EMAIL',
      'phone': 'PHONE',
      'url': 'URL',
      'select': 'SELECT',
      'multi_select': 'MULTI_SELECT',
      'textarea': 'TEXTAREA',
      'json': 'JSON',
      'user': 'USER',
      'user_multi': 'USER_MULTI'
    }
    const mappedType = typeMapping[type?.toLowerCase()] || type?.toUpperCase() || 'TEXT'

    const insertSql = `
      INSERT INTO public.data_model_attributes
      (data_model_id, name, display_name, type, is_required, is_unique, default_value, options, validation, "order")
      VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `
    const { rows } = await query(insertSql, [
      data_model_id,
      name,
      display_name,
      mappedType,
      !!is_required,
      !!is_unique,
      default_value ?? null,
      options ? JSON.stringify(options) : null,
      validation ? JSON.stringify(validation) : null,
      order ?? 0,
    ])
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/data-models/attributes', 201, duration, { attributeId: rows[0].id })
  return addSecurityHeaders(NextResponse.json({ attribute: rows[0] }, { status: 201 }))
}

export const POST = withErrorHandling(postHandler, 'POST /api/data-models/attributes')











