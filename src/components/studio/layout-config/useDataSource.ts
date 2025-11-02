'use client'

import { useState, useEffect, useCallback } from 'react'

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
    refreshInterval = 30000
  } = options

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApiData = useCallback(async () => {
    if (!apiUrl) {
      setError('API URL is required')
      return
    }

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
      const fetchedData = Array.isArray(result) 
        ? result 
        : result.data || result.results || result.items || []

      if (!Array.isArray(fetchedData)) {
        throw new Error('API response must be an array or contain a data/results/items array')
      }

      setData(fetchedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data from API'
      setError(errorMessage)
      console.error('API data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, apiMethod, apiHeaders])

  const fetchDatabaseData = useCallback(async () => {
    if (!sqlQuery) {
      setError('SQL query is required')
      return
    }

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
      const fetchedData = Array.isArray(result.data) ? result.data : result.rows || []

      setData(fetchedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute database query'
      setError(errorMessage)
      console.error('Database query error:', err)
    } finally {
      setLoading(false)
    }
  }, [sqlQuery, dbConnection])

  const fetchDataModelData = useCallback(async () => {
    if (!dataModelId || !spaceId) {
      setError('Data model ID and space ID are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/data-models/${dataModelId}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 10000,
          offset: 0
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch data: ${response.status}`)
      }

      const result = await response.json()
      const fetchedData = Array.isArray(result.data) ? result.data : result.rows || []

      setData(fetchedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data from data model'
      setError(errorMessage)
      console.error('Data model fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [dataModelId, spaceId])

  const fetchData = useCallback(async () => {
    if (dataSource === 'sample') {
      setData(sampleData)
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
  }, [dataSource, sampleData, fetchApiData, fetchDatabaseData, fetchDataModelData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return

    const intervalId = setInterval(() => {
      if (dataSource !== 'sample') {
        fetchData()
      }
    }, refreshInterval * 1000)

    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, dataSource, fetchData])

  return {
    data,
    loading,
    error,
    refresh: fetchData
  }
}

