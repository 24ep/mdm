import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLangfuseClient, isLangfuseEnabled } from '@/lib/langfuse'
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limiter'
import { getCachedResponse, getCacheConfig } from '@/lib/response-cache'
import { getBudgetConfig } from '@/lib/cost-tracker'
import { handleWorkflowRequest } from './handlers/workflow-handler'
import { handleAssistantRequest } from './handlers/assistant-handler'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { 
      agentId, 
      apiKey, 
      message, 
      attachments, 
      conversationHistory, 
      model, 
      instructions,
      reasoningEffort,
      store,
      vectorStoreId,
      enableWebSearch,
      enableCodeInterpreter,
      enableComputerUse,
      enableImageGeneration,
      useWorkflowConfig,
      stream: requestStream,
      threadId: existingThreadId,
      chatbotId,
      spaceId
    } = body

    if (!agentId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing agentId or apiKey' },
        { status: 400 }
      )
    }

    // Budget Check
    if (chatbotId) {
      try {
        const budgetConfig = await getBudgetConfig(chatbotId)
        if (budgetConfig && budgetConfig.enabled) {
          const { checkBudget } = await import('@/lib/cost-tracker')
          await checkBudget(chatbotId)
        }
      } catch (budgetError: any) {
        if (budgetError.message?.includes('budget exceeded')) {
          return NextResponse.json(
            {
              error: 'Budget exceeded',
              message: budgetError.message,
            },
            { status: 402 }
          )
        }
        console.warn('Budget check failed:', budgetError)
      }
    }

    // Rate Limiting Check
    if (chatbotId && session?.user?.id) {
      const rateLimitConfig = await getRateLimitConfig(chatbotId)
      if (rateLimitConfig) {
        const rateLimitResult = await checkRateLimit(
          chatbotId,
          session.user.id,
          rateLimitConfig
        )

        if (!rateLimitResult.allowed) {
          const { recordMetric } = await import('@/lib/performance-metrics')
          await recordMetric({
            chatbotId,
            metricType: 'rate_limit_violation',
            value: 1,
            metadata: { userId: session.user.id, reason: rateLimitResult.reason },
          }).catch(() => {})

          const { sendWebhook } = await import('@/lib/webhook-service')
          await sendWebhook(chatbotId, 'rate_limit_exceeded', {
            userId: session.user.id,
            reason: rateLimitResult.reason,
            resetTime: rateLimitResult.resetTime,
            blockedUntil: rateLimitResult.blockedUntil,
          }).catch(() => {})

          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: rateLimitResult.reason || 'Too many requests',
              resetTime: rateLimitResult.resetTime,
              blockedUntil: rateLimitResult.blockedUntil,
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': String(rateLimitConfig.maxRequestsPerMinute || rateLimitConfig.maxRequestsPerHour || rateLimitConfig.maxRequestsPerDay || 60),
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(rateLimitResult.resetTime),
                'Retry-After': rateLimitResult.blockedUntil
                  ? String(Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000))
                  : '60',
              },
            }
          )
        }
      }
    }

    // Cache Check (only for non-streaming requests)
    if (chatbotId && message && !requestStream) {
      const cacheConfig = await getCacheConfig(chatbotId)
      if (cacheConfig && cacheConfig.enabled) {
        const context = conversationHistory?.map((m: any) => m.content).join(' ') || ''
        const cached = await getCachedResponse(
          chatbotId,
          message,
          cacheConfig,
          cacheConfig.includeContext ? [context] : undefined
        )

        if (cached) {
          const { recordMetric } = await import('@/lib/performance-metrics')
          await recordMetric({
            chatbotId,
            metricType: 'cache_hit',
            value: 1,
          }).catch(() => {})

          return NextResponse.json({
            ...cached.response,
            cached: true,
          })
        } else {
          const { recordMetric } = await import('@/lib/performance-metrics')
          await recordMetric({
            chatbotId,
            metricType: 'cache_miss',
            value: 1,
          }).catch(() => {})
        }
      }
    }

    // Check if agentId is a workflow ID (wf_...) or assistant ID (asst_...)
    const isWorkflow = agentId.startsWith('wf_')
    const isAssistant = agentId.startsWith('asst_')

    if (!isWorkflow && !isAssistant) {
      return NextResponse.json(
        { 
          error: 'Invalid agent ID format',
          details: 'Agent ID must start with "wf_" (workflow) or "asst_" (assistant)'
        },
        { status: 400 }
      )
    }

    // Prepare messages for the thread
    const threadMessages = conversationHistory?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || ''
    })) || []

    // Add current message
    threadMessages.push({
      role: 'user',
      content: message || ''
    })

    // Handle workflow requests
    if (isWorkflow) {
      try {
        // Handle workflow request (will use workflow code from chatbot config if available)
        return await handleWorkflowRequest({
          agentId,
          apiKey,
          message,
          attachments,
          conversationHistory,
          model,
          instructions,
          reasoningEffort,
          store,
          vectorStoreId,
          enableWebSearch,
          enableCodeInterpreter,
          enableComputerUse,
          enableImageGeneration,
          requestStream,
          existingThreadId,
          chatbotId,
          spaceId,
          session,
          useWorkflowConfig,
        })
      } catch (error) {
        console.error('OpenAI Agents SDK workflow error:', error)
        
        const langfuse = isLangfuseEnabled() ? getLangfuseClient() : null
        if (langfuse) {
          try {
            langfuse.trace({
              name: 'openai-workflow-chat',
              userId: session?.user?.id || undefined,
              metadata: {
                chatbotId,
                agentId,
                error: error instanceof Error ? error.stack : String(error),
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              },
            })
          } catch (langfuseError) {
            console.warn('Failed to log workflow error to Langfuse:', langfuseError)
          }
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined
        
        let errorDetails = errorMessage
        if (error instanceof Error && 'cause' in error) {
          const cause = (error as any).cause
          if (cause) {
            errorDetails += `\nCause: ${typeof cause === 'string' ? cause : JSON.stringify(cause)}`
          }
        }

        return NextResponse.json(
          { 
            error: errorDetails,
            stack: errorStack,
          },
          { status: 500 }
        )
      }
    }

    // Handle assistant requests
    if (isAssistant) {
      try {
        return await handleAssistantRequest({
          agentId,
          apiKey,
          message,
          attachments,
          conversationHistory,
          model,
          instructions,
          requestStream,
          existingThreadId,
          chatbotId,
          spaceId,
          session,
          threadMessages,
        })
      } catch (error) {
        console.error('OpenAI Agent SDK assistant error:', error)
        
        const langfuse = isLangfuseEnabled() ? getLangfuseClient() : null
        if (langfuse) {
          try {
            langfuse.trace({
              name: 'openai-assistant-chat',
              userId: session?.user?.id || undefined,
              metadata: {
                error: error instanceof Error ? error.stack : String(error),
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              },
            })
          } catch (langfuseError) {
            console.warn('Failed to log error to Langfuse:', langfuseError)
          }
        }
        
        return NextResponse.json(
          { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    }

    // Should never reach here, but just in case
    return NextResponse.json(
      { error: 'Invalid agent type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('OpenAI Agent SDK proxy error:', error)
    
    const langfuse = isLangfuseEnabled() ? getLangfuseClient() : null
    if (langfuse) {
      try {
        const session = await getServerSession(authOptions)
        langfuse.trace({
          name: 'openai-assistant-chat',
          userId: session?.user?.id || undefined,
          metadata: {
            error: error instanceof Error ? error.stack : String(error),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      } catch (langfuseError) {
        console.warn('Failed to log error to Langfuse:', langfuseError)
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
