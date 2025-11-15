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
    logger.apiRequest('GET', `/api/tickets/${id}/time-logs`, { userId: session.user.id })

    const timeLogs = await db.ticketTimeLog.findMany({
      where: {
        ticketId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        loggedAt: 'desc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/time-logs`, 200, duration, {
      timeLogCount: timeLogs.length
    })
    return addSecurityHeaders(NextResponse.json({ timeLogs }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Time Logs API GET')
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
    logger.apiRequest('POST', `/api/tickets/${id}/time-logs`, { userId: session.user.id })

    const bodySchema = z.object({
      hours: z.number().positive('Valid hours are required'),
      description: z.string().optional().nullable(),
      loggedAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : new Date()),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { hours, description, loggedAt } = bodyValidation.data

    // Check if ticket exists
    const ticket = await db.ticket.findUnique({
      where: { id }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for time log creation', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket not found' }, { status: 404 }))
    }

    const timeLog = await db.ticketTimeLog.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        hours: hours,
        description: description || null,
        loggedAt: loggedAt || new Date()
      },
      include: {
        user: {
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
    logger.apiResponse('POST', `/api/tickets/${id}/time-logs`, 201, duration, {
      timeLogId: timeLog.id,
      hours,
    })
    return addSecurityHeaders(NextResponse.json(timeLog, { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Time Logs API POST')
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
    logger.apiRequest('DELETE', `/api/tickets/${id}/time-logs`, { userId: session.user.id })

    const querySchema = z.object({
      timeLogId: commonSchemas.id,
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { timeLogId } = queryValidation.data

    const timeLog = await db.ticketTimeLog.findUnique({
      where: { id: timeLogId }
    })

    if (!timeLog || timeLog.userId !== session.user.id) {
      logger.warn('Time log not found or unauthorized', { ticketId: id, timeLogId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Time log not found or unauthorized' }, { status: 404 }))
    }

    await db.ticketTimeLog.delete({
      where: { id: timeLogId }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}/time-logs`, 200, duration, { timeLogId })
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Time Logs API DELETE')
  }
}

