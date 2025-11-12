import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Load from OpenMetadata
    const pipelines: any[] = []

    return NextResponse.json({ pipelines })
  } catch (error) {
    console.error('Error loading ingestion pipelines:', error)
    return NextResponse.json(
      { error: 'Failed to load ingestion pipelines' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // TODO: Create in OpenMetadata
    const pipeline = {
      id: `pipeline_${Date.now()}`,
      ...body,
      status: 'idle',
      createdAt: new Date()
    }

    return NextResponse.json({ pipeline })
  } catch (error) {
    console.error('Error creating ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to create ingestion pipeline' },
      { status: 500 }
    )
  }
}

