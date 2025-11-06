import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { changeApproval } from '@/lib/db-change-approval'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required for rejection' },
        { status: 400 }
      )
    }

    await changeApproval.rejectChangeRequest(
      params.id,
      session.user.id,
      session.user.name || 'Unknown',
      reason
    )

    return NextResponse.json({
      success: true,
      message: 'Change request rejected'
    })
  } catch (error: any) {
    console.error('Error rejecting change request:', error)
    return NextResponse.json(
      { error: 'Failed to reject change request', details: error.message },
      { status: 500 }
    )
  }
}

