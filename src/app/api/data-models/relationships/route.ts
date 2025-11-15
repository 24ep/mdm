import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
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
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('GET', '/api/data-models/relationships', { userId: session.user.id })

    const querySchema = z.object({
      space_id: commonSchemas.id,
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { space_id: spaceId } = queryValidation.data

    // Get relationships from data model attributes that are foreign keys
    const relationshipsSql = `
      SELECT 
        dm1.id as from_model_id,
        dm1.name as from_model_name,
        dm1.display_name as from_model_display_name,
        dma1.id as from_attribute_id,
        dma1.name as from_attribute_name,
        dma1.display_name as from_attribute_display_name,
        dm2.id as to_model_id,
        dm2.name as to_model_name,
        dm2.display_name as to_model_display_name,
        dma2.id as to_attribute_id,
        dma2.name as to_attribute_name,
        dma2.display_name as to_attribute_display_name,
        dma1.referenced_table,
        dma1.referenced_column,
        'one-to-many' as relationship_type
      FROM public.data_model_attributes dma1
      JOIN public.data_models dm1 ON dm1.id::uuid = dma1.data_model_id::uuid
      JOIN public.data_model_spaces dms1 ON dms1.data_model_id::uuid = dm1.id::uuid
      LEFT JOIN public.data_models dm2 ON LOWER(dm2.name) = LOWER(dma1.referenced_table)
      LEFT JOIN public.data_model_spaces dms2 ON dms2.data_model_id::uuid = dm2.id::uuid
      LEFT JOIN public.data_model_attributes dma2 ON dma2.data_model_id::uuid = dm2.id::uuid 
        AND (LOWER(dma2.name) = LOWER(dma1.referenced_column) OR dma2.is_primary_key = TRUE)
      WHERE dma1.is_foreign_key = TRUE 
        AND dma1.is_active = TRUE
        AND dm1.deleted_at IS NULL
        AND dms1.space_id = $1
        AND (dm2.id IS NULL OR (dm2.deleted_at IS NULL AND dms2.space_id = $1))
      ORDER BY dm1.name, dma1.name
    `

    const { rows } = await query(relationshipsSql, [spaceId])

    const relationships = rows.map((row, index) => ({
      id: `rel-${index}`,
      fromModel: row.from_model_id,
      fromModelName: row.from_model_name,
      fromModelDisplayName: row.from_model_display_name,
      fromAttribute: row.from_attribute_id,
      fromAttributeName: row.from_attribute_name,
      fromAttributeDisplayName: row.from_attribute_display_name,
      toModel: row.to_model_id,
      toModelName: row.to_model_name,
      toModelDisplayName: row.to_model_display_name,
      toAttribute: row.to_attribute_id,
      toAttributeName: row.to_attribute_name,
      toAttributeDisplayName: row.to_attribute_display_name,
      type: row.relationship_type,
      label: `${row.from_model_display_name} → ${row.to_model_display_name}`
    }))

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/data-models/relationships', 200, duration, {
      relationshipCount: relationships.length,
      spaceId,
    })
    return addSecurityHeaders(NextResponse.json({ relationships }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/data-models/relationships', 500, duration)
    return handleApiError(error, 'Data Models Relationships API GET')
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('POST', '/api/data-models/relationships', { userId: session.user.id })

    const bodySchema = z.object({
      fromModel: commonSchemas.id,
      toModel: commonSchemas.id,
      fromAttribute: commonSchemas.id,
      toAttribute: commonSchemas.id,
      type: z.enum(['one-to-many', 'many-to-one', 'many-to-many', 'one-to-one']).optional().default('one-to-many'),
      label: z.string().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { 
      fromModel, 
      toModel, 
      fromAttribute, 
      toAttribute, 
      type, 
      label 
    } = bodyValidation.data

    // For now, we'll just return the relationship data
    // In a full implementation, you might want to store relationships in a separate table
    const relationship = {
      id: `rel-${Date.now()}`,
      fromModel,
      toModel,
      fromAttribute,
      toAttribute,
      type: type || 'one-to-many',
      label: label || ''
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/data-models/relationships', 201, duration, {
      relationshipId: relationship.id,
      fromModel,
      toModel,
    })
    return addSecurityHeaders(NextResponse.json({ relationship }, { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/data-models/relationships', 500, duration)
    return handleApiError(error, 'Data Models Relationships API POST')
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('PUT', '/api/data-models/relationships', { userId: session.user.id })

    const bodySchema = z.object({
      id: z.string().min(1),
      type: z.enum(['one-to-many', 'many-to-one', 'many-to-many', 'one-to-one']).optional(),
      label: z.string().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { id, type, label } = bodyValidation.data

    // For now, we'll just return the updated relationship data
    // In a full implementation, you might want to update relationships in a separate table
    const relationship = {
      id,
      type: type || 'one-to-many',
      label: label || ''
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/data-models/relationships', 200, duration, { relationshipId: id })
    return addSecurityHeaders(NextResponse.json({ relationship }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/data-models/relationships', 500, duration)
    return handleApiError(error, 'Data Models Relationships API PUT')
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('DELETE', '/api/data-models/relationships', { userId: session.user.id })

    const querySchema = z.object({
      id: z.string().min(1),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { id: relationshipId } = queryValidation.data

    // For now, we'll just return success
    // In a full implementation, you might want to delete relationships from a separate table
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', '/api/data-models/relationships', 200, duration, { relationshipId })
    return addSecurityHeaders(NextResponse.json({ message: 'Relationship deleted successfully' }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', '/api/data-models/relationships', 500, duration)
    return handleApiError(error, 'Data Models Relationships API DELETE')
  }
}
