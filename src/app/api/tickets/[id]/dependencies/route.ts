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
    logger.apiRequest('GET', `/api/tickets/${id}/dependencies`, { userId: session.user.id })

    const [dependencies, dependents] = await Promise.all([
      db.ticketDependency.findMany({
        where: {
          ticketId: id
        },
        include: {
          dependsOn: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          }
        }
      }),
      db.ticketDependency.findMany({
        where: {
          dependsOnId: id
        },
        include: {
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          }
        }
      })
    ])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/dependencies`, 200, duration, {
      dependencyCount: dependencies.length,
      dependentCount: dependents.length,
    })
    return addSecurityHeaders(NextResponse.json({ dependencies, dependents }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Dependencies API GET')
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
    logger.apiRequest('POST', `/api/tickets/${id}/dependencies`, { userId: session.user.id })

    const bodySchema = z.object({
      dependsOnId: commonSchemas.id,
      type: z.enum(['BLOCKS', 'RELATED', 'DUPLICATES']).optional().default('BLOCKS'),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { dependsOnId, type } = bodyValidation.data

    if (id === dependsOnId) {
      logger.warn('Ticket cannot depend on itself', { ticketId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Ticket cannot depend on itself' }, { status: 400 }))
    }

    // Check if dependency already exists
    const existing = await db.ticketDependency.findUnique({
      where: {
        ticketId_dependsOnId: {
          ticketId: id,
          dependsOnId
        }
      }
    })

    if (existing) {
      logger.warn('Dependency already exists', { ticketId: id, dependsOnId })
      return addSecurityHeaders(NextResponse.json({ error: 'Dependency already exists' }, { status: 400 }))
    }

    const dependency = await db.ticketDependency.create({
      data: {
        ticketId: id,
        dependsOnId,
        type: type || 'BLOCKS'
      },
      include: {
        dependsOn: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/tickets/${id}/dependencies`, 201, duration, {
      dependencyId: dependency.id,
      dependsOnId,
    })
    return addSecurityHeaders(NextResponse.json(dependency, { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Dependencies API POST')
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
    logger.apiRequest('DELETE', `/api/tickets/${id}/dependencies`, { userId: session.user.id })

    const querySchema = z.object({
      dependsOnId: commonSchemas.id,
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { dependsOnId } = queryValidation.data

    await db.ticketDependency.delete({
      where: {
        ticketId_dependsOnId: {
          ticketId: id,
          dependsOnId
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}/dependencies`, 200, duration, { dependsOnId })
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Ticket Dependencies API DELETE')
  }
}

