import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { encrypt } from '@/lib/encryption'

/**
 * GET /api/minio/[instanceId]/config
 * Get MinIO configuration (without sensitive data)
 */
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

    // Get service with minio-management plugin
    const result = await query(
      `SELECT 
        is.id as service_id,
        is.management_config,
        sma.credentials,
        is.endpoints
      FROM instance_services is
      JOIN service_registry sr ON sr.id = is.management_plugin_id
      LEFT JOIN service_management_assignments sma ON sma.instance_service_id = is.id
      WHERE is.instance_id = $1
        AND sr.slug = 'minio-management'
        AND is.deleted_at IS NULL
        AND sr.deleted_at IS NULL
      LIMIT 1`,
      [instanceId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'MinIO configuration not found for this instance' },
        { status: 404 }
      )
    }

    const row = result.rows[0]
    const config = row.management_config || {}
    const credentials = row.credentials || {}
    const endpoints = row.endpoints || []

    // Extract configuration (don't expose secret key)
    const endpoint = config.endpoint || credentials.endpoint || endpoints[0]?.url || process.env.MINIO_ENDPOINT || 'localhost'
    const port = config.port || credentials.port || endpoints[0]?.port || parseInt(process.env.MINIO_PORT || '9000')
    const useSSL = config.use_ssl || credentials.use_ssl || endpoint.startsWith('https://') || process.env.MINIO_USE_SSL === 'true'
    const region = config.region || credentials.region || process.env.MINIO_REGION || 'us-east-1'

    // Parse endpoint URL
    let endpointUrl: URL
    try {
      endpointUrl = new URL(endpoint.startsWith('http') ? endpoint : `http://${endpoint}`)
    } catch {
      endpointUrl = new URL(`http://${endpoint}`)
    }

    return NextResponse.json({
      serviceId: row.service_id,
      endpoint: endpointUrl.hostname,
      port: port || (endpointUrl.port ? parseInt(endpointUrl.port) : (useSSL ? 443 : 9000)),
      useSSL: useSSL,
      region: region,
      // Don't expose access key or secret key in GET
      hasCredentials: !!(credentials.access_key || config.access_key),
    })
  } catch (error) {
    console.error('Error fetching MinIO config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/minio/[instanceId]/config
 * Update MinIO configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId } = await params
    const body = await request.json()
    const { endpoint, port, accessKey, secretKey, useSSL, region } = body

    if (!endpoint || !accessKey || !secretKey) {
      return NextResponse.json(
        { error: 'endpoint, accessKey, and secretKey are required' },
        { status: 400 }
      )
    }

    // Get service with minio-management plugin
    const serviceResult = await query(
      `SELECT 
        is.id as service_id,
        is.management_plugin_id as plugin_id
      FROM instance_services is
      JOIN service_registry sr ON sr.id = is.management_plugin_id
      WHERE is.instance_id = $1
        AND sr.slug = 'minio-management'
        AND is.deleted_at IS NULL
        AND sr.deleted_at IS NULL
      LIMIT 1`,
      [instanceId]
    )

    if (serviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'MinIO service not found for this instance' },
        { status: 404 }
      )
    }

    const serviceId = serviceResult.rows[0].service_id
    const pluginId = serviceResult.rows[0].plugin_id

    // Prepare management config (non-sensitive)
    const managementConfig = {
      endpoint,
      port: port || 9000,
      use_ssl: useSSL || false,
      region: region || 'us-east-1',
    }

    // Prepare credentials (sensitive - will be encrypted)
    const credentials = {
      endpoint,
      port: port || 9000,
      access_key: accessKey,
      secret_key: secretKey,
      use_ssl: useSSL || false,
      region: region || 'us-east-1',
    }

    // Update instance_services management_config
    await query(
      `UPDATE instance_services
       SET management_config = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(managementConfig), serviceId]
    )

    // Update or create service_management_assignments credentials
    await query(
      `INSERT INTO service_management_assignments (
        id, instance_service_id, plugin_id, assigned_by, assigned_at, config, credentials, is_active
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, NOW(), $4, $5, true
      )
      ON CONFLICT (instance_service_id, plugin_id)
      DO UPDATE SET
        assigned_at = NOW(),
        config = EXCLUDED.config,
        credentials = EXCLUDED.credentials,
        is_active = true`,
      [
        serviceId,
        pluginId,
        session.user.id,
        JSON.stringify(managementConfig),
        JSON.stringify(credentials),
      ]
    )

    await logAPIRequest(
      session.user.id,
      'PUT',
      `/api/minio/${instanceId}/config`,
      200
    )

    return NextResponse.json({
      message: 'MinIO configuration updated successfully',
    })
  } catch (error) {
    console.error('Error updating MinIO config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

