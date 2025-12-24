'use client'

import { useState, useEffect } from 'react'
import { useTickets, UseTicketsOptions, UseTicketsResult } from './useTickets'
import { Ticket } from '../types'

export interface UseTicketsWithTimeLogsOptions extends UseTicketsOptions {
  includeTimeLogs?: boolean
}

export interface UseTicketsWithTimeLogsResult extends UseTicketsResult {
  ticketsWithTimeLogs: Ticket[]
}

/**
 * Hook for fetching tickets with their time logs included
 */
export function useTicketsWithTimeLogs(
  options: UseTicketsWithTimeLogsOptions = {}
): UseTicketsWithTimeLogsResult {
  const { includeTimeLogs = true, autoFetch = true, ...ticketsOptions } = options
  const ticketsResult = useTickets({ ...ticketsOptions, autoFetch })
  const [ticketsWithTimeLogs, setTicketsWithTimeLogs] = useState<Ticket[]>([])
  const [loadingTimeLogs, setLoadingTimeLogs] = useState(false)

  const fetchTimeLogsForTickets = async (tickets: Ticket[]) => {
    if (!includeTimeLogs || tickets.length === 0) {
      setTicketsWithTimeLogs(tickets)
      return
    }

    try {
      setLoadingTimeLogs(true)
      
      // Fetch time logs for all tickets in parallel
      const timeLogPromises = tickets.map(async (ticket) => {
        try {
          const response = await fetch(`/api/tickets/${ticket.id}/time-logs`)
          if (!response.ok) {
            return { ...ticket, timeLogs: [] }
          }
          const data = await response.json()
          return {
            ...ticket,
            timeLogs: data.timeLogs || [],
          }
        } catch (error) {
          console.error(`Error fetching time logs for ticket ${ticket.id}:`, error)
          return { ...ticket, timeLogs: [] }
        }
      })

      const ticketsWithLogs = await Promise.all(timeLogPromises)
      setTicketsWithTimeLogs(ticketsWithLogs)
    } catch (error) {
      console.error('Error fetching time logs:', error)
      setTicketsWithTimeLogs(tickets)
    } finally {
      setLoadingTimeLogs(false)
    }
  }

  useEffect(() => {
    if (includeTimeLogs && ticketsResult.tickets.length > 0) {
      fetchTimeLogsForTickets(ticketsResult.tickets)
    } else {
      setTicketsWithTimeLogs(ticketsResult.tickets)
    }
  }, [ticketsResult.tickets, includeTimeLogs])

  return {
    ...ticketsResult,
    loading: ticketsResult.loading || loadingTimeLogs,
    ticketsWithTimeLogs,
  }
}

