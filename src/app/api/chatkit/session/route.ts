import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { decryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import { createAuditContext } from '@/lib/audit-context-helper'

const prisma = new PrismaClient()

export async function = body(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, apiKey, user } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Generate a user ID if not provided (required by ChatKit API)
    // Use provided user ID, or generate a unique one based on session/IP
    const userId = user || `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    // Get OpenAI API key in priority order:
    // 1. From request body (chatbot-specific API key)
    // 2. From environment variable
    // 3. From database (global config)
    let openaiApiKey = apiKey || process.env.OPENAI_API_KEY

    // If not provided, try to get from database
    if (!openaiApiKey) {
      try {
        const openaiConfig = await prisma.aIProviderConfig.findUnique({
          where: { provider: 'openai' },
          select: { apiKey: true, isConfigured: true }
        })

        if (openaiConfig?.isConfigured && openaiConfig.apiKey) {
          // Check if stored in Vault
          if (openaiConfig.apiKey.startsWith('vault://')) {
            const secretsManager = getSecretsManager()
            // Try to get session for audit logging
            const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult.catch(() => null)
            const auditContext = createAuditContext(request, session?.user || null, 'ChatKit session creation')
            
            openaiApiKey = await secretsManager.getApiKey('openai', auditContext)
          } else {
            // Decrypt the API key if it's encrypted in database
            openaiApiKey = decryptApiKey(openaiConfig.apiKey) || openaiConfig.apiKey
          }
        }
      } catch (dbError) {
        console.error('Error fetching OpenAI config from database:', dbError)
        // Continue to check environment variable
      }
    }

    if (!openaiApiKey) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          details: 'Please configure your OpenAI API key in the chatbot settings, API Configuration section (Admin > API Configuration), or set OPENAI_API_KEY environment variable'
        },
        { status: 500 }
      )
    }

    // Create a ChatKit session using OpenAI's API
    // This endpoint creates a session for the specified agent
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1', // Required header for ChatKit API access
      },
      body: JSON.stringify({
        workflow: {
          id: agentId, // ChatKit API requires 'workflow' to be an object with 'id'
        },
        user: userId, // ChatKit API requires 'user' parameter
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      console.error('OpenAI ChatKit session error:', errorData)
      return NextResponse.json(
        { 
          error: 'Failed to create ChatKit session', 
          details: errorData.error?.message || errorText,
          fullError: errorData
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('ChatKit session created successfully:', { 
      session_id: data.session_id,
      has_client_secret: !!data.client_secret,
      client_secret_length: data.client_secret?.length,
      client_secret_prefix: data.client_secret?.substring(0, 20) + '...'
    })
    
    // Validate client_secret format
    if (!data.client_secret || typeof data.client_secret !== 'string') {
      console.error('Invalid client_secret format:', data)
      return NextResponse.json(
        { 
          error: 'Invalid client secret format from OpenAI',
          details: 'The session was created but client_secret is missing or invalid'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      client_secret: data.client_secret,
      session_id: data.session_id,
    })
  } catch (error) {
    console.error('ChatKit session error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Failed to create ChatKit session',
        details: errorMessage || 'The server had an error while processing your request. Sorry about that!',
        fullError: process.env.NODE_ENV === 'development' ? { message: errorMessage, stack: errorStack } : undefined
      },
      { status: 500 }
    )
  }
}

