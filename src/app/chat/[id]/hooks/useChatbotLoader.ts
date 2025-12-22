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
        // When config is updated from editor, ensure chatbot styles take precedence over theme config
        // This ensures the emulator uses style settings from ai-chat-ui, not theme config
        setChatbot((prev) => {
          const updated = { ...(prev || ({} as any)), ...cfg }
          // Mark that this config came from the editor to ensure styles are applied
          ;(updated as any)._fromEditor = true
          return updated
        })
      } else if (data.type === 'emulator-config-update' && data.id === chatbotId) {
        const emulatorCfg = data.emulatorConfig || {}
        setEmulatorConfig(emulatorCfg)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [chatbotId])

  const loadChatbot = async () => {
    // Helper for public fallback (guests/embeds)
    const tryPublicApi = async () => {
      try {
        const res = await fetch(`/api/public/chatbots/${chatbotId}`)
        if (res.ok) {
          const d = await res.json()
          if (d.chatbot) {
            setChatbot(d.chatbot)
            if (onChatbotLoaded) onChatbotLoaded(d.chatbot)
            return true
          }
        }
      } catch (e) {
        console.warn('Public API fallback failed', e)
      }
      return false
    }

    try {
      if (isUuid(chatbotId)) {
        // 1. Try Private API (Admin/Draft version)
        try {
          const response = await fetch(`/api/chatbots/${chatbotId}`)
          // Check for JSON content type to avoid handling auth redirects (HTML) as success
          const contentType = response.headers.get('content-type')
          
          if (response.ok && contentType && contentType.includes('application/json')) {
            const data = await response.json()
            if (data.chatbot) {
              setChatbot(data.chatbot)
              if (onChatbotLoaded) onChatbotLoaded(data.chatbot)
              return
            }
          }
        } catch (e) {
          // Failed to fetch private, continue to fallback
        }

        // 2. Try Public API (Published version)
        if (await tryPublicApi()) return

        // 3. Fallback to LocalStorage
        const saved = localStorage.getItem('ai-chatbots')
        if (saved) {
          const chatbots = JSON.parse(saved)
          const found = chatbots.find((c: any) => c.id === chatbotId)
          if (found) {
            setChatbot(found)
            if (onChatbotLoaded) onChatbotLoaded(found)
            return
          }
        }

        // 4. Not found anywhere
        // Only show error toast if we're not in an iframe (to avoid spamming embeds)
        if (!isInIframe) {
          toast.error('Chatbot not found')
        }
      } else {
        // Non-UUID ID - only check localStorage
        const saved = localStorage.getItem('ai-chatbots')
        if (saved) {
          const chatbots = JSON.parse(saved)
          const found = chatbots.find((c: any) => c.id === chatbotId)
          if (found) {
            setChatbot(found)
            if (onChatbotLoaded) onChatbotLoaded(found)
            return
          }
        }
        if (!isInIframe) {
          toast.error('Chatbot not found')
        }
      }
    } catch (error) {
      console.error('Error loading chatbot:', error)
      if (!isInIframe) {
        toast.error('Failed to load chatbot')
      }
    }
  }

  return {
    chatbot,
    setChatbot,
    emulatorConfig,
    setEmulatorConfig,
  }
}

