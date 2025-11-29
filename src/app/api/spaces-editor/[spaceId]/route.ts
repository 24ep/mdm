import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { SpacesEditorConfig } from '@/lib/space-studio-manager'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

    const { spaceId } = await params

    // Check if user has access to this space
    const accessCheck = await query(
      `SELECT sm.role 
       FROM space_members sm 
       WHERE sm.space_id = $1::uuid AND sm.user_id = $2::uuid
       UNION
       SELECT 'OWNER' as role
       FROM spaces s
       WHERE s.id = $1::uuid AND s.created_by = $2::uuid`,
      [spaceId, session.user.id]
    )

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }}

    // Get spaces editor config from system_settings
    const configKey = `spaces_editor_config_${spaceId}`
    const configResult = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [configKey]
    )

    if (configResult.rows.length > 0) {
      try {
        const config: SpacesEditorConfig = JSON.parse(configResult.rows[0].value)
        return NextResponse.json({ config })
      } catch (e) {
        console.error('Error parsing config:', e)
        return NextResponse.json({ config: null })
      }
    }

    return NextResponse.json({ config: null })



export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\spaces-editor\[spaceId]\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\spaces-editor\[spaceId]\route.ts')

    const { spaceId } = await params

    // Check if user has access to this space
    const accessCheck = await query(
      `SELECT sm.role 
       FROM space_members sm 
       WHERE sm.space_id = $1::uuid AND sm.user_id = $2::uuid
       UNION
       SELECT 'OWNER' as role
       FROM spaces s
       WHERE s.id = $1::uuid AND s.created_by = $2::uuid`,
      [spaceId, session.user.id]
    )

    if (accessCheck.rows.length === 0 || !['OWNER', 'ADMIN'].includes(accessCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Access denied' }}

    const body = await request.json()
    const config: SpacesEditorConfig = body

    if (!config || config.spaceId !== spaceId) {
      return NextResponse.json({ error: 'Invalid config' }}

    // Save config to system_settings
    const configKey = `spaces_editor_config_${spaceId}`
    const configValue = JSON.stringify(config)

    await query(
      `INSERT INTO system_settings (id, key, value, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [configKey, configValue]
    )

    return NextResponse.json({ success: true })

