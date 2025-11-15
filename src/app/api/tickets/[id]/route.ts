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
    logger.apiRequest('GET', `/api/tickets/${id}`, { userId: session.user.id })
    const ticket = await db.ticket.findUnique({
      where: {
        id,
        deletedAt: null
      },
      include: {
        assignees: {
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
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attributes: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        spaces: {
          include: {
            space: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })

    if (!ticket) {
      logger.warn('Ticket not found', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket not found' }, { status: 404 }))
    }

    // Check if user has access to any of the ticket's spaces
    if (!ticket.spaces || ticket.spaces.length === 0) {
      logger.warn('Ticket has no associated spaces', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket has no associated spaces' }, { status: 404 }))
    }

    let hasAccess = false
    for (const ticketSpace of ticket.spaces) {
      const spaceAccess = await db.spaceMember.findFirst({
        where: {
          spaceId: ticketSpace.spaceId,
          userId: session.user.id
        }
      })

      const isSpaceOwner = await db.space.findFirst({
        where: {
          id: ticketSpace.spaceId,
          createdBy: session.user.id
        }
      })

      if (spaceAccess || isSpaceOwner) {
        hasAccess = true
        break
      }
    }

    if (!hasAccess) {
      logger.warn('Access denied to ticket', { ticketId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json(ticket))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Tickets API GET')
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
    logger.apiRequest('PUT', `/api/tickets/${id}`, { userId: session.user.id })
    
    const bodySchema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      dueDate: z.string().datetime().optional().nullable(),
      startDate: z.string().datetime().optional().nullable(),
      assignedTo: z.string().uuid().optional().nullable(),
      labels: z.array(z.string()).optional(),
      estimate: z.number().optional(),
      attributes: z.array(z.any()).optional(),
    })
    
    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      assignedTo,
      labels,
      estimate,
      attributes
    } = bodyValidation.data

    // Check if ticket exists and user has access
    const existingTicket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!existingTicket || existingTicket.deletedAt) {
      logger.warn('Ticket not found for update', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket not found' }, { status: 404 }))
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: existingTicket.spaces?.[0]?.spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: existingTicket.spaces?.[0]?.spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      logger.warn('Access denied to update ticket', { ticketId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) {
      updateData.status = status
      if (status === 'DONE' && !existingTicket.completedAt) {
        updateData.completedAt = new Date()
      } else if (status !== 'DONE' && existingTicket.completedAt) {
        updateData.completedAt = null
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null
    if (labels !== undefined) updateData.labels = labels
    if (estimate !== undefined) updateData.estimate = estimate

    // Update ticket
    const ticket = await db.ticket.update({
      where: { id },
      data: updateData,
      include: {
        assignees: {
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
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attributes: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    // Update attributes if provided
    if (attributes && Array.isArray(attributes)) {
      // Delete existing attributes
      await db.ticketAttribute.deleteMany({
        where: { ticketId: id }
      })

      // Create new attributes
      if (attributes.length > 0) {
        await db.ticketAttribute.createMany({
          data: attributes.map((attr: any, index: number) => ({
            ticketId: id,
            name: attr.name,
            displayName: attr.displayName || attr.name,
            type: attr.type || 'TEXT',
            value: attr.value || null,
            jsonValue: attr.jsonValue || null,
            isRequired: attr.isRequired || false,
            sortOrder: attr.sortOrder !== undefined ? attr.sortOrder : index
          }))
        })
      }

      // Reload ticket with updated attributes
      const ticketWithAttributes = await db.ticket.findUnique({
        where: { id },
        include: {
        assignees: {
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
        },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          attributes: {
            orderBy: {
              sortOrder: 'asc'
            }
          }
        }
      })

      const duration = Date.now() - startTime
      logger.apiResponse('PUT', `/api/tickets/${id}`, 200, duration)
      return addSecurityHeaders(NextResponse.json(ticketWithAttributes))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/tickets/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json(ticket))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Tickets API PUT')
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
    logger.apiRequest('DELETE', `/api/tickets/${id}`, { userId: session.user.id })
    // Check if ticket exists and user has access
    const existingTicket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!existingTicket || existingTicket.deletedAt) {
      logger.warn('Ticket not found for deletion', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket not found' }, { status: 404 }))
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: existingTicket.spaces?.[0]?.spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: existingTicket.spaces?.[0]?.spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      logger.warn('Access denied to delete ticket', { ticketId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Soft delete
    await db.ticket.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Tickets API DELETE')
  }
}

