import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { SpacesEditorConfig } from '@/lib/space-studio-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spaceId } = await params

    // Check if user has access to this space
    const accessCheck = await query(
      `SELECT sm.role 
       FROM space_members sm 
       WHERE sm.space_id = $1 AND sm.user_id = $2
       UNION
       SELECT 'OWNER' as role
       FROM spaces s
       WHERE s.id = $1 AND s.created_by = $2`,
      [spaceId, session.user.id]
    )

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

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
  } catch (error) {
    console.error('Error fetching spaces editor config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spaceId } = await params

    // Check if user has access to this space
    const accessCheck = await query(
      `SELECT sm.role 
       FROM space_members sm 
       WHERE sm.space_id = $1 AND sm.user_id = $2
       UNION
       SELECT 'OWNER' as role
       FROM spaces s
       WHERE s.id = $1 AND s.created_by = $2`,
      [spaceId, session.user.id]
    )

    if (accessCheck.rows.length === 0 || !['OWNER', 'ADMIN'].includes(accessCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const config: SpacesEditorConfig = body

    if (!config || config.spaceId !== spaceId) {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
    }

    // Save config to system_settings
    const configKey = `spaces_editor_config_${spaceId}`
    const configValue = JSON.stringify(config)

    await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [configKey, configValue]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving spaces editor config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

