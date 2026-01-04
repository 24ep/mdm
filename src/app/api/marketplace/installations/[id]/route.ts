import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { dropPluginSchema } from '@/lib/plugin-schema-utils'
import { checkPermission } from '@/shared/lib/security/permission-checker'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/marketplace/installations/[id]
 * Uninstall a plugin (soft delete) and remove its menu item
 */
async function deleteHandler(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Installation ID is required' }, { status: 400 })
  }

  // Check if installation exists and get details
  const existingResult = await query(
    `SELECT si.id, si.service_id, si.space_id, si.db_schema, sr.slug 
     FROM service_installations si
     JOIN service_registry sr ON sr.id = si.service_id
     WHERE si.id = CAST($1 AS uuid) AND si.deleted_at IS NULL`,
    [id]
  )

  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
  }

  const installation = existingResult.rows[0]

  // Check permission
  const permission = await checkPermission({
    resource: 'marketplace',
    action: 'uninstall',
    spaceId: installation.space_id || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  // Soft delete the installation
  await query(
    `UPDATE service_installations SET deleted_at = NOW(), updated_at = NOW() WHERE id = CAST($1 AS uuid)`,
    [id]
  )

  // Decrement installation count
  await query(
    `UPDATE service_registry 
     SET installation_count = GREATEST(0, installation_count - 1), updated_at = NOW()
     WHERE id = CAST($1 AS uuid)`,
    [installation.service_id]
  )

  // Remove menu item if it exists and was created by this plugin
  try {
    await query(
      `DELETE FROM menu_items WHERE source_plugin_id = CAST($1 AS uuid)`,
      [installation.service_id]
    )
    console.log(`[DELETE /api/marketplace/installations] Removed menu item for plugin: ${installation.slug}`)
  } catch (menuError) {
    console.error('[DELETE /api/marketplace/installations] Failed to remove menu item:', menuError)
  }

  // Drop isolated PostgreSQL schema
  if (installation.db_schema) {
    try {
      await dropPluginSchema(installation.slug)
      console.log(`[DELETE /api/marketplace/installations] Dropped schema: ${installation.db_schema} for plugin: ${installation.slug}`)
    } catch (schemaError) {
      console.error('[DELETE /api/marketplace/installations] Failed to drop schema:', schemaError)
    }
  }

  await logAPIRequest(
    session.user.id,
    'DELETE',
    `/api/marketplace/installations/${id}`,
    200,
    installation.space_id
  )

  return NextResponse.json({
    success: true,
    message: 'Plugin uninstalled successfully'
  })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/marketplace/installations/[id]')
