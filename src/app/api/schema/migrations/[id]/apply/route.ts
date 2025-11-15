import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { schemaMigration } from '@/lib/schema-migration'
import { logger } from '@/lib/logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function POST(
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
      id: z.string().min(1), // Migration ID
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('POST', `/api/schema/migrations/${id}/apply`, { userId: session.user.id })

    await schemaMigration.initialize()
    const result = await schemaMigration.applyMigration(id, session.user.id)

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/schema/migrations/${id}/apply`, 200, duration, {
      migrationId: id,
    })
    return addSecurityHeaders(NextResponse.json(result))
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Schema Migration Apply API')
  }
}

