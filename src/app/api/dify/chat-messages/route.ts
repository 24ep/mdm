import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiBaseUrl, apiKey, requestBody } = body

    if (!apiBaseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Missing apiBaseUrl or apiKey' },
        { status: 400 }
      )
    }

    // Clean up the base URL to avoid duplicate /v1
    let baseUrl = apiBaseUrl.replace(/\/$/, '') // Remove trailing slash
    baseUrl = baseUrl.replace(/\/v1$/, '') // Remove /v1 if present
    const apiUrl = `${baseUrl}/v1/chat-messages`

    // Forward the request to Dify API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // Check if response is streaming
    const contentType = response.headers.get('content-type')
    const isStreaming = contentType?.includes('text/event-stream') || contentType?.includes('text/plain')

    if (isStreaming && response.body) {
      // Return streaming response - proxy the stream directly
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    } else {
      // Return JSON response
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          return NextResponse.json(errorData, { status: response.status })
        } catch {
          return NextResponse.json(
            { error: errorText || 'Dify API request failed' },
            { status: response.status }
          )
        }
      }
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Dify proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy request to Dify API' },
      { status: 500 }
    )
  }
}
