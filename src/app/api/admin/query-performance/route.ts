import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPerformanceTracker } from '@/lib/query-performance'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'recent'
    const limit = parseInt(searchParams.get('limit') || '50')
    const days = parseInt(searchParams.get('days') || '7')
    const queryHash = searchParams.get('queryHash') || undefined

    switch (type) {
      case 'slow':
        const slowQueries = await queryPerformanceTracker.getSlowQueries(limit)
        return NextResponse.json({ success: true, data: slowQueries })

      case 'stats':
        const stats = await queryPerformanceTracker.getQueryStats(queryHash, days)
        return NextResponse.json({ success: true, data: stats })

      case 'trends':
        const trends = await queryPerformanceTracker.getPerformanceTrends(days)
        return NextResponse.json({ success: true, data: trends })

      case 'top-by-time':
        const topByTime = await queryPerformanceTracker.getTopQueriesByExecutionTime(limit)
        return NextResponse.json({ success: true, data: topByTime })

      case 'most-frequent':
        const mostFrequent = await queryPerformanceTracker.getMostFrequentQueries(limit)
        return NextResponse.json({ success: true, data: mostFrequent })

      case 'recent':
      default:
        const recent = await queryPerformanceTracker.getRecentQueries(limit)
        return NextResponse.json({ success: true, data: recent })
    }
  } catch (error: any) {
    console.error('Error fetching query performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch query performance data', details: error.message },
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
      query: sqlQuery,
      executionTime,
      rowCount,
      status,
      errorMessage,
      spaceId
    } = body

    if (!sqlQuery || executionTime === undefined) {
      return NextResponse.json({ error: 'Query and execution time are required' }, { status: 400 })
    }

    await queryPerformanceTracker.recordQueryExecution({
      query: sqlQuery,
      executionTime,
      rowCount: rowCount || 0,
      timestamp: new Date(),
      userId: session.user.id,
      userName: session.user.name || undefined,
      spaceId: spaceId || null,
      status: status || 'success',
      errorMessage: errorMessage || null
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error recording query performance:', error)
    return NextResponse.json(
      { error: 'Failed to record query performance', details: error.message },
      { status: 500 }
    )
  }
}






