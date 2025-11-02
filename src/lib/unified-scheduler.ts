/**
 * Unified Scheduler
 * 
 * Shared utilities for scheduling across workflows, notebooks, and data syncs
 */

export interface UnifiedSchedule {
  id: string
  type: 'workflow' | 'notebook' | 'data_sync'
  name: string
  schedule_type: string
  schedule_config: any
  timezone: string
  enabled: boolean
  next_run_at: Date | null
  last_run_at: Date | null
  status: string
}

export interface ScheduleTypeMapping {
  workflow: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_CRON'
  notebook: 'once' | 'daily' | 'weekly' | 'monthly' | 'interval' | 'cron'
  data_sync: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM_CRON' | 'MANUAL'
}

/**
 * Normalize schedule type across different systems
 */
export function normalizeScheduleType(
  type: string,
  system: 'workflow' | 'notebook' | 'data_sync'
): string {
  const mapping: Record<string, Record<string, string>> = {
    workflow: {
      'once': 'ONCE',
      'daily': 'DAILY',
      'weekly': 'WEEKLY',
      'monthly': 'MONTHLY',
      'cron': 'CUSTOM_CRON'
    },
    notebook: {
      'ONCE': 'once',
      'DAILY': 'daily',
      'WEEKLY': 'weekly',
      'MONTHLY': 'monthly',
      'CUSTOM_CRON': 'cron'
    },
    data_sync: {
      'once': 'MANUAL',
      'daily': 'DAILY',
      'weekly': 'WEEKLY',
      'monthly': 'HOURLY', // Approximate
      'cron': 'CUSTOM_CRON'
    }
  }

  return mapping[system]?.[type] || type
}

/**
 * Calculate next run time (unified across all systems)
 */
export function calculateUnifiedNextRunTime(
  scheduleType: string,
  scheduleConfig: any,
  timezone: string = 'UTC',
  lastRunAt?: Date | null
): Date | null {
  const now = new Date()
  let nextRun: Date

  // Normalize schedule type
  const normalizedType = scheduleType.toUpperCase()

  switch (normalizedType) {
    case 'ONCE':
      return null

    case 'HOURLY':
      nextRun = new Date(now)
      nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0)
      return nextRun

    case 'DAILY':
      const hour = scheduleConfig?.hour ?? scheduleConfig?.time?.hour ?? 9
      const minute = scheduleConfig?.minute ?? scheduleConfig?.time?.minute ?? 0
      nextRun = new Date(now)
      nextRun.setHours(hour, minute, 0, 0)
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      return nextRun

    case 'WEEKLY':
      const dayOfWeek = scheduleConfig?.dayOfWeek ?? scheduleConfig?.day ?? 1
      const weekHour = scheduleConfig?.hour ?? scheduleConfig?.time?.hour ?? 9
      const weekMinute = scheduleConfig?.minute ?? scheduleConfig?.time?.minute ?? 0
      nextRun = new Date(now)
      const currentDay = nextRun.getDay()
      const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7 || 7
      nextRun.setDate(nextRun.getDate() + daysUntilTarget)
      nextRun.setHours(weekHour, weekMinute, 0, 0)
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7)
      }
      return nextRun

    case 'MONTHLY':
      const dayOfMonth = scheduleConfig?.dayOfMonth ?? scheduleConfig?.day ?? 1
      const monthHour = scheduleConfig?.hour ?? scheduleConfig?.time?.hour ?? 9
      const monthMinute = scheduleConfig?.minute ?? scheduleConfig?.time?.minute ?? 0
      nextRun = new Date(now)
      nextRun.setDate(dayOfMonth)
      nextRun.setHours(monthHour, monthMinute, 0, 0)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
        nextRun.setDate(dayOfMonth)
      }
      return nextRun

    case 'INTERVAL':
      const value = scheduleConfig?.value ?? scheduleConfig?.interval ?? 60
      const unit = scheduleConfig?.unit ?? 'minutes'
      nextRun = new Date(now)
      if (unit === 'hours') {
        nextRun.setHours(nextRun.getHours() + value)
      } else {
        nextRun.setMinutes(nextRun.getMinutes() + value)
      }
      return nextRun

    case 'CUSTOM_CRON':
    case 'CRON':
      // Cron parsing requires external library
      // Placeholder - returns null for now
      return null

    default:
      return null
  }
}

/**
 * Get all schedules across all systems
 */
export async function getAllSchedules(
  spaceId?: string
): Promise<UnifiedSchedule[]> {
  const { query } = await import('@/lib/db')
  const schedules: UnifiedSchedule[] = []

  // Get workflow schedules
  const { rows: workflowSchedules } = await query(
    `SELECT 
      ws.id,
      'workflow' as type,
      w.name,
      ws.schedule_type,
      ws.schedule_config,
      ws.timezone,
      ws.is_active as enabled,
      ws.next_run_at,
      ws.last_run_at,
      CASE WHEN ws.is_active THEN 'active' ELSE 'paused' END as status
     FROM public.workflow_schedules ws
     JOIN public.workflows w ON ws.workflow_id = w.id
     ${spaceId ? 'WHERE w.space_id = $1' : ''}`,
    spaceId ? [spaceId] : []
  )

  schedules.push(...workflowSchedules.map((ws: any) => ({
    id: ws.id,
    type: 'workflow' as const,
    name: ws.name,
    schedule_type: ws.schedule_type,
    schedule_config: typeof ws.schedule_config === 'string' 
      ? JSON.parse(ws.schedule_config) 
      : ws.schedule_config,
    timezone: ws.timezone || 'UTC',
    enabled: ws.enabled,
    next_run_at: ws.next_run_at ? new Date(ws.next_run_at) : null,
    last_run_at: ws.last_run_at ? new Date(ws.last_run_at) : null,
    status: ws.status
  })))

  // Get notebook schedules
  const { rows: notebookSchedules } = await query(
    `SELECT 
      id,
      'notebook' as type,
      name,
      schedule_type,
      schedule_config,
      timezone,
      enabled,
      next_run_at,
      last_run_at,
      status::text
     FROM public.notebook_schedules
     ${spaceId ? 'WHERE space_id = $1' : ''}`,
    spaceId ? [spaceId] : []
  )

  schedules.push(...notebookSchedules.map((ns: any) => ({
    id: ns.id,
    type: 'notebook' as const,
    name: ns.name,
    schedule_type: ns.schedule_type,
    schedule_config: typeof ns.schedule_config === 'string' 
      ? JSON.parse(ns.schedule_config) 
      : ns.schedule_config,
    timezone: ns.timezone || 'UTC',
    enabled: ns.enabled,
    next_run_at: ns.next_run_at ? new Date(ns.next_run_at) : null,
    last_run_at: ns.last_run_at ? new Date(ns.last_run_at) : null,
    status: ns.status
  })))

  // Get data sync schedules
  const { rows: syncSchedules } = await query(
    `SELECT 
      id,
      'data_sync' as type,
      name,
      schedule_type,
      schedule_config,
      'UTC' as timezone,
      is_active as enabled,
      next_run_at,
      last_run_at,
      CASE WHEN is_active THEN 'active' ELSE 'paused' END as status
     FROM public.data_sync_schedules
     WHERE deleted_at IS NULL
     ${spaceId ? 'AND space_id = $1' : ''}`,
    spaceId ? [spaceId] : []
  )

  schedules.push(...syncSchedules.map((ds: any) => ({
    id: ds.id,
    type: 'data_sync' as const,
    name: ds.name,
    schedule_type: ds.schedule_type,
    schedule_config: typeof ds.schedule_config === 'string' 
      ? JSON.parse(ds.schedule_config) 
      : ds.schedule_config,
    timezone: ds.timezone || 'UTC',
    enabled: ds.enabled,
    next_run_at: ds.next_run_at ? new Date(ds.next_run_at) : null,
    last_run_at: ds.last_run_at ? new Date(ds.last_run_at) : null,
    status: ds.status
  })))

  return schedules.sort((a, b) => {
    if (!a.next_run_at && !b.next_run_at) return 0
    if (!a.next_run_at) return 1
    if (!b.next_run_at) return -1
    return a.next_run_at.getTime() - b.next_run_at.getTime()
  })
}

