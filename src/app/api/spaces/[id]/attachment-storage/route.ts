import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id

    // Check if user has access to this space
    const { data: spaceMember, error: memberError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Check if user has admin/owner role
    if (!['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get attachment storage configuration
    const { data: storageConfig, error: configError } = await supabase
      .from('space_attachment_storage')
      .select('*')
      .eq('space_id', spaceId)
      .single()

    if (configError && configError.code !== 'PGRST116') {
      console.error('Error fetching attachment storage config:', configError)
      return NextResponse.json({ error: 'Failed to fetch storage configuration' }, { status: 500 })
    }

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const body = await request.json()

    // Check if user has access to this space
    const { data: spaceMember, error: memberError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Check if user has admin/owner role
    if (!['admin', 'owner'].includes(spaceMember.role)) {
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

    // Upsert the configuration
    const { error: upsertError } = await supabase
      .from('space_attachment_storage')
      .upsert({
        space_id: spaceId,
        provider,
        config,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error saving attachment storage config:', upsertError)
      return NextResponse.json({ error: 'Failed to save storage configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in attachment storage PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
