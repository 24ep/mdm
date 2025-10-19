import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Implement your authentication system here
    // For now, we'll assume the user is authenticated
    const userId = request.headers.get('x-user-id') // Adjust based on your auth system
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id

    // Check if user has access to this space
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    const userRole = memberResult.rows[0].role

    // Get storage configuration for this space
    const storageResult = await query(
      'SELECT * FROM space_attachment_storage WHERE space_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [spaceId]
    )

    if (storageResult.rows.length === 0) {
      // Return default MinIO configuration
      return NextResponse.json({
        provider: 'minio',
        config: {
          endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
          accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          bucket: process.env.MINIO_BUCKET || 'attachments',
          region: process.env.MINIO_REGION || 'us-east-1'
        }
      })
    }

    const storage = storageResult.rows[0]
    return NextResponse.json({
      provider: storage.provider,
      config: storage.config
    })

  } catch (error) {
    console.error('Error fetching storage configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Implement your authentication system here
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const { provider, config } = await request.json()

    // Check if user has admin/owner role
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    const userRole = memberResult.rows[0].role
    if (!['owner', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate provider
    if (!['minio', 's3', 'sftp', 'ftp'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid storage provider' }, { status: 400 })
    }

    // Deactivate existing configurations
    await query(
      'UPDATE space_attachment_storage SET is_active = false WHERE space_id = $1',
      [spaceId]
    )

    // Insert new configuration
    const result = await query(
      'INSERT INTO space_attachment_storage (space_id, provider, config, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [spaceId, provider, JSON.stringify(config), userId]
    )

    return NextResponse.json({
      id: result.rows[0].id,
      provider: result.rows[0].provider,
      config: result.rows[0].config,
      is_active: result.rows[0].is_active
    })

  } catch (error) {
    console.error('Error saving storage configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
