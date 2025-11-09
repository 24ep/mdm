import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Execute GraphQL queries
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, query, variables, operationName, headers } = await request.json()

    if (!url || !query) {
      return NextResponse.json(
        { error: 'URL and query are required' },
        { status: 400 }
      )
    }

    // Validate URL
    let requestUrl: URL
    try {
      requestUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Execute GraphQL request
    const response = await fetch(requestUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        query,
        variables: variables ? JSON.parse(variables) : undefined,
        operationName
      })
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Get response
    const responseBody = await response.text()
    let parsedBody: any
    try {
      parsedBody = JSON.parse(responseBody)
    } catch {
      parsedBody = { data: responseBody }
    }

    // Convert headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const responseSize = new Blob([responseBody]).size

    return NextResponse.json({
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: JSON.stringify(parsedBody, null, 2),
        size: responseSize,
        time: responseTime,
        timestamp: new Date().toISOString()
      },
      graphql: {
        data: parsedBody.data,
        errors: parsedBody.errors,
        extensions: parsedBody.extensions
      }
    })
  } catch (error) {
    console.error('GraphQL execution error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        response: {
          status: 0,
          statusText: 'Error',
          headers: {},
          body: error instanceof Error ? error.message : 'Unknown error',
          size: 0,
          time: 0,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

