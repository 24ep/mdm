import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { changeApproval } from '@/lib/db-change-approval'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const POST = withErrorHandling(postHandler, '

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }}

    const { id } = await params
    await changeApproval.mergeChangeRequest(id, session.user.id)

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

