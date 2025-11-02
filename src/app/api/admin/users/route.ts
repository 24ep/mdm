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

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const active = searchParams.get('active') || ''
    const spaceId = searchParams.get('spaceId') || ''

    const offset = (page - 1) * limit

    // Build the query with filters
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (role) {
      whereConditions.push(`u.role = $${paramIndex}`)
      queryParams.push(role)
      paramIndex++
    }

    if (active !== '') {
      whereConditions.push(`u.is_active = $${paramIndex}`)
      queryParams.push(active === 'true')
      paramIndex++
    }

    if (spaceId) {
      whereConditions.push(`u.id IN (SELECT user_id FROM space_members WHERE space_id = $${paramIndex}::uuid)`)
      queryParams.push(spaceId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get users with space associations
    // Add limit and offset as the last parameters
    const limitParamIndex = paramIndex
    const offsetParamIndex = paramIndex + 1
    const usersQueryParams = [...queryParams, limit, offset]
    
    const users = await query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        true as is_active,
        null as last_login_at,
        null as default_space_id,
        COALESCE(
          json_agg(
            json_build_object(
              'spaceId', sm.space_id,
              'spaceName', s.name,
              'role', sm.role
            )
          ) FILTER (WHERE sm.space_id IS NOT NULL),
          '[]'::json
        ) as spaces
      FROM users u
      LEFT JOIN space_members sm ON u.id = sm.user_id
      LEFT JOIN spaces s ON sm.space_id = s.id
      ${whereClause}
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `, usersQueryParams)

    // Get total count (reuse the same WHERE clause and params, without limit/offset)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `
    const totalResult = await query(countQuery, queryParams)
    const total = parseInt(totalResult.rows[0]?.total || '0')

    return NextResponse.json({
      users: users.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
