import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, role, isActive, defaultSpaceId, spaces } = body

    const sets: string[] = []
    const values: any[] = []

    if (name) {
      values.push(name)
      sets.push(`name = $${values.length}`)
    }
    if (email) {
      values.push(email)
      sets.push(`email = $${values.length}`)
    }
    if (typeof isActive === 'boolean') {
      values.push(isActive)
      sets.push(`is_active = $${values.length}::boolean`)
    }
    if (typeof body.requiresPasswordChange === 'boolean') {
      values.push(body.requiresPasswordChange)
      sets.push(`requires_password_change = $${values.length}::boolean`)
    }
    if (body.lockoutUntil === null || typeof body.lockoutUntil === 'string') {
      const val = body.lockoutUntil ? new Date(body.lockoutUntil) : null
      values.push(val)
      sets.push(`lockout_until = $${values.length}`)
    }
    if (role) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      values.push(role)
      sets.push(`role = $${values.length}`)
    }
    if (defaultSpaceId !== undefined) {
      values.push(defaultSpaceId || null)
      sets.push(`default_space_id = $${values.length}::uuid`)
    }
    if (body.allowedLoginMethods !== undefined) {
      values.push(body.allowedLoginMethods)
      sets.push(`allowed_login_methods = $${values.length}::text[]`)
    }

    if (!sets.length) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    values.push(id)
    const sql = `UPDATE users SET ${sets.join(
      ', '
    )}, updated_at = NOW() WHERE id = $${values.length
      }::uuid RETURNING id, email, name, role, is_active, requires_password_change, lockout_until, created_at, default_space_id, allowed_login_methods`

    const { rows } = await query(sql, values)
    if (!rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (spaces && Array.isArray(spaces)) {
      await query('DELETE FROM space_members WHERE user_id = $1::uuid', [id])

      for (const space of spaces) {
        if (space.spaceId && space.role) {
          await query(
            'INSERT INTO space_members (user_id, space_id, role) VALUES ($1::uuid, $2::uuid, $3)',
            [id, space.spaceId, space.role]
          )
        }
      }
    }

    return NextResponse.json({
      user: {
        id: rows[0].id,
        email: rows[0].email,
        name: rows[0].name,
        role: rows[0].role,
        isActive: rows[0].is_active,
        allowedLoginMethods: rows[0].allowed_login_methods,
        createdAt: rows[0].created_at,
        defaultSpaceId: rows[0].default_space_id
      }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const { rows } = await query(
      'DELETE FROM users WHERE id = $1::uuid RETURNING id',
      [id]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

export const PUT = withErrorHandling(
  putHandler,
  'PUT /api/admin/users/[id]'
)
export const DELETE = withErrorHandling(
  deleteHandler,
  'DELETE /api/admin/users/[id]'
)

