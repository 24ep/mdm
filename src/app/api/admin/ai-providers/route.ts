import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import { createAuditContext } from '@/lib/audit-context-helper'
import { db as prisma } from '@/lib/db'

async function getHandler() {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' })
    }

    const providers = await prisma.aIProviderConfig.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    const formattedProviders = providers.map(provider => ({
      id: provider.id,
      provider: provider.provider,
      name: provider.name,
      description: provider.description,
      website: provider.website,
      icon: provider.icon,
      isSupported: provider.isSupported,
      apiKey: provider.apiKey ? '***' : null, // Mask the API key for security
      baseUrl: provider.baseUrl,
      customHeaders: provider.customHeaders,
      timeout: provider.timeout,
      retryAttempts: provider.retryAttempts,
      status: provider.status,
      isConfigured: provider.isConfigured,
      lastTested: provider.lastTested,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt
    }))

    return NextResponse.json({ providers: formattedProviders })
  }
}





export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/ai-providers')
async function postHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }}

    const body = await request.json()
    const { 
      provider, 
      name, 
      description, 
      website, 
      icon, 
      apiKey, 
      baseUrl, 
      customHeaders, 
      timeout, 
      retryAttempts 
    } = body

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    let encryptedApiKey: string | null = null

    if (apiKey) {
      if (useVault) {
        // Store in Vault with audit context
        const auditContext = createAuditContext(request, session.user, 'API key creation')
        await secretsManager.storeSecret(
          `ai-providers/${provider}/api-key`,
          { apiKey },
          undefined,
          auditContext
        )
        // Store a reference in database (encrypted or masked)
        encryptedApiKey = 'vault://' + provider
      } else {
        // Use database encryption
        encryptedApiKey = encryptApiKey(apiKey)
      }
    }

    const providerConfig = await prisma.aIProviderConfig.create({
      data: {
        provider,
        name,
        description,
        website,
        icon,
        apiKey: encryptedApiKey,
        baseUrl,
        customHeaders: customHeaders || {},
        timeout: timeout || 30000,
        retryAttempts: retryAttempts || 3,
        status: 'inactive',
        isConfigured: !!apiKey
      }
    })

    const formattedProvider = {
      id: providerConfig.id,
      provider: providerConfig.provider,
      name: providerConfig.name,
      description: providerConfig.description,
      website: providerConfig.website,
      icon: providerConfig.icon,
      isSupported: providerConfig.isSupported,
      apiKey: providerConfig.apiKey ? '***' : null,
      baseUrl: providerConfig.baseUrl,
      customHeaders: providerConfig.customHeaders,
      timeout: providerConfig.timeout,
      retryAttempts: providerConfig.retryAttempts,
      status: providerConfig.status,
      isConfigured: providerConfig.isConfigured,
      lastTested: providerConfig.lastTested,
      createdAt: providerConfig.createdAt,
      updatedAt: providerConfig.updatedAt
    }

    return NextResponse.json({ provider: formattedProvider })
  }
}





export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/ai-providers')
async function putHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' })
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' })
    }

    const body = await request.json()
    const { 
      id,
      apiKey, 
      baseUrl, 
      customHeaders, 
      timeout, 
      retryAttempts 
    } = body

    // Get existing provider to know the provider name
    const existingProvider = await prisma.aIProviderConfig.findUnique({
      where: { id },
      select: { provider: true }
    })

    if (!existingProvider) {
      return NextResponse.json({ error: 'Provider not found' })
    }

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    let encryptedApiKey: string | null | undefined = undefined

    if (apiKey !== undefined) {
      if (apiKey) {
        if (useVault) {
          // Store in Vault with audit context
          const auditContext = createAuditContext(request, session.user, 'API key update')
          await secretsManager.storeSecret(
            `ai-providers/${existingProvider.provider}/api-key`,
            { apiKey },
            undefined,
            auditContext
          )
          // Store reference in database
          encryptedApiKey = 'vault://' + existingProvider.provider
        } else {
          // Use database encryption
          encryptedApiKey = encryptApiKey(apiKey)
        }
      } else {
        // Delete from Vault if using Vault
        if (useVault) {
          try {
            const auditContext = createAuditContext(request, session.user, 'API key deletion')
            await secretsManager.deleteSecret(
              `ai-providers/${existingProvider.provider}/api-key`,
              auditContext
            )
          } catch (error) {
            // Ignore if secret doesn't exist
          }
        }
        encryptedApiKey = null
      }
    }

    const updateData: any = {
      baseUrl,
      customHeaders: customHeaders || {},
      timeout: timeout || 30000,
      retryAttempts: retryAttempts || 3,
    }

    if (encryptedApiKey !== undefined) {
      updateData.apiKey = encryptedApiKey
      updateData.isConfigured = !!apiKey
      updateData.status = apiKey ? 'active' : 'inactive'
      
      // 2-way sync: If OpenAI provider key is updated, sync to chatbots that use global key
      if (existingProvider.provider === 'openai' && apiKey) {
        try {
          // Find chatbots using OpenAI Agent SDK that might be using global key
          // Note: We don't force update chatbot-specific keys, but the global key is available
          // The Chat UI will show the global key is available and user can choose to use it
        } catch (syncError) {
          // Don't fail the main request if sync fails
          console.warn('Note: Global API key updated. Chatbots can now use this key via "Use Global API Key" button.', syncError)
        }
      }
    }

    const providerConfig = await prisma.aIProviderConfig.update({
      where: { id },
      data: updateData
    })

    const formattedProvider = {
      id: providerConfig.id,
      provider: providerConfig.provider,
      name: providerConfig.name,
      description: providerConfig.description,
      website: providerConfig.website,
      icon: providerConfig.icon,
      isSupported: providerConfig.isSupported,
      apiKey: providerConfig.apiKey ? '***' : null,
      baseUrl: providerConfig.baseUrl,
      customHeaders: providerConfig.customHeaders,
      timeout: providerConfig.timeout,
      retryAttempts: providerConfig.retryAttempts,
      status: providerConfig.status,
      isConfigured: providerConfig.isConfigured,
      lastTested: providerConfig.lastTested,
      createdAt: providerConfig.createdAt,
      updatedAt: providerConfig.updatedAt
    }

    return NextResponse.json({ provider: formattedProvider })
  } catch (error) {
    console.error('Error updating AI provider:', error)
    return NextResponse.json({ error: 'Failed to update AI provider' })
  }
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/ai-providers')
