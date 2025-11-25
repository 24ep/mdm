import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; bucket: string; objectName: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId, bucket, objectName } = await params
    const client = await getMinIOClient(instanceId)

    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucket)
    if (!bucketExists) {
      return NextResponse.json(
        { error: 'Bucket does not exist' },
        { status: 404 }
      )
    }

    // Get object
    const dataStream = await client.getObject(bucket, decodeURIComponent(objectName))
    
    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of dataStream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Get object metadata
    const stat = await client.statObject(bucket, decodeURIComponent(objectName))

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': stat.metaData?.['content-type'] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${objectName.split('/').pop()}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading object:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to download object',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; bucket: string; objectName: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId, bucket, objectName } = await params
    const client = await getMinIOClient(instanceId)

    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucket)
    if (!bucketExists) {
      return NextResponse.json(
        { error: 'Bucket does not exist' },
        { status: 404 }
      )
    }

    // Delete object
    await client.removeObject(bucket, decodeURIComponent(objectName))

    return NextResponse.json({
      success: true,
      message: 'Object deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting object:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete object',
      },
      { status: 500 }
    )
  }
}

