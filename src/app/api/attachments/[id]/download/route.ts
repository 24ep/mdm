import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

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

    // Get active storage connection
    const storageConnection = await db.storageConnection.findFirst({
      where: { 
        isActive: true,
        type: { in: ['minio', 's3', 'sftp', 'ftp'] }
      }
    })

    if (!storageConnection) {
      return NextResponse.json({ error: 'No active storage connection found' }, { status: 500 })
    }

    // Initialize storage service
    const storageService = new AttachmentStorageService({
      provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
      config: {
        [storageConnection.type]: storageConnection.config
      } as any
    })

    // Download file
    const downloadResult = await storageService.downloadFile(attachment.filePath)

    if (!downloadResult.success) {
      return NextResponse.json({ 
        error: downloadResult.error || 'Download failed' 
      }, { status: 500 })
    }

    // Convert stream to buffer
    const chunks: Buffer[] = []
    const stream = downloadResult.stream!
    
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    
    const fileBuffer = Buffer.concat(chunks)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize.toString(),
        'Cache-Control': 'private, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Error in file download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
