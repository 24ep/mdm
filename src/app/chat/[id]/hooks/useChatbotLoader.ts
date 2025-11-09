import { useState, useEffect } from 'react'
import { ChatbotConfig } from '../types'
import toast from 'react-hot-toast'
import { isUuid } from '@/lib/validation'

interface UseChatbotLoaderOptions {
  chatbotId: string
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  isInIframe: boolean
  onChatbotLoaded?: (chatbot: ChatbotConfig) => void
}

export function useChatbotLoader({
  chatbotId,
  previewDeploymentType,
  isInIframe,
  onChatbotLoaded,
}: UseChatbotLoaderOptions) {
  const [chatbot, setChatbot] = useState<ChatbotConfig | null>(null)
  const [emulatorConfig, setEmulatorConfig] = useState<{
    backgroundColor?: string
    backgroundImage?: string
    text?: string
    description?: string
  }>({})

  // Load chatbot
  useEffect(() => {
    loadChatbot()
  }, [chatbotId])

  // Dynamically load Google Fonts for configured families
  useEffect(() => {
    if (!chatbot) return
    const families = [chatbot.fontFamily, chatbot.headerFontFamily].filter(Boolean) as string[]
    if (families.length === 0) return

    // Create unique id to avoid duplicating
    const linkId = 'chatbot-google-fonts'
    const existing = document.getElementById(linkId) as HTMLLinkElement | null
    const uniqueFamilies = Array.from(new Set(families))
    const googleFamilies = uniqueFamilies
      .map((f) => encodeURIComponent(f.replace(/\s+/g, '+')) + ':wght@400;500;600;700')
      .join('&family=')
    const href = `https://fonts.googleapis.com/css2?family=${googleFamilies}&display=swap`

    if (existing) {
      if (existing.href !== href) existing.href = href
    } else {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }
  }, [chatbot?.fontFamily, chatbot?.headerFontFamily])

  // Listen for realtime config updates from editor
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (data.type === 'chatbot-config-update' && data.id === chatbotId) {
        const cfg = data.config || {}
        setChatbot((prev) => ({ ...(prev || ({} as any)), ...cfg }))
      } else if (data.type === 'emulator-config-update' && data.id === chatbotId) {
        const emulatorCfg = data.emulatorConfig || {}
        setEmulatorConfig(emulatorCfg)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [chatbotId])

  const loadChatbot = async () => {
    try {
      // Best practice: Database is source of truth - try API first
      // This ensures we always get the latest data when chatbot exists in database
      if (isUuid(chatbotId)) {
        // Check localStorage first to determine if we should make an API call
        const saved = localStorage.getItem('ai-chatbots')
        if (saved) {
          const chatbots = JSON.parse(saved)
          const found = chatbots.find((c: any) => c.id === chatbotId)
          if (found) {
            // Found in localStorage - check if it's been saved to database
            const savedToDatabase = (found as any)._savedToDatabase === true
            
            if (savedToDatabase) {
              // Chatbot has been saved to database - fetch latest version from API
              try {
                const response = await fetch(`/api/chatbots/${chatbotId}`)
                if (response.ok) {
                  const data = await response.json()
                  if (data.chatbot) {
                    // Found in database - use it (this is the source of truth)
                    setChatbot(data.chatbot)
                    if (onChatbotLoaded) {
                      onChatbotLoaded(data.chatbot)
                    }
                    return
                  }
                } else if (response.status === 404) {
                  // Not found in database but flag says it should be - use localStorage as fallback
                  console.warn('Chatbot marked as saved to database but not found, using localStorage version')
                  setChatbot(found)
                  if (onChatbotLoaded) {
                    onChatbotLoaded(found)
                  }
                  return
                } else {
                  // Other errors (500, etc.) - use localStorage as fallback
                  console.error('API returned error status:', response.status)
                  setChatbot(found)
                  if (onChatbotLoaded) {
                    onChatbotLoaded(found)
                  }
                  return
                }
              } catch (apiError) {
                // Network error - use localStorage version
                console.error('API load failed, using localStorage version:', apiError)
                setChatbot(found)
                if (onChatbotLoaded) {
                  onChatbotLoaded(found)
                }
                return
              }
            } else {
              // localStorage-only chatbot - skip API call to avoid 404 errors
              setChatbot(found)
              if (onChatbotLoaded) {
                onChatbotLoaded(found)
              }
              return
            }
          }
        }
        
        // Not in localStorage - try database (might be a database-only chatbot)
        try {
          const response = await fetch(`/api/chatbots/${chatbotId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.chatbot) {
              // Found in database - use it
              setChatbot(data.chatbot)
              if (onChatbotLoaded) {
                onChatbotLoaded(data.chatbot)
              }
              return
            }
          } else if (response.status === 404) {
            // Not found in database and not in localStorage
            toast.error('Chatbot not found')
            return
          } else {
            // Other errors (500, etc.)
            console.error('API returned error status:', response.status)
            toast.error('Failed to load chatbot from server')
            return
          }
        } catch (apiError) {
          // Network errors
          console.error('API load failed:', apiError)
          toast.error('Failed to load chatbot from server')
          return
        }
      } else {
        // Non-UUID ID - only check localStorage (these are always localStorage-only)
        const saved = localStorage.getItem('ai-chatbots')
        if (saved) {
          const chatbots = JSON.parse(saved)
          const found = chatbots.find((c: any) => c.id === chatbotId)
          if (found) {
            setChatbot(found)
            if (onChatbotLoaded) {
              onChatbotLoaded(found)
            }
            return
          }
        }
        toast.error('Chatbot not found')
      }
    } catch (error) {
      console.error('Error loading chatbot:', error)
      toast.error('Failed to load chatbot')
    }
  }

  return {
    chatbot,
    setChatbot,
    emulatorConfig,
    setEmulatorConfig,
  }
}

