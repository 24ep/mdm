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
  let spaceId: string | undefined
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: z.string().min(1), // Can be 'all' or UUID
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    spaceId = id
    logger.apiRequest('GET', `/api/spaces/${id}/data-models`, { userId: session.user.id })

    if (spaceId === 'all') {
      // Get all data models across all spaces
      const listSql = `
        SELECT DISTINCT dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
               dm.is_active, dm.sort_order, dm.created_by,
               ARRAY_AGG(s.id) as space_ids,
               ARRAY_AGG(s.name) as space_names,
               ARRAY_AGG(s.slug) as space_slugs
        FROM public.data_models dm
        JOIN data_model_spaces dms ON dms.data_model_id::uuid = dm.id
        JOIN spaces s ON s.id = dms.space_id::uuid
        WHERE dm.deleted_at IS NULL AND s.deleted_at IS NULL
        GROUP BY dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
                 dm.is_active, dm.sort_order, dm.created_by
        ORDER BY dm.sort_order ASC, dm.created_at DESC
      `
      
      const { rows: dataModels } = await query(listSql, [])
      
      // Transform the data to match the expected format
      const transformedDataModels = dataModels.map((dm: any) => ({
        ...dm,
        spaces: dm.space_ids?.map((id: string, index: number) => ({
          space: {
            id: id,
            name: dm.space_names?.[index] || '',
            slug: dm.space_slugs?.[index] || ''
          }
        })) || []
      }))
      
      const duration = Date.now() - startTime
      logger.apiResponse('GET', `/api/spaces/all/data-models`, 200, duration, {
        dataModelCount: transformedDataModels.length
      })
      return addSecurityHeaders(NextResponse.json({ dataModels: transformedDataModels }))
    } else {
      // Validate that spaceId is a valid UUID format
      const uuidValidation = z.string().uuid().safeParse(spaceId)
      if (!uuidValidation.success) {
        logger.warn('Invalid space ID format', { spaceId })
        return addSecurityHeaders(NextResponse.json({ 
          error: 'Invalid space ID format',
          details: 'Space ID must be a valid UUID'
        }, { status: 400 }))
      }

      // Get data models for specific space
      const listSql = `
        SELECT DISTINCT dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
               dm.is_active, dm.sort_order, dm.created_by,
               ARRAY_AGG(s.id) as space_ids,
               ARRAY_AGG(s.name) as space_names,
               ARRAY_AGG(s.slug) as space_slugs
        FROM public.data_models dm
        JOIN data_model_spaces dms ON dms.data_model_id::uuid = dm.id
        JOIN spaces s ON s.id = dms.space_id::uuid
        WHERE dm.deleted_at IS NULL AND s.deleted_at IS NULL AND dms.space_id::text = $1
        GROUP BY dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
                 dm.is_active, dm.sort_order, dm.created_by
        ORDER BY dm.sort_order ASC, dm.created_at DESC
      `
      
      const { rows: dataModels } = await query(listSql, [spaceId])
      
      // Transform the data to match the expected format
      const transformedDataModels = dataModels.map((dm: any) => ({
        ...dm,
        spaces: dm.space_ids?.map((id: string, index: number) => ({
          space: {
            id: id,
            name: dm.space_names?.[index] || '',
            slug: dm.space_slugs?.[index] || ''
          }
        })) || []
      }))
      
      const duration = Date.now() - startTime
      logger.apiResponse('GET', `/api/spaces/${spaceId}/data-models`, 200, duration, {
        dataModelCount: transformedDataModels.length
      })
      return addSecurityHeaders(NextResponse.json({ dataModels: transformedDataModels }))
    }
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error fetching data models', error, {
      spaceId,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Data Models API')
  }
}

