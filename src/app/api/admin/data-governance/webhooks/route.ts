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
    const webhooks = []

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error('Error loading webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to load webhooks' },
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
    const webhook = {
      id: `webhook_${Date.now()}`,
      ...body,
      status: 'active',
      successCount: 0,
      failureCount: 0,
      createdAt: new Date()
    }

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

