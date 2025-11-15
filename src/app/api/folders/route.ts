import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Validate query parameters
    const queryValidation = validateQuery(request, z.object({
      space_id: commonSchemas.id,
      type: z.string().optional().default('data_model'),
    }))
    
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }
    
    const { space_id: spaceId, type = 'data_model' } = queryValidation.data
    logger.apiRequest('GET', '/api/folders', { userId: session.user.id, spaceId, type })

    // Check if user has access to the space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: spaceId,
        userId: session.user.id
      },
      select: {
        role: true
      }
    })

    if (!spaceMember) {
      logger.warn('Access denied for folders', { spaceId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Folder model doesn't exist in Prisma schema
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/folders', 200, duration, { count: 0 })
    return addSecurityHeaders(NextResponse.json({ folders: [] }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/folders', 500, duration)
    return handleApiError(error, 'Folders API GET')
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      name: z.string().min(1, 'Name is required'),
      type: z.string().optional().default('data_model'),
      space_id: commonSchemas.id,
      parent_id: commonSchemas.id.optional().nullable(),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { name, type = 'data_model', space_id, parent_id } = bodyValidation.data
    logger.apiRequest('POST', '/api/folders', { userId: session.user.id, name, space_id })

    // Check if user has admin/owner access to the space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: space_id,
        userId: session.user.id
      },
      select: {
        role: true
      }
    })

    if (!spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      logger.warn('Access denied for folder creation', { spaceId: space_id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Folder model doesn't exist in Prisma schema
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/folders', 501, duration)
    return addSecurityHeaders(NextResponse.json(
      { error: 'Folder model not implemented' },
      { status: 501 }
    ))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/folders', 500, duration)
    return handleApiError(error, 'Folders API POST')
  }
}
