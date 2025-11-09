import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // TODO: Update in OpenMetadata
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to update ingestion pipeline' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Delete from OpenMetadata
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to delete ingestion pipeline' },
      { status: 500 }
    )
  }
}

