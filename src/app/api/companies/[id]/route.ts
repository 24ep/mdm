import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/companies/${id}`, { userId: session.user.id })

    const res = await query(
      `SELECT c.*,
              COALESCE(
                (
                  SELECT json_agg(cu ORDER BY cu.created_at DESC)
                  FROM customers cu
                  WHERE cu.company_id = c.id AND cu.deleted_at IS NULL
                ), '[]'::json
              ) AS customers
       FROM companies c
       WHERE c.id = $1 AND c.deleted_at IS NULL
       LIMIT 1`,
      [id]
    )

    const company = res.rows[0]
    if (!company) {
      logger.warn('Company not found', { companyId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Company not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/companies/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json(company))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Company API GET')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      is_active: z.boolean().optional(),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { name, description, is_active } = bodyValidation.data
    logger.apiRequest('PUT', `/api/companies/${id}`, { userId: session.user.id })

    const current = await query('SELECT * FROM companies WHERE id = $1 LIMIT 1', [id])
    const currentCompany = current.rows[0]
    if (!currentCompany) {
      logger.warn('Company not found for update', { companyId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Company not found' }, { status: 404 }))
    }

    if (name && name !== currentCompany.name) {
      const existing = await query(
        'SELECT id FROM companies WHERE name = $1 AND deleted_at IS NULL AND id <> $2 LIMIT 1',
        [name, id]
      )
      if (existing.rows[0]) {
        logger.warn('Company with this name already exists', { name, companyId: id })
        return addSecurityHeaders(NextResponse.json(
          { error: 'Company with this name already exists' },
          { status: 400 }
        ))
      }
    }

    const updated = await query(
      'UPDATE companies SET name = $1, description = $2, is_active = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name ?? currentCompany.name, description ?? currentCompany.description, typeof is_active === 'boolean' ? is_active : currentCompany.is_active, id]
    )

    const updatedCompany = updated.rows[0]

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, old_value, new_value, user_id) VALUES ($1,$2,$3,$4,$5,$6)',
      ['UPDATE', 'Company', id, currentCompany, updatedCompany, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/companies/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json(updatedCompany))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Company API PUT')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/companies/${id}`, { userId: session.user.id })

    const cnt = await query(
      'SELECT COUNT(*)::int AS total FROM customers WHERE company_id = $1 AND deleted_at IS NULL',
      [id]
    )
    if ((cnt.rows[0]?.total || 0) > 0) {
      logger.warn('Cannot delete company with associated customers', { companyId: id, customerCount: cnt.rows[0]?.total })
      return addSecurityHeaders(NextResponse.json(
        { error: 'Cannot delete company with associated customers' },
        { status: 400 }
      ))
    }

    await query(
      'UPDATE companies SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, user_id) VALUES ($1,$2,$3,$4)',
      ['DELETE', 'Company', id, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/companies/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ message: 'Company deleted successfully' }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Company API DELETE')
  }
}
