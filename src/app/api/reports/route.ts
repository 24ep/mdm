import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireAnySpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { reportSchema } from '@/lib/validation/report-schemas'
import { auditLogger } from '@/lib/utils/audit-logger'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate query parameters
    const queryValidation = validateQuery(request, z.object({
      source: z.string().optional(),
      space_id: commonSchemas.id.optional(),
      search: z.string().optional().default(''),
      category_id: commonSchemas.id.optional(),
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
    }))
    
    if (!queryValidation.success) {
      return queryValidation.response
    }
    
    const { source, space_id: spaceId, search = '', category_id: categoryId, status, date_from: dateFrom, date_to: dateTo } = queryValidation.data
    logger.apiRequest('GET', '/api/reports', { userId: session.user.id, source, spaceId, search })

    const params: any[] = [session.user.id]
    const filters: string[] = ['r.deleted_at IS NULL']

    if (source) {
      params.push(source.toUpperCase().replace('-', '_'))
      filters.push('r.source = $' + params.length)
    }

    if (spaceId) {
      params.push(spaceId)
      filters.push('rs.space_id = $' + params.length)
    }

    if (categoryId) {
      params.push(categoryId)
      filters.push('r.category_id = $' + params.length)
    }

    if (status) {
      params.push(status === 'active')
      filters.push('r.is_active = $' + params.length)
    }

    if (dateFrom) {
      params.push(dateFrom)
      filters.push('r.created_at >= $' + params.length + '::date')
    }

    if (dateTo) {
      params.push(dateTo)
      filters.push('r.created_at <= $' + params.length + '::date')
    }

    if (search) {
      params.push(`%${search}%`, `%${search}%`)
      filters.push('(r.name ILIKE $' + (params.length - 1) + ' OR r.description ILIKE $' + params.length + ')')
    }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

    const reportsSql = `
      SELECT DISTINCT r.*,
             c.name as category_name,
             f.name as folder_name
      FROM public.reports r
      LEFT JOIN report_spaces rs ON rs.report_id = r.id
      LEFT JOIN report_permissions rp ON rp.report_id = r.id AND rp.user_id = $1
      LEFT JOIN report_categories c ON c.id = r.category_id
      LEFT JOIN report_folders f ON f.id = r.folder_id
      WHERE (
        r.created_by = $1 OR
        rp.user_id = $1 OR
        (rs.space_id IN (
          SELECT sm.space_id FROM space_members sm WHERE sm.user_id = $1
        )) OR
        r.is_public = true
      )
      ${where.replace('WHERE', 'AND')}
      ORDER BY r.created_at DESC
    `

    const categoriesSql = `
      SELECT * FROM report_categories
      WHERE deleted_at IS NULL
      ORDER BY name
    `

    const foldersSql = `
      SELECT * FROM report_folders
      WHERE deleted_at IS NULL
      ORDER BY name
    `

    const [{ rows: reports }, { rows: categories }, { rows: folders }] = await Promise.all([
      query(reportsSql, params),
      query(categoriesSql, []),
      query(foldersSql, [])
    ])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/reports', 200, duration, { 
      reportsCount: reports.length, 
      categoriesCount: categories.length,
      foldersCount: folders.length
    })
    return NextResponse.json({
      reports: reports || [],
      categories: categories || [],
      folders: folders || []
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/reports')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      source: z.string().min(1, 'Source is required'),
      category_id: commonSchemas.id.optional(),
      folder_id: commonSchemas.id.optional(),
      owner: z.string().optional(),
      link: z.string().url().optional(),
      workspace: z.string().optional(),
      embed_url: z.string().url().optional(),
      metadata: z.any().optional(),
      space_ids: z.array(commonSchemas.id).optional().default([]),
    }))
    
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const {
      name,
      description,
      source,
      category_id,
      folder_id,
      owner,
      link,
      workspace,
      embed_url,
      metadata,
      space_ids = []
    } = bodyValidation.data
    logger.apiRequest('POST', '/api/reports', { userId: session.user.id, name, source })

    const insertSql = `
      INSERT INTO public.reports (
        name, description, source, category_id, folder_id,
        owner, link, workspace, embed_url, metadata,
        created_by, is_active, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `

    const result = await query(insertSql, [
      name,
      description || null,
      source,
      category_id || null,
      folder_id || null,
      owner || null,
      link || null,
      workspace || null,
      embed_url || null,
      metadata ? JSON.stringify(metadata) : null,
      session.user.id,
      true,
      false
    ])

    const report = result.rows[0]

    // Log audit event
    auditLogger.reportCreated(report.id, { source: source })

    // Associate with spaces
    if (space_ids && space_ids.length > 0) {
      for (const spaceId of space_ids) {
        await query(
          'INSERT INTO report_spaces (report_id, space_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [report.id, spaceId]
        )
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/reports', 201, duration, { reportId: report.id })
    return NextResponse.json({ report }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports')

