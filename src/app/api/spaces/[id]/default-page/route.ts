import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { SpacesEditorConfig } from '@/lib/space-studio-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceSlugOrId } = await params
    
    // Get space ID from slug or id
    const spaceResult = await query(
      'SELECT id FROM spaces WHERE slug = $1 OR id = $1 LIMIT 1',
      [spaceSlugOrId]
    )

    if (spaceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const spaceId = spaceResult.rows[0].id

    // Get spaces editor config to find default page
    const configKey = `spaces_editor_config_${spaceId}`
    const configResult = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [configKey]
    )

    let defaultPath = '/dashboard'
    let pageId: string | null = null

    if (configResult.rows.length > 0) {
      try {
        const config: SpacesEditorConfig = JSON.parse(configResult.rows[0].value)
        
        // First, check if postAuthRedirectPageId is configured
        if (config.postAuthRedirectPageId && config.pages && config.pages.length > 0) {
          const redirectPage = config.pages.find(p => p.id === config.postAuthRedirectPageId && p.isActive && !p.hidden)
          if (redirectPage) {
            defaultPath = redirectPage.path || '/dashboard'
            pageId = redirectPage.id
          } else {
            // If configured page not found, fall through to default homepage
            const homepage = config.pages
              .filter(p => p.isActive && !p.hidden)
              .sort((a, b) => (a.order || 0) - (b.order || 0))[0]
            if (homepage) {
              defaultPath = homepage.path || '/dashboard'
              pageId = homepage.id
            }
          }
        } else if (config.pages && config.pages.length > 0) {
          // Find the default/homepage (first active page sorted by order)
          const homepage = config.pages
            .filter(p => p.isActive && !p.hidden)
            .sort((a, b) => (a.order || 0) - (b.order || 0))[0]

          if (homepage) {
            defaultPath = homepage.path || '/dashboard'
            pageId = homepage.id
          }
        }
      } catch (e) {
        console.error('Error parsing spaces editor config:', e)
        // Fallback to dashboard
      }
    }

    return NextResponse.json({ 
      path: defaultPath,
      pageId: pageId
    })
  } catch (error) {
    console.error('Error fetching default page:', error)
    // Return default dashboard on error
    return NextResponse.json({ 
      path: '/dashboard',
      pageId: null
    })
  }
}


