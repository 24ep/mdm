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
    const workspaceId = searchParams.get('workspaceId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const history = await prisma.apiRequestHistory.findMany({
      where: {
        createdBy: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
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

    const body = await request.json()
    const {
      requestId,
      method,
      url,
      headers,
      body: requestBody,
      statusCode,
      statusText,
      responseHeaders,
      responseBody,
      responseTime,
      error,
    } = body

    const historyItem = await prisma.apiRequestHistory.create({
      data: {
        requestId,
        method,
        url,
        headers: headers || {},
        body: requestBody,
        statusCode,
        statusText,
        responseHeaders,
        responseBody,
        responseTime,
        error,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ history: historyItem })
  } catch (error) {
    console.error('Error creating history:', error)
    return NextResponse.json(
      { error: 'Failed to create history' },
      { status: 500 }
    )
  }
}

