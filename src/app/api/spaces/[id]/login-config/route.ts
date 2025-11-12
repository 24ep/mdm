import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { SpacesEditorConfig } from '@/lib/space-studio-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceSlugOrId } = await params
    
    // Get space ID from slug
    const spaceResult = await query(
      'SELECT id FROM spaces WHERE slug = $1 OR id = $1 LIMIT 1',
      [spaceSlugOrId]
    )

    if (spaceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const spaceId = spaceResult.rows[0].id

    // Get spaces editor config
    const configKey = `spaces_editor_config_${spaceId}`
    const configResult = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [configKey]
    )

    if (configResult.rows.length > 0) {
      try {
        const config: SpacesEditorConfig = JSON.parse(configResult.rows[0].value)
        return NextResponse.json({ 
          loginPageConfig: config.loginPageConfig || null,
          postAuthRedirectPageId: config.postAuthRedirectPageId || null
        })
      } catch (e) {
        console.error('Error parsing config:', e)
      }
    }

    return NextResponse.json({ 
      loginPageConfig: null,
      postAuthRedirectPageId: null
    })
  } catch (error) {
    console.error('Error fetching login config:', error)
    return NextResponse.json({ 
      loginPageConfig: null,
      postAuthRedirectPageId: null
    })
  }
}


