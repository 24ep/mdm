import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getUserPermissions } from '@/lib/permission-checker'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } 

export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\permissions\user\route.ts')= authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized'  })



    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId') || undefined
    const userId = searchParams.get('userId') || session.user.id

    // Check if user has permission to view other users' permissions
    if (userId !== session.user.id) {
      // Only admins can view other users' permissions
      if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
        return NextResponse.json({ error: 'Forbidden'  })
    }

    // Get user's global role
    const { rows: userRows } = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    )

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found'  })

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
