import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

async function getPrometheusConfig(instanceId: string) {
  const result = await query(
    `SELECT 
      is.management_config,
      sma.credentials,
      is.endpoints
    FROM instance_services is
    JOIN service_registry sr ON sr.id = is.management_plugin_id
    LEFT JOIN service_management_assignments sma ON sma.instance_service_id = is.id
    WHERE is.instance_id = $1
      AND sr.slug = 'prometheus-management'
      AND is.deleted_at IS NULL
      AND sr.deleted_at IS NULL
    LIMIT 1`,
    [instanceId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpoints = row.endpoints || []

  const apiUrl = config.api_url || credentials.api_url || endpoints[0]?.url || 'http://localhost:9090'

  return { apiUrl }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId } = await params
    const config = await getPrometheusConfig(instanceId)

    if (!config) {
      return NextResponse.json(
        { error: 'Prometheus configuration not found for this instance' },
        { status: 404 }
      )
    }

    // Test connection to Prometheus API
    const response = await fetch(`${config.apiUrl}/api/v1/status/config`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Prometheus API returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Prometheus connection successful',
      version: data.data?.versionInfo?.version,
      apiUrl: config.apiUrl,
    })
  } catch (error) {
    console.error('Prometheus connection test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 500 }
    )
  }
}

