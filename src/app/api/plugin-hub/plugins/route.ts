/**
 * Plugin Hub API
 * Serves plugins from the hub repository
 */

import { NextRequest, NextResponse } from 'next/server'
import { PluginDefinition } from '@/features/marketplace/types'
import { rateLimitMiddleware } from '@/shared/middleware/api-rate-limit'

// Plugin Hub runs as separate service - connect via URL only
const PLUGIN_HUB_URL = process.env.PLUGIN_HUB_URL || 'http://localhost:3001'

/**
 * GET /api/plugin-hub/plugins
 * List all available plugins from the hub
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 100,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')

    // Fetch from remote hub API (hub runs as separate service)
    let plugins: PluginDefinition[] = []

    try {
      plugins = await fetchPluginsFromRemoteHub({
        category: category || undefined,
        status: status || undefined,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      })
    } catch (error) {
      console.error('Failed to fetch from plugin hub:', error)
      console.error('Make sure plugin hub is running at:', PLUGIN_HUB_URL)
      return NextResponse.json(
        { 
          plugins: [],
          error: 'Plugin hub is not available',
          message: `Cannot connect to plugin hub at ${PLUGIN_HUB_URL}. Please ensure the hub is running.`
        },
        { status: 503 }
      )
    }

    // Apply filters
    if (category) {
      plugins = plugins.filter(p => p.category === category)
    }
    if (status) {
      plugins = plugins.filter(p => p.status === status)
    }
    if (verified !== null) {
      const verifiedBool = verified === 'true'
      plugins = plugins.filter(p => p.verified === verifiedBool)
    }

    // Mark all as external/hub plugins
    plugins = plugins.map(plugin => ({
      ...plugin,
      source: 'hub' as const,
      sourceUrl: PLUGIN_HUB_URL,
    }))

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error('Error fetching plugins from hub:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins from hub' },
      { status: 500 }
    )
  }
}

// Local file loading removed - hub runs as separate service
// All plugins are fetched via API from the hub

/**
 * Fetch plugins from remote hub API
 */
async function fetchPluginsFromRemoteHub(filters?: {
  category?: string
  status?: string
  verified?: boolean
}): Promise<PluginDefinition[]> {
  const params = new URLSearchParams()
  if (filters?.category) params.append('category', filters.category)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.verified !== undefined) params.append('verified', filters.verified.toString())

  const response = await fetch(`${PLUGIN_HUB_URL}/api/plugins?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error(`Hub API returned ${response.status}`)
  }

  const data = await response.json()
  return data.plugins || []
}

