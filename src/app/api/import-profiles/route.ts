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
      dataModel: z.string().optional(),
      isPublic: z.string().transform((val) => val === 'true').optional(),
      importType: z.string().optional(),
    }))
    
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }
    
    const { dataModel, isPublic, importType } = queryValidation.data
    logger.apiRequest('GET', '/api/import-profiles', { userId: session.user.id, dataModel, importType })

    // Build where clause for filtering using Prisma
    const where: any = {}
    
    if (dataModel) {
      where.dataModel = dataModel
    }
    
    if (isPublic !== null) {
      where.isPublic = isPublic === 'true'
    }
    
    if (importType) {
      where.importType = importType
    }

    // Get import profiles using Prisma
    const profiles = await db.importProfile.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/import-profiles', 200, duration, { count: profiles.length })
    return addSecurityHeaders(NextResponse.json({ profiles }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/import-profiles', 500, duration)
    return handleApiError(error, 'Import Profiles API GET')
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
      description: z.string().optional(),
      dataModel: z.string().min(1, 'Data model is required'),
      fileTypes: z.array(z.string()).min(1, 'At least one file type is required'),
      headerRow: z.number().int().positive().optional().default(1),
      dataStartRow: z.number().int().positive().optional().default(2),
      chunkSize: z.number().int().positive().optional().default(1000),
      maxItems: z.number().int().positive().optional().nullable(),
      importType: z.enum(['insert', 'upsert', 'delete']),
      primaryKeyAttribute: z.string().optional().nullable(),
      dateFormat: z.string().optional().default('YYYY-MM-DD'),
      timeFormat: z.string().optional().default('HH:mm:ss'),
      booleanFormat: z.string().optional().default('true/false'),
      attributeMapping: z.record(z.any()).optional().default({}),
      attributeOptions: z.record(z.any()).optional().default({}),
      isPublic: z.boolean().optional().default(false),
      sharing: z.any().optional(),
      spaceId: commonSchemas.id.optional().nullable(),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { 
      name, 
      description, 
      dataModel, 
      fileTypes, 
      headerRow = 1, 
      dataStartRow = 2, 
      chunkSize = 1000, 
      maxItems, 
      importType, 
      primaryKeyAttribute, 
      dateFormat = 'YYYY-MM-DD', 
      timeFormat = 'HH:mm:ss', 
      booleanFormat = 'true/false', 
      attributeMapping = {}, 
      attributeOptions = {}, 
      isPublic = false, 
      sharing,
      spaceId
    } = bodyValidation.data
    logger.apiRequest('POST', '/api/import-profiles', { userId: session.user.id, name, dataModel, importType })

    // Create the import profile using Prisma
    const profile = await db.importProfile.create({
      data: {
        name,
        description,
        dataModelId: dataModel,
        mapping: attributeMapping || {},
        settings: {
          fileTypes: fileTypes,
          headerRow: headerRow || 1,
          dataStartRow: dataStartRow || 2,
          chunkSize: chunkSize || 1000,
          maxItems: maxItems || null,
          importType: importType,
          primaryKeyAttribute: primaryKeyAttribute || null,
          dateFormat: dateFormat || 'YYYY-MM-DD',
          timeFormat: timeFormat || 'HH:mm:ss',
          booleanFormat: booleanFormat || 'true/false',
          attributeOptions: attributeOptions || {},
          isPublic: isPublic || false
        } as any,
        createdBy: session.user.id,
        spaceId: spaceId || null
      }
    })

    // ImportProfileSharing model doesn't exist in Prisma schema
    // Sharing functionality not implemented

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/import-profiles', 201, duration, { profileId: profile.id })
    return addSecurityHeaders(NextResponse.json({ profile }, { status: 201 }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/import-profiles', 500, duration)
    return handleApiError(error, 'Import Profiles API POST')
  }
}
