import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { createAuditLog } from '@/lib/audit'
import { db } from '@/lib/db'
import crypto from 'crypto'

// Webhook endpoint to receive updates from ServiceDesk
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let auditLogId: string | null = null
  
  try {
    const body = await request.text()
    const signature = request.headers.get('x-servicedesk-signature') || 
                     request.headers.get('x-webhook-signature')
    
    // Verify webhook signature if configured
    const webhookSecret = process.env.SERVICEDESK_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)
    const { event_type, request: serviceDeskRequest } = payload

    if (!event_type || !serviceDeskRequest?.id) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Create initial audit log
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      const userAgent = request.headers.get('user-agent') || undefined
      
      const auditResult = await createAuditLog({
        action: 'SERVICEDESK_WEBHOOK_RECEIVED',
        entityType: 'ServiceDeskIntegration',
        entityId: 'webhook',
        userId: undefined, // Webhook doesn't have user context
        newValue: { eventType: event_type, requestId: serviceDeskRequest.id },
        ipAddress,
        userAgent
      })
      auditLogId = auditResult?.id || null
    } catch (auditError) {
      console.warn('Failed to create initial audit log:', auditError)
    }

    // Find local ticket by ServiceDesk request ID
    const tickets = await db.ticket.findMany({
      where: {
        metadata: {
          path: ['serviceDeskRequestId'],
          equals: serviceDeskRequest.id.toString()
        }
      },
      include: {
        spaces: {
          include: {
            space: true
          }
        }
      }
    })

    if (tickets.length === 0) {
      // Ticket not found locally, might be a new ticket from ServiceDesk
      return NextResponse.json({ 
        success: true, 
        message: 'Ticket not found locally, skipping sync' 
      })
    }

    const ticket = tickets[0]
    const spaceId = ticket.spaces[0]?.spaceId || ticket.spaces[0]?.space?.id

    if (!spaceId) {
      return NextResponse.json({ error: 'Space not found' }, { status: 400 })
    }

    // Get ServiceDesk service
    const service = await getServiceDeskService(spaceId)
    if (!service) {
      return NextResponse.json({ error: 'ServiceDesk config not found' }, { status: 400 })
    }

    // Get full ticket details from ServiceDesk
    const ticketResult = await service.getTicket(serviceDeskRequest.id.toString())
    if (!ticketResult.success) {
      return NextResponse.json({ error: 'Failed to get ticket from ServiceDesk' }, { status: 400 })
    }

    const serviceDeskTicket = ticketResult.data?.request || ticketResult.data?.requests?.[0]
    if (!serviceDeskTicket) {
      return NextResponse.json({ error: 'Ticket not found in ServiceDesk' }, { status: 404 })
    }

    // Map ServiceDesk status to our status
    const statusMap: Record<string, string> = {
      'Open': 'BACKLOG',
      'In Progress': 'IN_PROGRESS',
      'Resolved': 'DONE',
      'Closed': 'CLOSED'
    }

    // Map ServiceDesk priority to our priority
    const priorityMap: Record<string, string> = {
      'Low': 'LOW',
      'Medium': 'MEDIUM',
      'High': 'HIGH',
      'Critical': 'URGENT'
    }

    // Update local ticket with ServiceDesk data
    const updateData: any = {}
    
    if (serviceDeskTicket.subject && serviceDeskTicket.subject !== ticket.title) {
      updateData.title = serviceDeskTicket.subject
    }
    
    if (serviceDeskTicket.description && serviceDeskTicket.description !== ticket.description) {
      updateData.description = serviceDeskTicket.description
    }
    
    if (serviceDeskTicket.status?.name) {
      const mappedStatus = statusMap[serviceDeskTicket.status.name] || ticket.status
      if (mappedStatus !== ticket.status) {
        updateData.status = mappedStatus
        if (mappedStatus === 'DONE' && !ticket.completedAt) {
          updateData.completedAt = new Date()
        }
      }
    }
    
    if (serviceDeskTicket.priority?.name) {
      const mappedPriority = priorityMap[serviceDeskTicket.priority.name] || ticket.priority
      if (mappedPriority !== ticket.priority) {
        updateData.priority = mappedPriority
      }
    }

    // Update ticket if there are changes
    if (Object.keys(updateData).length > 0) {
      await db.ticket.update({
        where: { id: ticket.id },
        data: updateData
      })
    }

    // Log sync activity
    await query(
      `INSERT INTO servicedesk_sync_logs 
       (ticket_id, space_id, sync_type, event_type, success, details, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, NOW())`,
      [
        ticket.id,
        spaceId,
        'webhook',
        event_type,
        true,
        JSON.stringify({ updated: Object.keys(updateData), requestId: serviceDeskRequest.id })
      ]
    ).catch(() => {}) // Ignore if table doesn't exist yet

    // Send notification to ticket assignees (via API endpoint)
    if (event_type === 'request.updated' || event_type === 'request.status_changed') {
      try {
        const assignees = await db.ticketAssignee.findMany({
          where: { ticketId: ticket.id },
          include: { user: true }
        })

        // Create notifications via API
        for (const assignee of assignees) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: assignee.userId,
              type: 'INFO',
              title: 'ServiceDesk Ticket Updated',
              message: `Ticket "${ticket.title}" was updated in ServiceDesk`,
              priority: 'MEDIUM',
              data: { ticket_id: ticket.id, request_id: serviceDeskRequest.id },
              action_url: `/projects?ticket=${ticket.id}`,
              action_label: 'View Ticket'
            })
          }).catch(() => {}) // Ignore notification errors
        }
      } catch (error) {
        console.error('Failed to send notifications:', error)
      }
    }

    // Update audit log on success
    if (auditLogId) {
      await createAuditLog({
        action: 'SERVICEDESK_WEBHOOK_PROCESSED',
        entityType: 'ServiceDeskIntegration',
        entityId: spaceId || 'unknown',
        userId: undefined,
        newValue: {
          eventType: event_type,
          requestId: serviceDeskRequest.id,
          ticketId: ticket.id,
          updated: Object.keys(updateData).length > 0,
          duration: Date.now() - startTime,
          status: 'success'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      ticketId: ticket.id,
      updated: Object.keys(updateData).length > 0
    })
  } catch (error) {
    console.error('POST /integrations/manageengine-servicedesk/webhook error', error)
    
    // Update audit log on error
    if (auditLogId) {
      await createAuditLog({
        action: 'SERVICEDESK_WEBHOOK_PROCESS_FAILED',
        entityType: 'ServiceDeskIntegration',
        entityId: 'webhook',
        userId: undefined,
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

