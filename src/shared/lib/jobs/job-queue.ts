import { query } from '@/lib/db'

export type JobType = 'import' | 'export'
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  progress: number
  data?: any
  error?: string
  result?: any
}

/**
 * Simple in-memory job queue
 * In production, use Redis/BullMQ for distributed job processing
 */
class JobQueue {
  private queue: Map<string, Job> = new Map()
  private processing: Set<string> = new Set()
  private workers: Map<JobType, (job: Job) => Promise<void>> = new Map()

  /**
   * Register a worker function for a job type
   */
  registerWorker(type: JobType, worker: (job: Job) => Promise<void>) {
    this.workers.set(type, worker)
  }

  /**
   * Add a job to the queue
   */
  async add(job: Job): Promise<void> {
    this.queue.set(job.id, job)
    // Start processing if not already processing
    this.processNext()
  }

  /**
   * Get job status
   */
  getJob(jobId: string): Job | undefined {
    return this.queue.get(jobId)
  }

  /**
   * Update job status
   */
  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    const job = this.queue.get(jobId)
    if (job) {
      Object.assign(job, updates)
      this.queue.set(jobId, job)

      // Update database
      if (job.type === 'import') {
        await query(
          `UPDATE import_jobs 
           SET status = $1, progress = $2, processed_rows = $3, 
               total_rows = $4, error_message = $5, result = $6,
               started_at = CASE WHEN $1 = 'PROCESSING' AND started_at IS NULL THEN NOW() ELSE started_at END,
               completed_at = CASE WHEN $1 IN ('COMPLETED', 'FAILED', 'CANCELLED') THEN NOW() ELSE completed_at END,
               updated_at = NOW()
           WHERE id = $7`,
          [
            updates.status || job.status,
            updates.progress ?? job.progress,
            updates.data?.processedRows || 0,
            updates.data?.totalRows || null,
            updates.error || null,
            updates.result ? JSON.stringify(updates.result) : null,
            jobId,
          ]
        )
      } else if (job.type === 'export') {
        await query(
          `UPDATE export_jobs 
           SET status = $1, progress = $2, processed_rows = $3, 
               total_rows = $4, error_message = $5, file_url = $6,
               file_name = $7, file_size = $8,
               started_at = CASE WHEN $1 = 'PROCESSING' AND started_at IS NULL THEN NOW() ELSE started_at END,
               completed_at = CASE WHEN $1 IN ('COMPLETED', 'FAILED', 'CANCELLED') THEN NOW() ELSE completed_at END,
               updated_at = NOW()
           WHERE id = $9`,
          [
            updates.status || job.status,
            updates.progress ?? job.progress,
            updates.data?.processedRows || 0,
            updates.data?.totalRows || null,
            updates.error || null,
            updates.result?.fileUrl || null,
            updates.result?.fileName || null,
            updates.result?.fileSize || null,
            jobId,
          ]
        )
      }
    }
  }

  /**
   * Process next job in queue
   */
  private async processNext(): Promise<void> {
    // Find a pending job that's not being processed
    const pendingJob = Array.from(this.queue.values()).find(
      (job) => job.status === 'PENDING' && !this.processing.has(job.id)
    )

    if (!pendingJob) {
      return
    }

    const worker = this.workers.get(pendingJob.type)
    if (!worker) {
      console.warn(`No worker registered for job type: ${pendingJob.type}`)
      return
    }

    this.processing.add(pendingJob.id)
    this.updateJob(pendingJob.id, { status: 'PROCESSING' })

    // Process job asynchronously
    worker(pendingJob)
      .then(() => {
        this.processing.delete(pendingJob.id)
      })
      .catch((error) => {
        console.error(`Job ${pendingJob.id} failed:`, error)
        this.updateJob(pendingJob.id, {
          status: 'FAILED',
          error: error.message,
        })
        this.processing.delete(pendingJob.id)
        // Try to process next job
        this.processNext()
      })
  }

  /**
   * Cancel a job
   */
  async cancel(jobId: string): Promise<void> {
    const job = this.queue.get(jobId)
    if (job && job.status === 'PENDING') {
      await this.updateJob(jobId, { status: 'CANCELLED' })
      this.queue.delete(jobId)
    }
  }

  /**
   * Process all pending jobs (for cron job endpoint)
   */
  async processPendingJobs(): Promise<number> {
    const pendingJobs = Array.from(this.queue.values()).filter(
      (job) => job.status === 'PENDING' && !this.processing.has(job.id)
    )

    let processed = 0
    for (const job of pendingJobs.slice(0, 50)) {
      // Limit to 50 jobs per cron run
      this.processNext()
      processed++
    }

    return processed
  }
}

// Singleton instance
export const jobQueue = new JobQueue()

// Register workers on module load
if (typeof window === 'undefined') {
  // Only register workers on server side
  import('./import-worker').then(({ processImportJob }) => {
    jobQueue.registerWorker('import', processImportJob)
  })
  import('./export-worker').then(({ processExportJob }) => {
    jobQueue.registerWorker('export', processExportJob)
  })
}

