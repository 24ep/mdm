import { useState, useEffect, useCallback } from 'react'
import { ChatbotConfig } from '../types'

export interface AgentThread {
  id: string
  threadId: string
  title: string | null
  messageCount: number
  lastMessageAt: string | null
  createdAt: string
  metadata: Record<string, any>
}

interface UseAgentThreadOptions {
  chatbot: ChatbotConfig | null
  chatbotId: string
  spaceId?: string | null
}

export function useAgentThread({ chatbot, chatbotId, spaceId }: UseAgentThreadOptions) {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [threads, setThreads] = useState<AgentThread[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only enable for OpenAI Agent SDK
  const isEnabled = chatbot?.engineType === 'openai-agent-sdk' && chatbot?.openaiAgentSdkAgentId

  // Load threads for this chatbot
  const loadThreads = useCallback(async () => {
    if (!isEnabled) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/chat-handler/openai-agent-sdk/threads?chatbotId=${chatbotId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads || [])
        
        // Auto-select most recent thread if no current thread
        if (!currentThreadId && data.threads?.length > 0) {
          setCurrentThreadId(data.threads[0].threadId)
        }
      } else {
        setError('Failed to load threads')
      }
    } catch (err) {
      console.error('Error loading threads:', err)
      setError('Failed to load threads')
    } finally {
      setIsLoading(false)
    }
  }, [chatbotId, isEnabled, currentThreadId])

  // Create a new thread
  const createThread = useCallback(async (threadId: string, title?: string) => {
    if (!isEnabled) return null

    try {
      const response = await fetch('/chat-handler/openai-agent-sdk/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId,
          threadId,
          title: title || 'New Conversation',
          metadata: {
            agentId: chatbot?.openaiAgentSdkAgentId,
            model: chatbot?.openaiAgentSdkModel,
          },
          spaceId: spaceId || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await loadThreads() // Reload threads
        return data.thread
      }
      return null
    } catch (err) {
      console.error('Error creating thread:', err)
      return null
    }
  }, [chatbotId, chatbot, spaceId, isEnabled, loadThreads])

  // Update thread title
  const updateThreadTitle = useCallback(async (threadId: string, title: string) => {
    if (!isEnabled) return false

    try {
      const response = await fetch(`/chat-handler/openai-agent-sdk/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (response.ok) {
        await loadThreads() // Reload threads
        return true
      }
      return false
    } catch (err) {
      console.error('Error updating thread:', err)
      return false
    }
  }, [isEnabled, loadThreads])

  // Delete thread
  const deleteThread = useCallback(async (threadId: string) => {
    if (!isEnabled) return false

    try {
      const response = await fetch(`/chat-handler/openai-agent-sdk/threads/${threadId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // If deleted thread was current, clear it
        if (currentThreadId === threadId) {
          setCurrentThreadId(null)
        }
        await loadThreads() // Reload threads
        return true
      }
      return false
    } catch (err) {
      console.error('Error deleting thread:', err)
      return false
    }
  }, [isEnabled, currentThreadId, loadThreads])

  // Load threads on mount and when chatbot changes
  useEffect(() => {
    if (isEnabled) {
      loadThreads()
    }
  }, [isEnabled, loadThreads])

  return {
    currentThreadId,
    setCurrentThreadId,
    threads,
    isLoading,
    error,
    createThread,
    updateThreadTitle,
    deleteThread,
    loadThreads,
    isEnabled,
  }
}

