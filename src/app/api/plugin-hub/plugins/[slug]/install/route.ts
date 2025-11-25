/**
 * Plugin Hub API - Install plugin from hub
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { promises as fs } from 'fs'
import { join } from 'path'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { rateLimitMiddleware } from '@/shared/middleware/api-rate-limit'

// Plugin Hub runs as separate service - connect via URL
const PLUGIN_HUB_URL = process.env.PLUGIN_HUB_URL || 'http://localhost:3001'
const PLUGIN_INSTALL_DIR = process.env.PLUGIN_INSTALL_DIR || join(process.cwd(), '.plugins', 'installed')

/**
 * POST /api/plugin-hub/plugins/[slug]/install
 * Install a plugin from the hub
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 10,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { spaceId, config } = body

    // Fetch plugin definition from hub API
    let plugin: any
    try {
      const response = await fetch(`${PLUGIN_HUB_URL}/api/plugins/${slug}`)
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Plugin not found in hub' },
            { status: 404 }
          )
        }
        throw new Error(`Hub API returned ${response.status}`)
      }
      
      const data = await response.json()
      plugin = data.plugin

      if (!plugin) {
        return NextResponse.json(
          { error: 'Plugin not found in hub' },
          { status: 404 }
        )
      }
    } catch (error) {
      console.error('Failed to fetch plugin from hub:', error)
      return NextResponse.json(
        { 
          error: 'Plugin hub is not available',
          message: `Cannot connect to plugin hub at ${PLUGIN_HUB_URL}. Please ensure the hub is running.`
        },
        { status: 503 }
      )
    }

    // Check if already installed
    const existing = await query(
      `SELECT id FROM service_registry WHERE slug = $1 AND deleted_at IS NULL`,
      [slug]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Plugin already installed' },
        { status: 409 }
      )
    }

    // Install plugin files to local directory
    const installedPath = await installPluginFiles(slug, plugin)

    // Register plugin in database
    const result = await query(
      `INSERT INTO service_registry (
        id, name, slug, description, version, provider, provider_url, category,
        status, capabilities, api_base_url, api_auth_type, api_auth_config,
        ui_type, ui_config, webhook_supported, webhook_events, icon_url,
        screenshots, documentation_url, support_url, pricing_info, verified,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'approved', $8::jsonb, $9, $10, $11::jsonb,
        $12, $13::jsonb, $14, $15, $16, $17, $18, $19, $20::jsonb, $21, NOW(), NOW()
      ) RETURNING id`,
      [
        plugin.name,
        plugin.slug,
        plugin.description || null,
        plugin.version,
        plugin.provider,
        plugin.providerUrl || null,
        plugin.category,
        JSON.stringify({
          source: 'hub',
          sourceUrl: process.env.PLUGIN_HUB_URL || 'http://localhost:3001',
          installedPath,
        }),
        plugin.apiBaseUrl || null,
        plugin.apiAuthType || null,
        plugin.apiAuthConfig ? JSON.stringify(plugin.apiAuthConfig) : '{}',
        plugin.uiType || null,
        plugin.uiConfig ? JSON.stringify(plugin.uiConfig) : '{}',
        plugin.webhookSupported || false,
        plugin.webhookEvents || [],
        plugin.iconUrl || null,
        plugin.screenshots || [],
        plugin.documentationUrl || null,
        plugin.supportUrl || null,
        plugin.pricingInfo ? JSON.stringify(plugin.pricingInfo) : null,
        plugin.verified || false,
      ]
    )

    const pluginId = result.rows[0].id

    // Create installation if spaceId provided
    if (spaceId) {
      await query(
        `INSERT INTO service_installations (
          id, service_id, space_id, installed_by, config, status, installed_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'active', NOW(), NOW()
        )`,
        [pluginId, spaceId, session.user.id, config ? JSON.stringify(config) : '{}']
      )
    }

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/plugin-hub/plugins/${slug}/install`,
      201
    )

    return NextResponse.json({
      id: pluginId,
      message: 'Plugin installed successfully',
      installedPath,
    }, { status: 201 })
  } catch (error) {
    console.error('Error installing plugin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Install plugin files to local directory
 * Downloads plugin files from hub API
 */
async function installPluginFiles(slug: string, plugin: any): Promise<string> {
  const targetPath = join(PLUGIN_INSTALL_DIR, slug)

  // Create target directory
  await fs.mkdir(targetPath, { recursive: true })

  // For now, we'll create a minimal plugin file
  // In production, you might want to download the full plugin package from hub
  const pluginFile = join(targetPath, 'plugin.ts')
  const pluginContent = `// Plugin installed from hub
// Source: ${PLUGIN_HUB_URL}
// Slug: ${slug}
export const ${slug.replace(/-/g, '')}Plugin = ${JSON.stringify(plugin, null, 2)}
`
  
  await fs.writeFile(pluginFile, pluginContent, 'utf-8')

  // Note: In a full implementation, you would:
  // 1. Download plugin package from hub API
  // 2. Extract it to targetPath
  // 3. Install dependencies if needed

  return targetPath
}

