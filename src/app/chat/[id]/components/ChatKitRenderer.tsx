'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatKitWrapper } from './ChatKitWrapper'

import { ChatbotConfig } from '../types'

interface ChatKitRendererProps {
  chatbot: ChatbotConfig
  previewDeploymentType?: 'popover' | 'fullpage' | 'popup-center'
  isInIframe?: boolean
  isMobile?: boolean
  onChatKitUnavailable?: () => void // Callback when ChatKit fails to load
}

export function ChatKitRenderer({
  chatbot,
  previewDeploymentType = 'fullpage',
  isInIframe = false,
  isMobile = false,
  onChatKitUnavailable
}: ChatKitRendererProps) {
  const [chatkitLoaded, setChatkitLoaded] = useState(false)
  const [chatkitModule, setChatkitModule] = useState<any>(null)
  const [chatkitError, setChatkitError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  // Auto-show for widget (only auto-open, don't auto-close)
  useEffect(() => {
    if (!chatbot) return
    const useChatKitInRegularStyle = (chatbot as any).useChatKitInRegularStyle === true

    // Regular Style UI on desktop should always be "open" internally to fill our container
    if (previewDeploymentType === 'fullpage' || useChatKitInRegularStyle) {
      setIsOpen(true)
      return
    }
    // For popover/popup-center, start closed to show widget button
    setIsOpen(false)
    const shouldAuto = (chatbot as any).widgetAutoShow !== undefined ? (chatbot as any).widgetAutoShow : true
    if (shouldAuto) {
      const delayMs = ((chatbot as any).widgetAutoShowDelay || 0) * 1000
      const t = setTimeout(() => setIsOpen(true), delayMs)
      return () => clearTimeout(t)
    }
  }, [chatbot, previewDeploymentType])

  // Load ChatKit script
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if script already loaded
    if (document.querySelector('script[src*="chatkit.js"]')) {
      setChatkitLoaded(true)
      return
    }

    // Load ChatKit script
    const script = document.createElement('script')
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
    script.async = true
    script.onload = () => {
      console.log('ChatKit script loaded')
      setChatkitLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load ChatKit script')
      setChatkitError('Failed to load ChatKit script')
      toast.error('Failed to load ChatKit')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Compute agent ID once
  const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
  const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId

  // Load ChatKit module when script is loaded
  useEffect(() => {
    if (!chatkitLoaded || !agentId || chatkitModule || isInitializing) {
      return
    }

    setIsInitializing(true)
    console.log('Loading ChatKit module...')

    // Import ChatKit module dynamically
    import('@openai/chatkit-react')
      .then((module) => {
        console.log('ChatKit module loaded:', module)
        if (!module.useChatKit) {
          throw new Error('useChatKit not found in @openai/chatkit-react')
        }
        setChatkitModule(module)
        setIsInitializing(false)
      })
      .catch((error) => {
        // Handle module not found error gracefully
        const isModuleNotFound =
          error instanceof Error &&
          (error.message.includes('Cannot find module') ||
            error.message.includes('Failed to fetch dynamically imported module') ||
            (error as any).code === 'MODULE_NOT_FOUND')

        if (isModuleNotFound) {
          console.warn('ChatKit module (@openai/chatkit-react) is not installed. Please run: npm install @openai/chatkit-react')
        } else {
          console.error('Error importing ChatKit module:', error)
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setChatkitError(errorMessage)
        setIsInitializing(false)

        // Notify parent that ChatKit is unavailable so it can fall back to regular chat
        if (onChatKitUnavailable) {
          onChatKitUnavailable()
        }
        console.warn('ChatKit module not available, will use regular chat style')
      })
  }, [chatkitLoaded, agentId, chatkitModule, isInitializing, onChatKitUnavailable])

  // Debug: Trace ChatKitRenderer state
  console.log('ChatKitRenderer state:', { chatkitLoaded, chatkitModule: !!chatkitModule, chatkitError, isInitializing, isMobile, previewDeploymentType, agentId: agentId, engineType: chatbot.engineType })

  // Render ChatKit component when ready
  if (chatkitModule && agentId && !chatkitError) {
    return (
      <ChatKitWrapper
        chatkitModule={chatkitModule}
        chatbot={chatbot as any}
        onError={setChatkitError}
        previewDeploymentType={previewDeploymentType}
        isInIframe={isInIframe}
        isMobile={isMobile}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    )
  }

  // If ChatKit fails to load, show loading state briefly then return null
  // The parent component will handle the fallback to regular chat
  if (chatkitError) {
    return null
  }

  // Loading state - don't show full screen, just return null
  // The parent component should handle showing the page content while ChatKit loads in the background
  if (!chatkitLoaded || !chatkitModule) {
    return null
  }

  return null
}
