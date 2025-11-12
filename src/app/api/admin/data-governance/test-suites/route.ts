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
    const testSuites: any[] = []

    return NextResponse.json({ testSuites })
  } catch (error) {
    console.error('Error loading test suites:', error)
    return NextResponse.json(
      { error: 'Failed to load test suites' },
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
    const testSuite = {
      id: `suite_${Date.now()}`,
      ...body,
      testCases: [],
      createdAt: new Date()
    }

    return NextResponse.json({ testSuite })
  } catch (error) {
    console.error('Error creating test suite:', error)
    return NextResponse.json(
      { error: 'Failed to create test suite' },
      { status: 500 }
    )
  }
}

