import { NextRequest, NextResponse } from 'next/server'
import { executePreRequestScript, executeTests } from '@/lib/api-client-executor'

export async function POST(request: NextRequest) {
  try {
    const {
      method,
      url,
      headers,
      body,
      preRequestScript,
      tests,
      environment
    } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
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

    // Execute pre-request script
    const scriptResult = executePreRequestScript(preRequestScript || '', {
      method: method || 'GET',
      url: requestUrl.toString(),
      headers: headers || {},
      body,
      environment
    })

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: scriptResult.method || method || 'GET',
      headers: {
        ...scriptResult.headers,
        'User-Agent': 'MDM-API-Client/1.0'
      }
    }

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(scriptResult.method || method) && scriptResult.body) {
      fetchOptions.body = scriptResult.body
    }

    const startTime = Date.now()
    
    // Execute the request
    let response: Response
    let error: string | undefined

    try {
      response = await fetch(scriptResult.url, fetchOptions)
    } catch (fetchError) {
      error = fetchError instanceof Error ? fetchError.message : 'Network error'
      return NextResponse.json({
        error,
        response: {
          status: 0,
          statusText: 'Error',
          headers: {},
          body: error,
          size: 0,
          time: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      })
    }
    
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Get response body
    let responseBody: string
    const contentType = response.headers.get('content-type') || ''
    
    try {
      if (contentType.includes('application/json')) {
        const json = await response.json()
        responseBody = JSON.stringify(json, null, 2)
      } else if (contentType.includes('text/')) {
        responseBody = await response.text()
      } else {
        // For binary or unknown types, try text first
        try {
          responseBody = await response.text()
        } catch {
          responseBody = '[Binary content]'
        }
      }
    } catch (error) {
      responseBody = `Error reading response: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    // Convert headers to plain object
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // Calculate response size
    const responseSize = new Blob([responseBody]).size

    const responseData = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      size: responseSize,
      time: responseTime,
      timestamp: new Date().toISOString()
    }

    // Execute tests if provided
    let testResults
    if (tests && tests.length > 0) {
      testResults = executeTests(tests, responseData)
    }

    return NextResponse.json({
      response: responseData,
      testResults
    })
  } catch (error) {
    console.error('API client execution error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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

