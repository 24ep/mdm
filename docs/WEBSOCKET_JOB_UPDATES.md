# WebSocket/SSE Job Status Updates

## Overview

The system provides real-time job status updates using Server-Sent Events (SSE) for Next.js App Router compatibility. This allows clients to receive live updates as jobs progress.

## Endpoint

**URL**: `/api/import-export/jobs/ws?jobId={jobId}`  
**Method**: `GET`  
**Protocol**: Server-Sent Events (SSE)

## Usage

### React Hook

Use the `useJobStatus` hook for easy integration:

```tsx
import { useJobStatus } from '@/shared/hooks/useJobStatus'

function JobStatusComponent({ jobId }: { jobId: string }) {
  const {
    status,
    progress,
    error,
    isLoading,
    isCompleted,
    isFailed,
    isProcessing,
  } = useJobStatus(jobId, {
    useSSE: true, // Use Server-Sent Events (default)
    pollInterval: 2000, // Fallback polling interval
    onStatusChange: (status) => {
      console.log('Status changed:', status)
    },
    onComplete: (result) => {
      console.log('Job completed!', result)
      // Handle completion (e.g., show success message, download file)
    },
    onError: (error) => {
      console.error('Job failed:', error)
      // Handle error (e.g., show error message)
    },
  })

  if (isLoading) {
    return <div>Loading job status...</div>
  }

  return (
    <div>
      <div>Status: {status}</div>
      <div>Progress: {progress}%</div>
      {error && <div>Error: {error}</div>}
      {isCompleted && <div>Job completed successfully!</div>}
      {isProcessing && <div>Processing... {progress}%</div>}
    </div>
  )
}
```

### Direct SSE Connection

For non-React usage:

```typescript
const eventSource = new EventSource(`/api/import-export/jobs/ws?jobId=${jobId}`)

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  if (message.type === 'status_update') {
    console.log('Status:', message.status)
    console.log('Progress:', message.progress)
    console.log('Result:', message.result)
  } else if (message.type === 'error') {
    console.error('Error:', message.message)
  }
}

eventSource.onerror = (error) => {
  console.error('SSE error:', error)
  eventSource.close()
}

// Cleanup
eventSource.close()
```

## Message Types

### Connected

```json
{
  "type": "connected",
  "jobId": "uuid"
}
```

### Status Update

```json
{
  "type": "status_update",
  "jobId": "uuid",
  "status": "PROCESSING",
  "progress": 50,
  "error": null,
  "result": null,
  "updatedAt": "2025-01-XXT12:00:00.000Z"
}
```

### Error

```json
{
  "type": "error",
  "message": "Job not found"
}
```

## Status Values

- `PENDING` - Job is queued, waiting to be processed
- `PROCESSING` - Job is currently being processed
- `COMPLETED` - Job completed successfully
- `FAILED` - Job failed with an error
- `CANCELLED` - Job was cancelled

## Polling Fallback

If SSE is not available or fails, the hook automatically falls back to polling:

```tsx
const { status, progress } = useJobStatus(jobId, {
  useSSE: false, // Disable SSE, use polling only
  pollInterval: 5000, // Poll every 5 seconds
})
```

## Example: Import Job with Progress

```tsx
import { useState } from 'react'
import { useJobStatus } from '@/shared/hooks/useJobStatus'

function ImportJobProgress({ jobId }: { jobId: string }) {
  const { progress, status, error, isCompleted, result } = useJobStatus(jobId, {
    onComplete: (result) => {
      console.log('Import completed!', result)
      // Show success notification
      // Navigate to results page
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Status: {status}</span>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">Error: {error}</div>
      )}

      {isCompleted && result && (
        <div className="text-green-600 text-sm">
          Imported {result.importedCount} rows
          {result.skippedCount > 0 && `, skipped ${result.skippedCount}`}
        </div>
      )}
    </div>
  )
}
```

## Example: Export Job with Download

```tsx
import { useJobStatus } from '@/shared/hooks/useJobStatus'

function ExportJobProgress({ jobId }: { jobId: string }) {
  const { progress, status, isCompleted, result } = useJobStatus(jobId, {
    onComplete: (result) => {
      // Auto-download file when completed
      if (result?.fileUrl) {
        window.open(result.fileUrl, '_blank')
      }
    },
  })

  return (
    <div>
      <div>Exporting... {progress}%</div>
      {isCompleted && result?.fileUrl && (
        <a
          href={result.fileUrl}
          download={result.fileName}
          className="btn btn-primary"
        >
          Download {result.fileName}
        </a>
      )}
    </div>
  )
}
```

## Browser Compatibility

SSE is supported in all modern browsers:
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅

For older browsers, the hook automatically falls back to polling.

## Performance

- **SSE**: Single persistent connection, efficient for real-time updates
- **Polling**: Multiple HTTP requests, less efficient but more compatible
- **Recommended**: Use SSE when possible, fallback to polling if needed

## Troubleshooting

### Connection Issues

1. **Check browser console** for SSE errors
2. **Verify endpoint URL** is correct
3. **Check network tab** for connection status
4. **Try polling fallback** if SSE fails

### No Updates Received

1. **Verify job ID** is correct
2. **Check job exists** in database
3. **Verify job is processing** (not stuck in PENDING)
4. **Check server logs** for errors

### High CPU Usage

1. **Reduce poll interval** if using polling
2. **Use SSE** instead of polling
3. **Close connections** when component unmounts

---

**Last Updated**: 2025-01-XX

