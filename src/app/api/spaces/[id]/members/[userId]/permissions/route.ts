import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const userId = params.userId

    // Check if current user has permission to view member permissions
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get member permissions
    const permissions = await query(`
      SELECT permissions FROM member_permissions 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, userId])

    return NextResponse.json({
      permissions: permissions.rows[0]?.permissions || []
    })
  } catch (error) {
    console.error('Error fetching member permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member permissions' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const userId = params.userId
    const body = await request.json()
    const { permissions } = body

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Permissions must be an array' }, { status: 400 })
    }

    // Check if current user has permission to manage member permissions
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if target user is a member of the space
    const targetMemberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, userId])

    if (targetMemberCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User is not a member of this space' }, { status: 404 })
    }

    // Prevent non-owners from modifying owner permissions
    if (targetMemberCheck.rows[0].role === 'owner' && memberCheck.rows[0].role !== 'owner') {
      return NextResponse.json({ error: 'Cannot modify owner permissions' }, { status: 403 })
    }

    // Update or insert member permissions
    await query(`
      INSERT INTO member_permissions (space_id, user_id, permissions, updated_at)
      VALUES ($1::uuid, $2::uuid, $3, NOW())
      ON CONFLICT (space_id, user_id)
      DO UPDATE SET permissions = $3, updated_at = NOW()
    `, [spaceId, userId, permissions])

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully'
    })
  } catch (error) {
    console.error('Error updating member permissions:', error)
    return NextResponse.json(
      { error: 'Failed to update member permissions' },
      { status: 500 }
    )
  }
}
