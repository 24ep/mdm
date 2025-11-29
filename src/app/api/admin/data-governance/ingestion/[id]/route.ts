import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

    const { id } = await params
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



export const PATCH = withErrorHandling(patchHandler, 'PATCH /api/src\app\api\admin\data-governance\ingestion\[id]\route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\admin\data-governance\ingestion\[id]\route.ts')

    const { id } = await params
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

