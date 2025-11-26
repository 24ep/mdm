import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ITSMService } from '@/lib/itsm-service'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// Push ticket to ITSM
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticket_id, space_id, syncComments } = body

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticket_id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
        tags: true,
        comments: syncComments ? {
          include: {
            author: {
              select: {
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        } : false
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get ITSM configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_type, api_auth_apikey_value, api_auth_username, 
              api_auth_password, config
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ITSM%'
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [space_id]
    )

    if (configRows.length === 0) {
      return NextResponse.json(
        { error: 'ITSM integration not configured for this space' },
        { status: 400 }
      )
    }

    const config = configRows[0]
    const customConfig = (config.config as any) || {}
    
    // Get credentials
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let apiKey: string | undefined
    let username: string | undefined
    let password: string | undefined
    
    if (useVault) {
      if (config.api_auth_apikey_value?.startsWith('vault://')) {
        const vaultPath = config.api_auth_apikey_value.replace('vault://', '')
        const connectionId = vaultPath.split('/')[0]
        const creds = await secretsManager.getSecret(`itsm-integrations/${connectionId}/credentials`)
        apiKey = creds?.apiKey
        username = creds?.username
        password = creds?.password
      }
    } else {
      apiKey = config.api_auth_apikey_value ? decryptApiKey(config.api_auth_apikey_value) : undefined
      username = config.api_auth_username ? decryptApiKey(config.api_auth_username) : undefined
      password = config.api_auth_password ? decryptApiKey(config.api_auth_password) : undefined
    }

    // Initialize ITSM service
    const itsmService = new ITSMService({
      baseUrl: config.api_url,
      provider: customConfig.provider || 'custom',
      apiKey,
      username,
      password,
      authType: config.api_auth_type || 'apikey',
      instanceName: customConfig.instanceName,
      customEndpoints: customConfig.customEndpoints,
      fieldMappings: customConfig.fieldMappings
    })

    // Check if ticket already has an ITSM ticket linked
    const metadata = (ticket.metadata as any) || {}
    const existingTicketId = metadata.itsmTicketId

    let result
    if (existingTicketId) {
      // Update existing ticket
      const itsmTicket = itsmService.mapTicketToITSM({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags
      })

      result = await itsmService.updateTicket(existingTicketId, {
        title: itsmTicket.title,
        description: itsmTicket.description,
        priority: itsmTicket.priority,
        status: itsmTicket.status
      })
    } else {
      // Create new ticket
      const itsmTicket = itsmService.mapTicketToITSM({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags
      })

      result = await itsmService.createTicket(itsmTicket)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync ticket to ITSM' },
        { status: 500 }
      )
    }

    // Update ticket metadata with ITSM info
    const updatedMetadata = {
      ...metadata,
      itsmTicketId: result.ticketId,
      itsmTicketNumber: result.ticketNumber,
      itsmTicketUrl: result.ticketUrl,
      itsmProvider: customConfig.provider,
      itsmPushedAt: new Date().toISOString(),
      itsmLastSyncedAt: new Date().toISOString()
    }

    await db.ticket.update({
      where: { id: ticket_id },
      data: { metadata: updatedMetadata }
    })

    // Sync comments if requested
    let syncedComments = 0
    if (syncComments && result.ticketId && ticket.comments) {
      for (const comment of ticket.comments) {
        try {
          await itsmService.addComment(result.ticketId, {
            content: `${comment.author?.name || 'User'}: ${comment.content}`,
            isPublic: true
          })
          syncedComments++
        } catch (error) {
          console.error('Failed to sync comment:', error)
        }
      }
    }

    // Create audit log
    await createAuditLog({
      action: existingTicketId ? 'UPDATE' : 'CREATE',
      entityType: 'ticket_itsm_sync',
      entityId: ticket_id,
      userId: session.user.id,
      newValue: JSON.stringify({
        itsmTicketId: result.ticketId,
        itsmTicketUrl: result.ticketUrl,
        syncedComments
      })
    })

    return NextResponse.json({
      success: true,
      message: existingTicketId 
        ? 'Ticket updated in ITSM successfully' 
        : 'Ticket synced to ITSM successfully',
      data: {
        ticketId: result.ticketId,
        ticketNumber: result.ticketNumber,
        ticketUrl: result.ticketUrl,
        syncedComments
      }
    })
  } catch (error: any) {
    console.error('Error pushing ticket to ITSM:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to push ticket to ITSM' },
      { status: 500 }
    )
  }
}

