import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function postHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\storage\files\delete\route.ts')

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { fileIds } = await request.json()

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs are required' }, { status: 400 })
    }

    // Delete files from SpaceAttachmentStorage
    await db.spaceAttachmentStorage.deleteMany({
      where: {
        id: {
          in: fileIds
        }
      }
    })

    // TODO: Also delete from actual storage service (MinIO, S3, etc.)

    return NextResponse.json({ message: 'Files deleted successfully' })
  , { status: 500 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/storage/files/delete')

