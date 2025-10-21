import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id

    // Check if user has access to this space
    const spaceAccess = await query(`
      SELECT sm.role
      FROM space_members sm
      WHERE sm.space_id = $1 AND sm.user_id = $2
    `, [spaceId, session.user.id])

    if (spaceAccess.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all users in this space
    const { rows } = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,
        sm.role as space_role,
        u.is_active
      FROM space_members sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1 AND u.is_active = true
      ORDER BY u.name ASC
    `, [spaceId])

    return NextResponse.json({ 
      users: rows,
      count: rows.length 
    })
  } catch (error) {
    console.error('Error fetching space users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch space users' },
      { status: 500 }
    )
  }
}
