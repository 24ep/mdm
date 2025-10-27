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
      where: { id: attachmentId },
      include: {
        dataModelAttribute: {
          include: {
            dataModel: {
              select: { spaceId: true }
            }
          }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    const spaceId = attachment.dataModelAttribute.dataModel.spaceId

    // Check if user has access to this space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: spaceId,
        userId: session.user.id
      },
      select: { role: true }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get storage configuration using Prisma
    const storageConfig = await db.spaceAttachmentStorage.findUnique({
      where: { spaceId: spaceId }
    })

    if (!storageConfig) {
      console.error('Storage configuration not found')
      return NextResponse.json({ error: 'Storage configuration not found' }, { status: 500 })
    }

    // Initialize storage service
    const storageService = new AttachmentStorageService(storageConfig)

    // Download file
    const downloadResult = await storageService.downloadFile(attachment.storedName)

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
        'Content-Type': attachment.contentType,
        'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
        'Content-Length': attachment.fileSize.toString(),
        'Cache-Control': 'private, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Error in file download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
