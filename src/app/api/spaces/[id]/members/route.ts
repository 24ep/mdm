import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params

    // Check if user has access to this space
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get space members
    const members = await query(`
      SELECT 
        sm.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_system_role,
        u.is_active
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
      ORDER BY sm.role DESC, u.name ASC
    `, [spaceId])

    return NextResponse.json({
      members: members.rows
    })
  } catch (error) {
    console.error('Error fetching space members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch space members' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const body = await request.json()
    const { user_id, role = 'member' } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if current user has permission to add members
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user exists
    const userCheck = await query(`
      SELECT id, name, email FROM users WHERE id = $1 AND is_active = true
    `, [user_id])

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Add user to space
    const result = await query(`
      INSERT INTO space_members (space_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (space_id, user_id) 
      DO UPDATE SET role = $3, updated_at = NOW()
      RETURNING *
    `, [spaceId, user_id, role])

    return NextResponse.json({
      member: result.rows[0],
      user: userCheck.rows[0],
      message: 'Member added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding space member:', error)
    return NextResponse.json(
      { error: 'Failed to add space member' },
      { status: 500 }
    )
  }
}
