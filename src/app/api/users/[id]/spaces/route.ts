import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'

// GET /api/users/[id]/spaces - get user's space memberships
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const forbidden = await requireRole(request, 'MANAGER')
  if (forbidden) return forbidden

  try {
    const { rows } = await query(`
      SELECT 
        sm.id,
        sm.space_id,
        sm.role,
        sm.created_at,
        s.name as space_name,
        s.description as space_description,
        s.is_default as space_is_default
      FROM space_members sm
      JOIN spaces s ON sm.space_id = s.id
      WHERE sm.user_id = $1 AND s.deleted_at IS NULL
      ORDER BY s.is_default DESC, s.name ASC
    `, [params.id])

    return NextResponse.json({ spaces: rows })
  } catch (error) {
    console.error('Error fetching user spaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user spaces' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id]/spaces - update user's space memberships
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const forbidden = await requireRole(request, 'MANAGER')
  if (forbidden) return forbidden

  try {
    const body = await request.json()
    const { spaces } = body

    if (!Array.isArray(spaces)) {
      return NextResponse.json({ error: 'Spaces must be an array' }, { status: 400 })
    }

    // Remove existing space memberships
    await query('DELETE FROM space_members WHERE user_id = $1', [params.id])
    
    // Add new space memberships
    for (const space of spaces) {
      if (space.space_id && space.role) {
        await query(
          'INSERT INTO space_members (user_id, space_id, role) VALUES ($1, $2, $3)',
          [params.id, space.space_id, space.role]
        )
      }
    }

    // Return updated space memberships
    const { rows } = await query(`
      SELECT 
        sm.id,
        sm.space_id,
        sm.role,
        sm.created_at,
        s.name as space_name,
        s.description as space_description,
        s.is_default as space_is_default
      FROM space_members sm
      JOIN spaces s ON sm.space_id = s.id
      WHERE sm.user_id = $1 AND s.deleted_at IS NULL
      ORDER BY s.is_default DESC, s.name ASC
    `, [params.id])

    return NextResponse.json({ spaces: rows })
  } catch (error) {
    console.error('Error updating user spaces:', error)
    return NextResponse.json(
      { error: 'Failed to update user spaces' },
      { status: 500 }
    )
  }
}
