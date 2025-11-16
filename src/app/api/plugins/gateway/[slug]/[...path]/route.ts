import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { pluginGateway } from '@/features/marketplace/lib/plugin-gateway'

/**
 * Plugin API Gateway - Routes requests to plugin APIs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const resolvedParams = await params
  return handleGatewayRequest(request, resolvedParams, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const resolvedParams = await params
  return handleGatewayRequest(request, resolvedParams, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const resolvedParams = await params
  return handleGatewayRequest(request, resolvedParams, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const resolvedParams = await params
  return handleGatewayRequest(request, resolvedParams, 'DELETE')
}

async function handleGatewayRequest(
  request: NextRequest,
  params: { slug: string; path: string[] },
  method: string
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, path } = params
    const installationId = request.nextUrl.searchParams.get('installationId')

    if (!installationId) {
      return NextResponse.json(
        { error: 'installationId is required' },
        { status: 400 }
      )
    }

    // Get plugin
    const pluginResult = await query(
      'SELECT * FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    )

    if (pluginResult.rows.length === 0) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
    }

    const row = pluginResult.rows[0]
    const plugin = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      apiBaseUrl: row.api_base_url,
      apiAuthType: row.api_auth_type,
      apiAuthConfig: row.api_auth_config,
    }

    // Build path
    const apiPath = `/${path.join('/')}`
    const queryString = request.nextUrl.searchParams.toString()
    const fullPath = queryString ? `${apiPath}?${queryString}` : apiPath

    // Get request body if present
    let body = null
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.json()
      } catch {
        // No body
      }
    }

    // Route request through gateway
    const response = await pluginGateway.routeRequest(
      plugin as any,
      installationId,
      fullPath,
      method,
      body,
      Object.fromEntries(request.headers.entries())
    )

    // Forward response
    const responseData = await response.json().catch(() => null)
    const responseHeaders = new Headers()
    
    // Copy relevant headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        responseHeaders.set(key, value)
      }
    })

    return NextResponse.json(responseData || {}, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Error in plugin gateway:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

