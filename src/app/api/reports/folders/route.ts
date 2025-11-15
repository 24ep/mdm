import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'
import { folderSchema } from '@/lib/validation/report-schemas'
import { auditLogger } from '@/lib/utils/audit-logger'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 }))
    }

    logger.apiRequest('GET', '/api/reports/folders', { userId: session.user.id })

    const sql = `
      SELECT * FROM report_folders
      WHERE deleted_at IS NULL
      ORDER BY name
    `

    const result = await query(sql, [])
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/reports/folders', 200, duration, {
      folderCount: result.rows.length
    })
    return addSecurityHeaders(NextResponse.json(createSuccessResponse({ folders: result.rows || [] })))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/reports/folders', 500, duration)
    return handleApiError(error, 'Report Folders API GET')
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 }))
    }

    logger.apiRequest('POST', '/api/reports/folders', { userId: session.user.id })

    const bodyValidation = await validateBody(request, folderSchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { name, description, parent_id } = bodyValidation.data

    const sql = `
      INSERT INTO report_folders (name, description, parent_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const result = await query(sql, [
      name,
      description || null,
      parent_id || null,
      session.user.id
    ])

    // Log audit event
    auditLogger.folderCreated(result.rows[0].id)

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/reports/folders', 201, duration, {
      folderId: result.rows[0].id
    })
    return addSecurityHeaders(NextResponse.json(createSuccessResponse({ folder: result.rows[0] }), { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/reports/folders', 500, duration)
    return handleApiError(error, 'Report Folders API POST')
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 }))
    }

    logger.apiRequest('PUT', '/api/reports/folders', { userId: session.user.id })

    const bodySchema = z.object({
      id: z.string().min(1),
    }).merge(folderSchema)

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { id, ...folderData } = bodyValidation.data
    const { name, description, parent_id } = folderData

    const sql = `
      UPDATE report_folders
      SET name = $1, description = $2, parent_id = $3, updated_at = NOW()
      WHERE id = $4 AND created_by = $5
      RETURNING *
    `

    const result = await query(sql, [
      name,
      description || null,
      parent_id || null,
      id,
      session.user.id
    ])

    if (result.rows.length === 0) {
      logger.warn('Folder not found for update', { folderId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Folder not found', 'NOT_FOUND'), { status: 404 }))
    }

    // Log audit event
    auditLogger.folderUpdated(id)

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/reports/folders', 200, duration, { folderId: id })
    return addSecurityHeaders(NextResponse.json(createSuccessResponse({ folder: result.rows[0] })))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/reports/folders', 500, duration)
    return handleApiError(error, 'Report Folders API PUT')
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 }))
    }

    logger.apiRequest('DELETE', '/api/reports/folders', { userId: session.user.id })

    const querySchema = z.object({
      id: z.string().min(1),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { id } = queryValidation.data

    const sql = `
      UPDATE report_folders
      SET deleted_at = NOW()
      WHERE id = $1 AND created_by = $2
      RETURNING *
    `

    const result = await query(sql, [id, session.user.id])

    if (result.rows.length === 0) {
      logger.warn('Folder not found for deletion', { folderId: id, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json(createErrorResponse('Folder not found', 'NOT_FOUND'), { status: 404 }))
    }

    // Log audit event
    auditLogger.folderDeleted(id)

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', '/api/reports/folders', 200, duration, { folderId: id })
    return addSecurityHeaders(NextResponse.json(createSuccessResponse({ deleted: true })))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', '/api/reports/folders', 500, duration)
    return handleApiError(error, 'Report Folders API DELETE')
  }
}

