import { useState, useEffect } from 'react'
import { Message, ChatbotConfig } from '../types'

export interface ChatHistoryItem {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

interface UseChatHistoryOptions {
  chatbotId: string
  chatbot: ChatbotConfig | null
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  isInIframe: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  currentChatId: string | null
  setCurrentChatId: (id: string | null) => void
}

export function useChatHistory({
  chatbotId,
  chatbot,
  previewDeploymentType,
  isInIframe,
  messages,
  setMessages,
  currentChatId,
  setCurrentChatId,
}: UseChatHistoryOptions) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([])

  // Load chat history from localStorage
  useEffect(() => {
    if (previewDeploymentType === 'fullpage' && !isInIframe) {
      const saved = localStorage.getItem(`chat-history-${chatbotId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const loadedHistory = parsed.map((ch: any) => ({
            ...ch,
            messages: ch.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
            createdAt: new Date(ch.createdAt),
          }))
          setChatHistory(loadedHistory)
          // Select the most recent chat if available
          if (loadedHistory.length > 0 && !currentChatId) {
            const mostRecent = loadedHistory[0]
            setCurrentChatId(mostRecent.id)
            setMessages(mostRecent.messages)
          }
        } catch (e) {
          console.error('Error loading chat history:', e)
        }
      }
    }
  }, [chatbotId, previewDeploymentType, isInIframe])

  // Save chat history to localStorage
  useEffect(() => {
    if (previewDeploymentType === 'fullpage' && !isInIframe && chatHistory.length > 0) {
      localStorage.setItem(`chat-history-${chatbotId}`, JSON.stringify(chatHistory))
    }
  }, [chatHistory, chatbotId, previewDeploymentType, isInIframe])

  // Auto-create chat when switching to full page if no current chat
  useEffect(() => {
    if (previewDeploymentType === 'fullpage' && !isInIframe && !currentChatId && chatbot && chatHistory.length === 0) {
      const newChatId = `chat-${Date.now()}`
      const initialMessages: Message[] = []
      // Use Agent SDK greeting if available, otherwise use conversationOpener
      const greetingMessage = chatbot.openaiAgentSdkGreeting || chatbot.conversationOpener
      if (greetingMessage) {
        initialMessages.push({
          id: 'opener',
          role: 'assistant',
          content: greetingMessage,
          timestamp: new Date(),
        })
      }
      const newChat = {
        id: newChatId,
        title: 'New Chat',
        messages: initialMessages,
        createdAt: new Date(),
      }
      setChatHistory([newChat])
      setCurrentChatId(newChatId)
      setMessages(initialMessages)
    }
  }, [previewDeploymentType, isInIframe, chatbot, currentChatId, chatHistory.length, setMessages])

  // Update current chat title
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === 'user')
      if (firstUserMessage) {
        const title = firstUserMessage.content.substring(0, 50) || 'New Chat'
        setChatHistory((prev) =>
          prev.map((ch) => (ch.id === currentChatId ? { ...ch, title, messages } : ch))
        )
      }
    }
  }, [messages, currentChatId])

  // Update current chat messages when they change
  useEffect(() => {
    if (currentChatId && previewDeploymentType === 'fullpage' && !isInIframe) {
      setChatHistory((prev) =>
        prev.map((ch) => (ch.id === currentChatId ? { ...ch, messages } : ch))
      )
    }
  }, [messages, currentChatId, previewDeploymentType, isInIframe])

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    const initialMessages: Message[] = []
    // Use Agent SDK greeting if available, otherwise use conversationOpener
    const greetingMessage = chatbot?.openaiAgentSdkGreeting || chatbot?.conversationOpener
    if (greetingMessage) {
      initialMessages.push({
        id: 'opener',
        role: 'assistant',
        content: greetingMessage,
        timestamp: new Date(),
      })
    }
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: initialMessages,
      createdAt: new Date(),
    }
    setChatHistory((prev) => [newChat, ...prev])
    setCurrentChatId(newChatId)
    setMessages(initialMessages)
  }

  const handleSelectChat = (chatId: string) => {
    const chat = chatHistory.find((ch) => ch.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
    }
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatHistory((prev) => prev.filter((ch) => ch.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
      setMessages([])
    }
  }

  return {
    chatHistory,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
  }
}

