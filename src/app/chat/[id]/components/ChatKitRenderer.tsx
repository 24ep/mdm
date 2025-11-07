'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'
import { ChatKitWrapper } from './ChatKitWrapper'

export function ChatKitRenderer({ 
  chatbot, 
  previewDeploymentType = 'fullpage',
  isInIframe = false 
}: { 
  chatbot: ChatbotConfig
  previewDeploymentType?: 'popover' | 'fullpage' | 'popup-center'
  isInIframe?: boolean
}) {
  const [chatkitLoaded, setChatkitLoaded] = useState(false)
  const [chatkitModule, setChatkitModule] = useState<any>(null)
  const [chatkitError, setChatkitError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  // Load ChatKit script
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (document.querySelector('script[src*="chatkit.js"]')) {
      setChatkitLoaded(true)
      return
    }

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
  }, [])

  // Load ChatKit module when script is loaded
  useEffect(() => {
    if (!chatkitLoaded || !chatbot.chatkitAgentId || chatkitModule || isInitializing) {
      return
    }

    setIsInitializing(true)
    console.log('Loading ChatKit module...')

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
        console.error('Error importing ChatKit module:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setChatkitError(errorMessage)
        setIsInitializing(false)
        toast.error(`Failed to load ChatKit module: ${errorMessage}`)
      })
  }, [chatkitLoaded, chatbot.chatkitAgentId, chatkitModule, isInitializing])

  // Render ChatKit component when ready
  if (chatkitModule && chatbot.chatkitAgentId && !chatkitError) {
    return (
      <ChatKitWrapper
        chatkitModule={chatkitModule}
        chatbot={chatbot}
        onError={setChatkitError}
        previewDeploymentType={previewDeploymentType}
        isInIframe={isInIframe}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    )
  }

  if (chatkitError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 mb-4">
          <h2 className="text-xl font-semibold mb-2">ChatKit Error</h2>
          <p className="text-sm">{chatkitError}</p>
        </div>
        <Button
          onClick={() => {
            setChatkitError(null)
            setChatkitLoaded(false)
            window.location.reload()
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!chatkitLoaded || !chatkitModule) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <span className="ml-2">Loading ChatKit...</span>
        {!chatkitLoaded && (
          <p className="text-sm text-muted-foreground mt-2">Loading ChatKit script...</p>
        )}
        {chatkitLoaded && !chatkitModule && (
          <p className="text-sm text-muted-foreground mt-2">Loading ChatKit module...</p>
        )}
      </div>
    )
  }

  return null
}

