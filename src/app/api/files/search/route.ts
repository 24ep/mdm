import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Validate query parameters - use passthrough for complex filters
    const queryValidation = validateQuery(request, z.object({
      q: z.string().optional().default(''),
      spaceId: commonSchemas.id,
      fileType: z.string().optional(),
      category: z.string().optional(),
      tag: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      sizeMin: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
      sizeMax: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
      uploadedBy: commonSchemas.id.optional(),
      sortBy: z.enum(['name', 'size', 'type', 'uploaded_at']).optional().default('uploaded_at'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
      page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().optional().transform((val) => parseInt(val || '20')).pipe(z.number().int().positive().max(100)).optional().default(20),
    }))
    
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }
    
    const { q = '', spaceId, fileType, category, tag, dateFrom, dateTo, sizeMin, sizeMax, uploadedBy, sortBy = 'uploaded_at', sortOrder = 'desc', page, limit = 20 } = queryValidation.data
    const offset = (page - 1) * limit
    logger.apiRequest('GET', '/api/files/search', { userId, spaceId, q, page, limit })

    // Check if user has access to this space
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0) {
      logger.warn('Space not found or access denied for file search', { spaceId, userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 }))
    }

    // Build the search query
    let whereConditions = ['af.space_id = $1', 'af.deleted_at IS NULL']
    let queryParams: any[] = [spaceId]
    let paramIndex = 2

    // Text search
    if (q) {
      whereConditions.push(`fsi.search_text ILIKE $${paramIndex}`)
      queryParams.push(`%${q}%`)
      paramIndex++
    }

    // File type filter
    if (fileType) {
      const types = fileType.split(',').map(t => t.trim())
      const typeConditions = types.map(() => {
        const condition = `af.mime_type ILIKE $${paramIndex}`
        queryParams.push(`%${types[queryParams.length - paramIndex + 1]}%`)
        paramIndex++
        return condition
      })
      whereConditions.push(`(${typeConditions.join(' OR ')})`)
    }

    // Category filter
    if (category) {
      whereConditions.push(`fc.name = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    // Tag filter
    if (tag) {
      whereConditions.push(`ft.name = $${paramIndex}`)
      queryParams.push(tag)
      paramIndex++
    }

    // Date range filter
    if (dateFrom) {
      whereConditions.push(`af.uploaded_at >= $${paramIndex}`)
      queryParams.push(dateFrom)
      paramIndex++
    }

    if (dateTo) {
      whereConditions.push(`af.uploaded_at <= $${paramIndex}`)
      queryParams.push(dateTo)
      paramIndex++
    }

    // Size range filter
    if (sizeMin) {
      whereConditions.push(`af.file_size >= $${paramIndex}`)
      queryParams.push(String(sizeMin))
      paramIndex++
    }

    if (sizeMax) {
      whereConditions.push(`af.file_size <= $${paramIndex}`)
      queryParams.push(String(sizeMax))
      paramIndex++
    }

    // Uploaded by filter
    if (uploadedBy) {
      whereConditions.push(`af.uploaded_by = $${paramIndex}`)
      queryParams.push(uploadedBy)
      paramIndex++
    }

    // Build the main query
    const baseQuery = `
      FROM attachment_files af
      LEFT JOIN file_search_index fsi ON af.id = fsi.file_id
      LEFT JOIN file_categorizations fc_rel ON af.id = fc_rel.file_id
      LEFT JOIN file_categories fc ON fc_rel.category_id = fc.id
      LEFT JOIN file_tag_assignments fta ON af.id = fta.file_id
      LEFT JOIN file_tags ft ON fta.tag_id = ft.id
      WHERE ${whereConditions.join(' AND ')}
    `

    // Get total count
    const countQuery = `SELECT COUNT(DISTINCT af.id) as total ${baseQuery}`
    const countResult = await query(countQuery, queryParams)
    const total = parseInt((countResult.rows[0] as any).total)

    // Get files with pagination
    const orderBy = sortBy === 'name' ? 'af.file_name' :
                   sortBy === 'size' ? 'af.file_size' :
                   sortBy === 'type' ? 'af.mime_type' :
                   'af.uploaded_at'

    const filesQuery = `
      SELECT DISTINCT
        af.id,
        af.file_name,
        af.file_path,
        af.file_size,
        af.mime_type,
        af.uploaded_by,
        af.uploaded_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', fc.id,
              'name', fc.name,
              'color', fc.color,
              'icon', fc.icon
            )
          ) FILTER (WHERE fc.id IS NOT NULL),
          '[]'::json
        ) as categories,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ft.id,
              'name', ft.name,
              'color', ft.color
            )
          ) FILTER (WHERE ft.id IS NOT NULL),
          '[]'::json
        ) as tags
      ${baseQuery}
      GROUP BY af.id, af.file_name, af.file_path, af.file_size, af.mime_type, af.uploaded_by, af.uploaded_at
      ORDER BY ${orderBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)
    const filesResult = await query(filesQuery, queryParams)

    // Get available filters for the response
    const filtersQuery = `
      SELECT 
        json_agg(DISTINCT af.mime_type) as file_types,
        json_agg(DISTINCT fc.name) FILTER (WHERE fc.name IS NOT NULL) as categories,
        json_agg(DISTINCT ft.name) FILTER (WHERE ft.name IS NOT NULL) as tags,
        MIN(af.uploaded_at) as earliest_date,
        MAX(af.uploaded_at) as latest_date,
        MIN(af.file_size) as min_size,
        MAX(af.file_size) as max_size
      FROM attachment_files af
      LEFT JOIN file_categorizations fc_rel ON af.id = fc_rel.file_id
      LEFT JOIN file_categories fc ON fc_rel.category_id = fc.id
      LEFT JOIN file_tag_assignments fta ON af.id = fta.file_id
      LEFT JOIN file_tags ft ON fta.tag_id = ft.id
      WHERE af.space_id = $1 AND af.deleted_at IS NULL
    `

    const filtersResult = await query(filtersQuery, [spaceId])
    const filters = filtersResult.rows[0] as any

    return NextResponse.json({
      files: filesResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        fileTypes: filters.file_types || [],
        categories: filters.categories || [],
        tags: filters.tags || [],
        dateRange: {
          from: filters.earliest_date,
          to: filters.latest_date
        },
        sizeRange: {
          min: filters.min_size,
          max: filters.max_size
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/files/search', 200, duration, { total, filesCount: filesResult.rows.length })
    return addSecurityHeaders(NextResponse.json({
      files: filesResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        fileTypes: filters.file_types || [],
        categories: filters.categories || [],
        tags: filters.tags || [],
        dateRange: {
          from: filters.earliest_date,
          to: filters.latest_date
        },
        sizeRange: {
          min: filters.min_size,
          max: filters.max_size
        }
      }
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/files/search', 500, duration)
    return handleApiError(error, 'File Search API GET')
  }
}
