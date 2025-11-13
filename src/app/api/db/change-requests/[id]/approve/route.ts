import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { changeApproval } from '@/lib/db-change-approval'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { comment } = body

    const hasEnoughApprovals = await changeApproval.approveChangeRequest(
      id,
      session.user.id,
      session.user.name || undefined,
      comment
    )

    return NextResponse.json({
      success: true,
      hasEnoughApprovals,
      message: hasEnoughApprovals 
        ? 'Change request approved and ready to merge'
        : 'Approval recorded, waiting for more approvals'
    })
  } catch (error: any) {
    console.error('Error approving change request:', error)
    return NextResponse.json(
      { error: 'Failed to approve change request', details: error.message },
      { status: 500 }
    )
  }
}

