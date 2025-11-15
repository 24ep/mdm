import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
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
    if (!session?.user?.id) {
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
    logger.apiRequest('GET', `/api/customers/${id}`, { userId: session.user.id })
    const { rows } = await query(
      `SELECT * FROM public.customers WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    )

    const customer = rows[0]
    if (!customer) {
      logger.warn('Customer not found', { customerId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Customer not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/customers/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json(customer))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Customer API GET')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
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
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company_id: commonSchemas.id.optional(),
      source_id: commonSchemas.id.optional(),
      industry_id: commonSchemas.id.optional(),
      event_id: commonSchemas.id.optional(),
      position_id: commonSchemas.id.optional(),
      business_profile_id: commonSchemas.id.optional(),
      title_id: commonSchemas.id.optional(),
      call_workflow_status_id: commonSchemas.id.optional(),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const {
      first_name,
      last_name,
      email,
      phone,
      company_id,
      source_id,
      industry_id,
      event_id,
      position_id,
      business_profile_id,
      title_id,
      call_workflow_status_id,
    } = bodyValidation.data
    logger.apiRequest('PUT', `/api/customers/${id}`, { userId: session.user.id })

    const { rows: currentRows } = await query(
      'SELECT * FROM public.customers WHERE id = $1 LIMIT 1',
      [id]
    )
    const currentCustomer = currentRows[0]
    if (!currentCustomer) {
      logger.warn('Customer not found for update', { customerId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Customer not found' }, { status: 404 }))
    }

    if (email && email !== currentCustomer.email) {
      const { rows: existing } = await query(
        'SELECT id FROM public.customers WHERE email = $1 AND deleted_at IS NULL AND id <> $2 LIMIT 1',
        [email, id]
      )
      if (existing.length > 0) {
        logger.warn('Customer with this email already exists', { email, customerId: id })
        return addSecurityHeaders(NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        ))
      }
    }

    const updateSql = `
      UPDATE public.customers
      SET first_name = $1,
          last_name = $2,
          email = $3,
          phone = $4,
          company_id = $5,
          source_id = $6,
          industry_id = $7,
          event_id = $8,
          position_id = $9,
          business_profile_id = $10,
          title_id = $11,
          call_workflow_status_id = $12,
          updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `

    const paramsArr = [
      first_name,
      last_name,
      email,
      phone,
      company_id,
      source_id,
      industry_id,
      event_id,
      position_id,
      business_profile_id,
      title_id,
      call_workflow_status_id,
      id,
    ]

    const { rows } = await query(updateSql, paramsArr)
    const customer = rows[0]

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: id,
      oldValue: currentCustomer,
      newValue: customer,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/customers/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json(customer))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Customer API PUT')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
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
    logger.apiRequest('DELETE', `/api/customers/${id}`, { userId: session.user.id })
    const { rows: currentRows } = await query(
      'SELECT * FROM public.customers WHERE id = $1 LIMIT 1',
      [id]
    )
    const currentCustomer = currentRows[0]
    if (!currentCustomer) {
      logger.warn('Customer not found for deletion', { customerId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Customer not found' }, { status: 404 }))
    }

    await query(
      'UPDATE public.customers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, old_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['DELETE', 'Customer', id, currentCustomer, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/customers/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ message: 'Customer deleted successfully' }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Customer API DELETE')
  }
}