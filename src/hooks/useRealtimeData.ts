'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface RealtimeDataOptions {
  interval?: number
  enabled?: boolean
  onDataUpdate?: (data: any) => void
  onError?: (error: Error) => void
}

interface RealtimeDataState {
  data: any
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isConnected: boolean
  connectionCount: number
}

export function useRealtimeData(
  dataSourceId: string,
  query: string,
  options: RealtimeDataOptions = {}
) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onDataUpdate,
    onError
  } = options

  const [state, setState] = useState<RealtimeDataState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    isConnected: false,
    connectionCount: 0
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const fetchData = useCallback(async () => {
    if (!dataSourceId || !query) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Simulate API call - replace with actual data fetching
      const response = await fetch('/api/data/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataSourceId,
          query,
          timestamp: Date.now()
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        data: data.result,
        loading: false,
        lastUpdated: new Date(),
        isConnected: true,
        connectionCount: prev.connectionCount + 1
      }))

      onDataUpdate?.(data.result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isConnected: false
      }))
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [dataSourceId, query, onDataUpdate, onError])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const wsUrl = `ws://localhost:3001/api/realtime/${dataSourceId}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setState(prev => ({ ...prev, isConnected: true, error: null }))
        reconnectAttempts.current = 0
        
        // Send subscription message
        ws.send(JSON.stringify({
          type: 'subscribe',
          dataSourceId,
          query
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'data_update') {
            setState(prev => ({
              ...prev,
              data: message.data,
              lastUpdated: new Date(),
              connectionCount: prev.connectionCount + 1
            }))
            onDataUpdate?.(message.data)
          } else if (message.type === 'error') {
            setState(prev => ({ ...prev, error: message.error }))
            onError?.(new Error(message.error))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setState(prev => ({ ...prev, isConnected: false }))
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, delay)
        } else {
          toast.error('Failed to reconnect to real-time data')
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setState(prev => ({ ...prev, error: 'WebSocket connection error' }))
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setState(prev => ({ ...prev, error: 'Failed to create WebSocket connection' }))
    }
  }, [dataSourceId, query, onDataUpdate, onError])

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setState(prev => ({ ...prev, isConnected: false }))
  }, [])

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Initial fetch
    fetchData()

    // Set up polling
    intervalRef.current = setInterval(fetchData, interval)
  }, [fetchData, interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const reset = useCallback(() => {
    stopPolling()
    disconnectWebSocket()
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
      isConnected: false,
      connectionCount: 0
    })
  }, [stopPolling, disconnectWebSocket])

  // Effect to handle polling
  useEffect(() => {
    if (enabled && dataSourceId && query) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, dataSourceId, query, startPolling, stopPolling])

  // Effect to handle WebSocket connection
  useEffect(() => {
    if (enabled && dataSourceId && query) {
      connectWebSocket()
    } else {
      disconnectWebSocket()
    }

    return () => {
      disconnectWebSocket()
    }
  }, [enabled, dataSourceId, query, connectWebSocket, disconnectWebSocket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
      disconnectWebSocket()
    }
  }, [stopPolling, disconnectWebSocket])

  return {
    ...state,
    refresh,
    reset,
    startPolling,
    stopPolling,
    connectWebSocket,
    disconnectWebSocket
  }
}
