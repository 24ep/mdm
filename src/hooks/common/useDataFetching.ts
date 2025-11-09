/**
 * Data Fetching Hook
 * Reusable hook for fetching data with loading and error states
 */

import { useState, useEffect, useCallback } from 'react'

export interface UseDataFetchingOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useDataFetching<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseDataFetchingOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetchFn()
      setData(result)
      onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchFn, onSuccess, onError])

  useEffect(() => {
    if (immediate) {
      let cancelled = false
      
      const execute = async () => {
        try {
          const result = await fetchFn()
          if (!cancelled) {
            setData(result)
            setLoading(false)
            onSuccess?.(result)
          }
        } catch (err) {
          if (!cancelled) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            setLoading(false)
            onError?.(error)
          }
        }
      }
      
      execute()
      
      return () => {
        cancelled = true
      }
    }
  }, dependencies)

  return { data, loading, error, refetch: fetchData }
}

