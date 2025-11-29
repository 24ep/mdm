import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { reportSchema } from '@/lib/validation/report-schemas'
import { auditLogger } from '@/lib/utils/audit-logger'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/reports/${id}`, { userId: session.user.id })

    const sql = `
      SELECT r.*,
             c.name as category_name,
             f.name as folder_name,
             ri.access_type,
             ri.config as integration_config
      FROM public.reports r
      LEFT JOIN report_categories c ON c.id = r.category_id
      LEFT JOIN report_folders f ON f.id = r.folder_id
      LEFT JOIN report_spaces rs ON rs.report_id = r.id
      LEFT JOIN report_permissions rp ON rp.report_id = r.id AND rp.user_id = $1
      LEFT JOIN report_integrations ri ON ri.source = r.source 
        AND ri.created_by = $1 
        AND ri.is_active = true
        AND (ri.space_id IS NULL OR ri.space_id IN (
          SELECT sm.space_id FROM space_members sm WHERE sm.user_id = $1
        ))
      WHERE r.id = $2
        AND r.deleted_at IS NULL
        AND (
          r.created_by = $1 OR
          rp.user_id = $1 OR
          (rs.space_id IN (
            SELECT sm.space_id FROM space_members sm WHERE sm.user_id = $1
          )) OR
          r.is_public = true
        )
      ORDER BY ri.created_at DESC
      LIMIT 1
    `

    const result = await query(sql, [session.user.id, id])

    if (result.rows.length === 0) {
      logger.warn('Report not found', { reportId: id })
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const report = result.rows[0]
    
    // Log audit event
    auditLogger.reportViewed(report.id)
    
    // Merge integration config into metadata if SDK access type
    if (report.access_type === 'SDK' && report.integration_config) {
      const integrationConfig = typeof report.integration_config === 'string' 
        ? JSON.parse(report.integration_config) 
        : report.integration_config
      
      // Merge SDK config into report metadata
      const metadata = report.metadata || {}
      if (report.source === 'POWER_BI' && integrationConfig.sdk_config) {
        metadata.sdk_config = integrationConfig.sdk_config
        metadata.embed_token = integrationConfig.embed_token
        metadata.report_id = integrationConfig.report_id
      } else if (report.source === 'GRAFANA') {
        metadata.api_url = integrationConfig.api_url
        metadata.api_key = integrationConfig.api_key
        metadata.dashboard_uid = report.metadata?.dashboard_uid || report.metadata?.uid
      }
      report.metadata = metadata
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/reports/${id}`, 200, duration)
    return NextResponse.json({ report })
}

export const GET = withErrorHandling(getHandler, 'GET /api/reports/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('PUT', `/api/reports/${id}`, { userId: session.user.id })

    // Validate with Zod schema (partial validation for updates)
    const updateSchema = reportSchema.partial()
    const bodyValidation = await validateBody(request, updateSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const validationResult = { success: true, data: bodyValidation.data }

    const {
      name,
      description,
      category_id,
      folder_id,
      owner,
      link,
      workspace,
      embed_url,
      metadata
    } = validationResult.data
    
    // Get is_active from body directly as it may not be in the schema
    const bodyData = bodyValidation.data as any
    const is_active = bodyData.is_active

    const sql = `
      UPDATE public.reports
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          category_id = COALESCE($3, category_id),
          folder_id = COALESCE($4, folder_id),
          owner = COALESCE($5, owner),
          link = COALESCE($6, link),
          workspace = COALESCE($7, workspace),
          embed_url = COALESCE($8, embed_url),
          metadata = COALESCE($9::jsonb, metadata),
          is_active = COALESCE($10, is_active),
          updated_at = NOW()
      WHERE id = $11
        AND (created_by = $12 OR EXISTS (
          SELECT 1 FROM report_permissions
          WHERE report_id = $11 AND user_id = $12 AND permission = 'edit'
        ))
      RETURNING *
    `

    const result = await query(sql, [
      name || null,
      description || null,
      category_id || null,
      folder_id || null,
      owner || null,
      link || null,
      workspace || null,
      embed_url || null,
      metadata ? JSON.stringify(metadata) : null,
      is_active !== undefined ? is_active : null,
      id,
      session.user.id
    ])

    if (result.rows.length === 0) {
      logger.warn('Report not found or no permission for update', { reportId: id, userId: session.user.id })
      return NextResponse.json({ error: 'Report not found or no permission' }, { status: 404 })
    }

    // Log audit event
    auditLogger.reportUpdated(id, { fields: Object.keys(validationResult.data) })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/reports/${id}`, 200, duration)
    return NextResponse.json({ report: result.rows[0] })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/reports/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/reports/${id}`, { userId: session.user.id })

    const sql = `
      UPDATE public.reports
      SET deleted_at = NOW()
      WHERE id = $1
        AND (created_by = $2 OR EXISTS (
          SELECT 1 FROM report_permissions
          WHERE report_id = $1 AND user_id = $2 AND permission = 'delete'
        ))
      RETURNING *
    `

    const result = await query(sql, [id, session.user.id])

    if (result.rows.length === 0) {
      logger.warn('Report not found or no permission for deletion', { reportId: id, userId: session.user.id })
      return NextResponse.json({ error: 'Report not found or no permission' }, { status: 404 })
    }

    // Log audit event
    auditLogger.reportDeleted(id)

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/reports/${id}`, 200, duration)
    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/reports/[id]')

