import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { auditLogger } from '@/lib/utils/audit-logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; permissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user owns the report
    const ownerCheck = await query(
      'SELECT created_by FROM reports WHERE id = $1',
      [params.id]
    )

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].created_by !== session.user.id) {
      return NextResponse.json({ error: 'Only report owner can manage permissions' }, { status: 403 })
    }

    const sql = `
      DELETE FROM report_permissions
      WHERE id = $1 AND report_id = $2
      RETURNING *
    `

    const result = await query(sql, [params.permissionId, params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    // Log audit event
    auditLogger.permissionChanged(params.id, params.permissionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

