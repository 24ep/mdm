import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Client as MinioClient } from 'minio'

async function getMinIOClient(instanceId: string) {
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
    throw new Error('MinIO configuration not found')
  }

  const row = result.rows[0]
  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpoints = row.endpoints || []

  const endpoint = config.endpoint || credentials.endpoint || endpoints[0]?.url || process.env.MINIO_ENDPOINT || 'localhost'
  const port = config.port || credentials.port || endpoints[0]?.port || parseInt(process.env.MINIO_PORT || '9000')
  const accessKey = config.access_key || credentials.access_key || process.env.MINIO_ACCESS_KEY || 'minioadmin'
  const secretKey = config.secret_key || credentials.secret_key || process.env.MINIO_SECRET_KEY || 'minioadmin'
  const useSSL = config.use_ssl || credentials.use_ssl || endpoint.startsWith('https://') || process.env.MINIO_USE_SSL === 'true'
  const region = config.region || credentials.region || process.env.MINIO_REGION || 'us-east-1'

  let endpointUrl: URL
  try {
    endpointUrl = new URL(endpoint.startsWith('http') ? endpoint : `http://${endpoint}`)
  } catch {
    endpointUrl = new URL(`http://${endpoint}`)
  }

  return new MinioClient({
    endPoint: endpointUrl.hostname,
    port: port || (endpointUrl.port ? parseInt(endpointUrl.port) : (useSSL ? 443 : 9000)),
    useSSL,
    accessKey,
    secretKey,
    region,
  })
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; bucket: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, bucket } = await params
    const client = await getMinIOClient(instanceId)

    const exists = await client.bucketExists(bucket)
    if (!exists) {
      return NextResponse.json(
        { error: 'Bucket not found' },
        { status: 404 }
      )
    }

    // Get bucket details
    const objects = client.listObjects(bucket, '', true)
    let objectCount = 0
    let totalSize = 0
    const objectList: any[] = []

    for await (const obj of objects) {
      objectCount++
      totalSize += obj.size || 0
      objectList.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag,
      })
    }

    return NextResponse.json({
      name: bucket,
      exists: true,
      objectCount,
      totalSize,
      objects: objectList.slice(0, 100), // Limit to first 100 objects
    })
}



export const GET = withErrorHandling(getHandler, 'GET /api/minio/[instanceId]/buckets/[bucket]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; bucket: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, bucket } = await params
    const client = await getMinIOClient(instanceId)

    // List and delete all objects first
    const objects = client.listObjects(bucket, '', true)
    const objectsToDelete: string[] = []
    for await (const obj of objects) {
      objectsToDelete.push(obj.name || '')
    }

    // Delete all objects
    await Promise.all(
      objectsToDelete.map((objectName) => client.removeObject(bucket, objectName))
    )

    // Delete bucket
    await client.removeBucket(bucket)

    return NextResponse.json({
      success: true,
      message: `Bucket ${bucket} deleted successfully`,
    })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/minio/[instanceId]/buckets/[bucket]')

