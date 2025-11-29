import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
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
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        module: {
          select: {
            id: true,
            name: true
          }
        },
        milestone: {
          select: {
            id: true,
            name: true
          }
        },
        release: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!ticket) {
      logger.warn('Ticket not found', { ticketId: id })
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to any of the ticket's spaces
    if (!ticket.spaces || ticket.spaces.length === 0) {
      logger.warn('Ticket has no associated spaces', { ticketId: id })
      return NextResponse.json({ error: 'Ticket has no associated spaces' }, { status: 404 })
    }

    // Check access to first space (tickets typically have one primary space)
    const spaceId = ticket.spaces[0]?.spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}`, 200, duration)
    return NextResponse.json(ticket)
}

export const GET = withErrorHandling(getHandler, 'GET /api/tickets/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
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
      projectId: z.string().uuid().optional().nullable(),
      moduleId: z.string().uuid().optional().nullable(),
      milestoneId: z.string().uuid().optional().nullable(),
      releaseId: z.string().uuid().optional().nullable(),
    })
    
    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
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
      attributes,
      projectId,
      moduleId,
      milestoneId,
      releaseId
    } = bodyValidation.data

    // Check if ticket exists and user has access
    const existingTicket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!existingTicket || existingTicket.deletedAt) {
      logger.warn('Ticket not found for update', { ticketId: id })
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to this space
    const spaceId = existingTicket.spaces?.[0]?.spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
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
    if (projectId !== undefined) updateData.projectId = projectId || null
    if (moduleId !== undefined) updateData.moduleId = moduleId || null
    if (milestoneId !== undefined) updateData.milestoneId = milestoneId || null
    if (releaseId !== undefined) updateData.releaseId = releaseId || null

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
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        module: {
          select: {
            id: true,
            name: true
          }
        },
        milestone: {
          select: {
            id: true,
            name: true
          }
        },
        release: {
          select: {
            id: true,
            name: true
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
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          module: {
            select: {
              id: true,
              name: true
            }
          },
          milestone: {
            select: {
              id: true,
              name: true
            }
          },
          release: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      const duration = Date.now() - startTime
      logger.apiResponse('PUT', `/api/tickets/${id}`, 200, duration)
      return NextResponse.json(ticketWithAttributes)
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/tickets/${id}`, 200, duration)
    return NextResponse.json(ticket)
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/tickets/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
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
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to this space
    const spaceId = existingTicket.spaces?.[0]?.spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
    }

    // Soft delete
    await db.ticket.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}`, 200, duration)
    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/tickets/[id]')

