import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ManageEngineServiceDeskService } from '@/lib/manageengine-servicedesk'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Get or update sync schedule configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const space_id = searchParams.get('space_id')

    if (!space_id) {
      return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get sync schedule configuration
    const { rows } = await query(
      `SELECT schedule_type, schedule_config, is_active, last_run_at, next_run_at
       FROM servicedesk_sync_schedules
       WHERE space_id = $1::uuid AND deleted_at IS NULL
       LIMIT 1`,
      [space_id]
    )

    if (rows.length === 0) {
      return NextResponse.json({
        schedule: null,
        message: 'No sync schedule configured'
      })
    }

    return NextResponse.json({
      schedule: rows[0]
    })
  } catch (error) {
    console.error('GET /integrations/manageengine-servicedesk/sync-schedule error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create or update sync schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { space_id, schedule_type, schedule_config, is_active } = body

    if (!space_id || !schedule_type) {
      return NextResponse.json(
        { error: 'space_id and schedule_type are required' },
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

    // Calculate next run time based on schedule type
    let nextRunAt: Date | null = null
    if (schedule_type === 'interval' && schedule_config?.interval_minutes) {
      nextRunAt = new Date(Date.now() + schedule_config.interval_minutes * 60 * 1000)
    } else if (schedule_type === 'daily' && schedule_config?.time) {
      const [hours, minutes] = schedule_config.time.split(':').map(Number)
      nextRunAt = new Date()
      nextRunAt.setHours(hours, minutes, 0, 0)
      if (nextRunAt <= new Date()) {
        nextRunAt.setDate(nextRunAt.getDate() + 1)
      }
    } else if (schedule_type === 'hourly') {
      nextRunAt = new Date(Date.now() + 60 * 60 * 1000)
    }

    // Check if schedule exists
    const { rows: existing } = await query(
      `SELECT id FROM servicedesk_sync_schedules
       WHERE space_id = $1::uuid AND deleted_at IS NULL
       LIMIT 1`,
      [space_id]
    )

    if (existing.length > 0) {
      // Update existing
      await query(
        `UPDATE servicedesk_sync_schedules SET
         schedule_type = $1,
         schedule_config = $2::jsonb,
         is_active = $3,
         next_run_at = $4,
         updated_at = NOW()
         WHERE id = $5`,
        [
          schedule_type,
          JSON.stringify(schedule_config || {}),
          is_active !== false,
          nextRunAt,
          existing[0].id
        ]
      )
    } else {
      // Create new
      await query(
        `INSERT INTO servicedesk_sync_schedules
         (space_id, schedule_type, schedule_config, is_active, next_run_at, created_at, updated_at)
         VALUES ($1::uuid, $2, $3::jsonb, $4, $5, NOW(), NOW())`,
        [
          space_id,
          schedule_type,
          JSON.stringify(schedule_config || {}),
          is_active !== false,
          nextRunAt
        ]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sync schedule saved successfully',
      next_run_at: nextRunAt
    })
  } catch (error) {
    console.error('POST /integrations/manageengine-servicedesk/sync-schedule error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Execute scheduled sync (called by scheduler)
export async function PUT(request: NextRequest) {
  try {
    // Verify API key for scheduler
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key')
    const expectedApiKey = process.env.SCHEDULER_API_KEY || process.env.CRON_SECRET

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get all active schedules that are due
    const { rows: dueSchedules } = await query(
      `SELECT id, space_id, schedule_type, schedule_config
       FROM servicedesk_sync_schedules
       WHERE is_active = true
         AND deleted_at IS NULL
         AND (next_run_at IS NULL OR next_run_at <= NOW())
       ORDER BY next_run_at ASC NULLS LAST
       LIMIT 50`
    )

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        message: 'No sync schedules due to run',
        executed: 0
      })
    }

    const results = []

    for (const schedule of dueSchedules) {
      try {
        // Get all tickets with ServiceDesk request ID for this space
        const tickets = await db.ticket.findMany({
          where: {
            spaces: {
              some: {
                spaceId: schedule.space_id
              }
            },
            metadata: {
              path: ['serviceDeskRequestId'],
              not: Prisma.DbNull
            }
          }
        })

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
          [schedule.space_id]
        )

        if (configRows.length === 0) {
          continue
        }

        const config = configRows[0]
        const secretsManager = getSecretsManager()
        const useVault = secretsManager.getBackend() === 'vault'
        
        let apiKey: string | null
        if (useVault && config.api_auth_apikey_value?.startsWith('vault://')) {
          const vaultPath = config.api_auth_apikey_value.replace('vault://', '')
          const connectionId = vaultPath.split('/')[0]
          const creds = await secretsManager.getSecret(`servicedesk-integrations/${connectionId}/credentials`)
          apiKey = creds?.apiKey || ''
        } else {
          apiKey = decryptApiKey(config.api_auth_apikey_value)
        }

        if (!apiKey) {
          continue
        }

        const service = new ManageEngineServiceDeskService({
          baseUrl: config.api_url,
          apiKey
        })

        let syncedCount = 0
        let errorCount = 0

        // Sync each ticket
        for (const ticket of tickets) {
          try {
            const metadata = ticket.metadata as any
            const requestId = metadata?.serviceDeskRequestId

            if (!requestId) continue

            // Get ticket from ServiceDesk
            const ticketResult = await service.getTicket(requestId)
            if (!ticketResult.success) {
              errorCount++
              continue
            }

            const serviceDeskTicket = ticketResult.data?.request || ticketResult.data?.requests?.[0]
            if (!serviceDeskTicket) {
              errorCount++
              continue
            }

            // Map and update (similar to sync endpoint)
            const statusMap: Record<string, string> = {
              'Open': 'BACKLOG',
              'In Progress': 'IN_PROGRESS',
              'Resolved': 'DONE',
              'Closed': 'CLOSED'
            }

            const priorityMap: Record<string, string> = {
              'Low': 'LOW',
              'Medium': 'MEDIUM',
              'High': 'HIGH',
              'Critical': 'URGENT'
            }

            const updateData: any = {}
            
            if (serviceDeskTicket.subject && serviceDeskTicket.subject !== ticket.title) {
              updateData.title = serviceDeskTicket.subject
            }
            
            if (serviceDeskTicket.status?.name) {
              const mappedStatus = statusMap[serviceDeskTicket.status.name] || ticket.status
              if (mappedStatus !== ticket.status) {
                updateData.status = mappedStatus
              }
            }
            
            if (serviceDeskTicket.priority?.name) {
              const mappedPriority = priorityMap[serviceDeskTicket.priority.name] || ticket.priority
              if (mappedPriority !== ticket.priority) {
                updateData.priority = mappedPriority
              }
            }

            if (Object.keys(updateData).length > 0) {
              await db.ticket.update({
                where: { id: ticket.id },
                data: updateData
              })
              syncedCount++
            }
          } catch (error) {
            console.error(`Error syncing ticket ${ticket.id}:`, error)
            errorCount++
          }
        }

        // Update next run time
        let nextRunAt: Date | null = null
        if (schedule.schedule_type === 'interval' && schedule.schedule_config?.interval_minutes) {
          nextRunAt = new Date(Date.now() + schedule.schedule_config.interval_minutes * 60 * 1000)
        } else if (schedule.schedule_type === 'hourly') {
          nextRunAt = new Date(Date.now() + 60 * 60 * 1000)
        } else if (schedule.schedule_type === 'daily' && schedule.schedule_config?.time) {
          const [hours, minutes] = schedule.schedule_config.time.split(':').map(Number)
          nextRunAt = new Date()
          nextRunAt.setHours(hours, minutes, 0, 0)
          if (nextRunAt <= new Date()) {
            nextRunAt.setDate(nextRunAt.getDate() + 1)
          }
        }

        await query(
          `UPDATE servicedesk_sync_schedules SET
           last_run_at = NOW(),
           next_run_at = $1,
           last_run_status = $2,
           updated_at = NOW()
           WHERE id = $3`,
          [nextRunAt, 'success', schedule.id]
        )

        results.push({
          schedule_id: schedule.id,
          space_id: schedule.space_id,
          synced: syncedCount,
          errors: errorCount,
          total: tickets.length
        })
      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error)
        await query(
          `UPDATE servicedesk_sync_schedules SET
           last_run_at = NOW(),
           last_run_status = $1,
           updated_at = NOW()
           WHERE id = $2`,
          ['error', schedule.id]
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${dueSchedules.length} sync schedules`,
      results
    })
  } catch (error) {
    console.error('PUT /integrations/manageengine-servicedesk/sync-schedule error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

