import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
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
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/data-records/${id}`, { userId: session.user.id })

    const record = await db.dataRecord.findUnique({
      where: { id },
      include: {
        values: true
      }
    })

    if (!record) {
      logger.warn('Data record not found', { recordId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/data-records/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ record }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Data Records API GET')
  }
}

export async function PUT(
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
    
    const { id } = paramValidation.data
    logger.apiRequest('PUT', `/api/data-records/${id}`, { userId: session.user.id })

    const bodySchema = z.object({
      values: z.array(z.object({
        attribute_id: z.string().uuid(),
        value: z.any().nullable(),
      })),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { values } = bodyValidation.data

    // Upsert values using Prisma
    if (values.length) {
      for (const v of values) {
        await db.dataRecordValue.upsert({
          where: {
            dataRecordId_attributeId: {
              dataRecordId: id,
              attributeId: v.attribute_id
            }
          },
          update: {
            value: v.value ?? null
          },
          create: {
            dataRecordId: id,
            attributeId: v.attribute_id,
            value: v.value ?? null
          }
        })
      }
    }

    const record = await db.dataRecord.findUnique({
      where: { id },
      include: {
        values: true
      }
    })

    if (!record) {
      logger.warn('Data record not found for update', { recordId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Record not found' }, { status: 404 }))
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataRecord',
      entityId: id,
      oldValue: null, // We don't have old values in this case
      newValue: record,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/data-records/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ record }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Data Records API PUT')
  }
}

export async function DELETE(
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
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/data-records/${id}`, { userId: session.user.id })

    await db.dataRecord.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/data-records/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Data Records API DELETE')
  }
}


