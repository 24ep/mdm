import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permission-checker'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId') || undefined
    const userId = searchParams.get('userId') || session.user.id

    // Check if user has permission to view other users' permissions
    if (userId !== session.user.id) {
      // Only admins can view other users' permissions
      if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get user's global role
    const { rows: userRows } = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    )

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const globalRole = userRows[0].role

    // Get space role if spaceId provided
    let spaceRole: string | undefined
    if (spaceId) {
      const { rows: spaceRows } = await query(
        'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
        [spaceId, userId]
      )
      if (spaceRows.length > 0) {
        spaceRole = spaceRows[0].role
      }
    }

    const context = {
      userId,
      globalRole,
      spaceId,
      spaceRole
    }

    const permissions = await getUserPermissions(context)

    return NextResponse.json({
      permissions,
      globalRole: context.globalRole,
      spaceRole: context.spaceRole,
      spaceId: context.spaceId
    })
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
