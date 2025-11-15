import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
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
    logger.apiRequest('GET', `/api/tickets/${id}/subtasks`, { userId: session.user.id })

    const subtasks = await db.ticket.findMany({
      where: {
        parentId: id,
        deletedAt: null
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/subtasks`, 200, duration, {
      subtaskCount: subtasks.length
    })
    return addSecurityHeaders(NextResponse.json({ subtasks }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Subtasks API GET')
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
    logger.apiRequest('POST', `/api/tickets/${id}/subtasks`, { userId: session.user.id })

    const bodySchema = z.object({
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      status: z.string().optional(),
      priority: z.string().optional(),
      spaceIds: z.array(z.string().uuid()).optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { title, description, status, priority, spaceIds } = bodyValidation.data

    // Get parent ticket to inherit spaces
    const parentTicket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!parentTicket) {
      logger.warn('Parent ticket not found for subtask creation', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Parent ticket not found' }, { status: 404 }))
    }

    // Get max position for subtasks
    const maxPosition = await db.ticket.findFirst({
      where: { parentId: id },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const finalSpaceIds = spaceIds && spaceIds.length > 0 
      ? spaceIds 
      : parentTicket.spaces.map(ts => ts.spaceId)

    const subtask = await db.ticket.create({
      data: {
        title,
        description: description || null,
        status: status || 'BACKLOG',
        priority: priority || 'MEDIUM',
        parentId: id,
        createdBy: session.user.id,
        position: (maxPosition?.position || 0) + 1,
        spaces: {
          create: finalSpaceIds.map((spaceId: string) => ({
            spaceId
          }))
        }
      },
      include: {
        spaces: {
          include: {
            space: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/tickets/${id}/subtasks`, 201, duration, {
      subtaskId: subtask.id
    })
    return addSecurityHeaders(NextResponse.json(subtask, { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Subtasks API POST')
  }
}

