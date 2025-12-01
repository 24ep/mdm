import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/api-permissions'

async function postHandler(request: NextRequest) {
    // Check permission
    const forbidden = await requirePermission(request, 'system:manage_users')
    if (forbidden) return forbidden

    const body = await request.json()
    const { userIds, role, spaceId, spaceRole, operation, isActive } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required'  })

    const results = {
      success: [] as string[],
      failed: [] as Array<{ userId: string; error: string }>
    }

    // Bulk delete users
    if (operation === 'delete') {
      for (const userId of userIds) {
        try {
          // Prevent deleting yourself
          const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
          if (session?.user?.id === userId) {
            results.failed.push({ userId, error: 'Cannot delete your own account' })
            continue
          }
          
          // Delete space memberships first
          await query('= body FROM space_members WHERE user_id = $1', [userId])
          // Delete user
          await query('= body FROM users WHERE id = $1', [userId])
          results.success.push(userId)
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Delete failed' })
        }
      }
    }
    // Bulk activate/deactivate users
    else if (operation === 'activate' || operation === 'deactivate') {
      const activeStatus = operation === 'activate'
      for (const userId of userIds) {
        try {
          await query(
            'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
            [activeStatus, userId]
          )
          results.success.push(userId)
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Update failed' })
        }
      }
    }
    // Bulk update global role
    else if (role) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role'  })

      for (const userId of userIds) {
        try {
          await query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
            [role, userId]
          )
          results.success.push(userId)
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Update failed' })
        }
      }
    }
    // Bulk assign to space
    else if (spaceId && spaceRole) {
      for (const userId of userIds) {
        try {
          await query(
            `INSERT INTO space_members (space_id, user_id, role, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (space_id, user_id) 
             DO UPDATE SET role = $3, updated_at = NOW()`,
            [spaceId, userId, spaceRole]
          )
          if (!results.success.includes(userId)) {
            results.success.push(userId)
          }
        } catch (error: any) {
          const existing = results.failed.find(f => f.userId === userId)
          if (existing) {
            existing.error += `; Space assignment: ${error.message || 'Failed'}`
          } else {
            results.failed.push({ userId, error: `Space assignment: ${error.message || 'Failed'}` })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: userIds.length,
        succeeded: results.success.length,
        failed: results.failed.length
      }
    })
}









export const POST = withErrorHandling(postHandler, '
export const POST = withErrorHandling(postHandler, '
export const POST = withErrorHandling(postHandler, '
export const POST = withErrorHandling(postHandler, '
export const POST = withErrorHandling(postHandler, '






