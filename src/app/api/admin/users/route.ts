import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, password, role, isActive, defaultSpaceId, spaces } = body

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await query<any>(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Validate role
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
    const userRole = role || 'USER'
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await query<any>(
      `INSERT INTO users (email, name, password, role, is_active, default_space_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, name, role, is_active, created_at, default_space_id`,
      [
        email,
        name,
        hashedPassword,
        userRole,
        isActive !== undefined ? isActive : true,
        defaultSpaceId || null
      ]
    )

    const newUser = result.rows[0]

    // Handle space memberships if provided
    if (spaces && Array.isArray(spaces) && spaces.length > 0) {
      for (const space of spaces) {
        if (space.spaceId && space.role) {
          await query(
            'INSERT INTO space_members (user_id, space_id, role) VALUES ($1, $2, $3)',
            [newUser.id, space.spaceId, space.role]
          )
        }
      }
    }

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isActive: newUser.is_active,
          createdAt: newUser.created_at,
          defaultSpaceId: newUser.default_space_id
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

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
