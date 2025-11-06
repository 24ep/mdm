'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseDataSourceOptions {
  dataSource: 'sample' | 'api' | 'database' | 'file' | 'manual' | 'data-model'
  apiUrl?: string
  apiMethod?: string
  apiHeaders?: string
  sqlQuery?: string
  dbConnection?: string
  dataModelId?: string
  spaceId?: string
  sampleData?: any[]
  autoRefresh?: boolean
  refreshInterval?: number
  limit?: number
}

interface UseDataSourceResult {
  data: any[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDataSource(options: UseDataSourceOptions): UseDataSourceResult {
  const {
    dataSource,
    apiUrl,
    apiMethod = 'GET',
    apiHeaders = '{}',
    sqlQuery,
    dbConnection,
    dataModelId,
    spaceId,
    sampleData = [],
    autoRefresh = false,
    refreshInterval = 30000,
    limit
  } = options

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use refs to track what's been loaded to prevent duplicate fetches
  const lastFetchRef = useRef<string>('')
  const loadingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const dataRef = useRef<any[]>([]) // Track data in ref to avoid dependency issues

  // Create a stable key for caching
  const getCacheKey = useCallback(() => {
    if (dataSource === 'sample') return 'sample'
    if (dataSource === 'data-model') return `data-model-${dataModelId}`
    if (dataSource === 'api') return `api-${apiUrl}`
    if (dataSource === 'database') return `db-${dbConnection}-${sqlQuery?.substring(0, 50)}`
    return dataSource
  }, [dataSource, dataModelId, apiUrl, dbConnection, sqlQuery])

  // Helper function to compare data arrays (deep equality check)
  // Must be defined before fetch functions that use it
  const dataEquals = useCallback((data1: any[], data2: any[]): boolean => {
    if (data1.length !== data2.length) return false
    if (data1.length === 0) return true
    
    // Fast path: compare JSON strings (good enough for most cases)
    try {
      const str1 = JSON.stringify(data1.sort((a, b) => (a.id || '').localeCompare(b.id || '')))
      const str2 = JSON.stringify(data2.sort((a, b) => (a.id || '').localeCompare(b.id || '')))
      return str1 === str2
    } catch {
      // Fallback: shallow comparison
      return data1.every((item, idx) => {
        const item2 = data2[idx]
        if (!item2) return false
        return item.id === item2.id && JSON.stringify(item) === JSON.stringify(item2)
      })
    }
  }, [])

  const fetchApiData = useCallback(async () => {
    if (!apiUrl) {
      setError('API URL is required')
      return
    }

    if (loadingRef.current) return // Prevent duplicate requests
    
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      let headers: Record<string, string> = {}
      
      // Parse headers JSON
      try {
        headers = apiHeaders ? JSON.parse(apiHeaders) : {}
      } catch (e) {
        setError('Invalid headers JSON format')
        setLoading(false)
        loadingRef.current = false
        return
      }

      const fetchOptions: RequestInit = {
        method: apiMethod,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      const response = await fetch(apiUrl, fetchOptions)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      // Handle different response formats
      let fetchedData = Array.isArray(result) 
        ? result 
        : result.data || result.results || result.items || []

      if (!Array.isArray(fetchedData)) {
        throw new Error('API response must be an array or contain a data/results/items array')
      }

      // Apply limit if specified
      if (limit && limit > 0 && fetchedData.length > limit) {
        fetchedData = fetchedData.slice(0, limit)
      }

      // Compare with existing data - only update UI if data changed
      const currentData = dataRef.current
      const hasChanged = !dataEquals(currentData, fetchedData)
      
      if (hasChanged) {
        console.log('✅ [useDataSource] API data changed, updating UI')
        setData(fetchedData)
        dataRef.current = fetchedData
      } else {
        console.log('⏸️ [useDataSource] API data unchanged, skipping UI update')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data from API'
      setError(errorMessage)
      console.error('API data fetch error:', err)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [apiUrl, apiMethod, apiHeaders, dataEquals, limit])

  const fetchDatabaseData = useCallback(async () => {
    if (!sqlQuery) {
      setError('SQL query is required')
      return
    }

    if (loadingRef.current) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/execute-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sqlQuery,
          connection: dbConnection || 'default'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Database query failed: ${response.status}`)
      }

      const result = await response.json()
      let fetchedData = Array.isArray(result.data) ? result.data : result.rows || []

      // Apply limit if specified
      if (limit && limit > 0 && fetchedData.length > limit) {
        fetchedData = fetchedData.slice(0, limit)
      }

      // Compare with existing data - only update UI if data changed
      const currentData = dataRef.current
      const hasChanged = !dataEquals(currentData, fetchedData)
      
      if (hasChanged) {
        console.log('✅ [useDataSource] Database data changed, updating UI')
        setData(fetchedData)
        dataRef.current = fetchedData
      } else {
        console.log('⏸️ [useDataSource] Database data unchanged, skipping UI update')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute database query'
      setError(errorMessage)
      console.error('Database query error:', err)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [sqlQuery, dbConnection, dataEquals, limit])

  const fetchDataModelData = useCallback(async () => {
    if (!dataModelId) {
      setError('Data model ID is required')
      return
    }

    if (loadingRef.current) return
    
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 [useDataSource] Fetching data for model:', dataModelId)
      
      const response = await fetch(`/api/data-models/${dataModelId}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: limit && limit > 0 ? limit : 10000,
          offset: 0
        })
      })

      console.log('🔍 [useDataSource] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [useDataSource] API error response:', response.status, errorText)
        
        let errorMessage = `Failed to fetch data (${response.status})`
        try {
          const errorData = errorText ? JSON.parse(errorText) : {}
          errorMessage = errorData.error || errorData.details || errorMessage
          if (errorData.details) {
            console.error('❌ [useDataSource] Error details:', errorData.details)
          }
        } catch (parseError) {
          // If we can't parse, use the raw text
          if (errorText && errorText.length < 200) {
            errorMessage = errorText
          }
        }
        
        setError(errorMessage)
        return
      }

      const result = await response.json()
      let fetchedData = Array.isArray(result.data) ? result.data : (Array.isArray(result.rows) ? result.rows : [])
      
      // Apply limit if specified (in case API didn't respect it)
      if (limit && limit > 0 && fetchedData.length > limit) {
        fetchedData = fetchedData.slice(0, limit)
      }
      
      // Compare with existing data - only update UI if data changed
      const currentData = dataRef.current
      const hasChanged = !dataEquals(currentData, fetchedData)
      
      if (hasChanged) {
        console.log('✅ [useDataSource] Data changed, updating UI:', {
          previousLength: currentData.length,
          newLength: fetchedData.length,
          hasData: fetchedData.length > 0
        })
        setData(fetchedData)
        dataRef.current = fetchedData
        setError(null) // Clear any previous errors
      } else {
        console.log('⏸️ [useDataSource] Data unchanged, skipping UI update:', {
          length: fetchedData.length
        })
        // Data unchanged, but still update loading state
        setLoading(false)
        loadingRef.current = false
        return
      }
      
      if (fetchedData.length === 0) {
        console.warn('⚠️ [useDataSource] No data returned from API')
      }
    } catch (err) {
      console.error('❌ [useDataSource] Fetch error:', err)
      let errorMessage = 'Failed to fetch data from data model'
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to server'
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [dataModelId, dataEquals, limit])

  const fetchData = useCallback(async () => {
    const cacheKey = getCacheKey()
    
    // Skip if already loading the same data
    if (loadingRef.current && lastFetchRef.current === cacheKey) {
      console.log('⏸️ [useDataSource] Already loading, skipping:', cacheKey)
      return
    }
    
    // Skip if we just fetched this and have data (use ref to avoid dependency)
    if (!loadingRef.current && lastFetchRef.current === cacheKey && dataRef.current.length > 0) {
      console.log('⏸️ [useDataSource] Already fetched, skipping:', cacheKey)
      return
    }
    
    lastFetchRef.current = cacheKey
    console.log('🔄 [useDataSource] Starting fetch for:', cacheKey)
    
    if (dataSource === 'sample') {
      setData(sampleData)
      dataRef.current = sampleData
      setError(null)
      return
    }

    if (dataSource === 'data-model') {
      await fetchDataModelData()
      return
    }

    if (dataSource === 'api') {
      await fetchApiData()
      return
    }

    if (dataSource === 'database') {
      await fetchDatabaseData()
      return
    }

    // For 'file' and 'manual', use sample data as fallback
    setData(sampleData)
    dataRef.current = sampleData
  }, [dataSource, sampleData, fetchApiData, fetchDatabaseData, fetchDataModelData, getCacheKey])

  // Initial fetch - only when key dependencies change
  useEffect(() => {
    const cacheKey = getCacheKey()
    
    // Skip if already loading the same key
    if (cacheKey === lastFetchRef.current && loadingRef.current) {
      console.log('⏸️ [useDataSource] Skipping fetch - already loading:', cacheKey)
      return
    }
    
    // Skip if we just fetched this key and have data (use ref to avoid dependency)
    if (cacheKey === lastFetchRef.current && dataRef.current.length > 0 && !loadingRef.current) {
      console.log('⏸️ [useDataSource] Skipping fetch - already have data:', cacheKey)
      return
    }
    
    // Only fetch if cache key actually changed
    if (cacheKey !== lastFetchRef.current) {
      console.log('🔄 [useDataSource] Cache key changed, fetching:', cacheKey, '->', lastFetchRef.current)
      lastFetchRef.current = cacheKey
      fetchData()
    } else if (dataRef.current.length === 0 && !loadingRef.current) {
      // Only fetch if we have no data and not loading (use ref to avoid dependency)
      console.log('🔄 [useDataSource] No data, fetching:', cacheKey)
      lastFetchRef.current = cacheKey
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, dataModelId, apiUrl, sqlQuery, dbConnection]) // Only actual identifiers

  // Auto-refresh setup - enable real-time by default for data-model sources
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Enable real-time for data-model sources (default behavior)
    // For other sources, only if explicitly enabled
    const shouldPoll = dataSource === 'data-model' 
      ? true  // Always enable real-time for data models
      : (autoRefresh && refreshInterval > 0)  // Only if explicitly enabled for others
    
    if (shouldPoll && refreshInterval > 0 && dataSource !== 'sample') {
      const intervalSeconds = dataSource === 'data-model' && !autoRefresh 
        ? 30  // Default 30 seconds for data models
        : refreshInterval
      
      console.log('🔄 [useDataSource] Starting real-time polling, interval:', intervalSeconds, 'seconds')
      
      // Create a stable refresh function that uses the latest fetch functions
      const refreshFn = () => {
        if (!loadingRef.current) {
          // Use the latest fetch functions from closure
          if (dataSource === 'data-model' && dataModelId) {
            fetchDataModelData()
          } else if (dataSource === 'api' && apiUrl) {
            fetchApiData()
          } else if (dataSource === 'database' && sqlQuery) {
            fetchDatabaseData()
          }
        }
      }
      
      // Initial fetch
      refreshFn()
      
      intervalRef.current = setInterval(refreshFn, intervalSeconds * 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [autoRefresh, refreshInterval, dataSource, dataModelId, apiUrl, sqlQuery, fetchDataModelData, fetchApiData, fetchDatabaseData])

  return {
    data,
    loading,
    error,
    refresh: fetchData
  }
}

