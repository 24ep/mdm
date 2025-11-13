import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { user_id, role } = body

    if (!user_id || !role) {
      return NextResponse.json({ error: 'user_id and role are required' }, { status: 400 })
    }

    // Check if user has permission to manage this dashboard
    const { rows: accessCheck } = await query(`
      SELECT d.created_by, dp.role
      FROM dashboards d
      LEFT JOIN dashboard_permissions dp ON dp.dashboard_id = d.id AND dp.user_id = $2
      WHERE d.id = $1 AND d.deleted_at IS NULL
    `, [id, session.user.id])

    if (accessCheck.length === 0) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const dashboard = accessCheck[0]
    const canManage = dashboard.created_by === session.user.id || 
                     (dashboard.role && dashboard.role === 'ADMIN')

    if (!canManage) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if permission already exists
    const { rows: existingPermission } = await query(`
      SELECT id FROM dashboard_permissions 
      WHERE dashboard_id = $1 AND user_id = $2
    `, [id, user_id])

    if (existingPermission.length > 0) {
      // Update existing permission
      await query(`
        UPDATE dashboard_permissions 
        SET role = $3 
        WHERE dashboard_id = $1 AND user_id = $2
      `, [id, user_id, role])
    } else {
      // Create new permission
      await query(`
        INSERT INTO dashboard_permissions (dashboard_id, user_id, role)
        VALUES ($1, $2, $3)
      `, [id, user_id, role])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error managing dashboard permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
