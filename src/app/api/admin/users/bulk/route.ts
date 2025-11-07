import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/api-permissions'

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const forbidden = await requirePermission(request, 'system:manage_users')
    if (forbidden) return forbidden

    const body = await request.json()
    const { userIds, role, spaceId, spaceRole } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 })
    }

    const results = {
      success: [] as string[],
      failed: [] as Array<{ userId: string; error: string }>
    }

    // Bulk update global role
    if (role) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

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
    if (spaceId && spaceRole) {
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
  } catch (error) {
    console.error('Error in bulk user operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




