import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// = body - Delete a bucket (space)
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } 

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\admin\storage\buckets\[id]\route.ts')= authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const POST = withErrorHandling(deleteHandler, '

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }}

    const { id: bucketId } = await params

    // Verify bucket exists
    const space = await db.space.findUnique({
      where: { id: bucketId }
    })

    if (!space) {
      return NextResponse.json({ error: 'Bucket not found' }}

    // Delete all attachment storage files first (cascade should handle this, but being explicit)
    await db.spaceAttachmentStorage.deleteMany({
      where: { spaceId: bucketId }
    })

    // Delete the space (bucket)
    await db.space.delete({
      where: { id: bucketId }
    })

    return NextResponse.json({ message: 'Bucket deleted successfully' })

