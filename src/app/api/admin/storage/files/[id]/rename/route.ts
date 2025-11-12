import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

export async function PUT(
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

    const fileId = params.id
    const { newName } = await request.json()

    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: 'New name is required' }, { status: 400 })
    }

    // Get the file to get its current path and spaceId
    const existingFile = await db.spaceAttachmentStorage.findUnique({
      where: { id: fileId },
      select: { filePath: true, fileName: true, spaceId: true }
    })

    if (!existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get active storage connection
    const storageConnection = await db.storageConnection.findFirst({
      where: { 
        isActive: true,
        type: { in: ['minio', 's3', 'sftp', 'ftp'] }
      }
    })

    if (!storageConnection) {
      return NextResponse.json({ error: 'No active storage connection found' }, { status: 404 })
    }

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
      }, { status: 500 })
    }

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
  } catch (error: any) {
    console.error('Error renaming file:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

