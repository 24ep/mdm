/**
 * Plugin Hub API - Get specific plugin
 */

import { NextRequest, NextResponse } from 'next/server'
import { PluginDefinition } from '@/features/marketplace/types'

// Plugin Hub runs as separate service - connect via URL only
const PLUGIN_HUB_URL = process.env.PLUGIN_HUB_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Fetch from remote hub API (hub runs as separate service)
    try {
      const response = await fetch(`${PLUGIN_HUB_URL}/api/plugins/${slug}`)
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          plugin: {
            ...data.plugin,
            source: 'hub',
            sourceUrl: PLUGIN_HUB_URL,
          },
        })
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: 'Plugin not found in hub' },
          { status: 404 }
        )
      } else {
        throw new Error(`Hub API returned ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch from plugin hub:', error)
      return NextResponse.json(
        { 
          error: 'Plugin hub is not available',
          message: `Cannot connect to plugin hub at ${PLUGIN_HUB_URL}. Please ensure the hub is running.`
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error fetching plugin from hub:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Local file loading removed - hub runs as separate service
// All plugins are fetched via API from the hub

