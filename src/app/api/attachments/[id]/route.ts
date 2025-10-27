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

    // Check if user can delete (uploader or admin/owner)
    if (attachment.uploadedBy !== session.user.id && !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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
    const { AttachmentStorageService } = await import('@/lib/attachment-storage')
    const storageService = new AttachmentStorageService(storageConfig)

    // Delete file from storage
    const deleteResult = await storageService.deleteFile(attachment.storedName)

    if (!deleteResult.success) {
      console.error('Failed to delete file from storage:', deleteResult.error)
      // Continue with database deletion even if storage deletion fails
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