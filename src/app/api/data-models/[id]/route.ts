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
    logger.apiRequest('GET', `/api/data-models/${id}`, { userId: session.user.id })

    const { rows } = await query(
      'SELECT * FROM public.data_models WHERE id = $1::uuid AND deleted_at IS NULL',
      [id]
    )
    if (!rows[0]) {
      logger.warn('Data model not found', { dataModelId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/data-models/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ dataModel: rows[0] }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Data Models API GET')
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
    logger.apiRequest('PUT', `/api/data-models/${id}`, { userId: session.user.id })

    const bodySchema = z.object({
      name: z.string().min(1).optional(),
      display_name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      is_active: z.boolean().optional(),
      icon: z.string().optional().nullable(),
      sort_order: z.number().int().optional(),
      is_pinned: z.boolean().optional(),
      source_type: z.string().optional().nullable(),
      external_connection_id: z.string().uuid().optional().nullable(),
      external_schema: z.string().optional().nullable(),
      external_table: z.string().optional().nullable(),
      external_primary_key: z.string().optional().nullable(),
      slug: z.string().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { name, display_name, description, is_active, icon, sort_order, is_pinned, source_type, external_connection_id, external_schema, external_table, external_primary_key, slug: slugInput } = bodyValidation.data
    let slug = slugInput
    
    if (!name && !display_name && description === undefined && is_active === undefined && icon === undefined && sort_order === undefined && is_pinned === undefined && source_type === undefined && external_connection_id === undefined && external_schema === undefined && external_table === undefined && external_primary_key === undefined && slug === undefined) {
      return addSecurityHeaders(NextResponse.json({ error: 'No fields to update' }, { status: 400 }))
    }

    const fields: string[] = []
    const values: any[] = []
    let idx = 1
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name) }
    if (display_name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(display_name) }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description) }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(!!is_active) }
    if (icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(icon) }
    if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(parseInt(sort_order) || 0) }
    if (is_pinned !== undefined) { fields.push(`is_pinned = $${idx++}`); values.push(!!is_pinned) }
    if (source_type !== undefined) { fields.push(`source_type = $${idx++}`); values.push(source_type) }
    if (external_connection_id !== undefined) { fields.push(`external_connection_id = $${idx++}`); values.push(external_connection_id) }
    if (external_schema !== undefined) { fields.push(`external_schema = $${idx++}`); values.push(external_schema) }
    if (external_table !== undefined) { fields.push(`external_table = $${idx++}`); values.push(external_table) }
    if (external_primary_key !== undefined) { fields.push(`external_primary_key = $${idx++}`); values.push(external_primary_key) }

    // Handle slug update if provided
    if (slug !== undefined) {
      const toSlug = (text: string) => (
        text || ''
      ).toString().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
      slug = toSlug(slug)
      if (!slug) {
        return addSecurityHeaders(NextResponse.json({ error: 'Invalid slug' }, { status: 400 }))
      }
      // Ensure unique (excluding current record)
      const { rows: conflict } = await query(
        'SELECT id FROM public.data_models WHERE slug = $1 AND id <> $2 AND deleted_at IS NULL LIMIT 1',
        [slug, id]
      )
      if (conflict.length > 0) {
        logger.warn('Slug already in use', { dataModelId: id, slug })
        return addSecurityHeaders(NextResponse.json({ error: 'Slug already in use' }, { status: 409 }))
      }
      fields.push(`slug = $${idx++}`)
      values.push(slug)
    }

    // Get current data for audit log
    const currentDataResult = await query('SELECT * FROM data_models WHERE id = $1::uuid', [id])
    const currentData = currentDataResult.rows[0]

    const sql = `UPDATE public.data_models SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`
    values.push(id)
    const { rows } = await query(sql, values)
    if (!rows[0]) {
      logger.warn('Data model not found for update', { dataModelId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataModel',
      entityId: id,
      oldValue: currentData,
      newValue: rows[0],
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/data-models/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ dataModel: rows[0] }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Data Models API PUT')
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
    logger.apiRequest('DELETE', `/api/data-models/${id}`, { userId: session.user.id })

    // Get current data for audit log
    const currentDataResult = await query('SELECT * FROM data_models WHERE id = $1::uuid', [id])
    const currentData = currentDataResult.rows[0]

    const { rows } = await query(
      'UPDATE public.data_models SET deleted_at = NOW() WHERE id = $1::uuid AND deleted_at IS NULL RETURNING id',
      [id]
    )
    if (!rows[0]) {
      logger.warn('Data model not found for deletion', { dataModelId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }

    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      entityType: 'DataModel',
      entityId: id,
      oldValue: currentData,
      newValue: null,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/data-models/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ ok: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Data Models API DELETE')
  }
}