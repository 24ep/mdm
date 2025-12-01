import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ManageEngineServiceDeskService } from '@/lib/manageengine-servicedesk'
import { db } from '@/lib/db'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'
import { createAuditLog } from '@/lib/audit'
import { validateTicketData, sanitizeTicketData } from '@/lib/servicedesk-validator'

// Push ticket to ServiceDesk
async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  let auditLogId: string | null = null
  
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\integrations\manageengine-servicedesk\push\route.ts')

    const body = await request.json()
    const { ticket_id, space_id, requesterEmail, category, subcategory, group, technician, syncComments, syncAttachments, syncTimeLogs } = body

    if (!ticket_id || !space_id) {
      return NextResponse.json(
        { error: 'ticket_id and space_id are required' },
        { status: 400 }
      )
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden'  })

    // Rate limiting check
    const rateLimitConfig = await getServiceDeskRateLimitConfig(space_id)
    const rateLimitResult = await checkServiceDeskRateLimit(space_id, session.user.id, rateLimitConfig)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: rateLimitResult.reason,
          resetTime: rateLimitResult.resetTime,
          blockedUntil: rateLimitResult.blockedUntil
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitConfig.maxRequestsPerMinute || 60),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
            'Retry-After': rateLimitResult.blockedUntil 
              ? String(Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000))
              : '60'
          }
        }
      )
    }

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticket_id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            email: true
          }
        },
        tags: true,
        attributes: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found'  })

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

    const config = configRows[0]
    
    // Get API key from Vault or decrypt
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let apiKey: string
    if (useVault && config.api_auth_apikey_value?.startsWith('vault://')) {
      const vaultPath = config.api_auth_apikey_value.replace('vault://', '')
      const connectionId = vaultPath.split('/')[0]
      const creds = await secretsManager.getSecret(`servicedesk-integrations/${connectionId}/credentials`)
      apiKey = creds?.apiKey || ''
    } else {
      apiKey = decryptApiKey(config.api_auth_apikey_value) || ''
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Failed to retrieve API key' },
        { status: 500 }
      )
    }

    // Validate ticket data
    const validation = validateTicketData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      dueDate: ticket.dueDate,
      requesterEmail: requesterEmail || ticket.creator?.email || undefined
    })

    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      )
    }

    // Sanitize ticket data
    const sanitizedTicket = sanitizeTicketData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      dueDate: ticket.dueDate,
      requesterEmail: requesterEmail || ticket.creator?.email || undefined
    })

    // Initialize ServiceDesk service
    const service = new ManageEngineServiceDeskService({
      baseUrl: config.api_url,
      apiKey
    })

    // Map our ticket to ServiceDesk format
    const serviceDeskTicket = service.mapTicketToServiceDesk({
      title: sanitizedTicket.title,
      description: sanitizedTicket.description,
      priority: sanitizedTicket.priority,
      status: sanitizedTicket.status,
      dueDate: sanitizedTicket.dueDate,
      requesterEmail: sanitizedTicket.requesterEmail,
      tags: ticket.tags,
      attributes: ticket.attributes.map(attr => ({
        name: attr.name,
        value: attr.value || attr.jsonValue
      }))
    })

    // Log validation warnings if any
    if (validation.warnings.length > 0) {
      console.warn('ServiceDesk push validation warnings:', validation.warnings)
    }

    // Add optional fields from request
    if (category) serviceDeskTicket.category = category
    if (subcategory) serviceDeskTicket.subcategory = subcategory
    if (group) serviceDeskTicket.group = group
    if (technician) {
      serviceDeskTicket.technician = technician
    } else if (ticket.assignees && ticket.assignees.length > 0) {
      serviceDeskTicket.technician = ticket.assignees[0].user.email
    }

    // Create ticket in ServiceDesk
    const result = await service.createTicket(serviceDeskTicket)

    if (result.success) {
      const requestId = result.requestId
      
      // Store the ServiceDesk request ID in ticket metadata
      const metadata = (ticket.metadata as any) || {}
      metadata.serviceDeskRequestId = requestId
      metadata.serviceDeskPushedAt = new Date().toISOString()
      
      await db.ticket.update({
        where: { id: ticket_id },
        data: { metadata }
      })

      // Sync comments if requested
      let syncedComments = 0
      if (syncComments) {
        try {
          // Get comments from ticket
          const comments = await db.ticketComment.findMany({
            where: { ticketId: ticket_id },
            include: {
              author: {
                select: { email: true, name: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          })

          for (const comment of comments) {
            try {
              await service.addComment(requestId!, {
                content: comment.content,
                isPublic: true
              })
              syncedComments++

