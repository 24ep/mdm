import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const spaceId = searchParams.get('space_id')
    const type = searchParams.get('type') || ''
    const visibility = searchParams.get('visibility') || ''

    const offset = (page - 1) * limit
    const params: any[] = [session.user.id]
    const filters: string[] = ['d.deleted_at IS NULL']
    

    if (search) {
      params.push(`%${search}%`, `%${search}%`)
      filters.push('(d.name ILIKE $' + (params.length - 1) + ' OR d.description ILIKE $' + params.length + ')')
    }

    if (spaceId) {
      params.push(spaceId)
      filters.push('ds.space_id = $' + params.length)
    }

    if (type) {
      params.push(type)
      filters.push('d.type = $' + params.length)
    }

    if (visibility) {
      params.push(visibility)
      filters.push('d.visibility = $' + params.length)
    }

    const where = filters.length ? 'AND ' + filters.join(' AND ') : ''
    
    const listSql = `
      SELECT DISTINCT d.*, 
             ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as space_names,
             ARRAY_AGG(DISTINCT s.slug) FILTER (WHERE s.slug IS NOT NULL) as space_slugs,
             COUNT(DISTINCT de.id) as element_count,
             COUNT(DISTINCT dds.id) as datasource_count
      FROM public.dashboards d
      LEFT JOIN dashboard_spaces ds ON ds.dashboard_id = d.id
      LEFT JOIN dashboard_permissions dp ON dp.dashboard_id = d.id AND dp.user_id = $1
      LEFT JOIN spaces s ON s.id = ds.space_id
      LEFT JOIN dashboard_elements de ON de.dashboard_id = d.id
      LEFT JOIN dashboard_datasources dds ON dds.dashboard_id = d.id
      WHERE (
        d.created_by = $1 OR
        dp.user_id = $1 OR
        (ds.space_id IN (
          SELECT sm.space_id FROM space_members sm WHERE sm.user_id = $1
        )) OR
        d.visibility = 'PUBLIC'
      )
      ${where}
      GROUP BY d.id
      ORDER BY d.is_default DESC, d.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    
    const countSql = `
      SELECT COUNT(DISTINCT d.id)::int AS total 
      FROM public.dashboards d
      LEFT JOIN dashboard_spaces ds ON ds.dashboard_id = d.id
      LEFT JOIN dashboard_permissions dp ON dp.dashboard_id = d.id AND dp.user_id = $1
      WHERE (
        d.created_by = $1 OR
        dp.user_id = $1 OR
        (ds.space_id IN (
          SELECT sm.space_id FROM space_members sm WHERE sm.user_id = $1
        )) OR
        d.visibility = 'PUBLIC'
      )
      ${where}
    `
    
    const [{ rows: dashboards }, { rows: totalRows }] = await Promise.all([
      query<any>(listSql, [...params, limit, offset]),
      query<{ total: number }>(countSql, params),
    ])
    
    const total = totalRows[0]?.total || 0
    return NextResponse.json({
      dashboards: dashboards || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { 
      name, 
      description, 
      type = 'CUSTOM',
      visibility = 'PRIVATE',
      space_ids = [],
      refresh_rate = 300,
      is_realtime = false,
      background_color = '#ffffff',
      font_family = 'Inter',
      font_size = 14,
      grid_size = 12,
      layout_config = {},
      style_config = {}
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!space_ids || !Array.isArray(space_ids) || space_ids.length === 0) {
      return NextResponse.json({ error: 'At least one space ID is required' }, { status: 400 })
    }

    // Check if user has access to all spaces
    const placeholders = space_ids.map((_, i) => `$${i + 1}`).join(',')
    const { rows: spaceAccess } = await query(
      `SELECT space_id, role FROM space_members WHERE space_id IN (${placeholders}) AND user_id = $${space_ids.length + 1}`,
      [...space_ids, session.user.id]
    )

    if (spaceAccess.length !== space_ids.length) {
      return NextResponse.json({ error: 'Access denied to one or more spaces' }, { status: 403 })
    }

    // Generate public link if visibility is PUBLIC
    let publicLink = null
    if (visibility === 'PUBLIC') {
      const { rows: linkRows } = await query('SELECT public.generate_dashboard_public_link() as link')
      publicLink = linkRows[0]?.link
    }

    // Create the dashboard
    const insertSql = `
      INSERT INTO public.dashboards (
        name, description, type, visibility, is_default, is_active,
        refresh_rate, is_realtime, public_link, background_color,
        font_family, font_size, grid_size, layout_config, style_config, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `
    
    const { rows } = await query<any>(insertSql, [
      name,
      description || null,
      type,
      visibility,
      false, // is_default
      true,  // is_active
      refresh_rate,
      is_realtime,
      publicLink,
      background_color,
      font_family,
      font_size,
      grid_size,
      JSON.stringify(layout_config),
      JSON.stringify(style_config),
      session.user.id
    ])

    const dashboard = rows[0]

    // Associate the dashboard with spaces
    for (const spaceId of space_ids) {
      await query(
        'INSERT INTO dashboard_spaces (dashboard_id, space_id) VALUES ($1, $2)',
        [dashboard.id, spaceId]
      )
    }

    // Add creator as admin permission
    await query(
      'INSERT INTO dashboard_permissions (dashboard_id, user_id, role) VALUES ($1, $2, $3)',
      [dashboard.id, session.user.id, 'ADMIN']
    )

    return NextResponse.json({ dashboard }, { status: 201 })
  } catch (error) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
