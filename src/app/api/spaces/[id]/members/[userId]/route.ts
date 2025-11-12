import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, userId } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if current user has permission to update members
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent non-owners from promoting users to owner
    if (role === 'owner' && memberCheck.rows[0].role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can promote users to owner' }, { status: 403 })
    }

    // Update member role
    const result = await query(`
      UPDATE space_members 
      SET role = $3, updated_at = NOW()
      WHERE space_id = $1 AND user_id = $2
      RETURNING *
    `, [spaceId, userId, role])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({
      member: result.rows[0],
      message: 'Member role updated successfully'
    })
  } catch (error) {
    console.error('Error updating space member:', error)
    return NextResponse.json(
      { error: 'Failed to update space member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, userId } = await params

    // Check if current user has permission to remove members
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent users from removing themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself from space' }, { status: 400 })
    }

    // Check if target user is owner
    const targetMemberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, userId])

    if (targetMemberCheck.rows.length > 0 && targetMemberCheck.rows[0].role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove space owner' }, { status: 400 })
    }

    // Remove member
    const result = await query(`
      DELETE FROM space_members 
      WHERE space_id = $1 AND user_id = $2
      RETURNING *
    `, [spaceId, userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Member removed successfully'
    })
  } catch (error) {
    console.error('Error removing space member:', error)
    return NextResponse.json(
      { error: 'Failed to remove space member' },
      { status: 500 }
    )
  }
}
