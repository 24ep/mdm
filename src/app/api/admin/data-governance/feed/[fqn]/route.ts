import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { fqn: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fqn = decodeURIComponent(params.fqn)

    // TODO: Load from OpenMetadata
    const threads: any[] = []

    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Error loading feed:', error)
    return NextResponse.json(
      { error: 'Failed to load activity feed' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { fqn: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fqn = decodeURIComponent(params.fqn)
    const body = await request.json()

    // TODO: Create thread in OpenMetadata
    const thread = {
      id: `thread_${Date.now()}`,
      ...body,
      createdBy: {
        id: session.user.id,
        name: session.user.name || session.user.email || 'Unknown',
        displayName: session.user.name
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      posts: [],
      resolved: false
    }

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}

