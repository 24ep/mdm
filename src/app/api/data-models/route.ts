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

    // Validate that spaceId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(spaceId)) {
      return NextResponse.json({ 
        error: 'Invalid space ID format',
        details: 'Space ID must be a valid UUID'
      }, { status: 400 })
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
      SELECT DISTINCT dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
             dm.is_active, dm.sort_order, dm.created_by,
             ARRAY_AGG(s.slug) as space_slugs,
             ARRAY_AGG(s.name) as space_names
      FROM public.data_models dm
      JOIN data_model_spaces dms ON dms.data_model_id::uuid = dm.id
      JOIN spaces s ON s.id = dms.space_id::uuid
      ${where}
      GROUP BY dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
               dm.is_active, dm.sort_order, dm.created_by
      ORDER BY dm.sort_order ASC, dm.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    
    const countSql = `
      SELECT COUNT(DISTINCT dm.id)::int AS total 
      FROM public.data_models dm
      JOIN data_model_spaces dms ON dms.data_model_id::uuid = dm.id
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
    const { name, description, space_ids } = body

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

    // Create the data model
    const insertSql = `INSERT INTO public.data_models (name, description, created_by, is_active, sort_order)
                       VALUES ($1, $2, $3, $4, $5) RETURNING *`
    const { rows } = await query<any>(insertSql, [
      name,
      description ?? null,
      session.user.id,
      true,
      0
    ])

    const dataModel = rows[0]

    // Associate the data model with all specified spaces
    for (const spaceId of space_ids) {
      // Validate that spaceId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(spaceId)) {
        return NextResponse.json({ 
          error: 'Invalid space ID format',
          details: `Space ID ${spaceId} must be a valid UUID`
        }, { status: 400 })
      }
      
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


