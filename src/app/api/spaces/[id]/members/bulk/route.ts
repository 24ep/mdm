import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const body = await request.json()
    const { operation, userIds, data } = body

    if (!operation || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }

    // Check if current user has permission to manage members
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let result: any = {}

    switch (operation) {
      case 'change_role':
        if (!data?.role) {
          return NextResponse.json({ error: 'Role is required for change_role operation' }, { status: 400 })
        }
        
        // Update roles for selected users
        const updateResult = await query(`
          UPDATE space_members 
          SET role = $1, updated_at = NOW()
          WHERE space_id = $2::uuid AND user_id = ANY($3::uuid[])
          RETURNING user_id, role
        `, [data.role, spaceId, userIds])
        
        result = {
          operation: 'change_role',
          updated: updateResult.rows.length,
          role: data.role
        }
        break

      case 'remove':
        // Remove selected users from space
        const removeResult = await query(`
          DELETE FROM space_members 
          WHERE space_id = $1::uuid AND user_id = ANY($2::uuid[])
          RETURNING user_id
        `, [spaceId, userIds])
        
        result = {
          operation: 'remove',
          removed: removeResult.rows.length
        }
        break

      case 'activate':
        // Activate selected users (if they have an is_active field)
        const activateResult = await query(`
          UPDATE space_members 
          SET is_active = true, updated_at = NOW()
          WHERE space_id = $1::uuid AND user_id = ANY($2::uuid[])
          RETURNING user_id
        `, [spaceId, userIds])
        
        result = {
          operation: 'activate',
          activated: activateResult.rows.length
        }
        break

      case 'deactivate':
        // Deactivate selected users
        const deactivateResult = await query(`
          UPDATE space_members 
          SET is_active = false, updated_at = NOW()
          WHERE space_id = $1::uuid AND user_id = ANY($2::uuid[])
          RETURNING user_id
        `, [spaceId, userIds])
        
        result = {
          operation: 'deactivate',
          deactivated: deactivateResult.rows.length
        }
        break

      case 'export':
        // Get member details for export
        const exportResult = await query(`
          SELECT 
            sm.*,
            u.name as user_name,
            u.email as user_email,
            u.role as user_system_role,
            u.is_active,
            u.last_sign_in_at
          FROM space_members sm
          LEFT JOIN users u ON sm.user_id = u.id
          WHERE sm.space_id = $1::uuid AND sm.user_id = ANY($2::uuid[])
          ORDER BY u.name ASC
        `, [spaceId, userIds])
        
        result = {
          operation: 'export',
          members: exportResult.rows,
          count: exportResult.rows.length
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
