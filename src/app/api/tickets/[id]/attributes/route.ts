import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, validateQuery, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

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
    logger.apiRequest('POST', `/api/tickets/${id}/attributes`, { userId: session.user.id })

    const bodySchema = z.object({
      name: z.string().min(1),
      displayName: z.string().optional(),
      type: z.string().optional(),
      value: z.string().optional().nullable(),
      jsonValue: z.any().optional().nullable(),
      isRequired: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { name, displayName, type, value, jsonValue, isRequired, sortOrder } = bodyValidation.data

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for attribute creation', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket not found' }, { status: 404 }))
    }

    // Get space ID from ticket
    const spaceId = ticket.spaces?.[0]?.spaceId
    if (!spaceId) {
      logger.warn('Ticket has no associated space', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket has no associated space' }, { status: 404 }))
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      logger.warn('Access denied to create ticket attribute', { ticketId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Check if attribute already exists
    const existing = await db.ticketAttribute.findUnique({
      where: {
        ticketId_name: {
          ticketId: id,
          name
        }
      }
    })

    if (existing) {
      logger.warn('Ticket attribute already exists', { ticketId: id, attributeName: name })
      return addSecurityHeaders(NextResponse.json({ error: 'Attribute already exists' }, { status: 400 }))
    }

    // Get max sort order if not provided
    let finalSortOrder = sortOrder
    if (finalSortOrder === undefined) {
      const maxSort = await db.ticketAttribute.findFirst({
        where: { ticketId: id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
      })
      finalSortOrder = maxSort ? maxSort.sortOrder + 1 : 0
    }

    const attribute = await db.ticketAttribute.create({
      data: {
        ticketId: id,
        name,
        displayName: displayName || name,
        type: type || 'TEXT',
        value: value || null,
        jsonValue: jsonValue || null,
        isRequired: isRequired || false,
        sortOrder: finalSortOrder
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/tickets/${id}/attributes`, 201, duration, {
      attributeId: attribute.id,
      attributeName: name,
    })
    return addSecurityHeaders(NextResponse.json(attribute, { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Attributes API POST')
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
    logger.apiRequest('PUT', `/api/tickets/${id}/attributes`, { userId: session.user.id })

    const bodySchema = z.object({
      attributeId: z.string().uuid(),
      name: z.string().min(1).optional(),
      displayName: z.string().optional(),
      type: z.string().optional(),
      value: z.string().optional().nullable(),
      jsonValue: z.any().optional().nullable(),
      isRequired: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { attributeId, displayName, type, value, jsonValue, isRequired, sortOrder } = bodyValidation.data

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for attribute update', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket not found' }, { status: 404 }))
    }

    // Get space ID from ticket
    const spaceId = ticket.spaces?.[0]?.spaceId
    if (!spaceId) {
      logger.warn('Ticket has no associated space for attribute update', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket has no associated space' }, { status: 404 }))
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const updateData: any = {}
    if (displayName !== undefined) updateData.displayName = displayName
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value
    if (jsonValue !== undefined) updateData.jsonValue = jsonValue
    if (isRequired !== undefined) updateData.isRequired = isRequired
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const attribute = await db.ticketAttribute.update({
      where: { id: attributeId },
      data: updateData
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/tickets/${id}/attributes`, 200, duration, { attributeId })
    return addSecurityHeaders(NextResponse.json(attribute))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Attributes API PUT')
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
    logger.apiRequest('DELETE', `/api/tickets/${id}/attributes`, { userId: session.user.id })

    const querySchema = z.object({
      attributeId: z.string().uuid(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { attributeId } = queryValidation.data

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for attribute deletion', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket not found' }, { status: 404 }))
    }

    // Get space ID from ticket
    const spaceId = ticket.spaces?.[0]?.spaceId
    if (!spaceId) {
      logger.warn('Ticket has no associated space for attribute deletion', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket has no associated space' }, { status: 404 }))
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await db.ticketAttribute.delete({
      where: { id: attributeId }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}/attributes`, 200, duration, { attributeId })
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Attributes API DELETE')
  }
}

