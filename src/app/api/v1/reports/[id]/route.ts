import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { id } = await params

    const result = await query(
      `SELECT 
        r.*,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug
        ) as space
      FROM reports r
      LEFT JOIN spaces s ON s.id = r.space_id
      WHERE r.id = $1 AND r.deleted_at IS NULL`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found'  })

    const row = result.rows[0]
    const report = {
      id: row.id,
      name: row.name,
      description: row.description,
      sourceType: row.source_type,
      sourceId: row.source_id,
      spaceId: row.space_id,
      space: row.space,
      url: row.url,
      embedUrl: row.embed_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/v1/reports/${id}`,
      200
    )

    return NextResponse.json({ report })



export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\v1\reports\[id]\route.ts')
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { id } = await params
    const body = await request.json()

    const permission = await checkPermission({
      resource: 'reports',
      action: 'update',
      resourceId: id,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      values.push(body.name)
      paramIndex++
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(body.description)
      paramIndex++
    }
    if (body.url !== undefined) {
      updates.push(`url = $${paramIndex}`)
      values.push(body.url)
      paramIndex++
    }
    if (body.embedUrl !== undefined) {
      updates.push(`embed_url = $${paramIndex}`)
      values.push(body.embedUrl)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update'  })

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const updateQuery = `
      UPDATE reports
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found'  })

    await logAPIRequest(
      session.user.id,
      'PUT',
      `/api/v1/reports/${id}`,
      200
    )

    return NextResponse.json({ message: 'Report updated successfully' })



export const PUT = withErrorHandling(putHandler, 'PUT /api/src\app\api\v1\reports\[id]\route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\v1\reports\[id]\route.ts')

    const { id } = await params

    const permission = await checkPermission({
      resource: 'reports',
      action: 'delete',
      resourceId: id,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    const result = await query(
      `UPDATE reports
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found'  })

    await logAPIRequest(
      session.user.id,
      'DELETE',
      `/api/v1/reports/${id}`,
      200
    )

    return NextResponse.json({ message: 'Report deleted successfully' })

