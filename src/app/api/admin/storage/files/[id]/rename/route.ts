import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } 

export const PUT = withErrorHandling(putHandler, 'PUT /api/src\app\api\admin\storage\files\[id]\rename\route.ts')= authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(putHandler, '

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions'  })

    const { id: fileId } = await params
    const { newName } = await request.json()

    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: 'New name is required'  })

    // Get the file to get its current path and spaceId
    const existingFile = await db.spaceAttachmentStorage.findUnique({
      where: { id: fileId },
      select: { filePath: true, fileName: true, spaceId: true }
    })

    if (!existingFile) {
      return NextResponse.json({ error: 'File not found'  })

    // Get active storage connection
    const storageConnection = await db.storageConnection.findFirst({
      where: { 
        isActive: true,
        type: { in: ['minio', 's3', 'sftp', 'ftp'] }
      }
    })

    if (!storageConnection) {
      return NextResponse.json({ error: 'No active storage connection found'  })

    // Create storage service instance
    const storageService = new AttachmentStorageService({
      provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
      config: {
        [storageConnection.type]: storageConnection.config
      } as any
    })

    // Extract the actual file name from the path (last part after /)
    const oldFileName = existingFile.filePath?.split('/').pop() || existingFile.fileName
    const newFileName = newName.trim()

    // Rename file in storage
    const renameResult = await storageService.renameFile(oldFileName, newFileName)
    
    if (!renameResult.success) {
      return NextResponse.json({ 
        error: renameResult.error || 'Failed to rename file in storage' 
       })

    // Update file path and name in database
    const pathParts = existingFile.filePath?.split('/') || []
    pathParts[pathParts.length - 1] = newFileName
    const newFilePath = pathParts.join('/')

    const updatedFile = await db.spaceAttachmentStorage.update({
      where: { id: fileId },
      data: { 
        fileName: newName.trim(),
        filePath: newFilePath
      }
    })

    return NextResponse.json({ 
      file: {
        id: updatedFile.id,
        name: updatedFile.fileName,
        path: updatedFile.filePath,
        createdAt: updatedFile.createdAt
      }
    })

