import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params

    // Check if user has access to this space
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id
      }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Check if user has admin/owner role
    if (!['ADMIN', 'OWNER'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get attachment storage configuration
    const storageConfig = await db.spaceAttachmentStorage.findFirst({
      where: { spaceId }
    })

    // Return default MinIO config if no config exists
    const defaultConfig = {
      provider: 'minio',
      config: {
        minio: {
          endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
          access_key: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secret_key: process.env.MINIO_SECRET_KEY || 'minioadmin',
          bucket: process.env.MINIO_BUCKET || 'attachments',
          region: 'us-east-1',
          use_ssl: false
        },
        s3: {
          access_key_id: '',
          secret_access_key: '',
          bucket: '',
          region: 'us-east-1'
        },
        sftp: {
          host: '',
          port: 22,
          username: '',
          password: '',
          path: '/uploads'
        },
        ftp: {
          host: '',
          port: 21,
          username: '',
          password: '',
          path: '/uploads',
          passive: true
        }
      }
    }

    return NextResponse.json({ 
      storage: storageConfig || defaultConfig 
    })

  } catch (error) {
    console.error('Error in attachment storage GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const body = await request.json()

    // Check if user has access to this space
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id
      }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Check if user has admin/owner role
    if (!['ADMIN', 'OWNER'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate required fields based on provider
    const { provider, config } = body
    
    if (!provider || !config) {
      return NextResponse.json({ error: 'Provider and config are required' }, { status: 400 })
    }

    // Validate provider-specific required fields
    const requiredFields = {
      minio: ['endpoint', 'access_key', 'secret_key', 'bucket'],
      s3: ['access_key_id', 'secret_access_key', 'bucket'],
      sftp: ['host', 'username', 'password'],
      ftp: ['host', 'username', 'password']
    }

    const providerConfig = config[provider]
    if (!providerConfig) {
      return NextResponse.json({ error: `Invalid provider: ${provider}` }, { status: 400 })
    }

    const missingFields = requiredFields[provider as keyof typeof requiredFields]?.filter(
      field => !providerConfig[field]
    )

    if (missingFields && missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields for ${provider}: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }

    // Upsert the configuration using raw SQL
    // Note: SpaceAttachmentStorage model doesn't have provider/config fields in schema
    // Using raw SQL to work with the actual table structure
    await query(
      `INSERT INTO space_attachment_storage (space_id, provider, config, created_by, is_active, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT (space_id) 
       DO UPDATE SET provider = $2, config = $3, updated_at = NOW()`,
      [spaceId, provider, JSON.stringify(config), session.user.id]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in attachment storage PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
