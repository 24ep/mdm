import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
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
      return NextResponse.json({ error: 'Unauthorized' }}

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }}

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
      sets.push(`is_active = $${values.length}`)
    }
    if (role) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }}
      values.push(role)
      sets.push(`role = $${values.length}`)
    }
    if (defaultSpaceId !== undefined) {
      values.push(defaultSpaceId || null)
      sets.push(`default_space_id = $${values.length}`)
    }

    if (!sets.length) {
      return NextResponse.json({ error: 'No fields to update' }}

    values.push(id)
    const sql = `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id, email, name, role, is_active, created_at, default_space_id`

    const { rows } = await query(sql, values)
    if (!rows.length) {
      return NextResponse.json({ error: 'User not found' }}

    // Handle space memberships if provided
    if (spaces && Array.isArray(spaces)) {
      // Remove existing space memberships
      await query('DELETE FROM space_members WHERE user_id = $1', [id])

      // Add new space memberships
      for (const space of spaces) {
        if (space.spaceId && space.role) {
          await query(
            'INSERT INTO space_members (user_id, space_id, role) VALUES ($1, $2, $3)',
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



export const PUT = withErrorHandling(putHandler, 'PUT /api/src\app\api\admin\users\[id]\route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\admin\users\[id]\route.ts')

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }}

    const { id } = await params
    const { rows } = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'User not found' }}

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

