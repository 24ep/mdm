import { NextRequest, NextResponse } from 'next/server'
import { createAuditLog } from './audit'

export interface AuditMiddlewareOptions {
  entityType: string
  getEntityId: (request: NextRequest, response: NextResponse) => string
  getOldValue?: (request: NextRequest) => any
  getNewValue?: (request: NextRequest, response: NextResponse) => any
  shouldAudit?: (request: NextRequest, response: NextResponse) => boolean
}

export function createAuditMiddleware(options: AuditMiddlewareOptions) {
  return async function auditMiddleware(
    request: NextRequest,
    response: NextResponse,
    next: () => Promise<NextResponse>
  ) {
    const { entityType, getEntityId, getOldValue, getNewValue, shouldAudit } = options

    // Check if we should audit this request
    if (shouldAudit && !shouldAudit(request, response)) {
      return next()
    }

    try {
      const userId = request.headers.get('x-user-id')
      if (!userId) {
        return next()
      }

      const entityId = getEntityId(request, response)
      const oldValue = getOldValue ? await getOldValue(request) : null
      
      // Execute the original request
      const result = await next()
      
      const newValue = getNewValue ? await getNewValue(request, result) : null

      // Create audit log asynchronously (don't wait for it)
      createAuditLog({
        action: request.method,
        entityType,
        entityId,
        oldValue,
        newValue,
        userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }).catch(error => {
        console.error('Failed to create audit log:', error)
      })

      return result
    } catch (error) {
      console.error('Audit middleware error:', error)
      return next()
    }
  }
}

// Helper function to extract user ID from session
export function extractUserIdFromRequest(request: NextRequest): string | null {
  // This would need to be implemented based on your auth system
  // For now, we'll return null and let the individual endpoints handle it
  return null
}

// Helper function to determine if a request should be audited
export function shouldAuditRequest(request: NextRequest): boolean {
  const method = request.method
  const pathname = request.nextUrl.pathname

  // Only audit write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false
  }

  // Skip certain paths
  const skipPaths = ['/api/health', '/api/sse']
  if (skipPaths.some(path => pathname.startsWith(path))) {
    return false
  }

  return true
}
