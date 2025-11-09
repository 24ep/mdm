import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenMetadataClient } from '@/lib/openmetadata-client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Load config from database
    // For now, return mock data
    // When config is available, use OpenMetadataClient to fetch real data:
    // const client = new OpenMetadataClient(config)
    // const tables = await client.getTables()
    // const dashboards = await client.getDashboards()
    // const pipelines = await client.getPipelines()
    // etc.

    const assets = [
      {
        id: '1',
        name: 'users',
        fullyQualifiedName: 'database.service.users',
        description: 'User data table',
        type: 'table',
        service: 'database.service',
        tags: ['pii', 'users'],
        quality: {
          score: 85,
          checks: [
            {
              id: '1',
              name: 'Null Check',
              type: 'column',
              status: 'passed',
              result: { nullCount: 0 },
              executedAt: new Date()
            }
          ]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Error loading data assets:', error)
    return NextResponse.json(
      { error: 'Failed to load assets' },
      { status: 500 }
    )
  }
}

