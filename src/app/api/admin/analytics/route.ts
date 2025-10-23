import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    
    // Mock analytics data based on range
    const getDateRange = (range: string) => {
      const now = new Date()
      const ranges = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      }
      const days = ranges[range as keyof typeof ranges] || 7
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
      return { startDate, endDate: now }
    }

    const { startDate, endDate } = getDateRange(range)
    
    // Mock analytics data
    const analytics = {
      overview: {
        totalUsers: 1250,
        activeUsers: 890,
        totalSpaces: 45,
        totalDataModels: 234,
        totalRecords: 15678,
        storageUsed: '2.4 GB',
        apiCalls: 45678
      },
      userActivity: {
        labels: Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }),
        datasets: [
          {
            label: 'Active Users',
            data: [45, 52, 48, 61, 55, 67, 73],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          },
          {
            label: 'New Users',
            data: [12, 18, 15, 22, 19, 25, 28],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          }
        ]
      },
      spaceUsage: [
        { name: 'Development', users: 25, dataModels: 12, records: 2340, storage: '450 MB' },
        { name: 'Production', users: 45, dataModels: 28, records: 8900, storage: '1.2 GB' },
        { name: 'Testing', users: 15, dataModels: 8, records: 1200, storage: '200 MB' },
        { name: 'Analytics', users: 8, dataModels: 5, records: 890, storage: '150 MB' }
      ],
      systemMetrics: {
        cpuUsage: 45,
        memoryUsage: 67,
        diskUsage: 34,
        networkLatency: 12
      },
      recentActivity: [
        {
          id: '1',
          type: 'user_login',
          user: 'john.doe@example.com',
          space: 'Development',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          description: 'User logged in'
        },
        {
          id: '2',
          type: 'data_model_created',
          user: 'jane.smith@example.com',
          space: 'Production',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          description: 'Created new data model "Customer Orders"'
        },
        {
          id: '3',
          type: 'space_created',
          user: 'admin@example.com',
          space: 'Analytics',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          description: 'Created new space "Analytics"'
        }
      ]
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
