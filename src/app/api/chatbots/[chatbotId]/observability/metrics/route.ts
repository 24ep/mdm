import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getLangfuseClient, isLangfuseEnabled } from '@/lib/langfuse'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatbotId } = await params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'

    // Calculate time range
    const now = new Date()
    const startDate = new Date(now)
    switch (timeRange) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1)
        break
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
    }

    // Get performance metrics from database
    const performanceMetrics = await prisma.chatbotPerformanceMetric.findMany({
      where: {
        chatbotId,
        recordedAt: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
    })

    // Get cost records for cost by model
    const costRecords = await prisma.chatbotCostRecord.findMany({
      where: {
        chatbotId,
        recordedAt: {
          gte: startDate,
          lte: now,
        },
      },
    })

    // Calculate metrics
    const totalRequests = performanceMetrics.filter(m => m.metricType === 'response_time').length
    const errorCount = performanceMetrics.filter(m => m.metricType === 'error').length
    const successRate = totalRequests > 0 ? ((totalRequests - errorCount) / totalRequests) * 100 : 0
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

    // Calculate average latency
    const responseTimeMetrics = performanceMetrics.filter(m => m.metricType === 'response_time')
    const averageLatency = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + Number(m.value), 0) / responseTimeMetrics.length
      : 0

    // Calculate tool usage
    const toolUsage: Record<string, number> = {}
    performanceMetrics.forEach((metric) => {
      if (metric.metricType === 'tool_call' && metric.metadata) {
        const metadata = metric.metadata as any
        const toolName = metadata.toolName || 'unknown'
        toolUsage[toolName] = (toolUsage[toolName] || 0) + 1
      }
    })

    // Calculate cost by model
    const costByModel: Record<string, number> = {}
    costRecords.forEach((record) => {
      const metadata = record.metadata as any
      const model = metadata.model || 'unknown'
      costByModel[model] = (costByModel[model] || 0) + Number(record.cost)
    })

    // Calculate requests over time
    const requestsOverTime: Record<string, number> = {}
    performanceMetrics.forEach((metric) => {
      if (metric.metricType === 'response_time') {
        const date = metric.recordedAt.toISOString().split('T')[0]
        requestsOverTime[date] = (requestsOverTime[date] || 0) + 1
      }
    })

    const requestsOverTimeArray = Object.entries(requestsOverTime)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // If Langfuse is enabled, try to get additional metrics
    let langfuseMetrics = null
    if (isLangfuseEnabled()) {
      try {
        const langfuse = getLangfuseClient()
        // Fetch additional metrics from Langfuse if available
        // This would depend on Langfuse SDK API
      } catch (error) {
        console.warn('Failed to fetch Langfuse metrics:', error)
      }
    }

    const metrics = {
      totalRequests,
      successRate,
      averageLatency,
      errorRate,
      toolUsage,
      costByModel,
      requestsOverTime: requestsOverTimeArray,
      ...(langfuseMetrics || {}),
    }

    return NextResponse.json({ metrics })
  } catch (error: any) {
    console.error('Error fetching observability metrics:', error)
    
    // Handle Prisma UUID validation errors
    if (error?.code === 'P2023' || error?.message?.includes('UUID')) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

