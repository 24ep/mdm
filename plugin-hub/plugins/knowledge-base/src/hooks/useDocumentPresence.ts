'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { KnowledgePresence } from '../types'

interface UseDocumentPresenceOptions {
  documentId: string | null
  enabled?: boolean
  updateInterval?: number
}

export function useDocumentPresence(options: UseDocumentPresenceOptions) {
  const { data: session } = useSession()
  const { documentId, enabled = true, updateInterval = 2000 } = options
  const [presence, setPresence] = useState<KnowledgePresence[]>([])
  const [cursor, setCursor] = useState<{ line: number; ch: number } | null>(null)
  const [selection, setSelection] = useState<{
    from: { line: number; ch: number }
    to: { line: number; ch: number }
  } | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch presence
  const fetchPresence = useCallback(async () => {
    if (!documentId || !enabled) return

    try {
      const response = await fetch(`/api/knowledge/documents/${documentId}/presence`)
      if (response.ok) {
        const data = await response.json()
        setPresence(data.presence || [])
      }
    } catch (error) {
      console.error('Error fetching presence:', error)
    }
  }, [documentId, enabled])

  // Update own presence
  const updatePresence = useCallback(async (
    newCursor?: { line: number; ch: number },
    newSelection?: {
      from: { line: number; ch: number }
      to: { line: number; ch: number }
    }
  ) => {
    if (!documentId || !enabled || !session?.user) return

    if (newCursor) setCursor(newCursor)
    if (newSelection) setSelection(newSelection)

    // Debounce updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/knowledge/documents/${documentId}/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cursor: newCursor || cursor,
            selection: newSelection || selection,
          }),
        })
      } catch (error) {
        console.error('Error updating presence:', error)
      }
    }, 500)
  }, [documentId, enabled, session, cursor, selection])

  // Set up polling
  useEffect(() => {
    if (!documentId || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    fetchPresence()
    intervalRef.current = setInterval(fetchPresence, updateInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [documentId, enabled, updateInterval, fetchPresence])

  return {
    presence,
    updatePresence,
  }
}

