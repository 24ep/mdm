import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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
      userId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId, userId } = paramValidation.data
    logger.apiRequest('PUT', `/api/spaces/${spaceId}/members/${userId}`, { userId: session.user.id })

    const bodySchema = z.object({
      role: z.enum(['owner', 'admin', 'member', 'viewer']),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { role } = bodyValidation.data

    // Check if current user has permission to update members
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions to update member', { spaceId, targetUserId: userId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }))
    }

    // Prevent non-owners from promoting users to owner
    if (role === 'owner' && memberCheck.rows[0].role !== 'owner') {
      logger.warn('Non-owner attempted to promote user to owner', { spaceId, targetUserId: userId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Only owners can promote users to owner' }, { status: 403 }))
    }

    // Update member role
    const result = await query(`
      UPDATE space_members 
      SET role = $3, updated_at = NOW()
      WHERE space_id = $1 AND user_id = $2
      RETURNING *
    `, [spaceId, userId, role])

    if (result.rows.length === 0) {
      logger.warn('Member not found for update', { spaceId, targetUserId: userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Member not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/spaces/${spaceId}/members/${userId}`, 200, duration, { role })
    return addSecurityHeaders(NextResponse.json({
      member: result.rows[0],
      message: 'Member role updated successfully'
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Member Update API')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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
      userId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId, userId } = paramValidation.data
    logger.apiRequest('DELETE', `/api/spaces/${spaceId}/members/${userId}`, { userId: session.user.id })

    // Check if current user has permission to remove members
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions to remove member', { spaceId, targetUserId: userId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }))
    }

    // Prevent users from removing themselves
    if (userId === session.user.id) {
      logger.warn('User attempted to remove themselves', { spaceId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Cannot remove yourself from space' }, { status: 400 }))
    }

    // Check if target user is owner
    const targetMemberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, userId])

    if (targetMemberCheck.rows.length > 0 && targetMemberCheck.rows[0].role === 'owner') {
      logger.warn('Attempted to remove space owner', { spaceId, targetUserId: userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Cannot remove space owner' }, { status: 400 }))
    }

    // Remove member
    const result = await query(`
      DELETE FROM space_members 
      WHERE space_id = $1 AND user_id = $2
      RETURNING *
    `, [spaceId, userId])

    if (result.rows.length === 0) {
      logger.warn('Member not found for deletion', { spaceId, targetUserId: userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Member not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/spaces/${spaceId}/members/${userId}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({
      message: 'Member removed successfully'
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Member Delete API')
  }
}
