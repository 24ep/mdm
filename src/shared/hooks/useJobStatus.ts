import { useState, useEffect, useRef } from 'react'

export interface JobStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  progress: number
  error?: string
  result?: any
  updatedAt?: string
}

export interface UseJobStatusOptions {
  pollInterval?: number // Polling interval in milliseconds (default: 2000)
  useSSE?: boolean // Use Server-Sent Events for real-time updates (default: true)
  onStatusChange?: (status: JobStatus) => void
  onComplete?: (result: any) => void
  onError?: (error: string) => void
}

/**
 * Hook for tracking job status with real-time updates
 * 
 * @example
 * ```tsx
 * const { status, progress, error, isLoading } = useJobStatus(jobId, {
 *   onComplete: (result) => {
 *     console.log('Job completed!', result)
 *   }
 * })
 * ```
 */
export function useJobStatus(
  jobId: string | null,
  options: UseJobStatusOptions = {}
) {
  const {
    pollInterval = 2000,
    useSSE = true,
    onStatusChange,
    onComplete,
    onError,
  } = options

  const [status, setStatus] = useState<JobStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastStatusRef = useRef<string | null>(null)

  // Fetch job status
  const fetchStatus = async () => {
    if (!jobId) return

    try {
      const response = await fetch(`/api/import-export/jobs/${jobId}/status`)
      if (!response.ok) {
        throw new Error('Failed to fetch job status')
      }

      const data = await response.json()
      const jobStatus: JobStatus = {
        status: data.status,
        progress: data.progress || 0,
        error: data.errorMessage,
        result: data.result,
        updatedAt: data.updatedAt,
      }

      setStatus(jobStatus)
      setIsLoading(false)
      setError(null)

      // Call callbacks
      const statusKey = `${jobStatus.status}-${jobStatus.progress}`
      if (statusKey !== lastStatusRef.current) {
        lastStatusRef.current = statusKey
        onStatusChange?.(jobStatus)

        if (jobStatus.status === 'COMPLETED') {
          onComplete?.(jobStatus.result)
        } else if (jobStatus.status === 'FAILED') {
          onError?.(jobStatus.error || 'Job failed')
        }
      }

      // Stop polling if job is done
      if (
        jobStatus.status === 'COMPLETED' ||
        jobStatus.status === 'FAILED' ||
        jobStatus.status === 'CANCELLED'
      ) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setIsLoading(false)
      onError?.(errorMessage)
    }
  }

  // Setup SSE connection
  useEffect(() => {
    if (!jobId || !useSSE) return

    try {
      const eventSource = new EventSource(
        `/api/import-export/jobs/ws?jobId=${jobId}`
      )

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'status_update') {
            const jobStatus: JobStatus = {
              status: message.status,
              progress: message.progress || 0,
              error: message.error,
              result: message.result,
              updatedAt: message.updatedAt,
            }

            setStatus(jobStatus)
            setIsLoading(false)
            setError(null)

            // Call callbacks
            const statusKey = `${jobStatus.status}-${jobStatus.progress}`
            if (statusKey !== lastStatusRef.current) {
              lastStatusRef.current = statusKey
              onStatusChange?.(jobStatus)

              if (jobStatus.status === 'COMPLETED') {
                onComplete?.(jobStatus.result)
              } else if (jobStatus.status === 'FAILED') {
                onError?.(jobStatus.error || 'Job failed')
              }
            }
          } else if (message.type === 'error') {
            setError(message.message)
            setIsLoading(false)
            onError?.(message.message)
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('SSE error:', err)
        eventSource.close()
        // Fallback to polling
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(fetchStatus, pollInterval)
        }
      }

      eventSourceRef.current = eventSource

      return () => {
        eventSource.close()
        eventSourceRef.current = null
      }
    } catch (err) {
      console.error('Error setting up SSE:', err)
      // Fallback to polling
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(fetchStatus, pollInterval)
      }
    }
  }, [jobId, useSSE])

  // Setup polling fallback
  useEffect(() => {
    if (!jobId || useSSE) return

    // Initial fetch
    fetchStatus()

    // Setup polling
    pollIntervalRef.current = setInterval(fetchStatus, pollInterval)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [jobId, pollInterval, useSSE])

  // Cleanup
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  return {
    status: status?.status || null,
    progress: status?.progress || 0,
    error: error || status?.error || null,
    result: status?.result || null,
    isLoading,
    isCompleted: status?.status === 'COMPLETED',
    isFailed: status?.status === 'FAILED',
    isProcessing: status?.status === 'PROCESSING',
  }
}

