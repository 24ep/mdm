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
    port: port,
    useSSL: useSSL,
    accessKey: accessKey,
    secretKey: secretKey,
    region: region,
  })
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId } = await params
    if (!instanceId) {
      return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string

    if (!file || !bucket) {
      return NextResponse.json(
        { error: 'File and bucket are required' },
        { status: 400 }
      )
    }

    const client = await getMinIOClient(instanceId)

    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucket)
    if (!bucketExists) {
      return NextResponse.json(
        { error: 'Bucket does not exist' },
        { status: 404 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload object
    const objectName = file.name
    await client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': file.type || 'application/octet-stream',
    })

    return NextResponse.json({
      success: true,
      message: 'Object uploaded successfully',
      bucket,
      objectName,
      size: buffer.length,
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/minio/[instanceId]/objects')

