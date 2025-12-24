'use client'

import { useState } from 'react'

export interface TimeLogInput {
  hours: number
  description?: string | null
  loggedAt?: Date | string
}

export interface UseTimeLogActionsResult {
  addTimeLog: (ticketId: string, timeLog: TimeLogInput) => Promise<any | null>
  deleteTimeLog: (ticketId: string, timeLogId: string) => Promise<boolean>
  loading: boolean
  error: string | null
}

/**
 * Hook for time log CRUD operations
 */
export function useTimeLogActions(): UseTimeLogActionsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTimeLog = async (
    ticketId: string,
    timeLog: TimeLogInput
  ): Promise<any | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tickets/${ticketId}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: timeLog.hours,
          description: timeLog.description || null,
          loggedAt: timeLog.loggedAt
            ? new Date(timeLog.loggedAt).toISOString()
            : new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add time log')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add time log'
      setError(errorMessage)
      console.error('Error adding time log:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteTimeLog = async (
    ticketId: string,
    timeLogId: string
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/tickets/${ticketId}/time-logs?timeLogId=${timeLogId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete time log')
      }

      return true
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete time log'
      setError(errorMessage)
      console.error('Error deleting time log:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    addTimeLog,
    deleteTimeLog,
    loading,
    error,
  }
}

