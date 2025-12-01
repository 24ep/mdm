import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { auditLogger } from '@/lib/utils/audit-logger'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const sql = `
      SELECT 
        rp.*,
        u.name as user_name,
        u.email as user_email,
        r.name as role_name
      FROM report_permissions rp
      LEFT JOIN users u ON u.id = rp.user_id
      LEFT JOIN roles r ON r.id = rp.role_id
      WHERE rp.report_id = $1
      ORDER BY rp.created_at DESC
    `

    const result = await query(sql, [id])
    
    const permissions = result.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      role_id: row.role_id,
      permission: row.permission,
      user_name: row.user_name,
      role_name: row.role_name,
      type: row.user_id ? 'user' : 'role'
    }))

    return NextResponse.json({ permissions })



export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\reports\[id]\permissions\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { user_id, role_id, permission } = body

    if (!permission || (!user_id && !role_id)) {
      return NextResponse.json({ error: 'Permission and user_id or role_id required'  })

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\reports\[id]\permissions\route.ts')

    // Check if user owns the report
    const ownerCheck = await query(
      'SELECT created_by FROM reports WHERE id = $1',
      [id]
    )

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found'  })

    if (ownerCheck.rows[0].created_by !== session.user.id) {
      return NextResponse.json({ error: 'Only report owner can manage permissions'  })

    const sql = `
      INSERT INTO report_permissions (report_id, user_id, role_id, permission, created_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (report_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(role_id, '00000000-0000-0000-0000-000000000000'::uuid), permission)
      DO UPDATE SET permission = EXCLUDED.permission
      RETURNING *
    `

    const result = await query(sql, [
      id,
      user_id || null,
      role_id || null,
      permission,
      session.user.id
    ])

    // Log audit event
    auditLogger.permissionChanged(id, result.rows[0].id)

    return NextResponse.json({ permission: result.rows[0] }, { status: 201 })

