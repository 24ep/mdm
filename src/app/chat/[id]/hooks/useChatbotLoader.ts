import { useState, useEffect } from 'react'
import { ChatbotConfig } from '../types'
import toast from 'react-hot-toast'
import { isUuid } from '@/lib/validation'
import { DEFAULT_CHATBOT_CONFIG } from '@/app/admin/components/chatbot/constants'

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

  // Helper to merge loaded chatbot with default config to ensure all values are set
  // Filter out undefined values from defaults to prevent them from overriding valid loaded values
  const mergeWithDefaults = (loadedChatbot: any): ChatbotConfig => {
    // Create a clean defaults object without undefined values
    const cleanDefaults: Record<string, any> = {}
    for (const [key, value] of Object.entries(DEFAULT_CHATBOT_CONFIG)) {
      if (value !== undefined) {
        cleanDefaults[key] = value
      }
    }
    // Merge: clean defaults first, then loaded chatbot values take precedence
    return { ...cleanDefaults, ...loadedChatbot } as ChatbotConfig
  }

  // Update emulator config when chatbot loads with persisted settings
  useEffect(() => {
    if (chatbot) {
      setEmulatorConfig(prev => ({
        ...prev,
        // Only override if not already set (or should we always override? 
        // Let's always override matching fields from chatbot config as that's the source of truth on load)
        backgroundColor: chatbot.pageBackgroundColor || prev.backgroundColor,
        backgroundImage: chatbot.pageBackgroundImage || prev.backgroundImage,
        text: chatbot.pageTitle || prev.text,
        description: chatbot.pageDescription || prev.description
      }))
    }
  }, [chatbot])

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
            ; (updated as any)._fromEditor = true
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
        const res = await fetch(`/api/public/chatbots/${chatbotId}`, { cache: 'no-store' })
        if (res.ok) {
          const d = await res.json()
          if (d.chatbot) {
            const merged = mergeWithDefaults(d.chatbot)
            setChatbot(merged)
            if (onChatbotLoaded) onChatbotLoaded(merged)
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
          const response = await fetch(`/api/chatbots/${chatbotId}`, { cache: 'no-store' })
          // Check for JSON content type to avoid handling auth redirects (HTML) as success
          const contentType = response.headers.get('content-type')

          if (response.ok && contentType && contentType.includes('application/json')) {
            const data = await response.json()
            if (data.chatbot) {
              const merged = mergeWithDefaults(data.chatbot)
              setChatbot(merged)
              if (onChatbotLoaded) onChatbotLoaded(merged)
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
            const merged = mergeWithDefaults(found)
            setChatbot(merged)
            if (onChatbotLoaded) onChatbotLoaded(merged)
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
            const merged = mergeWithDefaults(found)
            setChatbot(merged)
            if (onChatbotLoaded) onChatbotLoaded(merged)
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

