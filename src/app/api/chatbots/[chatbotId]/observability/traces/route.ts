import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLangfuseClient, isLangfuseEnabled } from '@/lib/langfuse'

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

    if (!isLangfuseEnabled()) {
      return NextResponse.json({ traces: [] })
    }

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

    const langfuse = getLangfuseClient()

    // Fetch traces from Langfuse
    // Langfuse doesn't have a direct fetchTraces method in the SDK
    // We need to use the Langfuse API directly or fetch from database
    try {
      // Option 1: Use Langfuse API directly (if available)
      // Option 2: Store trace IDs in database and fetch from there
      // For now, we'll return traces from our database if we're storing them
      // Otherwise, we'll use Langfuse's REST API
      
      const langfuseHost = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'
      const apiKey = process.env.LANGFUSE_SECRET_KEY
      
      if (!apiKey) {
        return NextResponse.json({ traces: [] })
      }

      // Use Langfuse REST API to fetch traces
      const response = await fetch(
        `${langfuseHost}/api/public/traces?userId=${session.user.id}&fromTimestamp=${startDate.toISOString()}&toTimestamp=${now.toISOString()}&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        console.warn('Failed to fetch traces from Langfuse API:', response.statusText)
        return NextResponse.json({ traces: [] })
      }

      const data = await response.json()
      const traces = data.data || []

      const formattedTraces = traces.map((trace: any) => ({
        id: trace.id,
        name: trace.name || 'Unknown',
        userId: trace.userId,
        timestamp: trace.timestamp || trace.createdAt,
        latency: trace.latency || trace.duration,
        status: trace.status || (trace.level === 'ERROR' ? 'error' : 'success'),
        metadata: trace.metadata || {},
        observations: trace.observations || [],
      }))

      return NextResponse.json({ traces: formattedTraces })
    } catch (error) {
      console.error('Error fetching traces from Langfuse:', error)
      // Return empty array if Langfuse API fails
      return NextResponse.json({ traces: [] })
    }
  } catch (error) {
    console.error('Error in traces API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

