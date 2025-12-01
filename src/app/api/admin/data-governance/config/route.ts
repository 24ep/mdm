import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // TODO: Load from database or configuration store
    // For now, return empty config
    const config = null

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error loading data governance config:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}





export const GET = withErrorHandling(getHandler, 'GET /api/admin/data-governance/config')

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { config } = body

    // TODO: Save to database or configuration store
    // For now, just validate the config
    if (!config.host) {
      return NextResponse.json(
        { error: 'OpenMetadata host is required' },
        { status: 400 }
      )
    }

    // Validate OpenMetadata connection
    try {
      const testUrl = `${config.host}/api/v1/system/version`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (config.authProvider === 'basic' && config.authConfig?.username && config.authConfig?.password) {
        const credentials = Buffer.from(
          `${config.authConfig.username}:${config.authConfig.password}`
        ).toString('base64')
        headers['Authorization'] = `Basic ${credentials}`
      } else if (config.authProvider === 'jwt' && config.authConfig?.jwtToken) {
        headers['Authorization'] = `Bearer ${config.authConfig.jwtToken}`
      }

      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers,
      })

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to connect to OpenMetadata. Please check your configuration.' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to connect to OpenMetadata. Please check your configuration.' },
        { status: 400 }
      )
    }

    // TODO: Save config to database
    // await saveDataGovernanceConfig(config)

    return NextResponse.json({ 
      success: true,
      config: {
        ...config,
        lastSync: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error saving data governance config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/data-governance/config')

