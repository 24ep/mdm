import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Trigger pipeline in OpenMetadata
    return NextResponse.json({ 
      success: true,
      message: 'Pipeline execution started'
    })
  } catch (error) {
    console.error('Error triggering ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to trigger ingestion pipeline' },
      { status: 500 }
    )
  }
}

