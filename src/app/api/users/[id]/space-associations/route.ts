import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'

// GET /api/users/[id]/space-associations - get user's space associations
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
        s.is_default as space_is_default,
        s.is_active as space_is_active
      FROM space_members sm
      JOIN spaces s ON sm.space_id = s.id
      WHERE sm.user_id = $1 AND s.deleted_at IS NULL
      ORDER BY s.is_default DESC, s.name ASC
    `, [params.id])

    return NextResponse.json({ spaces: rows })
  } catch (error) {
    console.error('Error fetching user space associations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user space associations' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id]/space-associations - update user's space associations
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

    // Validate space associations
    for (const space of spaces) {
      if (!space.space_id || !space.role) {
        return NextResponse.json(
          { error: 'Each space association must have space_id and role' },
          { status: 400 }
        )
      }
      
      if (!['owner', 'admin', 'member'].includes(space.role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be owner, admin, or member' },
          { status: 400 }
        )
      }
    }

    // Start transaction
    await query('BEGIN')

    try {
      // Remove existing space memberships
      await query('DELETE FROM space_members WHERE user_id = $1', [params.id])
      
      // Add new space memberships
      for (const space of spaces) {
        await query(
          'INSERT INTO space_members (user_id, space_id, role) VALUES ($1, $2, $3)',
          [params.id, space.space_id, space.role]
        )
      }

      // Commit transaction
      await query('COMMIT')

      // Return updated space associations
      const { rows } = await query(`
        SELECT 
          sm.id,
          sm.space_id,
          sm.role,
          sm.created_at,
          s.name as space_name,
          s.description as space_description,
          s.is_default as space_is_default,
          s.is_active as space_is_active
        FROM space_members sm
        JOIN spaces s ON sm.space_id = s.id
        WHERE sm.user_id = $1 AND s.deleted_at IS NULL
        ORDER BY s.is_default DESC, s.name ASC
      `, [params.id])

      return NextResponse.json({ spaces: rows })
    } catch (error) {
      // Rollback transaction
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error updating user space associations:', error)
    return NextResponse.json(
      { error: 'Failed to update user space associations' },
      { status: 500 }
    )
  }
}
