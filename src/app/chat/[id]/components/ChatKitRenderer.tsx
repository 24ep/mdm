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

  // Debug: Log chatbot config for ChatKit requirements on mount
  useEffect(() => {
    const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
    const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
    const apiKey = isAgentSDK ? chatbot.openaiAgentSdkApiKey : chatbot.chatkitApiKey
    
    console.log('🔍 ChatKit Configuration Check:', {
      engineType: chatbot.engineType,
      isChatKitEngine: chatbot.engineType === 'chatkit',
      isAgentSDK: chatbot.engineType === 'openai-agent-sdk',
      hasAgentId: !!agentId,
      agentIdPreview: agentId ? agentId.substring(0, 20) + '...' : 'NOT SET',
      hasApiKey: !!apiKey,
      chatbotId: chatbot.id,
      chatbotName: chatbot.name
    })
    
    // Log warnings for missing configuration
    if (chatbot.engineType !== 'chatkit' && chatbot.engineType !== 'openai-agent-sdk') {
      console.warn('⚠️ ChatKit will NOT render: engineType is', chatbot.engineType, '(must be "chatkit" or "openai-agent-sdk")')
    }
    if (!agentId) {
      console.warn('⚠️ ChatKit will NOT render: agentId is not configured')
    }
    if (!apiKey) {
      console.warn('⚠️ ChatKit sessions may fail: API key is not configured')
    }
  }, [chatbot])

  // Auto-show for widget (only auto-open, don't auto-close)
  // Use refs to track one-time initialization and prevent re-triggering
  const initializedRef = React.useRef(false)
  const autoShowTriggeredRef = React.useRef(false)
  
  useEffect(() => {
    if (!chatbot) return
    
    // Only run initialization logic once per mount
    if (initializedRef.current) return
    initializedRef.current = true
    
    const useChatKitInRegularStyle = (chatbot as any).useChatKitInRegularStyle === true

    // Regular Style UI on desktop or fullpage should always be "open"
    if (previewDeploymentType === 'fullpage' || useChatKitInRegularStyle) {
      setIsOpen(true)
      return
    }
    
    // For popover/popup-center, start closed to show widget button
    setIsOpen(false)
    
    // Check if auto-show is enabled
    const shouldAuto = (chatbot as any).widgetAutoShow !== undefined ? (chatbot as any).widgetAutoShow : true
    if (shouldAuto && !autoShowTriggeredRef.current) {
      autoShowTriggeredRef.current = true
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
  console.log('ChatKitRenderer state:', { 
    chatkitLoaded, 
    chatkitModule: !!chatkitModule, 
    chatkitError, 
    isInitializing, 
    isMobile, 
    previewDeploymentType, 
    agentId: agentId, 
    engineType: chatbot.engineType,
    timestamp: new Date().toISOString()
  })

  // Render ChatKit component when ready
  if (chatkitModule && agentId && !chatkitError) {
    console.log('✅ ChatKit ready to render')
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

  // If ChatKit fails to load, show error state and trigger fallback
  if (chatkitError) {
    console.error('❌ ChatKit error detected:', chatkitError)
    // Notify parent to use fallback
    if (onChatKitUnavailable) {
      console.log('🔄 Triggering ChatKit unavailable callback')
      onChatKitUnavailable()
    }
    
    // Show visible error in development, return null in production to use fallback
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="max-w-md">
            <div className="text-red-500 mb-2">⚠️ ChatKit Error</div>
            <p className="text-sm text-muted-foreground mb-4">{chatkitError}</p>
            <p className="text-xs text-muted-foreground">Falling back to regular chat...</p>
          </div>
        </div>
      )
    }
    return null
  }

  // Loading state - show spinner while initializing
  if (!chatkitLoaded) {
    console.log('⏳ ChatKit script loading...')
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading ChatKit...</p>
        </div>
      </div>
    )
  }

  // No agent ID configured - show error BEFORE checking module loading
  // This prevents infinite "Initializing..." spinner when agentId is missing
  if (!agentId) {
    console.error('❌ ChatKit cannot render: No agent ID configured')
    console.log('💡 To fix: Set chatkitAgentId (for ChatKit engine) or openaiAgentSdkAgentId (for Agent SDK)')
    
    // Always try to fallback
    if (onChatKitUnavailable) {
      onChatKitUnavailable()
    }
    
    // Show helpful error message
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="max-w-md">
          <div className="text-amber-500 mb-2">⚠️ ChatKit Configuration Missing</div>
          <p className="text-sm text-muted-foreground mb-2">
            Agent ID is not configured.
          </p>
          <p className="text-xs text-muted-foreground">
            Please set the Agent ID in the chatbot&apos;s Engine Configuration.
          </p>
        </div>
      </div>
    )
  }

  if (isInitializing || !chatkitModule) {
    console.log('⏳ ChatKit module initializing...')
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Initializing ChatKit module...</p>
        </div>
      </div>
    )
  }

  return null
}
