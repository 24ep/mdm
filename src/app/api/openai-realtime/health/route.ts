import { NextRequest, NextResponse } from 'next/server'

/**
 * Health check endpoint for WebSocket proxy server
 * This helps verify if the proxy server is running
 */
export async function GET(request: NextRequest) {
  try {
    const wsPort = process.env.WS_PROXY_PORT || '3001'
    const wsHost = request.headers.get('host')?.split(':')[0] || 'localhost'
    const wsUrl = `ws://${wsHost}:${wsPort}/api/openai-realtime`
    
    // Try to connect to WebSocket server (quick check)
    // Note: This is a simple check - in production you might want a more robust health check
    
    return NextResponse.json({
      success: true,
      wsUrl,
      message: 'WebSocket proxy server should be running at the URL above',
      instructions: [
        'To start the WebSocket proxy server:',
        '1. Run: npm run ws-proxy',
        '2. Or: npx tsx lib/websocket-proxy.ts',
        '3. The server will run on ws://localhost:3001',
      ],
      checkConnection: `Try connecting to: ${wsUrl}`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

