import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { deleteCredentials, storeCredentials } from '@/shared/lib/security/credential-manager'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const result = await query(
    `SELECT 
      si.*,
      json_build_object(
        'id', sr.id,
        'name', sr.name,
        'slug', sr.slug
      ) as service
     FROM service_installations si
     JOIN service_registry sr ON sr.id = si.service_id
     WHERE si.id = $1 AND si.deleted_at IS NULL`,
    [id]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
  }

  const row = result.rows[0]

  const installation = {
    id: row.id,
    serviceId: row.service_id,
    spaceId: row.space_id,
    installedBy: row.installed_by,
    config: row.config,
    status: row.status,
    lastHealthCheck: row.last_health_check,
    healthStatus: row.health_status,
    permissions: row.permissions,
    service: row.service,
    installedAt: row.installed_at,
    updatedAt: row.updated_at,
  }

  return NextResponse.json({ installation })
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { config, credentials, status } = body

  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (config !== undefined) {
    updates.push(`config = $${paramIndex}`)
    values.push(JSON.stringify(config))
    paramIndex++
  }

  if (credentials !== undefined) {
    // Store credentials securely
    await storeCredentials(`plugin:installation:${id}`, credentials)
    updates.push(`credentials = $${paramIndex}`)
    values.push(JSON.stringify({ stored: true }))
    paramIndex++
  }

  if (status !== undefined) {
    updates.push(`status = $${paramIndex}`)
    values.push(status)
    paramIndex++
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  updates.push(`updated_at = NOW()`)
  values.push(id)

  const updateQuery = `
    UPDATE service_installations
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex} AND deleted_at IS NULL
    RETURNING *
  `

  const result = await query(updateQuery, values)

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
  }

  const row = result.rows[0]

  const installation = {
    id: row.id,
    serviceId: row.service_id,
    spaceId: row.space_id,
    config: row.config,
    status: row.status,
    updatedAt: row.updated_at,
  }

  await logAPIRequest(
    session.user.id,
    'PUT',
    `/api/marketplace/installations/${id}`,
    200
  )

  return NextResponse.json({ installation })
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Get installation to update count
  const installation = await query(
    'SELECT service_id FROM service_installations WHERE id = $1',
    [id]
  )

  if (installation.rows.length === 0) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
  }

  const serviceId = installation.rows[0].service_id

  // Soft delete installation
  const result = await query(
    `UPDATE service_installations
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
  }

  // Update installation count
  await query(
    `UPDATE service_registry 
     SET installation_count = GREATEST(installation_count - 1, 0), updated_at = NOW()
     WHERE id = $1`,
    [serviceId]
  )

  // Delete credentials
  await deleteCredentials(`plugin:installation:${id}`)

  await logAPIRequest(
    session.user.id,
    'DELETE',
    `/api/marketplace/installations/${id}`,
    200
  )

  return NextResponse.json({ message: 'Installation deleted successfully' })
}

export const GET = withErrorHandling(getHandler, 'GET /api/marketplace/installations/[id]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/marketplace/installations/[id]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/marketplace/installations/[id]')
