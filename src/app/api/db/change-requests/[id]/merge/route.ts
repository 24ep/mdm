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

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    await changeApproval.mergeChangeRequest(params.id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Change request merged successfully'
    })
  } catch (error: any) {
    console.error('Error merging change request:', error)
    return NextResponse.json(
      { error: 'Failed to merge change request', details: error.message },
      { status: 500 }
    )
  }
}

