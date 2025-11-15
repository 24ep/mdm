import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: attachmentId } = paramValidation.data
    logger.apiRequest('GET', `/api/attachments/${attachmentId}`, { userId: session.user.id })

    // Get attachment metadata using Prisma
    const attachment = await db.attachmentFile.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment) {
      logger.warn('Attachment not found', { attachmentId })
      return addSecurityHeaders(NextResponse.json({ error: 'Attachment not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/attachments/${attachmentId}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ attachment }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Attachment API GET')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: attachmentId } = paramValidation.data
    logger.apiRequest('DELETE', `/api/attachments/${attachmentId}`, { userId: session.user.id })

    // Get attachment metadata using Prisma
    const attachment = await db.attachmentFile.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment) {
      logger.warn('Attachment not found for deletion', { attachmentId })
      return addSecurityHeaders(NextResponse.json({ error: 'Attachment not found' }, { status: 404 }))
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
        logger.error('Failed to delete file from storage', deleteResult.error, { attachmentId, filePath: attachment.filePath })
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete attachment metadata from database using Prisma
    await db.attachmentFile.delete({
      where: { id: attachmentId }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/attachments/${attachmentId}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Attachment API DELETE')
  }
}