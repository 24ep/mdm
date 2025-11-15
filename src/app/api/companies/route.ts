import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody } from '@/lib/api-validation'
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
      limit: z.string().optional().transform((val) => parseInt(val || '10')).pipe(z.number().int().positive().max(100)).optional().default(10),
      search: z.string().optional().default(''),
    }))
    
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }
    
    const { page, limit = 10, search = '' } = queryValidation.data
    logger.apiRequest('GET', '/api/companies', { userId: session.user.id, page, limit, search })

    const offset = (page - 1) * limit

    const whereClauses: string[] = ['deleted_at IS NULL']
    const params: any[] = []
    if (search) {
      whereClauses.push('(name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 2) + ')')
      params.push(`%${search}%`, `%${search}%`)
    }
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const companiesSql = `
      SELECT c.*,
             (
               SELECT COUNT(*)::int
               FROM customers cu
               WHERE cu.company_id = c.id AND cu.deleted_at IS NULL
             ) AS customers_count
      FROM companies c
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM companies c
      ${whereSql}
    `

    const companiesRes = await query(companiesSql, [...params, limit, offset])
    const countRes = await query(countSql, params)
    const companies = companiesRes.rows
    const total = countRes.rows[0]?.total || 0
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/companies', 200, duration, { total })
    return addSecurityHeaders(NextResponse.json({
      companies: companies || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/companies', 500, duration)
    return handleApiError(error, 'Companies API GET')
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      name: z.string().min(1, 'Company name is required'),
      description: z.string().optional(),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { name, description } = bodyValidation.data
    logger.apiRequest('POST', '/api/companies', { userId: session.user.id, name })

    // Check if company already exists
    const existing = await query(
      'SELECT id FROM companies WHERE name = $1 AND deleted_at IS NULL LIMIT 1',
      [name]
    )

    if (existing.rows[0]) {
      logger.warn('Company with this name already exists', { name })
      return addSecurityHeaders(NextResponse.json(
        { error: 'Company with this name already exists' },
        { status: 400 }
      ))
    }

    const inserted = await query(
      'INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING *',
      [name, description ?? null]
    )
    const company = inserted.rows[0]

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, new_value, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['CREATE', 'Company', company.id, company, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/companies', 201, duration, { companyId: company.id })
    return addSecurityHeaders(NextResponse.json(company, { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/companies', 500, duration)
    return handleApiError(error, 'Companies API POST')
  }
}
