import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
/**
 * OpenAI Realtime API WebSocket Endpoint
 * 
 * This endpoint provides a WebSocket connection for real-time voice communication.
 * Since Next.js doesn't support WebSocket servers directly, this route:
 * 1. Returns connection info for the standalone WebSocket proxy server
 * 2. Or can be used with a custom server setup
 * 
 * For production, use the standalone WebSocket proxy server at lib/websocket-proxy.ts
 */

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const chatbotId = searchParams.get('chatbotId')
  const apiKey = searchParams.get('apiKey')

  if (!chatbotId) {
    return NextResponse.json({ error: 'Missing chatbotId' }, { status: 400 })
  }

  // Rate limiting: OpenAI Realtime sessions are expensive
  // Limit to 10 new sessions per minute per user/chatbot combo
  const rateLimitResult = await checkRateLimit(chatbotId, authResult.session.user.id, {
    enabled: true,
    maxRequestsPerMinute: 10,
    blockDuration: 60,
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many connection attempts. Please try again later.' },
      { status: 429 }
    )
  }

  // Return WebSocket proxy server URL
  // In production, this should point to your WebSocket proxy server
  const wsProxyUrl = process.env.WS_PROXY_URL || 'ws://localhost:3002/api/openai-realtime'

  return NextResponse.json({
    success: true,
    wsUrl: wsProxyUrl,
    message: 'Connect to the WebSocket proxy server at the provided URL',
    instructions: {
      step1: 'Connect to the WebSocket URL',
      step2: 'Send authentication message: { type: "auth", chatbotId: "...", sessionConfig: {...} }',
      step3: 'Start sending audio data',
    },
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/openai-realtime')
