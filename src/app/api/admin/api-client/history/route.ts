import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const requestId = searchParams.get('requestId')

    const history = await prisma.apiClientHistory.findMany({
      where: {
        userId: session.user.id,
        ...(requestId && { requestId })
      },
      include: {
        request: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error loading history:', error)
    return NextResponse.json(
      { error: 'Failed to load history' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { requestId, request, response, error: errorMsg, testResults } = data

    // Create or find request
    let apiRequest
    if (requestId && requestId !== 'new') {
      apiRequest = await prisma.apiClientRequest.findUnique({
        where: { id: requestId }
      })
    }

    if (!apiRequest && request) {
      // Create request if it doesn't exist
      apiRequest = await prisma.apiClientRequest.create({
        data: {
          userId: session.user.id,
          name: request.name || 'Untitled Request',
          method: request.method,
          url: request.url,
          headers: request.headers || [],
          auth: request.auth,
          body: request.body,
          preRequestScript: request.preRequestScript,
          tests: request.tests || [],
          description: request.description,
          tags: request.tags || []
        }
      })
    }

    // Save history
    const history = await prisma.apiClientHistory.create({
      data: {
        requestId: apiRequest?.id || requestId || '',
        userId: session.user.id,
        method: request?.method || 'GET',
        url: request?.url || '',
        requestHeaders: request?.headers || {},
        requestBody: request?.body ? JSON.stringify(request.body) : null,
        responseStatus: response?.status,
        responseStatusText: response?.statusText,
        responseHeaders: response?.headers,
        responseBody: response?.body,
        responseSize: response?.size,
        responseTime: response?.time,
        error: errorMsg,
        testResults
      },
      include: {
        request: true
      }
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error saving history:', error)
    return NextResponse.json(
      { error: 'Failed to save history' },
      { status: 500 }
    )
  }
}

