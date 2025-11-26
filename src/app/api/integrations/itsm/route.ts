import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { ITSMService } from '@/lib/itsm-service'

// Get ITSM configuration
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

    // Get ITSM configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_type, api_auth_apikey_value, api_auth_username, 
              api_auth_password, name, is_active, created_at, updated_at, config
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ITSM%'
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
        provider: (config.config as any)?.provider || 'custom',
        authType: config.api_auth_type,
        name: config.name,
        isActive: config.is_active,
        isConfigured: true,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
        customConfig: config.config || {}
      },
      isConfigured: true
    })
  } catch (error: any) {
    console.error('Error fetching ITSM config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ITSM configuration' },
      { status: 500 }
    )
  }
}

// Configure ITSM integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      space_id, 
      baseUrl, 
      provider, 
      apiKey, 
      username, 
      password, 
      authType, 
      instanceName,
      customEndpoints,
      fieldMappings,
      name 
    } = body

    if (!space_id || !baseUrl || !provider) {
      return NextResponse.json(
        { error: 'space_id, baseUrl, and provider are required' },
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

    // Validate auth based on provider
    if (provider === 'servicenow' && (!username || !password)) {
      return NextResponse.json(
        { error: 'username and password are required for ServiceNow' },
        { status: 400 }
      )
    }
    if (provider === 'bmc_remedy' && !apiKey && (!username || !password)) {
      return NextResponse.json(
        { error: 'API key or username/password is required for BMC Remedy' },
        { status: 400 }
      )
    }
    if (provider === 'cherwell' && !apiKey) {
      return NextResponse.json(
        { error: 'API key is required for Cherwell' },
        { status: 400 }
      )
    }

    // Test connection first
    const service = new ITSMService({
      baseUrl,
      provider: provider as any,
      apiKey,
      username,
      password,
      authType: authType || 'apikey',
      instanceName,
      customEndpoints,
      fieldMappings
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
    
    let storedApiKey = apiKey || null
    let storedUsername = username || null
    let storedPassword = password || null
    
    if (useVault) {
      const connectionId = `itsm-${Date.now()}`
      await secretsManager.setSecret(`itsm-integrations/${connectionId}/credentials`, {
        apiKey,
        username,
        password
      })
      storedApiKey = apiKey ? `vault://${connectionId}/apiKey` : null
      storedUsername = username ? `vault://${connectionId}/username` : null
      storedPassword = password ? `vault://${connectionId}/password` : null
    } else {
      if (apiKey) storedApiKey = encryptApiKey(apiKey)
      if (username) storedUsername = encryptApiKey(username)
      if (password) storedPassword = encryptApiKey(password)
    }

    // Store custom config
    const customConfig = {
      provider,
      instanceName,
      customEndpoints,
      fieldMappings
    }

    // Check if configuration already exists
    const { rows: existingRows } = await query(
      `SELECT id FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ITSM%'
         AND deleted_at IS NULL
       LIMIT 1`,
      [space_id]
    )

    if (existingRows.length > 0) {
      // Update existing
      await query(
        `UPDATE public.external_connections 
         SET api_url = $1, 
             api_auth_type = $2,
             api_auth_apikey_value = $3,
             api_auth_username = $4,
             api_auth_password = $5,
             name = $6,
             config = $7,
             updated_at = NOW()
         WHERE id = $8`,
        [
          baseUrl,
          authType || 'apikey',
          storedApiKey,
          storedUsername,
          storedPassword,
          name || `${provider} Integration`,
          JSON.stringify(customConfig),
          existingRows[0].id
        ]
      )
    } else {
      // Create new
      await query(
        `INSERT INTO public.external_connections 
         (space_id, connection_type, name, api_url, api_auth_type, api_auth_apikey_value, 
          api_auth_username, api_auth_password, is_active, config, created_by, created_at, updated_at)
         VALUES ($1, 'api', $2, $3, $4, $5, $6, $7, true, $8, $9, NOW(), NOW())`,
        [
          space_id,
          name || `${provider} Integration`,
          baseUrl,
          authType || 'apikey',
          storedApiKey,
          storedUsername,
          storedPassword,
          JSON.stringify(customConfig),
          session.user.id
        ]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ITSM integration configured successfully'
    })
  } catch (error: any) {
    console.error('Error configuring ITSM:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to configure ITSM integration' },
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
    const { baseUrl, provider, apiKey, username, password, authType, instanceName, customEndpoints, fieldMappings } = body

    if (!baseUrl || !provider) {
      return NextResponse.json(
        { error: 'baseUrl and provider are required' },
        { status: 400 }
      )
    }

    // Test connection
    const service = new ITSMService({
      baseUrl,
      provider: provider as any,
      apiKey,
      username,
      password,
      authType: authType || 'apikey',
      instanceName,
      customEndpoints,
      fieldMappings
    })

    const result = await service.testConnection()

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error testing ITSM connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test connection' },
      { status: 500 }
    )
  }
}

