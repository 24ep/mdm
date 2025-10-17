import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get spaces where user is a member
    const spaces = await query(`
      SELECT 
        s.id, s.name, s.description, s.is_default, s.is_active, s.created_by, s.created_at, s.updated_at, s.deleted_at, s.slug,
        u.name as created_by_name,
        COUNT(sm.user_id) as member_count
      FROM spaces s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN space_members sm ON s.id = sm.space_id
      WHERE s.deleted_at IS NULL 
        AND s.id IN (
          SELECT space_id FROM space_members WHERE user_id = $1
        )
      GROUP BY s.id, u.name
      ORDER BY s.is_default DESC, s.created_at DESC
      LIMIT $2 OFFSET $3
    `, [session.user.id, limit, offset])

    // Get total count
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM spaces s
      WHERE s.deleted_at IS NULL 
        AND s.id IN (
          SELECT space_id FROM space_members WHERE user_id = $1
        )
    `, [session.user.id])

    const total = parseInt(totalResult.rows[0]?.total || '0')

    return NextResponse.json({
      spaces: spaces.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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
    const { name, description, is_default = false, slug } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to create spaces (basic check - can be enhanced with RBAC)
    const user = await query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    )

    if (!user.rows[0] || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.rows[0].role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create spaces' },
        { status: 403 }
      )
    }

    // Create the space
    const result = await query(`
      INSERT INTO spaces (name, description, is_default, created_by, slug)
      VALUES ($1, $2, $3, $4, COALESCE($5, LOWER(REGEXP_REPLACE($1, '[^a-zA-Z0-9]+', '-', 'g'))))
      RETURNING *
    `, [name.trim(), description?.trim() || null, is_default, session.user.id, slug?.trim() || null])

    const newSpace = result.rows[0]

    return NextResponse.json({
      space: newSpace,
      message: 'Space created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating space:', error)
    return NextResponse.json(
      { error: 'Failed to create space' },
      { status: 500 }
    )
  }
}
