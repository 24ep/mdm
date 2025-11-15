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
    logger.apiRequest('GET', `/api/dashboards/${id}`, { userId: session.user.id })

    const { rows: dashboards } = await query(`
      SELECT d.*, 
             ARRAY_AGG(DISTINCT s.id) FILTER (WHERE s.id IS NOT NULL) as space_ids,
             ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as space_names,
             ARRAY_AGG(DISTINCT s.slug) FILTER (WHERE s.slug IS NOT NULL) as space_slugs,
             COUNT(DISTINCT de.id) as element_count,
             COUNT(DISTINCT dds.id) as datasource_count,
             COUNT(DISTINCT df.id) as filter_count
      FROM public.dashboards d
      LEFT JOIN dashboard_spaces ds ON ds.dashboard_id = d.id
      LEFT JOIN spaces s ON s.id = ds.space_id
      LEFT JOIN dashboard_elements de ON de.dashboard_id = d.id
      LEFT JOIN dashboard_datasources dds ON dds.dashboard_id = d.id
      LEFT JOIN dashboard_filters df ON df.dashboard_id = d.id
      WHERE d.id = $1 AND d.deleted_at IS NULL
        AND (
          d.created_by = $2 OR
          d.id IN (SELECT dashboard_id FROM dashboard_permissions WHERE user_id = $2) OR
          (ds.space_id IN (SELECT space_id FROM space_members WHERE user_id = $2)) OR
          d.visibility = 'PUBLIC'
        )
      GROUP BY d.id
    `, [id, session.user.id])

    if (dashboards.length === 0) {
      logger.warn('Dashboard not found', { dashboardId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Dashboard not found' }, { status: 404 }))
    }

    const dashboard = dashboards[0]

    // Get dashboard elements
    const { rows: elements } = await query(`
      SELECT * FROM dashboard_elements 
      WHERE dashboard_id = $1 
      ORDER BY z_index ASC, position_y ASC, position_x ASC
    `, [id])

    // Get dashboard datasources
    const { rows: datasources } = await query(`
      SELECT * FROM dashboard_datasources 
      WHERE dashboard_id = $1 AND is_active = true
      ORDER BY created_at ASC
    `, [id])

    // Get dashboard filters
    const { rows: filters } = await query(`
      SELECT * FROM dashboard_filters 
      WHERE dashboard_id = $1 
      ORDER BY position ASC
    `, [id])

    // Get dashboard permissions
    const { rows: permissions } = await query(`
      SELECT dp.*, u.name as user_name, u.email as user_email
      FROM dashboard_permissions dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.dashboard_id = $1
      ORDER BY dp.created_at ASC
    `, [id])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/dashboards/${id}`, 200, duration, {
      elementsCount: elements.length,
      datasourcesCount: datasources.length,
      filtersCount: filters.length
    })
    return addSecurityHeaders(NextResponse.json({
      dashboard: {
        ...dashboard,
        elements,
        datasources,
        filters,
        permissions
      }
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Dashboard API GET')
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
      type: z.string().optional(),
      visibility: z.enum(['PRIVATE', 'PUBLIC', 'SHARED']).optional(),
      space_ids: z.array(commonSchemas.id).optional(),
      refresh_rate: z.number().int().positive().optional(),
      is_realtime: z.boolean().optional(),
      background_color: z.string().optional(),
      background_image: z.string().optional(),
      font_family: z.string().optional(),
      font_size: z.number().int().positive().optional(),
      grid_size: z.number().int().positive().optional(),
      layout_config: z.any().optional(),
      style_config: z.any().optional(),
      is_default: z.boolean().optional(),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const {
      name,
      description,
      type,
      visibility,
      space_ids,
      refresh_rate,
      is_realtime,
      background_color,
      background_image,
      font_family,
      font_size,
      grid_size,
      layout_config,
      style_config,
      is_default
    } = bodyValidation.data
    logger.apiRequest('PUT', `/api/dashboards/${id}`, { userId: session.user.id })

    // Check if user has permission to edit this dashboard
    const { rows: accessCheck } = await query(`
      SELECT d.created_by, dp.role
      FROM dashboards d
      LEFT JOIN dashboard_permissions dp ON dp.dashboard_id = d.id AND dp.user_id = $2
      WHERE d.id = $1 AND d.deleted_at IS NULL
    `, [id, session.user.id])

    if (accessCheck.length === 0) {
      logger.warn('Dashboard not found for update', { dashboardId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Dashboard not found' }, { status: 404 }))
    }

    const dashboard = accessCheck[0]
    const canEdit = dashboard.created_by === session.user.id || 
                   (dashboard.role && ['ADMIN', 'EDITOR'].includes(dashboard.role))

    if (!canEdit) {
      logger.warn('Access denied for dashboard update', { dashboardId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Generate public link if visibility is being changed to PUBLIC
    let publicLink = null
    if (visibility === 'PUBLIC') {
      const { rows: existingLink } = await query(
        'SELECT public_link FROM dashboards WHERE id = $1',
        [id]
      )
      
      if (!existingLink[0]?.public_link) {
        const { rows: linkRows } = await query('SELECT public.generate_dashboard_public_link() as link')
        publicLink = linkRows[0]?.link
      }
    }

    // Update dashboard
    const updateFields = []
    const updateValues = []
    let paramCount = 1

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`)
      updateValues.push(name)
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`)
      updateValues.push(description)
    }
    if (type !== undefined) {
      updateFields.push(`type = $${paramCount++}`)
      updateValues.push(type)
    }
    if (visibility !== undefined) {
      updateFields.push(`visibility = $${paramCount++}`)
      updateValues.push(visibility)
    }
    if (refresh_rate !== undefined) {
      updateFields.push(`refresh_rate = $${paramCount++}`)
      updateValues.push(refresh_rate)
    }
    if (is_realtime !== undefined) {
      updateFields.push(`is_realtime = $${paramCount++}`)
      updateValues.push(is_realtime)
    }
    if (background_color !== undefined) {
      updateFields.push(`background_color = $${paramCount++}`)
      updateValues.push(background_color)
    }
    if (background_image !== undefined) {
      updateFields.push(`background_image = $${paramCount++}`)
      updateValues.push(background_image)
    }
    if (font_family !== undefined) {
      updateFields.push(`font_family = $${paramCount++}`)
      updateValues.push(font_family)
    }
    if (font_size !== undefined) {
      updateFields.push(`font_size = $${paramCount++}`)
      updateValues.push(font_size)
    }
    if (grid_size !== undefined) {
      updateFields.push(`grid_size = $${paramCount++}`)
      updateValues.push(grid_size)
    }
    if (layout_config !== undefined) {
      updateFields.push(`layout_config = $${paramCount++}`)
      updateValues.push(JSON.stringify(layout_config))
    }
    if (style_config !== undefined) {
      updateFields.push(`style_config = $${paramCount++}`)
      updateValues.push(JSON.stringify(style_config))
    }
    if (publicLink !== null) {
      updateFields.push(`public_link = $${paramCount++}`)
      updateValues.push(publicLink)
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    if (updateFields.length > 1) { // More than just updated_at
      const updateSql = `
        UPDATE public.dashboards 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `
      
      const { rows } = await query(updateSql, updateValues)
      
      if (rows.length === 0) {
        logger.warn('Dashboard not found after update attempt', { dashboardId: id })
        return addSecurityHeaders(NextResponse.json({ error: 'Dashboard not found' }, { status: 404 }))
      }

      // Update space associations if provided
      if (space_ids && Array.isArray(space_ids)) {
        // Check if user has access to all spaces
        const placeholders = space_ids.map((_, i) => `$${i + 1}`).join(',')
        const { rows: spaceAccess } = await query(
          `SELECT space_id, role FROM space_members WHERE space_id IN (${placeholders}) AND user_id = $${space_ids.length + 1}`,
          [...space_ids, session.user.id]
        )

        if (spaceAccess.length !== space_ids.length) {
          logger.warn('Access denied to one or more spaces during dashboard update', { dashboardId: id, spaceIds: space_ids, userId: session.user.id })
          return addSecurityHeaders(NextResponse.json({ error: 'Access denied to one or more spaces' }, { status: 403 }))
        }

        // Remove existing associations
        await query('DELETE FROM dashboard_spaces WHERE dashboard_id = $1', [id])

        // Add new associations
        for (const spaceId of space_ids) {
          await query(
            'INSERT INTO dashboard_spaces (dashboard_id, space_id) VALUES ($1, $2)',
            [id, spaceId]
          )
        }
      }

      // Handle default dashboard setting
      if (is_default === true) {
        const { rows: spaces } = await query(
          'SELECT space_id FROM dashboard_spaces WHERE dashboard_id = $1',
          [id]
        )
        
        for (const space of spaces) {
          await query(
            'SELECT public.set_default_dashboard_for_space($1, $2)',
            [id, space.space_id]
          )
        }
      }

      const duration = Date.now() - startTime
      logger.apiResponse('PUT', `/api/dashboards/${id}`, 200, duration)
      return addSecurityHeaders(NextResponse.json({ dashboard: rows[0] }))
    }

    logger.warn('No fields to update for dashboard', { dashboardId: id })
    return addSecurityHeaders(NextResponse.json({ error: 'No fields to update' }, { status: 400 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Dashboard API PUT')
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
    logger.apiRequest('DELETE', `/api/dashboards/${id}`, { userId: session.user.id })

    // Check if user has permission to delete this dashboard
    const { rows: accessCheck } = await query(`
      SELECT d.created_by, dp.role
      FROM dashboards d
      LEFT JOIN dashboard_permissions dp ON dp.dashboard_id = d.id AND dp.user_id = $2
      WHERE d.id = $1 AND d.deleted_at IS NULL
    `, [id, session.user.id])

    if (accessCheck.length === 0) {
      logger.warn('Dashboard not found for deletion', { dashboardId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Dashboard not found' }, { status: 404 }))
    }

    const dashboard = accessCheck[0]
    const canDelete = dashboard.created_by === session.user.id || 
                     (dashboard.role && dashboard.role === 'ADMIN')

    if (!canDelete) {
      logger.warn('Access denied for dashboard deletion', { dashboardId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Soft delete the dashboard
    await query(
      'UPDATE public.dashboards SET deleted_at = NOW() WHERE id = $1',
      [id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/dashboards/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Dashboard API DELETE')
  }
}
