import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = params.id

    // Get attachment metadata using Prisma
    const attachment = await db.attachmentFile.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    return NextResponse.json({ attachment })

  } catch (error) {
    console.error('Error in attachment GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = params.id

    // Get attachment metadata using Prisma
    const attachment = await db.attachmentFile.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Get active storage connection
    const storageConnection = await db.storageConnection.findFirst({
      where: { 
        isActive: true,
        type: { in: ['minio', 's3', 'sftp', 'ftp'] }
      }
    })

    if (storageConnection) {
      // Initialize storage service
      const { AttachmentStorageService } = await import('@/lib/attachment-storage')
      const storageService = new AttachmentStorageService({
        provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
        config: {
          [storageConnection.type]: storageConnection.config
        } as any
      })

      // Delete file from storage
      const deleteResult = await storageService.deleteFile(attachment.filePath)

      if (!deleteResult.success) {
        console.error('Failed to delete file from storage:', deleteResult.error)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete attachment metadata from database using Prisma
    await db.attachmentFile.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in attachment delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}