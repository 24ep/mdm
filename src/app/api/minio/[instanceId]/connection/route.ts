import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Client as MinioClient } from 'minio'

async function getMinIOConfig(instanceId: string) {
  // Get service with minio-management plugin for this instance
  const result = await query(
    `SELECT 
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
    return null
  }

  const row = result.rows[0]
  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpoints = row.endpoints || []

  // Extract MinIO connection details
  const endpoint = config.endpoint || credentials.endpoint || endpoints[0]?.url || process.env.MINIO_ENDPOINT || 'localhost'
  const port = config.port || credentials.port || endpoints[0]?.port || parseInt(process.env.MINIO_PORT || '9000')
  const accessKey = config.access_key || credentials.access_key || process.env.MINIO_ACCESS_KEY || 'minioadmin'
  const secretKey = config.secret_key || credentials.secret_key || process.env.MINIO_SECRET_KEY || 'minioadmin'
  const useSSL = config.use_ssl || credentials.use_ssl || endpoint.startsWith('https://') || process.env.MINIO_USE_SSL === 'true'
  const region = config.region || credentials.region || process.env.MINIO_REGION || 'us-east-1'

  // Parse endpoint URL
  let endpointUrl: URL
  try {
    endpointUrl = new URL(endpoint.startsWith('http') ? endpoint : `http://${endpoint}`)
  } catch {
    endpointUrl = new URL(`http://${endpoint}`)
  }

  return {
    endPoint: endpointUrl.hostname,
    port: port || (endpointUrl.port ? parseInt(endpointUrl.port) : (useSSL ? 443 : 9000)),
    useSSL,
    accessKey,
    secretKey,
    region,
  }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId } = await params
    const config = await getMinIOConfig(instanceId)

    if (!config) {
      return NextResponse.json(
        { error: 'MinIO configuration not found for this instance' },
        { status: 404 }
      )
    }

    // Test connection
    const client = new MinioClient(config)
    await client.listBuckets()

    return NextResponse.json({
      success: true,
      message: 'MinIO connection successful',
      endpoint: `${config.useSSL ? 'https' : 'http'}://${config.endPoint}:${config.port}`,
    })
  } catch (error) {
    console.error('MinIO connection test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      },
      { status: 500 }
    )
}

export const GET = withErrorHandling(getHandler, 'GET /api/minio/[instanceId]/connection')

