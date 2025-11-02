import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE - Delete a bucket (space)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const bucketId = params.id

    // Verify bucket exists
    const space = await db.space.findUnique({
      where: { id: bucketId }
    })

    if (!space) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Delete all attachment storage files first (cascade should handle this, but being explicit)
    await db.spaceAttachmentStorage.deleteMany({
      where: { spaceId: bucketId }
    })

    // Delete the space (bucket)
    await db.space.delete({
      where: { id: bucketId }
    })

    return NextResponse.json({ message: 'Bucket deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting bucket:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

