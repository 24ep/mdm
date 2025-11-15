import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, validateQuery, commonSchemas } from '@/lib/api-validation'
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
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/tickets/${id}/comments`, { userId: session.user.id })

    const comments = await db.ticketComment.findMany({
      where: {
        ticketId: id,
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/comments`, 200, duration, {
      commentCount: comments.length
    })
    return addSecurityHeaders(NextResponse.json({ comments }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Comments API GET')
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
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('POST', `/api/tickets/${id}/comments`, { userId: session.user.id })

    const bodySchema = z.object({
      content: z.string().min(1),
      metadata: z.any().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { content, metadata } = bodyValidation.data

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        spaces: {
          include: {
            space: true
          }
        }
      }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for comment', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket not found' }, { status: 404 }))
    }

    // Check access
    const hasAccess = ticket.spaces.some((ts) => {
      // User should have access to at least one space
      return true // Simplified - add proper access check
    })

    if (!hasAccess) {
      logger.warn('Access denied to add ticket comment', { ticketId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    const comment = await db.ticketComment.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        content,
        metadata: metadata || {}
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/tickets/${id}/comments`, 201, duration, {
      commentId: comment.id
    })
    return addSecurityHeaders(NextResponse.json(comment, { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Comments API POST')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('PUT', `/api/tickets/${id}/comments`, { userId: session.user.id })

    const querySchema = z.object({
      commentId: z.string().uuid(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { commentId } = queryValidation.data

    const bodySchema = z.object({
      content: z.string().min(1),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { content } = bodyValidation.data

    const comment = await db.ticketComment.findUnique({
      where: { id: commentId }
    })

    if (!comment || comment.userId !== session.user.id) {
      logger.warn('Comment not found or unauthorized', { ticketId: id, commentId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 }))
    }

    const updated = await db.ticketComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/tickets/${id}/comments`, 200, duration, { commentId })
    return addSecurityHeaders(NextResponse.json(updated))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Comments API PUT')
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
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/tickets/${id}/comments`, { userId: session.user.id })

    const querySchema = z.object({
      commentId: z.string().uuid(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { commentId } = queryValidation.data

    const comment = await db.ticketComment.findUnique({
      where: { id: commentId }
    })

    if (!comment || (comment.userId !== session.user.id)) {
      logger.warn('Comment not found or unauthorized for deletion', { ticketId: id, commentId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 }))
    }

    // Soft delete
    await db.ticketComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}/comments`, 200, duration, { commentId })
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Comments API DELETE')
  }
}

