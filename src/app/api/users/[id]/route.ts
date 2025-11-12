import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'

// GET /api/users/[id] - get user (MANAGER+)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requireRole(_request, 'MANAGER')
  if (forbidden) return forbidden
  try {
    const { id } = await params
    const { rows } = await query(`
      SELECT 
        u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.updated_at, u.default_space_id,
        s.name as default_space_name,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', sp.id,
              'name', sp.name,
              'role', sm.role
            )
          ) FROM space_members sm
          JOIN spaces sp ON sm.space_id = sp.id
          WHERE sm.user_id = u.id AND sp.deleted_at IS NULL
          ), '[]'::json
        ) as spaces
      FROM public.users u
      LEFT JOIN spaces s ON u.default_space_id = s.id
      WHERE u.id = $1 
      LIMIT 1
    `, [id])
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ user: rows[0] })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/users/[id] - update user (MANAGER+); can change name, role, activation, password
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requireRole(request, 'MANAGER')
  if (forbidden) return forbidden
  try {
    const { id } = await params
    const body = await request.json()
    const { email, name, role, is_active, password, default_space_id, spaces } = body

    const sets: string[] = []
    const values: any[] = []

    if (email) { values.push(email); sets.push(`email = $${values.length}`) }
    if (name) { values.push(name); sets.push(`name = $${values.length}`) }
    if (typeof is_active === 'boolean') { values.push(is_active); sets.push(`is_active = $${values.length}`) }
    if (role) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      values.push(role); sets.push(`role = $${values.length}`)
    }
    if (password) {
      const bcrypt = await import('bcryptjs')
      const hashed = await bcrypt.hash(password, 12)
      values.push(hashed)
      sets.push(`password = $${values.length}`)
    }
    if (default_space_id !== undefined) { 
      values.push(default_space_id); 
      sets.push(`default_space_id = $${values.length}`) 
    }

    if (!sets.length) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Get current data for audit log
    const currentDataResult = await query('SELECT * FROM users WHERE id = $1', [id])
    const currentData = currentDataResult.rows[0]

    values.push(id)
    const sql = `UPDATE public.users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id, email, name, role, is_active, created_at, updated_at`

    const { rows } = await query(sql, values)
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Handle space memberships if provided
    if (spaces && Array.isArray(spaces)) {
      // Remove existing space memberships
      await query('DELETE FROM space_members WHERE user_id = $1', [id])
      
      // Add new space memberships
      for (const space of spaces) {
        if (space.id && space.role) {
          await query(
            'INSERT INTO space_members (user_id, space_id, role) VALUES ($1, $2, $3)',
            [id, space.id, space.role]
          )
        }
      }
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      oldValue: currentData,
      newValue: rows[0],
      userId: currentData.id, // The user being updated
      ipAddress: _request.headers.get('x-forwarded-for') || _request.headers.get('x-real-ip') || 'unknown',
      userAgent: _request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ user: rows[0] })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - delete user (MANAGER+)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requireRole(request, 'MANAGER')
  if (forbidden) return forbidden
  try {
    const { id } = await params
    const { rows } = await query('DELETE FROM public.users WHERE id = $1 RETURNING id', [id])
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


