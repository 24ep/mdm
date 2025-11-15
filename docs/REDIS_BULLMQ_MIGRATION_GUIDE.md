# Redis/BullMQ Migration Guide

## Overview

This guide explains how to migrate from the in-memory job queue to Redis/BullMQ for distributed job processing. This is recommended when:
- Running multiple server instances
- Need job persistence across server restarts
- Require job retry logic
- Need job prioritization
- Want job scheduling capabilities

## Current Implementation

The current system uses an in-memory job queue (`src/shared/lib/jobs/job-queue.ts`):
- ✅ Simple and works for single-instance deployments
- ✅ No external dependencies
- ❌ Jobs lost on server restart
- ❌ Not suitable for distributed deployments
- ❌ Limited retry logic

## Migration Steps

### 1. Install Dependencies

```bash
npm install bullmq ioredis
npm install --save-dev @types/ioredis
```

### 2. Update Environment Variables

Add to `.env.local`:

```env
REDIS_URL=redis://localhost:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

### 3. Create Redis Connection

Create `src/lib/redis-queue.ts`:

```typescript
import { Redis } from 'ioredis'

let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL
    
    if (redisUrl) {
      redisClient = new Redis(redisUrl)
    } else {
      const host = process.env.REDIS_HOST || 'localhost'
      const port = parseInt(process.env.REDIS_PORT || '6379')
      const password = process.env.REDIS_PASSWORD
      
      redisClient = new Redis({
        host,
        port,
        password,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            return null // Stop retrying
          }
          return Math.min(times * 50, 2000)
        },
      })
    }

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    redisClient.on('connect', () => {
      console.log('Redis connected')
    })
  }

  return redisClient
}
```

### 4. Create BullMQ Queue

Create `src/shared/lib/jobs/bullmq-queue.ts`:

```typescript
import { Queue, Worker, Job as BullJob } from 'bullmq'
import { getRedisClient } from '@/lib/redis-queue'
import { processImportJob } from './import-worker'
import { processExportJob } from './export-worker'
import { Job } from './job-queue'

// Queue names
export const IMPORT_QUEUE_NAME = 'import-jobs'
export const EXPORT_QUEUE_NAME = 'export-jobs'

// Create queues
export const importQueue = new Queue(IMPORT_QUEUE_NAME, {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
})

export const exportQueue = new Queue(EXPORT_QUEUE_NAME, {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
})

// Create workers (only on server)
if (typeof window === 'undefined') {
  const importWorker = new Worker(
    IMPORT_QUEUE_NAME,
    async (job: BullJob<Job>) => {
      await processImportJob(job.data)
    },
    {
      connection: getRedisClient(),
      concurrency: 5, // Process 5 jobs concurrently
    }
  )

  const exportWorker = new Worker(
    EXPORT_QUEUE_NAME,
    async (job: BullJob<Job>) => {
      await processExportJob(job.data)
    },
    {
      connection: getRedisClient(),
      concurrency: 5,
    }
  )

  // Worker event handlers
  importWorker.on('completed', (job) => {
    console.log(`Import job ${job.id} completed`)
  })

  importWorker.on('failed', (job, err) => {
    console.error(`Import job ${job?.id} failed:`, err)
  })

  exportWorker.on('completed', (job) => {
    console.log(`Export job ${job.id} completed`)
  })

  exportWorker.on('failed', (job, err) => {
    console.error(`Export job ${job?.id} failed:`, err)
  })
}

// Helper functions
export async function addImportJob(job: Job) {
  return await importQueue.add('import', job, {
    jobId: job.id,
  })
}

export async function addExportJob(job: Job) {
  return await exportQueue.add('export', job, {
    jobId: job.id,
  })
}

export async function getJobStatus(jobId: string, type: 'import' | 'export') {
  const queue = type === 'import' ? importQueue : exportQueue
  const job = await queue.getJob(jobId)
  
  if (!job) {
    return null
  }

  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress || 0,
    data: job.data,
    result: job.returnvalue,
    error: job.failedReason,
  }
}

export async function cancelJob(jobId: string, type: 'import' | 'export') {
  const queue = type === 'import' ? importQueue : exportQueue
  const job = await queue.getJob(jobId)
  
  if (job) {
    await job.remove()
  }
}
```

### 5. Update Job Queue Interface

Update `src/shared/lib/jobs/job-queue.ts` to support both implementations:

```typescript
import { addImportJob, addExportJob, getJobStatus, cancelJob } from './bullmq-queue'

// Feature flag to switch between implementations
const USE_BULLMQ = process.env.USE_BULLMQ === 'true'

export class JobQueue {
  // ... existing in-memory implementation ...

  async add(job: Job): Promise<void> {
    if (USE_BULLMQ) {
      if (job.type === 'import') {
        await addImportJob(job)
      } else {
        await addExportJob(job)
      }
    } else {
      // Existing in-memory implementation
      this.queue.set(job.id, job)
      this.processNext()
    }
  }

  async getJobStatus(jobId: string, type: 'import' | 'export'): Promise<Job | undefined> {
    if (USE_BULLMQ) {
      return await getJobStatus(jobId, type)
    } else {
      return this.queue.get(jobId)
    }
  }

  async cancel(jobId: string, type: 'import' | 'export'): Promise<void> {
    if (USE_BULLMQ) {
      await cancelJob(jobId, type)
    } else {
      // Existing implementation
      const job = this.queue.get(jobId)
      if (job && job.status === 'PENDING') {
        await this.updateJob(jobId, { status: 'CANCELLED' })
        this.queue.delete(jobId)
      }
    }
  }
}
```

### 6. Update API Routes

Update `src/app/api/import-export/import/route.ts`:

```typescript
// ... existing code ...

// Queue job for processing
if (process.env.USE_BULLMQ === 'true') {
  const { addImportJob } = await import('@/shared/lib/jobs/bullmq-queue')
  await addImportJob({
    id: importJob.id,
    type: 'import',
    status: 'PENDING',
    progress: 0,
  })
} else {
  const { jobQueue } = await import('@/shared/lib/jobs/job-queue')
  await jobQueue.add({
    id: importJob.id,
    type: 'import',
    status: 'PENDING',
    progress: 0,
  })
}
```

### 7. Update Cron Endpoint

Update `src/app/api/import-export/jobs/cron/route.ts`:

```typescript
// BullMQ doesn't need cron - it processes jobs automatically
// But we can still use this endpoint to trigger processing of stuck jobs

if (process.env.USE_BULLMQ === 'true') {
  // BullMQ processes jobs automatically via workers
  // This endpoint can be used for health checks or manual triggers
  return NextResponse.json({
    success: true,
    message: 'BullMQ is processing jobs automatically',
    note: 'No manual processing needed',
  })
} else {
  // Existing in-memory processing
  const processed = await jobQueue.processPendingJobs()
  // ...
}
```

## Benefits of BullMQ

1. **Distributed Processing**: Multiple workers can process jobs
2. **Job Persistence**: Jobs survive server restarts
3. **Retry Logic**: Automatic retries with exponential backoff
4. **Job Prioritization**: Set job priorities
5. **Job Scheduling**: Schedule jobs for future execution
6. **Job Progress**: Real-time progress tracking
7. **Job Events**: Listen to job lifecycle events
8. **Job Delays**: Delay job execution
9. **Rate Limiting**: Limit job processing rate
10. **Job Batching**: Process multiple jobs together

## Monitoring

### BullMQ Dashboard

Install `@bull-board/api` and `@bull-board/express`:

```bash
npm install @bull-board/api @bull-board/express
```

Create `src/app/api/admin/queues/route.ts`:

```typescript
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { importQueue, exportQueue } from '@/shared/lib/jobs/bullmq-queue'

const { router } = createBullBoard([
  new BullMQAdapter(importQueue),
  new BullMQAdapter(exportQueue),
])

export { router as GET, router as POST }
```

## Testing

### Local Redis Setup

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
# macOS: brew install redis
# Ubuntu: apt-get install redis-server
```

### Test Connection

```typescript
import { getRedisClient } from '@/lib/redis-queue'

const client = getRedisClient()
await client.ping() // Should return 'PONG'
```

## Migration Checklist

- [ ] Install BullMQ and ioredis
- [ ] Set up Redis instance
- [ ] Create BullMQ queue implementation
- [ ] Update job queue to support both implementations
- [ ] Update API routes to use BullMQ
- [ ] Test job processing
- [ ] Set `USE_BULLMQ=true` environment variable
- [ ] Monitor job processing
- [ ] Set up BullMQ dashboard (optional)
- [ ] Remove in-memory implementation (optional)

## Rollback Plan

If issues occur:
1. Set `USE_BULLMQ=false` or remove the environment variable
2. System will fall back to in-memory queue
3. Fix issues and try again

## Performance Considerations

- **Concurrency**: Adjust worker concurrency based on server capacity
- **Redis Memory**: Monitor Redis memory usage
- **Job Cleanup**: Configure `removeOnComplete` and `removeOnFail` appropriately
- **Connection Pooling**: Redis connection pooling is handled by ioredis

---

**Last Updated**: 2025-01-XX

