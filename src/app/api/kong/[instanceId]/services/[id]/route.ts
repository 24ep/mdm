import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

async function getKongConfig(instanceId: string) {
  const result = await query(
    `SELECT 
      is.management_config,
      sma.credentials,
      is.endpoints
    FROM instance_services is
    JOIN service_registry sr ON sr.id = is.management_plugin_id
    LEFT JOIN service_management_assignments sma ON sma.instance_service_id = is.id
    WHERE is.instance_id = $1
      AND sr.slug = 'kong-management'
      AND is.deleted_at IS NULL
      AND sr.deleted_at IS NULL
    LIMIT 1`,
    [instanceId]
  )

  if (result.rows.length === 0) {
    throw new Error('Kong configuration not found')
  }

  const row = result.rows[0]
  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpoints = row.endpoints || []

  const adminUrl = config.admin_url || credentials.admin_url || endpoints.find((e: any) => e.name === 'admin')?.url || 'http://localhost:8001'
  const apiKey = config.api_key || credentials.api_key || credentials.token

  return { adminUrl, apiKey }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId, id } = await params
    const config = await getKongConfig(instanceId)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['apikey'] = config.apiKey
    }

    const response = await fetch(`${config.adminUrl}/services/${id}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }
      throw new Error(`Kong API returned ${response.status}`)
    }

    const service = await response.json()

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error getting service:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get service',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId, id } = await params
    const body = await request.json()
    const config = await getKongConfig(instanceId)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['apikey'] = config.apiKey
    }

    const response = await fetch(`${config.adminUrl}/services/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Kong API returned ${response.status}`)
    }

    const service = await response.json()

    return NextResponse.json({
      success: true,
      service,
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update service',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId, id } = await params
    const config = await getKongConfig(instanceId)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['apikey'] = config.apiKey
    }

    const response = await fetch(`${config.adminUrl}/services/${id}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }
      throw new Error(`Kong API returned ${response.status}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete service',
      },
      { status: 500 }
    )
  }
}

