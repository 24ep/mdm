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
    let spaceId = searchParams.get('space_id')
    
    if (!spaceId) {
      // Fallback to user's default space
      const { rows: defaultSpace } = await query(
        `SELECT s.id FROM spaces s 
         JOIN space_members sm ON sm.space_id = s.id AND sm.user_id = $1
         WHERE s.is_default = true AND s.deleted_at IS NULL
         ORDER BY s.created_at DESC LIMIT 1`,
        [session.user.id]
      )
      spaceId = defaultSpace[0]?.id || null
      if (!spaceId) {
        return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
      }
    }

    const offset = (page - 1) * limit
    const params: any[] = [spaceId]
    const filters: string[] = ['dm.deleted_at IS NULL', 'dms.space_id = $1']
    
    if (search) {
      params.push(`%${search}%`, `%${search}%`)
      filters.push('(dm.name ILIKE $' + (params.length - 1) + ' OR dm.description ILIKE $' + params.length + ')')
    }
    
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''
    
    const listSql = `
      SELECT DISTINCT dm.*, 
             ARRAY_AGG(s.slug) as space_slugs,
             ARRAY_AGG(s.name) as space_names
      FROM public.data_models dm
      JOIN data_model_spaces dms ON dms.data_model_id = dm.id
      JOIN spaces s ON s.id = dms.space_id
      ${where}
      GROUP BY dm.id
      ORDER BY dm.sort_order ASC, dm.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    
    const countSql = `
      SELECT COUNT(DISTINCT dm.id)::int AS total 
      FROM public.data_models dm
      JOIN data_model_spaces dms ON dms.data_model_id = dm.id
      ${where}
    `
    
    const [{ rows: dataModels }, { rows: totalRows }] = await Promise.all([
      query<any>(listSql, [...params, limit, offset]),
      query<{ total: number }>(countSql, params),
    ])
    
    const total = totalRows[0]?.total || 0
    return NextResponse.json({
      dataModels: dataModels || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching data models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, display_name, description, space_ids, source_type, external_connection_id, external_schema, external_table, external_primary_key } = body
    let { slug } = body as any

    if (!name || !display_name) {
      return NextResponse.json({ error: 'Name and display_name are required' }, { status: 400 })
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

    // Slugify helper
    const toSlug = (text: string) => (
      text || ''
    ).toString().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')

    // Prepare slug
    slug = (slug && toSlug(slug)) || toSlug(name)
    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug derived from name' }, { status: 400 })
    }

    // Ensure slug unique; if conflict, add short hash suffix
    const { rows: conflict } = await query<{ id: string }>(
      'SELECT id FROM public.data_models WHERE slug = $1 AND deleted_at IS NULL LIMIT 1',
      [slug]
    )
    if (conflict.length > 0) {
      const suffix = (Math.random().toString(36).slice(2, 8))
      slug = `${slug}-${suffix}`
    }

    // Create the data model (without space_id since we'll use junction table)
    const insertSql = `INSERT INTO public.data_models (name, display_name, description, source_type, external_connection_id, external_schema, external_table, external_primary_key, slug)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`
    const { rows } = await query<any>(insertSql, [
      name,
      display_name,
      description ?? null,
      source_type ?? 'INTERNAL',
      external_connection_id ?? null,
      external_schema ?? null,
      external_table ?? null,
      external_primary_key ?? null,
      slug,
    ])

    const dataModel = rows[0]

    // Associate the data model with all specified spaces
    for (const spaceId of space_ids) {
      await query(
        'INSERT INTO data_model_spaces (data_model_id, space_id, created_by) VALUES ($1, $2, $3)',
        [dataModel.id, spaceId, session.user.id]
      )
    }

    return NextResponse.json({ dataModel }, { status: 201 })
  } catch (error) {
    console.error('Error creating data model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


