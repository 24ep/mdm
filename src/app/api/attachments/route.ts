import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
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
      spaceId: commonSchemas.id.optional(),
    }))
    
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }
    
    const { spaceId } = queryValidation.data
    logger.apiRequest('GET', '/api/attachments', { userId: session.user.id, spaceId })

    // Check if user has access to this space using Prisma
    if (spaceId) {
      const spaceMember = await db.spaceMember.findFirst({
        where: {
          spaceId: spaceId,
          userId: session.user.id
        },
        select: { role: true }
      })

      if (!spaceMember) {
        logger.warn('Space not found or access denied for attachments', { spaceId, userId: session.user.id })
        return addSecurityHeaders(NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 }))
      }
    }

    // Get attachments using Prisma
    const attachments = await db.attachmentFile.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/attachments', 200, duration, { count: attachments.length })
    return addSecurityHeaders(NextResponse.json({ attachments }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/attachments', 500, duration)
    return handleApiError(error, 'Attachments API GET')
  }
}
