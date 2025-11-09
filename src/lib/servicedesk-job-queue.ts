import { query } from './db'

export interface ServiceDeskJob {
  id: string
  spaceId: string
  userId: string
  jobType: 'bulk_push' | 'bulk_sync' | 'bulk_update' | 'bulk_delete'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  payload: {
    ticketIds?: string[]
    filters?: Record<string, any>
    options?: Record<string, any>
  }
  progress: {
    total: number
    completed: number
    failed: number
    errors?: Array<{ ticketId: string; error: string }>
  }
  result?: {
    successCount: number
    failureCount: number
    requestIds?: string[]
  }
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  errorMessage?: string
}

/**
 * Create a new ServiceDesk job
 */
export async function createServiceDeskJob(
  spaceId: string,
  userId: string,
  jobType: ServiceDeskJob['jobType'],
  payload: ServiceDeskJob['payload']
): Promise<string> {
  const { rows } = await query(
    `INSERT INTO servicedesk_jobs 
     (space_id, user_id, job_type, status, payload, progress, created_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, NOW())
     RETURNING id`,
    [
      spaceId,
      userId,
      jobType,
      'pending',
      JSON.stringify(payload),
      JSON.stringify({
        total: payload.ticketIds?.length || 0,
        completed: 0,
        failed: 0
      })
    ]
  )

  return rows[0].id
}

/**
 * Get a job by ID
 */
export async function getServiceDeskJob(jobId: string): Promise<ServiceDeskJob | null> {
  const { rows } = await query(
    `SELECT id, space_id, user_id, job_type, status, payload, progress, result, 
            created_at, started_at, completed_at, error_message
     FROM servicedesk_jobs
     WHERE id = $1::uuid`,
    [jobId]
  )

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    id: row.id,
    spaceId: row.space_id,
    userId: row.user_id,
    jobType: row.job_type,
    status: row.status,
    payload: row.payload,
    progress: row.progress,
    result: row.result,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message
  }
}

/**
 * Update job status
 */
export async function updateServiceDeskJob(
  jobId: string,
  updates: {
    status?: ServiceDeskJob['status']
    progress?: Partial<ServiceDeskJob['progress']>
    result?: ServiceDeskJob['result']
    errorMessage?: string
  }
): Promise<void> {
  const updateFields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.status) {
    updateFields.push(`status = $${paramIndex}`)
    values.push(updates.status)
    paramIndex++

    if (updates.status === 'processing' && !updates.startedAt) {
      updateFields.push(`started_at = NOW()`)
    } else if (updates.status === 'completed' || updates.status === 'failed') {
      updateFields.push(`completed_at = NOW()`)
    }
  }

  if (updates.progress) {
    updateFields.push(`progress = $${paramIndex}`)
    values.push(JSON.stringify(updates.progress))
    paramIndex++
  }

  if (updates.result) {
    updateFields.push(`result = $${paramIndex}`)
    values.push(JSON.stringify(updates.result))
    paramIndex++
  }

  if (updates.errorMessage) {
    updateFields.push(`error_message = $${paramIndex}`)
    values.push(updates.errorMessage)
    paramIndex++
  }

  if (updateFields.length === 0) return

  updateFields.push(`updated_at = NOW()`)
  values.push(jobId)

  await query(
    `UPDATE servicedesk_jobs 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex}::uuid`,
    values
  )
}

/**
 * Get pending jobs for processing
 */
export async function getPendingServiceDeskJobs(limit: number = 10): Promise<ServiceDeskJob[]> {
  const { rows } = await query(
    `SELECT id, space_id, user_id, job_type, status, payload, progress, result,
            created_at, started_at, completed_at, error_message
     FROM servicedesk_jobs
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit]
  )

  return rows.map(row => ({
    id: row.id,
    spaceId: row.space_id,
    userId: row.user_id,
    jobType: row.job_type,
    status: row.status,
    payload: row.payload,
    progress: row.progress,
    result: row.result,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message
  }))
}

/**
 * Get jobs for a user/space
 */
export async function getServiceDeskJobs(
  spaceId: string,
  userId?: string,
  limit: number = 50
): Promise<ServiceDeskJob[]> {
  let queryStr = `
    SELECT id, space_id, user_id, job_type, status, payload, progress, result,
           created_at, started_at, completed_at, error_message
    FROM servicedesk_jobs
    WHERE space_id = $1::uuid
  `
  const values: any[] = [spaceId]
  let paramIndex = 2

  if (userId) {
    queryStr += ` AND user_id = $${paramIndex}::uuid`
    values.push(userId)
    paramIndex++
  }

  queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex}`
  values.push(limit)

  const { rows } = await query(queryStr, values)

  return rows.map(row => ({
    id: row.id,
    spaceId: row.space_id,
    userId: row.user_id,
    jobType: row.job_type,
    status: row.status,
    payload: row.payload,
    progress: row.progress,
    result: row.result,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message
  }))
}

