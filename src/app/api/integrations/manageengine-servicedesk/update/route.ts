import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'
import { createAuditLog } from '@/lib/audit'
import { validateTicketData, sanitizeTicketData } from '@/lib/servicedesk-validator'

// Update a ticket in ServiceDesk
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let auditLogId: string | null = null
  let space_id: string | undefined = undefined
  let session: any = null
  
  try {
    session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = body
    space_id = parsed.space_id
    const { request_id, updates } = parsed

    if (!space_id || !request_id || !updates) {
      return NextResponse.json(
        { error: 'space_id, request_id, and updates are required' },
        { status: 400 }
      )
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limiting check
    const rateLimitConfig = await getServiceDeskRateLimitConfig(space_id)
    const rateLimitResult = await checkServiceDeskRateLimit(space_id, session.user.id, rateLimitConfig)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: rateLimitResult.reason,
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.resetTime || 60),
            'X-RateLimit-Limit': String(rateLimitConfig?.maxRequestsPerMinute || 60),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining || 0),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime || Date.now() + 60000)
          }
        }
      )
    }

    // Validate update data
    if (updates.subject || updates.description) {
      const validationData = {
        title: updates.subject || '',
        description: updates.description || '',
        requesterEmail: updates.requesterEmail || ''
      }
      const validation = validateTicketData(validationData)
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            validationErrors: validation.errors
          },
          { status: 400 }
        )
      }
      // Sanitize
      const sanitized = sanitizeTicketData(validationData)
      if (updates.subject) updates.subject = sanitized.title
      if (updates.description) updates.description = sanitized.description
    }

    // Create initial audit log
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      const userAgent = request.headers.get('user-agent') || undefined
      
      const auditResult = await createAuditLog({
        action: 'SERVICEDESK_TICKET_UPDATE_ATTEMPTED',
        entityType: 'ServiceDeskIntegration',
        entityId: space_id,
        userId: session.user.id,
        newValue: { requestId: request_id, updates },
        ipAddress,
        userAgent
      })
      auditLogId = auditResult?.id || null
    } catch (auditError) {
      console.warn('Failed to create initial audit log:', auditError)
    }

    // Get ServiceDesk configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_apikey_value
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ServiceDesk%'
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [space_id]
    )

    if (configRows.length === 0) {
      return NextResponse.json(
        { error: 'ServiceDesk integration not configured for this space' },
        { status: 400 }
      )
    }

    // Get ServiceDesk service
    const service = await getServiceDeskService(space_id)
    if (!service) {
      return NextResponse.json(
        { error: 'ServiceDesk integration not configured for this space' },
        { status: 400 }
      )
    }

    // Update ticket in ServiceDesk
    const result = await service.updateTicket(request_id, updates)

    if (result.success) {
      // Update audit log on success
      if (auditLogId) {
        await createAuditLog({
          action: 'SERVICEDESK_TICKET_UPDATED',
          entityType: 'ServiceDeskIntegration',
          entityId: space_id,
          userId: session.user.id,
          newValue: {
            requestId: request_id,
            updates,
            duration: Date.now() - startTime,
            status: 'success'
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined
        }).catch(() => {})
      }

      return NextResponse.json({
        success: true,
        message: 'Ticket updated in ServiceDesk successfully',
        data: result?.data || null,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }
      }, {
        headers: {
          'X-RateLimit-Limit': String(rateLimitConfig?.maxRequestsPerMinute || 60),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime)
        }
      })
    } else {
      // Update audit log on error
      if (auditLogId) {
        await createAuditLog({
          action: 'SERVICEDESK_TICKET_UPDATE_FAILED',
          entityType: 'ServiceDeskIntegration',
          entityId: space_id,
          userId: session.user.id,
          newValue: {
            requestId: request_id,
            error: result.error || 'Unknown error',
            duration: Date.now() - startTime,
            status: 'failed'
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined
        }).catch(() => {})
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update ticket in ServiceDesk' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('POST /integrations/manageengine-servicedesk/update error', error)
    
    // Update audit log on exception
    if (auditLogId) {
      await createAuditLog({
        action: 'SERVICEDESK_TICKET_UPDATE_FAILED',
        entityType: 'ServiceDeskIntegration',
        entityId: space_id || 'unknown',
        userId: session?.user?.id || 'unknown',
        newValue: {
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - (startTime || Date.now()),
          status: 'failed'
        },
        ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip') || undefined,
        userAgent: request?.headers?.get('user-agent') || undefined
      }).catch(() => {})
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

