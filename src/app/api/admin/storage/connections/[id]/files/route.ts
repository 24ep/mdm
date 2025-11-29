import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'
import { logger } from '@/lib/logger'
import { validateParams, validateQuery, commonSchemas } from '@/lib/api-validation'
import { handleApiError , requireAuthWithId } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// GET - List files from a storage connection
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } 

export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\storage\connections\[id]\files\route.ts')= authResult
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }



    logger.apiRequest('GET', '/api/admin/storage/connections/[id]/files', { userId: session.user.id })

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      logger.warn('Insufficient permissions for storage connection files', { userId: session.user.id, role: session.user.role })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    const connection = await prisma.storageConnection.findUnique({
      where: { id }
    })

    if (!connection) {
      logger.warn('Storage connection not found', { connectionId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Storage connection not found' }, { status: 404 }))
    }

    if (!connection.isActive || connection.status !== 'connected') {
      logger.warn('Storage connection not active or connected', { connectionId: id, isActive: connection.isActive, status: connection.status })
      return addSecurityHeaders(NextResponse.json({ 
        error: 'Storage connection is not active or connected' 
      }, { status: 400 }))
    }

    const querySchema = z.object({
      path: z.string().optional().default(''),
      search: z.string().optional().default(''),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { path, search } = queryValidation.data

    // For now, return empty files array
    // In production, implement actual file listing based on connection type
    // This would require SDK implementations for OneDrive and Google Drive
    const files: any[] = []

    // TODO: Implement file listing for each storage type:
    // - MinIO: Use MinIO client to list objects
    // - S3: Use AWS SDK to list objects
    // - SFTP: Use SFTP client to list files
    // - OneDrive: Use Microsoft Graph API
    // - Google Drive: Use Google Drive API

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/admin/storage/connections/[id]/files', 200, duration, {
      connectionId: id,
      fileCount: files.length,
      path,
      search,
    })
    return addSecurityHeaders(NextResponse.json({ files }))
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/admin/storage/connections/[id]/files', 500, duration)
    return handleApiError(error, 'Storage Connection Files API')
  }
}

