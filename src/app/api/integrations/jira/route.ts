import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { JiraService } from '@/lib/jira-service'

// Get Jira configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')

    if (!spaceId) {
      return NextResponse.json(
        { error: 'space_id is required' },
        { status: 400 }
      )
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [spaceId, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get Jira configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_apikey_value, name, is_active, created_at, updated_at
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%Jira%'
         AND deleted_at IS NULL
         AND is_active = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [spaceId]
    )

    if (configRows.length === 0) {
      return NextResponse.json({
        config: null,
        isConfigured: false
      })
    }

    const config = configRows[0]
    return NextResponse.json({
      config: {
        id: config.id,
        baseUrl: config.api_url,
        name: config.name,
        isActive: config.is_active,
        isConfigured: true,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      },
      isConfigured: true
    })
  } catch (error: any) {
    console.error('Error fetching Jira config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Jira configuration' },
      { status: 500 }
    )
  }
}

// Configure Jira integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { space_id, baseUrl, email, apiToken, projectKey, name } = body

    if (!space_id || !baseUrl || !email || !apiToken) {
      return NextResponse.json(
        { error: 'space_id, baseUrl, email, and apiToken are required' },
        { status: 400 }
      )
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Test connection first
    const service = new JiraService({
      baseUrl,
      email,
      apiToken,
      projectKey
    })

    const testResult = await service.testConnection()
    if (!testResult.success) {
      return NextResponse.json(
        { error: `Connection test failed: ${testResult.error}` },
        { status: 400 }
      )
    }

    // Store configuration
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let storedApiToken = apiToken
    let storedEmail = email
    
    if (useVault) {
      const connectionId = `jira-${Date.now()}`
      await secretsManager.storeSecret(`jira-integrations/${connectionId}/credentials`, {
        apiToken,
        email
      })
      storedApiToken = `vault://${connectionId}/apiToken`
      storedEmail = `vault://${connectionId}/email`
    } else {
      // Encrypt sensitive data
      const { encryptApiKey } = await import('@/lib/encryption')
      storedApiToken = encryptApiKey(apiToken)
      storedEmail = encryptApiKey(email)
    }

    // Check if configuration already exists
    const { rows: existingRows } = await query(
      `SELECT id FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%Jira%'
         AND deleted_at IS NULL
       LIMIT 1`,
      [space_id]
    )

    if (existingRows.length > 0) {
      // Update existing
      await query(
        `UPDATE public.external_connections 
         SET api_url = $1, 
             api_auth_apikey_value = $2,
             api_auth_username = $3,
             name = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [baseUrl, storedApiToken, storedEmail, name || 'Jira Integration', existingRows[0].id]
      )
    } else {
      // Create new
      await query(
        `INSERT INTO public.external_connections 
         (space_id, connection_type, name, api_url, api_auth_type, api_auth_apikey_value, api_auth_username, is_active, created_by, created_at, updated_at)
         VALUES ($1, 'api', $2, $3, 'basic', $4, $5, true, $6, NOW(), NOW())`,
        [space_id, name || 'Jira Integration', baseUrl, storedApiToken, storedEmail, session.user.id]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Jira integration configured successfully'
    })
  } catch (error: any) {
    console.error('Error configuring Jira:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to configure Jira integration' },
      { status: 500 }
    )
  }
}

// Test connection
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { baseUrl, email, apiToken } = body

    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json(
        { error: 'baseUrl, email, and apiToken are required' },
        { status: 400 }
      )
    }

    // Test connection
    const service = new JiraService({
      baseUrl,
      email,
      apiToken
    })

    const result = await service.testConnection()

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error testing Jira connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test connection' },
      { status: 500 }
    )
  }
}

