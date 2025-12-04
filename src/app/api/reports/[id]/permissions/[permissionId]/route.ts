import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { auditLogger } from '@/lib/utils/audit-logger'

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; permissionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, permissionId } = await params
    // Check if user owns the report
    const ownerCheck = await query(
      'SELECT created_by FROM reports WHERE id = $1',
      [id]
    )

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })


    if (ownerCheck.rows[0].created_by !== session.user.id) {
      return NextResponse.json({ error: 'Only report owner can manage permissions' }, { status: 500 })

    const sql = `
      DELETE FROM report_permissions
      WHERE id = $1 AND report_id = $2
      RETURNING *
    `

    const result = await query(sql, [permissionId, id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })

    // Log audit event
    auditLogger.permissionChanged(id, permissionId)

    return NextResponse.json({ success: true })



export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/reports/[id]/permissions/[permissionId]/route.ts')