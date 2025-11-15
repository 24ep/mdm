import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
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
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId } = paramValidation.data
    logger.apiRequest('GET', `/api/spaces/${spaceId}/users`, { userId: session.user.id })

    // Check if user has access to this space
    const spaceAccess = await query(`
      SELECT sm.role
      FROM space_members sm
      WHERE sm.space_id = $1 AND sm.user_id = $2
    `, [spaceId, session.user.id])

    if (spaceAccess.rows.length === 0) {
      logger.warn('Access denied to space users', { spaceId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Get all users in this space
    const { rows } = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        NULL as avatar,
        sm.role as space_role,
        u.is_active
      FROM space_members sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1 AND u.is_active = true
      ORDER BY u.name ASC
    `, [spaceId])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceId}/users`, 200, duration, {
      userCount: rows.length
    })
    return addSecurityHeaders(NextResponse.json({ 
      users: rows,
      count: rows.length 
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Users API')
  }
}
