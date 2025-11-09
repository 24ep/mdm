import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const searchParams = request.nextUrl.searchParams
    const chatbotId = searchParams.get('chatbotId')
    const apiKey = searchParams.get('apiKey')

    if (!chatbotId || !apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing chatbotId or apiKey' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Return WebSocket proxy server URL
    // In production, this should point to your WebSocket proxy server
    const wsProxyUrl = process.env.WS_PROXY_URL || 'ws://localhost:3002/api/openai-realtime'
    
    return new Response(JSON.stringify({
      success: true,
      wsUrl: wsProxyUrl,
      message: 'Connect to the WebSocket proxy server at the provided URL',
      instructions: {
        step1: 'Connect to the WebSocket URL',
        step2: 'Send authentication message: { type: "auth", apiKey: "...", sessionConfig: {...} }',
        step3: 'Start sending audio data',
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('OpenAI Realtime API error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

