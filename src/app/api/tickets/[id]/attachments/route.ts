import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { validateParams, validateQuery, commonSchemas } from '@/lib/api-validation'
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
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/tickets/${id}/attachments`, { userId: session.user.id })

    const attachments = await db.ticketAttachment.findMany({
      where: {
        ticketId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/attachments`, 200, duration, {
      attachmentCount: attachments.length
    })
    return addSecurityHeaders(NextResponse.json(createSuccessResponse({ attachments })))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Attachments API GET')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('POST', `/api/tickets/${id}/attachments`, { userId: session.user.id })

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return addSecurityHeaders(NextResponse.json(createErrorResponse('File is required', 'VALIDATION_ERROR'), { status: 400 }))
    }

    // Check if ticket exists
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for attachment upload', { ticketId: id })
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Ticket not found', 'NOT_FOUND'), { status: 404 }))
    }

    // Note: Tickets use local file system storage instead of AttachmentStorageService
    // because tickets may not be associated with a space, and local storage is simpler
    // for ticket-specific attachments. This is an intentional design decision.

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'tickets', id)
    await mkdir(uploadsDir, { recursive: true })
    logger.debug('Created upload directory', { uploadsDir })
    
    // Save file
    const filePath = join(uploadsDir, uniqueFileName)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, fileBuffer)

    // Save attachment record
    const attachment = await db.ticketAttachment.create({
      data: {
        ticketId: id,
        fileName: file.name,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: session.user.id
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/tickets/${id}/attachments`, 201, duration, {
      attachmentId: attachment.id,
      fileName: file.name,
      fileSize: file.size,
    })
    return addSecurityHeaders(NextResponse.json(createSuccessResponse({ attachment }), { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Attachments API POST')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/tickets/${id}/attachments`, { userId: session.user.id })

    const querySchema = z.object({
      attachmentId: z.string().uuid(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { attachmentId } = queryValidation.data

    const attachment = await db.ticketAttachment.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment || attachment.ticketId !== id) {
      logger.warn('Attachment not found', { ticketId: id, attachmentId })
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Attachment not found', 'NOT_FOUND'), { status: 404 }))
    }

    // Only allow deletion by uploader or ticket owner
    const ticket = await db.ticket.findUnique({
      where: { id }
    })

    if (attachment.uploadedBy !== session.user.id && ticket?.createdBy !== session.user.id) {
      logger.warn('Unauthorized attachment deletion attempt', { ticketId: id, attachmentId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Unauthorized', 'FORBIDDEN'), { status: 403 }))
    }

    await db.ticketAttachment.delete({
      where: { id: attachmentId }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}/attachments`, 200, duration, { attachmentId })
    return addSecurityHeaders(NextResponse.json(createSuccessResponse({ deleted: true })))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Attachments API DELETE')
  }
}

