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

    const offset = (page - 1) * limit

    // Check if tags column exists first
    const tagsColumnCheck = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'spaces' 
        AND column_name = 'tags'
      ) as exists
    `)
    
    const tagsColumnExists = tagsColumnCheck.rows[0]?.exists || false

    // Build query based on whether tags column exists
    // Note: limit and offset are safe integers, so we can interpolate them directly
    const listSql = tagsColumnExists
      ? `
        SELECT s.id, s.name, s.description, s.slug, s.is_default, s.is_active, 
               s.icon, s.logo_url, s.created_at, s.updated_at, s.deleted_at,
               COALESCE(s.tags, '[]'::jsonb) as tags,
               (SELECT COUNT(*)::int FROM space_members sm WHERE sm.space_id::uuid = s.id::uuid) as member_count
        FROM spaces s
        ORDER BY s.is_default DESC, s.deleted_at NULLS LAST, s.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      : `
        SELECT s.id, s.name, s.description, s.slug, s.is_default, s.is_active, 
               s.icon, s.logo_url, s.created_at, s.updated_at, s.deleted_at,
               '[]'::jsonb as tags,
               (SELECT COUNT(*)::int FROM space_members sm WHERE sm.space_id::uuid = s.id::uuid) as member_count
        FROM spaces s
        ORDER BY s.is_default DESC, s.deleted_at NULLS LAST, s.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    
    const countSql = `
      SELECT COUNT(*)::int AS total 
      FROM spaces s
    `
    
    const [{ rows: spaces }, { rows: totalRows }] = await Promise.all([
      query<any>(listSql),
      query<{ total: number }>(countSql),
    ])
    
    const total = totalRows[0]?.total || 0
    return NextResponse.json({
      spaces: spaces || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching spaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spaces' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, slug, is_default = false, tags = [] } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      )
    }

    const spaceSlug = slug?.trim() || name.toLowerCase().replace(/\s+/g, '-')

    // Create space - check if tags column exists
    const hasTagsColumn = await query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'spaces' 
        AND column_name = 'tags'
      ) as exists
    `)
    
    const tagsColumnExists = hasTagsColumn.rows[0]?.exists || false
    
    let insertSql: string
    let queryParams: any[]
    
    if (tagsColumnExists) {
      insertSql = `
        INSERT INTO spaces (name, description, slug, is_default, created_by, tags)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING id, name, description, slug, is_default, is_active, icon, logo_url, 
                  created_at, updated_at,
                  COALESCE(tags, '[]'::jsonb) as tags
      `
      queryParams = [
        name.trim(),
        description?.trim() || null,
        spaceSlug,
        is_default,
        session.user.id,
        JSON.stringify(Array.isArray(tags) ? tags : [])
      ]
    } else {
      insertSql = `
        INSERT INTO spaces (name, description, slug, is_default, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, slug, is_default, is_active, icon, logo_url, 
                  created_at, updated_at
      `
      queryParams = [
        name.trim(),
        description?.trim() || null,
        spaceSlug,
        is_default,
        session.user.id
      ]
    }

    const { rows } = await query<any>(insertSql, queryParams)

    const newSpace = rows[0]

    // Add creator as admin member
    await query(
      `INSERT INTO space_members (space_id, user_id, role) 
       VALUES ($1, $2, $3)
       ON CONFLICT (space_id, user_id) DO NOTHING`,
      [newSpace.id, session.user.id, 'ADMIN']
    )

    return NextResponse.json({
      space: {
        ...newSpace,
        tags: tagsColumnExists 
          ? (typeof newSpace.tags === 'string' ? JSON.parse(newSpace.tags) : (newSpace.tags || []))
          : []
      },
      message: 'Space created successfully'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating space:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create space' },
      { status: 500 }
    )
  }
}