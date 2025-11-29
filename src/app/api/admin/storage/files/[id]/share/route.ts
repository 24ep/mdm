import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const POST = withErrorHandling(postHandler, '

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }}

    const { id: fileId } = await params
    const { isPublic, permissionLevel = 'view', expiresIn = 3600 } = await request.json()

    // Get the file
    const file = await db.spaceAttachmentStorage.findUnique({
      where: { id: fileId },
      select: { 
        filePath: true, 
        fileName: true, 
        spaceId: true
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }}

    let publicUrl: string | null = null

    if (isPublic) {
      // Get active storage connection
      const storageConnection = await db.storageConnection.findFirst({
        where: { 
          isActive: true,
          type: { in: ['minio', 's3', 'sftp', 'ftp'] }
        }
      })

      if (storageConnection) {
        // Create storage service instance
        const storageService = new AttachmentStorageService({
          provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
          config: {
            [storageConnection.type]: storageConnection.config
          } as any
        })

        // Extract the actual file name from the path
        const fileName = file.filePath?.split('/').pop() || file.fileName

        // Generate public URL from storage service
        const urlResult = await storageService.generatePublicUrl(fileName, expiresIn)
        
        if (urlResult.success && urlResult.url) {
          publicUrl = urlResult.url
        } else {
          // Fallback to API endpoint if storage service doesn't support public URLs
          publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/storage/files/${fileId}/content`
        }
      } else {
        // Fallback if no storage connection
        publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/storage/files/${fileId}/content`
      }
    }

    return NextResponse.json({ 
      file: {
        id: fileId,
        isPublic,
        permissionLevel,
        publicUrl: publicUrl
      }
    })

