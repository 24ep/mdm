import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(postHandler, '

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions'  })

    const { id } = await params
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const userCheck = await query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    )

    if (!userCheck.rows.length) {
      return NextResponse.json({ error: 'User not found'  })

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    )

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

