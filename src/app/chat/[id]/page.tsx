'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Send, Paperclip, X, Bot, User, Loader2, Plus, MessageSquare, Trash2, Menu, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

// Dynamically import ChatKit to avoid SSR issues
const ChatKit = dynamic(
  () => import('@openai/chatkit-react').then((mod) => mod.ChatKit),
  { ssr: false }
)

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: string[]
  attachments?: Array<{
    type: 'image' | 'video'
    url: string
    name?: string
  }>
}

interface ChatKitColorAccent {
  primary?: string
  level?: number
}

interface ChatKitColor {
  accent?: ChatKitColorAccent
  [key: string]: any
}

interface ChatKitTypography {
  fontFamily?: string
  [key: string]: any
}

interface ChatKitTheme {
  colorScheme?: 'light' | 'dark'
  color?: ChatKitColor
  radius?: 'pill' | 'round' | 'soft' | 'sharp'
  density?: 'compact' | 'normal' | 'spacious'
  typography?: ChatKitTypography
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  [key: string]: any
}

interface ChatKitComposer {
  placeholder?: string
  tools?: any[]
  [key: string]: any
}

interface ChatKitStartScreen {
  greeting?: string
  prompts?: Array<{ label: string; prompt: string }>
}

interface ChatKitOptions {
  theme?: ChatKitTheme
  locale?: string
  composer?: ChatKitComposer
  startScreen?: ChatKitStartScreen
  [key: string]: any
}

interface ChatbotConfig {
  id: string
  name: string
  engineType?: 'custom' | 'agentbuilder' | 'openai' | 'chatkit' | 'dify' | 'openai-agent-sdk'
  apiEndpoint: string
  apiAuthType: 'none' | 'bearer' | 'api_key' | 'custom'
  apiAuthValue: string
  chatkitAgentId?: string
  chatkitApiKey?: string
  chatkitOptions?: ChatKitOptions
  difyApiKey?: string
  difyOptions?: {
    apiBaseUrl?: string
    responseMode?: 'streaming' | 'blocking'
    user?: string
    conversationId?: string
    inputs?: Record<string, any>
    [key: string]: any
  }
  openaiAgentSdkAgentId?: string
  openaiAgentSdkApiKey?: string
  openaiAgentSdkModel?: string
  openaiAgentSdkInstructions?: string
  openaiAgentSdkReasoningEffort?: 'low' | 'medium' | 'high'
  openaiAgentSdkStore?: boolean
  openaiAgentSdkVectorStoreId?: string
  logo?: string
  primaryColor: string
  fontFamily: string
  fontSize: string
  fontColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  // Message bubble borders
  bubbleBorderColor?: string
  bubbleBorderWidth?: string
  bubbleBorderRadius?: string
  bubblePadding?: string
  // Message background colors
  userMessageBackgroundColor?: string
  botMessageBackgroundColor?: string
  // Message display options
  showMessageName?: boolean
  messageName?: string
  messageNamePosition?: 'top-of-message' | 'top-of-avatar' | 'right-of-avatar'
  showMessageAvatar?: boolean
  messageBoxColor: string
  shadowColor: string
  shadowBlur: string
  conversationOpener: string
  followUpQuestions: string[]
  enableFileUpload: boolean
  showCitations: boolean
  enableVoiceAgent?: boolean
  typingIndicatorStyle?: 'spinner' | 'dots' | 'pulse' | 'bounce'
  typingIndicatorColor?: string
  headerTitle?: string
  headerDescription?: string
  headerLogo?: string
  headerBgColor?: string
  headerFontColor?: string
  headerFontFamily?: string
  headerShowAvatar?: boolean
  headerBorderEnabled?: boolean
  headerBorderColor?: string
  headerPaddingX?: string
  headerPaddingY?: string
  // Footer/Input Area
  footerBgColor?: string
  footerBorderColor?: string
  footerBorderWidth?: string
  footerBorderRadius?: string
  footerPaddingX?: string
  footerPaddingY?: string
  footerInputBgColor?: string
  footerInputBorderColor?: string
  footerInputBorderWidth?: string
  footerInputBorderRadius?: string
  footerInputFontColor?: string
  // Send Button
  sendButtonIcon?: string
  sendButtonRounded?: boolean
  sendButtonBgColor?: string
  sendButtonIconColor?: string
  sendButtonShadowColor?: string
  sendButtonShadowBlur?: string
  // File Upload Layout
  fileUploadLayout?: 'attach-first' | 'input-first'
  avatarType?: 'icon' | 'image'
  avatarIcon?: string
  avatarIconColor?: string
  avatarBackgroundColor?: string
  avatarImageUrl?: string
  // Widget styling
  widgetAvatarStyle?: 'circle' | 'square' | 'circle-with-label'
  widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center'
  widgetSize?: string
  widgetBackgroundColor?: string
  widgetBorderColor?: string
  widgetBorderWidth?: string
  widgetBorderRadius?: string
  widgetShadowColor?: string
  widgetShadowBlur?: string
  widgetLabelText?: string
  widgetLabelColor?: string
  widgetAnimation?: 'none' | 'fade' | 'slide' | 'bounce'
  widgetAutoShow?: boolean
  widgetAutoShowDelay?: number
  widgetOffsetX?: string
  widgetOffsetY?: string
  widgetZIndex?: number
  showNotificationBadge?: boolean
  notificationBadgeColor?: string
  // Chat window
  chatWindowWidth?: string
  chatWindowHeight?: string
  chatWindowBorderColor?: string
  chatWindowBorderWidth?: string
  chatWindowBorderRadius?: string
  chatWindowShadowColor?: string
  chatWindowShadowBlur?: string
  // Deployment
  deploymentType?: 'popover' | 'fullpage' | 'popup-center'
}

// ChatKit Renderer Component
function ChatKitRenderer({ 
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

  // Load ChatKit module when script is loaded
  useEffect(() => {
    if (!chatkitLoaded || !chatbot.chatkitAgentId || chatkitModule || isInitializing) {
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
            setChatkitControl(null)
            // Reload the page to retry
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

// Wrapper component that uses the ChatKit hook (must be at top level)
function ChatKitWrapper({ 
  chatkitModule, 
  chatbot, 
  onError,
  previewDeploymentType = 'fullpage',
  isInIframe = false,
  isOpen,
  setIsOpen
}: { 
  chatkitModule: any
  chatbot: ChatbotConfig
  onError: (error: string) => void
  previewDeploymentType?: 'popover' | 'fullpage' | 'popup-center'
  isInIframe?: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}) {
  const chatkitOptions = chatbot.chatkitOptions || {}
  
  // Build complete theme object with only valid ChatKit properties
  // Filter out any legacy or unsupported properties
  const theme = (() => {
    const validTheme: any = {}
    
    // Note: ChatKit may not support radius in theme object
    // We'll apply it via CSS instead to avoid validation errors
    // Only include radius if ChatKit explicitly supports it (commented out for now)
    // const radiusValue = chatkitOptions.theme?.radius
    // if (radiusValue && ['pill', 'round', 'soft', 'sharp'].includes(radiusValue)) {
    //   validTheme.radius = radiusValue
    // }
    
    // Only include valid theme properties if theme exists
    if (chatkitOptions.theme) {
      if (chatkitOptions.theme.colorScheme) {
        validTheme.colorScheme = chatkitOptions.theme.colorScheme
      }
      if (chatkitOptions.theme.density) {
        validTheme.density = chatkitOptions.theme.density
      }
    }
    
    // Build color object with only valid properties
    if (chatkitOptions.theme?.color) {
      validTheme.color = {}
      
      // Accent color (only include valid ChatKit properties: primary and level)
      if (chatkitOptions.theme.color.accent) {
        validTheme.color.accent = {
          primary: chatkitOptions.theme.color.accent.primary || chatbot.primaryColor,
          level: chatkitOptions.theme.color.accent.level ?? 2,
        }
        // Note: icon property is stored in config but not passed to ChatKit
        // as it's not a valid ChatKit theme property
      } else {
        // Provide default accent if not specified
        validTheme.color.accent = {
          primary: chatbot.primaryColor,
          level: 2,
        }
      }
      
      // Note: Only accent color is reliably supported by ChatKit
      // Other color properties (background, text, secondary, border, surface) 
      // may not be supported and are excluded to avoid validation errors
    } else {
      // Provide default color structure
      validTheme.color = {
        accent: {
          primary: chatbot.primaryColor,
          level: 2,
        }
      }
    }
    
    // Typography - Only include if ChatKit supports it
    // Note: Typography properties may not be fully supported by ChatKit
    // Commenting out for now to avoid validation errors
    // if (chatkitOptions.theme.typography) {
    //   validTheme.typography = {}
    //   if (chatkitOptions.theme.typography.fontFamily) {
    //     validTheme.typography.fontFamily = chatkitOptions.theme.typography.fontFamily
    //   }
    //   if (chatkitOptions.theme.typography.fontSize) {
    //     validTheme.typography.fontSize = chatkitOptions.theme.typography.fontSize
    //   }
    //   if (chatkitOptions.theme.typography.fontWeight !== undefined) {
    //     validTheme.typography.fontWeight = chatkitOptions.theme.typography.fontWeight
    //   }
    //   if (chatkitOptions.theme.typography.lineHeight) {
    //     validTheme.typography.lineHeight = chatkitOptions.theme.typography.lineHeight
    //   }
    //   if (chatkitOptions.theme.typography.letterSpacing) {
    //     validTheme.typography.letterSpacing = chatkitOptions.theme.typography.letterSpacing
    //   }
    //   
    //   // Only include typography if it has at least one property
    //   if (Object.keys(validTheme.typography).length === 0) {
    //     delete validTheme.typography
    //   }
    // }
    
    // Only return theme if it has at least one valid property
    // If no valid properties, return undefined to use ChatKit defaults
    return Object.keys(validTheme).length > 0 ? validTheme : undefined
  })()

  // Debug: Log theme object to verify radius is included
  console.log('ChatKit theme object:', JSON.stringify(theme, null, 2))
  console.log('ChatKit radius value:', theme?.radius)
  console.log('ChatKit theme keys:', theme ? Object.keys(theme) : 'no theme')

  try {
    const { useChatKit, ChatKit } = chatkitModule
    
    const { control } = useChatKit({
      api: {
        async getClientSecret(existing) {
          try {
              if (existing) {
                // Refresh existing session if needed
                const res = await fetch('/api/chatkit/session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    agentId: chatbot.chatkitAgentId, 
                    existing,
                    apiKey: chatbot.chatkitApiKey 
                  }),
                })
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                  const errorMessage = errorData.details 
                    ? `${errorData.error}: ${errorData.details}`
                    : errorData.error || 'Failed to refresh ChatKit session'
                  throw new Error(errorMessage)
                }
                const { client_secret } = await res.json()
                return client_secret
              }

              const res = await fetch('/api/chatkit/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  agentId: chatbot.chatkitAgentId,
                  apiKey: chatbot.chatkitApiKey 
                }),
              })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
              console.error('ChatKit session error details:', errorData)
              const errorMessage = errorData.details 
                ? `${errorData.error}: ${errorData.details}`
                : errorData.error || 'Failed to create ChatKit session'
              throw new Error(errorMessage)
            }
            const sessionData = await res.json()
            console.log('ChatKit client secret received:', { 
              has_secret: !!sessionData.client_secret,
              session_id: sessionData.session_id,
              secret_length: sessionData.client_secret?.length,
              secret_type: typeof sessionData.client_secret
            })
            if (!sessionData.client_secret) {
              throw new Error('No client secret received from session endpoint')
            }
            // Ensure client_secret is a string
            const clientSecret = String(sessionData.client_secret).trim()
            if (!clientSecret) {
              throw new Error('Client secret is empty')
            }
            console.log('Returning client secret to ChatKit (first 20 chars):', clientSecret.substring(0, 20) + '...')
            return clientSecret
          } catch (error) {
            console.error('Error getting client secret:', error)
            throw error
          }
        },
      },
      // Apply ChatKitOptions from chatbot config with complete theme
      theme: theme as any, // Type assertion for theme compatibility
      locale: chatkitOptions.locale as any, // Type assertion for locale
      // Filter composer to only include supported properties
      composer: chatkitOptions.composer ? {
        placeholder: chatkitOptions.composer.placeholder,
        // Filter tools to only include supported properties
        tools: chatkitOptions.composer.tools?.map((tool: any) => {
          const supportedTool: any = {}
          if (tool.id !== undefined && tool.id !== null && tool.id !== '') supportedTool.id = tool.id
          if (tool.label !== undefined && tool.label !== null && tool.label !== '') supportedTool.label = tool.label
          // Only include icon if it's a valid non-empty string
          if (tool.icon !== undefined && tool.icon !== null && tool.icon !== '') supportedTool.icon = tool.icon
          if (tool.pinned !== undefined) supportedTool.pinned = tool.pinned
          // Note: type and accept are internal config properties, not ChatKit API properties
          // They are used in the UI but should not be passed to ChatKit.create()
          return supportedTool
        }).filter((tool: any) => tool.id || tool.label) // Remove empty tools
      } : undefined,
      // Filter header to only include supported properties
      // Note: ChatKit expects header.title to be an object, not a string
      // We only use chatkitOptions.header if it's properly formatted
      // Header styling (colors, padding) is handled via CSS, not through ChatKit's header API
      header: chatkitOptions.header ? (() => {
        const header = { ...chatkitOptions.header }
        // Remove unsupported properties that ChatKit doesn't recognize
        delete (header as any).customButtonLeft
        delete (header as any).customButtonRight
        
        // Only keep properties that ChatKit supports
        // If title is a string, don't include it (ChatKit expects object format)
        const supportedHeader: any = {}
        if (header.title !== undefined) {
          // Only include title if it's already an object (ChatKit format)
          // Don't convert strings to objects as we don't know the exact structure
          if (typeof header.title === 'object' && header.title !== null) {
            supportedHeader.title = header.title
          }
        }
        if (header.description !== undefined) {
          // Only include description if it's already an object
          if (typeof header.description === 'object' && header.description !== null) {
            supportedHeader.description = header.description
          } else if (typeof header.description === 'string') {
            // ChatKit might accept string description, but be safe
            supportedHeader.description = header.description
          }
        }
        if (header.logo !== undefined) {
          supportedHeader.logo = header.logo
        }
        // Return empty object if no supported properties, or undefined to use defaults
        return Object.keys(supportedHeader).length > 0 ? supportedHeader : undefined
      })() : undefined,
      // Filter startScreen to only include supported properties
      startScreen: chatkitOptions.startScreen ? (() => {
        const supportedStartScreen: any = {}
        
        // Only include greeting if it exists
        if (chatkitOptions.startScreen.greeting) {
          supportedStartScreen.greeting = chatkitOptions.startScreen.greeting
        }
        
        // Filter prompts to only include supported properties (label and prompt, not name or icon)
        if (chatkitOptions.startScreen.prompts && chatkitOptions.startScreen.prompts.length > 0) {
          const filteredPrompts = chatkitOptions.startScreen.prompts.map((prompt: any) => {
            const supportedPrompt: any = {}
            if (prompt.label !== undefined) supportedPrompt.label = prompt.label
            if (prompt.prompt !== undefined) supportedPrompt.prompt = prompt.prompt
            // Note: 'name' and 'icon' are not supported by ChatKit and are excluded
            return supportedPrompt
          }).filter((prompt: any) => prompt.label || prompt.prompt) // Remove empty prompts
          
          // Only include prompts if there are valid ones
          if (filteredPrompts.length > 0) {
            supportedStartScreen.prompts = filteredPrompts
          }
        }
        
        // Only return startScreen if it has at least one property
        return Object.keys(supportedStartScreen).length > 0 ? supportedStartScreen : undefined
      })() : undefined,
      entities: chatkitOptions.entities ? {
        // Note: These functions would need to be implemented in your code
        // For now, we just pass the structure if entities are enabled
        onTagSearch: chatkitOptions.entities.onTagSearch,
        onRequestPreview: chatkitOptions.entities.onRequestPreview,
      } : undefined,
      // Disclaimer configuration
      disclaimer: chatkitOptions.disclaimer ? {
        text: chatkitOptions.disclaimer.text,
      } : undefined,
      // Thread item actions (feedback & retry)
      threadItemActions: chatkitOptions.threadItemActions ? {
        feedback: chatkitOptions.threadItemActions.feedback,
        retry: chatkitOptions.threadItemActions.retry,
      } : undefined,
      // Model picker configuration
      modelPicker: chatkitOptions.modelPicker ? {
        enabled: chatkitOptions.modelPicker.enabled,
      } : undefined,
      // Persona picker configuration
      personaPicker: chatkitOptions.personaPicker ? {
        enabled: chatkitOptions.personaPicker.enabled,
        personas: chatkitOptions.personaPicker.personas,
      } : undefined,
    })

    // Determine container style based on deployment type
    const deploymentType = previewDeploymentType || chatbot.deploymentType || 'fullpage'
    const shouldShowWidgetButton = deploymentType === 'popover' || deploymentType === 'popup-center'
    const shouldShowContainer = deploymentType === 'fullpage' ? true : isOpen

    // Widget position style helper
    const popoverPositionStyle = (): React.CSSProperties => {
      const pos = (chatbot as any).widgetPosition || 'bottom-right'
      const offsetX = (chatbot as any).widgetOffsetX || '20px'
      const offsetY = (chatbot as any).widgetOffsetY || '20px'
      const style: React.CSSProperties = { position: 'fixed' }
      if (pos.includes('bottom')) (style as any).bottom = offsetY; else (style as any).top = offsetY
      if (pos.includes('right')) (style as any).right = offsetX
      if (pos.includes('left')) (style as any).left = offsetX
      if (pos.includes('center')) {
        (style as any).left = '50%'
        ;(style as any).transform = 'translateX(-50%)'
      }
      return style
    }

    const containerStyle: React.CSSProperties = (() => {
      if (deploymentType === 'popover' || deploymentType === 'popup-center') {
        return {
          width: chatbot.chatWindowWidth || '380px',
          height: chatbot.chatWindowHeight || '600px',
          border: `${chatbot.chatWindowBorderWidth || chatbot.borderWidth} solid ${chatbot.chatWindowBorderColor || chatbot.borderColor}`,
          borderRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
          boxShadow: `0 0 ${chatbot.chatWindowShadowBlur || chatbot.shadowBlur} ${chatbot.chatWindowShadowColor || chatbot.shadowColor}`,
          overflow: 'hidden',
          paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
          paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
          paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
          paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
        } as React.CSSProperties
      }
      return {
        width: '100%',
        height: '100vh',
        border: 'none',
        borderRadius: '0',
        boxShadow: 'none',
        paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
        paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
        paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
        paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
      } as React.CSSProperties
    })()

    // Popup center overlay
    const overlayStyle: React.CSSProperties | undefined = deploymentType === 'popup-center'
      ? { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000 }
      : undefined

    return (
      <>
        {/* Overlay for popup-center */}
        {deploymentType === 'popup-center' && shouldShowContainer && (
          <div style={overlayStyle} onClick={() => setIsOpen(false)} />
        )}

        {/* Widget button */}
        {shouldShowWidgetButton && (() => {
          const widgetAvatarStyle = chatbot.widgetAvatarStyle || 'circle'
          const widgetSize = (chatbot as any).widgetSize || '60px'
          
          // Determine border radius based on avatar style
          let borderRadius: string
          if (widgetAvatarStyle === 'square') {
            borderRadius = (chatbot as any).widgetBorderRadius || '8px'
          } else {
            // circle or circle-with-label
            borderRadius = (chatbot as any).widgetBorderRadius || '50%'
          }
          
          const buttonContent = isOpen ? (
            <X className="h-6 w-6" style={{ color: chatbot?.avatarIconColor || '#ffffff' }} />
          ) : (() => {
            // Use widget-specific avatar config, fallback to general avatar config
            const widgetAvatarType = (chatbot as any).widgetAvatarType || chatbot?.avatarType || 'icon'
            const widgetAvatarImageUrl = (chatbot as any).widgetAvatarImageUrl || chatbot?.avatarImageUrl
            const widgetAvatarIcon = (chatbot as any).widgetAvatarIcon || chatbot?.avatarIcon || 'Bot'
            
            if (widgetAvatarType === 'image' && widgetAvatarImageUrl) {
              return <img src={widgetAvatarImageUrl} alt="Chat" style={{ width: '60%', height: '60%', borderRadius: widgetAvatarStyle === 'square' ? '8px' : '50%', objectFit: 'cover' }} />
            }
            const IconName = widgetAvatarIcon as string
            const IconComponent = (Icons as any)[IconName] || Bot
            const iconColor = chatbot?.avatarIconColor || '#ffffff'
            return <IconComponent className="h-6 w-6" style={{ color: iconColor }} />
          })()
          
          if (widgetAvatarStyle === 'circle-with-label') {
            const widgetBgColor = (chatbot as any).widgetBackgroundColor || chatbot.primaryColor
            const widgetLabelText = (chatbot as any).widgetLabelText || 'Chat'
            const widgetLabelColor = (chatbot as any).widgetLabelColor || '#ffffff'
            const widgetLabelFontSize = (chatbot as any).widgetLabelFontSize || '12px'
            
            return (
              <div
                style={{
                  ...popoverPositionStyle(),
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 0,
                  zIndex: ((chatbot as any).widgetZIndex || 9999) + 1,
                }}
              >
                <button
                  type="button"
                  aria-label={isOpen ? "Close chat" : "Open chat"}
                  onClick={() => setIsOpen(!isOpen)}
                  style={{
                    width: widgetSize,
                    height: widgetSize,
                    borderRadius: borderRadius,
                    border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
                    background: widgetBgColor,
                    boxShadow: (chatbot as any).widgetShadowBlur ? `0 0 ${(chatbot as any).widgetShadowBlur} ${(chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'}` : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    margin: 0,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  {buttonContent}
                </button>
                <div
                  style={{
                    backgroundColor: widgetBgColor,
                    color: widgetLabelColor,
                    padding: '4px 12px',
                    borderRadius: '0 4px 4px 0',
                    fontSize: widgetLabelFontSize,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    height: widgetSize,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
                    borderLeft: 'none',
                    boxShadow: (chatbot as any).widgetShadowBlur ? `0 0 ${(chatbot as any).widgetShadowBlur} ${(chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'}` : undefined,
                  }}
                >
                  <span>{widgetLabelText}</span>
                  {isOpen && (
                    <X 
                      className="h-4 w-4" 
                      style={{ color: widgetLabelColor, cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsOpen(false)
                      }}
                    />
                  )}
                </div>
              </div>
            )
          }
          
          return (
            <button
              type="button"
              aria-label={isOpen ? "Close chat" : "Open chat"}
              onClick={() => setIsOpen(!isOpen)}
              style={{
                ...popoverPositionStyle(),
                width: widgetSize,
                height: widgetSize,
                borderRadius: borderRadius,
                border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
                background: (chatbot as any).widgetBackgroundColor || chatbot.primaryColor,
                boxShadow: (chatbot as any).widgetShadowBlur ? `0 0 ${(chatbot as any).widgetShadowBlur} ${(chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'}` : undefined,
                zIndex: ((chatbot as any).widgetZIndex || 9999) + 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {buttonContent}
            </button>
          )
        })()}

        {/* Chat container */}
        {shouldShowContainer && (
          <div
            style={{
              ...containerStyle,
              position: (deploymentType === 'popover' || deploymentType === 'popup-center') ? 'fixed' : 'relative',
              ...(deploymentType === 'popover' ? (() => {
                const pos = (chatbot as any).widgetPosition || 'bottom-right'
                const offsetX = (chatbot as any).widgetOffsetX || '20px'
                const offsetY = (chatbot as any).widgetOffsetY || '20px'
                const widgetSize = (chatbot as any).widgetSize || '60px'
                const style: React.CSSProperties = { position: 'fixed' }
                
                // Position chat window above/below widget button
                if (pos.includes('bottom')) {
                  style.bottom = `calc(${offsetY} + ${widgetSize} + 10px)`
                } else {
                  style.top = `calc(${offsetY} + ${widgetSize} + 10px)`
                }
                
                if (pos.includes('right')) {
                  style.right = offsetX
                } else if (pos.includes('left')) {
                  style.left = offsetX
                } else if (pos.includes('center')) {
                  style.left = '50%'
                  style.transform = 'translateX(-50%)'
                }
                
                return style
              })() : deploymentType === 'popup-center' ? ({
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: ((chatbot as any).widgetZIndex || 9999) + 1,
              } as React.CSSProperties) : {}),
              zIndex: (chatbot as any).widgetZIndex || 9999,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <style>{`
              /* ChatKit Corner Radius - Apply based on theme radius value */
              ${(() => {
                const radiusValue = chatkitOptions?.theme?.radius || 'round'
                let borderRadius = '12px' // default round
                if (radiusValue === 'pill') borderRadius = '9999px'
                else if (radiusValue === 'round') borderRadius = '12px'
                else if (radiusValue === 'soft') borderRadius = '6px'
                else if (radiusValue === 'sharp') borderRadius = '0px'
                
                return `
                  /* Apply corner radius to ChatKit message bubbles and interactive elements */
                  div[class*="message"],
                  div[class*="Message"],
                  div[class*="bubble"],
                  div[class*="Bubble"],
                  button[class*="chatkit"],
                  button[class*="ChatKit"],
                  div[class*="input"],
                  div[class*="Input"],
                  div[class*="composer"],
                  div[class*="Composer"] {
                    border-radius: ${borderRadius} !important;
                  }
                `
              })()}
              
              /* ChatKit Header Styling - Apply to header elements */
              div[class*="header"]:first-child,
              header:first-child,
              [role="banner"],
              div > div:first-child[class*="header"],
              .chatkit-header {
                background-color: ${(chatbot as any).headerBgColor || chatbot.primaryColor || '#ffffff'} !important;
                color: ${(chatbot as any).headerFontColor || chatbot.fontColor || '#000000'} !important;
                padding: ${(chatbot as any).headerPaddingY || '12px'} ${(chatbot as any).headerPaddingX || '16px'} !important;
                ${(chatbot as any).headerBorderEnabled !== false ? `border-bottom: 1px solid ${(chatbot as any).headerBorderColor || chatbot.borderColor || '#e5e7eb'} !important;` : ''}
              }
              
              /* ChatKit Send Button Styling - Target send button in composer area */
              button[aria-label*="Send" i],
              button[aria-label*="send" i],
              button[type="submit"],
              button[class*="send" i],
              button[class*="Send"],
              .chatkit-send-button,
              div[class*="composer"] button:last-child,
              div[class*="Composer"] button:last-child {
                background-color: ${(chatbot as any).sendButtonBgColor || chatbot.primaryColor || '#3b82f6'} !important;
                color: ${(chatbot as any).sendButtonIconColor || '#ffffff'} !important;
                ${(chatbot as any).sendButtonRounded ? 'border-radius: 50% !important;' : ''}
                ${(chatbot as any).sendButtonShadowBlur ? `box-shadow: 0 0 ${(chatbot as any).sendButtonShadowBlur} ${(chatbot as any).sendButtonShadowColor || '#000000'} !important;` : ''}
                ${(chatbot as any).sendButtonPaddingX || (chatbot as any).sendButtonPaddingY ? `padding: ${(chatbot as any).sendButtonPaddingY || '8px'} ${(chatbot as any).sendButtonPaddingX || '8px'} !important;` : ''}
              }
              
              /* ChatKit Footer Styling - Apply to footer/composer elements */
              div[class*="footer"],
              div[class*="Footer"],
              div[class*="composer"]:last-child,
              div[class*="Composer"]:last-child,
              div[class*="input-container"],
              div[class*="InputContainer"] {
                background-color: ${(chatbot as any).footerBgColor || chatbot.messageBoxColor || '#ffffff'} !important;
                ${(chatbot as any).footerBorderColor ? `border-top: ${(chatbot as any).footerBorderWidth || chatbot.borderWidth || '1px'} solid ${(chatbot as any).footerBorderColor} !important;` : ''}
                ${(chatbot as any).footerPaddingX || (chatbot as any).footerPaddingY ? `padding: ${(chatbot as any).footerPaddingY || '16px'} ${(chatbot as any).footerPaddingX || '16px'} !important;` : ''}
                ${(chatbot as any).footerBorderRadius ? `border-bottom-left-radius: ${(chatbot as any).footerBorderRadius} !important; border-bottom-right-radius: ${(chatbot as any).footerBorderRadius} !important;` : ''}
              }
              
              /* ChatKit Input Field Styling - Apply to input elements in footer */
              input[class*="input"],
              input[class*="Input"],
              textarea[class*="input"],
              textarea[class*="Input"],
              div[class*="composer"] input,
              div[class*="Composer"] input,
              div[class*="composer"] textarea,
              div[class*="Composer"] textarea {
                background-color: ${(chatbot as any).footerInputBgColor || chatbot.messageBoxColor || '#ffffff'} !important;
                color: ${(chatbot as any).footerInputFontColor || chatbot.fontColor || '#000000'} !important;
                ${(chatbot as any).footerInputBorderColor ? `border: ${(chatbot as any).footerInputBorderWidth || chatbot.borderWidth || '1px'} solid ${(chatbot as any).footerInputBorderColor} !important;` : ''}
                ${(chatbot as any).footerInputBorderRadius ? `border-radius: ${(chatbot as any).footerInputBorderRadius} !important;` : ''}
              }
            `}</style>
            <ChatKit control={control} className="w-full h-full" />
          </div>
        )}
      </>
    )
  } catch (error) {
    console.error('Error initializing ChatKit:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    onError(errorMessage)
    toast.error(`Failed to initialize ChatKit: ${errorMessage}`)
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 mb-4">
          <h2 className="text-xl font-semibold mb-2">ChatKit Error</h2>
          <p className="text-sm">{errorMessage}</p>
        </div>
      </div>
    )
  }
}

export default function ChatPage() {
  const params = useParams()
  const chatbotId = params?.id as string
  const [chatbot, setChatbot] = useState<ChatbotConfig | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<Array<{ type: 'image' | 'video', url: string, name?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [previewDeploymentType, setPreviewDeploymentType] = useState<'popover' | 'fullpage' | 'popup-center'>('fullpage')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [emulatorConfig, setEmulatorConfig] = useState<{
    backgroundColor?: string
    backgroundImage?: string
    text?: string
    description?: string
  }>({})
  const [isInIframe, setIsInIframe] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; messages: Message[]; createdAt: Date }>>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Voice agent state
  const [isRecording, setIsRecording] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null) // SpeechRecognition type varies by browser
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Check if page is loaded in an iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

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
              timestamp: new Date(m.timestamp)
            })),
            createdAt: new Date(ch.createdAt)
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

  // Create new chat
  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    const initialMessages: Message[] = []
    // Add conversation opener if available
    if (chatbot?.conversationOpener) {
      initialMessages.push({
        id: 'opener',
        role: 'assistant',
        content: chatbot.conversationOpener,
        timestamp: new Date()
      })
    }
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: initialMessages,
      createdAt: new Date()
    }
    setChatHistory(prev => [newChat, ...prev])
    setCurrentChatId(newChatId)
    setMessages(initialMessages)
    setInput('')
  }

  // Auto-create chat when switching to full page if no current chat
  useEffect(() => {
    if (previewDeploymentType === 'fullpage' && !isInIframe && !currentChatId && chatbot && chatHistory.length === 0) {
      const newChatId = `chat-${Date.now()}`
      const initialMessages: Message[] = []
      // Add conversation opener if available
      if (chatbot.conversationOpener) {
        initialMessages.push({
          id: 'opener',
          role: 'assistant',
          content: chatbot.conversationOpener,
          timestamp: new Date()
        })
      }
      const newChat = {
        id: newChatId,
        title: 'New Chat',
        messages: initialMessages,
        createdAt: new Date()
      }
      setChatHistory([newChat])
      setCurrentChatId(newChatId)
      setMessages(initialMessages)
    }
  }, [previewDeploymentType, isInIframe, chatbot, currentChatId, chatHistory.length])

  // Select chat from history
  const handleSelectChat = (chatId: string) => {
    const chat = chatHistory.find(ch => ch.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
    }
  }

  // Delete chat from history
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatHistory(prev => prev.filter(ch => ch.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
      setMessages([])
    }
  }

  // Update current chat title
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        const title = firstUserMessage.content.substring(0, 50) || 'New Chat'
        setChatHistory(prev => prev.map(ch => 
          ch.id === currentChatId ? { ...ch, title, messages } : ch
        ))
      }
    }
  }, [messages, currentChatId])

  useEffect(() => {
    loadChatbot()
  }, [chatbotId])

  // Dynamically load Google Fonts for configured families in the emulator
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
        if (cfg.deploymentType) {
          setPreviewDeploymentType(cfg.deploymentType)
        }
      } else if (data.type === 'chatbot-preview-mode') {
        const val = data.value
        if (val === 'popover' || val === 'fullpage' || val === 'popup-center') {
          setPreviewDeploymentType(val)
          // Reset isOpen state when preview mode changes to show widget button
          if (val === 'popover' || val === 'popup-center') {
            setIsOpen(false)
          } else {
            setIsOpen(true)
          }
        }
      } else if (data.type === 'emulator-config-update' && data.id === chatbotId) {
        const emulatorCfg = data.emulatorConfig || {}
        setEmulatorConfig(emulatorCfg)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [chatbotId])

  // Auto-show for widget (only auto-open, don't auto-close)
  useEffect(() => {
    if (!chatbot) return
    if (previewDeploymentType === 'fullpage') {
      setIsOpen(true) // Full page always shows
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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatbot = async () => {
    try {
      // Try API first
      try {
        const response = await fetch(`/api/chatbots/${chatbotId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.chatbot) {
            setChatbot(data.chatbot)
            if (data.chatbot.deploymentType) setPreviewDeploymentType(data.chatbot.deploymentType)
            // Don't add conversation opener here - let chat history handle it for full page mode
            // For other modes, add it directly
            if (data.chatbot.conversationOpener && (previewDeploymentType !== 'fullpage' || isInIframe)) {
              setMessages([{
                id: 'opener',
                role: 'assistant',
                content: data.chatbot.conversationOpener,
                timestamp: new Date()
              }])
            }
            return
          }
        }
      } catch (apiError) {
        console.log('API load failed, trying localStorage')
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('ai-chatbots')
      if (saved) {
        const chatbots = JSON.parse(saved)
        const found = chatbots.find((c: any) => c.id === chatbotId)
        if (found) {
          setChatbot(found)
          if (found.deploymentType) setPreviewDeploymentType(found.deploymentType)
          // Don't add conversation opener here - let chat history handle it for full page mode
          // For other modes, add it directly
          if (found.conversationOpener && (previewDeploymentType !== 'fullpage' || isInIframe)) {
            setMessages([{
              id: 'opener',
              role: 'assistant',
              content: found.conversationOpener,
              timestamp: new Date()
            }])
          }
          return
        }
      }
      
      toast.error('Chatbot not found')
    } catch (error) {
      console.error('Error loading chatbot:', error)
      toast.error('Failed to load chatbot')
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const sendMessage = async (content: string, messageAttachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>) => {
    if ((!content.trim() && (!messageAttachments || messageAttachments.length === 0)) || !chatbot) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim() || '',
      timestamp: new Date(),
      attachments: messageAttachments || attachments.length > 0 ? (messageAttachments || attachments) : undefined
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    
    // Update current chat if exists
    if (currentChatId && previewDeploymentType === 'fullpage' && !isInIframe) {
      setChatHistory(prev => prev.map(ch => 
        ch.id === currentChatId ? { ...ch, messages: updatedMessages } : ch
      ))
    }
    
    setInput('')
    setAttachments([])
    setSelectedFollowUp(null)
    setIsLoading(true)

    try {
      // Handle OpenAI Agent SDK engine type
      if (chatbot.engineType === 'openai-agent-sdk' && chatbot.openaiAgentSdkAgentId && chatbot.openaiAgentSdkApiKey) {
        // Use proxy route to avoid CORS issues and handle API key securely
        const proxyUrl = '/api/openai-agent-sdk/chat-messages'
        
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agentId: chatbot.openaiAgentSdkAgentId,
            apiKey: chatbot.openaiAgentSdkApiKey,
            model: chatbot.openaiAgentSdkModel,
            instructions: chatbot.openaiAgentSdkInstructions,
            reasoningEffort: chatbot.openaiAgentSdkReasoningEffort,
            store: chatbot.openaiAgentSdkStore,
            vectorStoreId: chatbot.openaiAgentSdkVectorStoreId,
            message: content.trim() || '',
            attachments: userMessage.attachments || [],
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments
            }))
          })
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          let errorMessage = `OpenAI Agent SDK API request failed: ${response.status}`
          
          try {
            const errorData = JSON.parse(errorText)
            if (errorData.error) {
              errorMessage = errorData.error.message || errorData.error.details || errorMessage
              if (errorData.error.details) {
                errorMessage += ` - ${errorData.error.details}`
              }
              if (errorData.suggestion) {
                errorMessage += `\n\nSuggestion: ${errorData.suggestion}`
              }
            } else if (errorData.details) {
              errorMessage = errorData.details
            }
          } catch {
            errorMessage = errorText || errorMessage
          }
          
          console.error('OpenAI Agent SDK proxy error:', response.status, errorText)
          throw new Error(errorMessage)
        }

        // Check if response is streaming
        const contentType = response.headers.get('content-type')
        const isStreaming = contentType?.includes('text/event-stream') || contentType?.includes('text/plain')

        if (isStreaming && response.body) {
          // Handle streaming response from OpenAI Assistants API
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let fullResponse = ''
          let currentEvent = ''
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim()
              } else if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  
                  // Handle thread.message.delta events (content deltas)
                  if (currentEvent === 'thread.message.delta' && data.delta) {
                    // Extract text content from delta
                    if (data.delta.content && Array.isArray(data.delta.content)) {
                      for (const contentItem of data.delta.content) {
                        if (contentItem.type === 'text' && contentItem.text?.value) {
                          fullResponse += contentItem.text.value
                          // Update message in real-time
                          const streamingMessage: Message = {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: fullResponse,
                            timestamp: new Date()
                          }
                          setMessages([...updatedMessages, streamingMessage])
                        }
                      }
                    }
                  }
                  // Handle thread.message.completed (final message)
                  else if (currentEvent === 'thread.message.completed' && data.content) {
                    // Extract full content from completed message
                    if (Array.isArray(data.content)) {
                      for (const contentItem of data.content) {
                        if (contentItem.type === 'text' && contentItem.text?.value) {
                          fullResponse = contentItem.text.value
                        }
                      }
                    }
                  }
                  // Handle done event
                  else if (line.trim() === 'data: [DONE]' || data === '[DONE]') {
                    // Stream is complete
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.debug('Failed to parse SSE data:', line, e)
                }
              } else if (line.trim() === '' && currentEvent === 'done') {
                // Stream complete
                break
              }
            }
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fullResponse || 'No response received',
            timestamp: new Date()
          }
          const finalMessages = [...updatedMessages, assistantMessage]
          setMessages(finalMessages)
          
          if (currentChatId && previewDeploymentType === 'fullpage' && !isInIframe) {
            setChatHistory(prev => prev.map(ch => 
              ch.id === currentChatId ? { ...ch, messages: finalMessages } : ch
            ))
          }
        } else {
          // Handle blocking response
          const data = await response.json()
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.content || data.message || data.text || data.response || 'No response received',
            timestamp: new Date(),
            citations: chatbot.showCitations ? (data.citations || data.sources || []) : undefined
          }
          const finalMessages = [...updatedMessages, assistantMessage]
          setMessages(finalMessages)
          
          if (currentChatId && previewDeploymentType === 'fullpage' && !isInIframe) {
            setChatHistory(prev => prev.map(ch => 
              ch.id === currentChatId ? { ...ch, messages: finalMessages } : ch
            ))
          }
        }
      } else if (chatbot.engineType === 'dify' && chatbot.difyApiKey && chatbot.difyOptions?.apiBaseUrl) {
        const difyOptions = chatbot.difyOptions
        let apiBaseUrl = (difyOptions.apiBaseUrl || '').replace(/\/$/, '') // Remove trailing slash
        // Remove /v1 if it's already in the base URL to avoid duplication
        apiBaseUrl = apiBaseUrl.replace(/\/v1$/, '')
        
        // Prepare files array from attachments
        const files = (userMessage.attachments || []).map(att => ({
          type: att.type === 'image' ? 'image' : att.type === 'video' ? 'video' : 'document',
          transfer_method: 'remote_url' as const,
          url: att.url
        }))

        // Prepare request body
        const requestBody: any = {
          inputs: difyOptions.inputs || {},
          query: content.trim() || '',
          response_mode: difyOptions.responseMode || 'streaming',
          conversation_id: difyOptions.conversationId || '',
          user: difyOptions.user || 'user-' + Date.now(),
        }

        if (files.length > 0) {
          requestBody.files = files
        }

        // Use proxy route to avoid CORS issues
        const proxyUrl = '/api/dify/chat-messages'

        if (difyOptions.responseMode === 'streaming') {
          // Handle streaming response
          const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              apiBaseUrl,
              apiKey: chatbot.difyApiKey,
              requestBody
            })
          })

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.error('Dify proxy error:', response.status, errorText)
            throw new Error(`Dify API request failed: ${response.status} ${errorText}`)
          }

          // Read streaming response
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let fullResponse = ''
          let conversationId = ''

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n').filter(line => line.trim())

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    if (data.event === 'message') {
                      fullResponse += data.answer || ''
                      // Update message in real-time
                      const streamingMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: fullResponse,
                        timestamp: new Date()
                      }
                      setMessages([...updatedMessages, streamingMessage])
                    } else if (data.event === 'message_end') {
                      conversationId = data.conversation_id || conversationId
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // Update conversation ID for next message
          if (conversationId && chatbot.difyOptions) {
            // Note: This would need to be persisted in chatbot config
            // For now, we'll just use it in the current session
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fullResponse || 'No response received',
            timestamp: new Date()
          }
          const finalMessages = [...updatedMessages, assistantMessage]
          setMessages(finalMessages)
          
          if (currentChatId && previewDeploymentType === 'fullpage' && !isInIframe) {
            setChatHistory(prev => prev.map(ch => 
              ch.id === currentChatId ? { ...ch, messages: finalMessages } : ch
            ))
          }
        } else {
          // Handle blocking response
          const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              apiBaseUrl,
              apiKey: chatbot.difyApiKey,
              requestBody
            })
          })

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.error('Dify proxy error:', response.status, errorText)
            throw new Error(`Dify API request failed: ${response.status} ${errorText}`)
          }

          const data = await response.json()
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.answer || data.message || 'No response received',
            timestamp: new Date(),
            citations: chatbot.showCitations ? (data.metadata?.retriever_resources || []) : undefined
          }
          const finalMessages = [...updatedMessages, assistantMessage]
          setMessages(finalMessages)
          
          if (currentChatId && previewDeploymentType === 'fullpage' && !isInIframe) {
            setChatHistory(prev => prev.map(ch => 
              ch.id === currentChatId ? { ...ch, messages: finalMessages } : ch
            ))
          }
        }
      } else {
        // Handle other engine types (custom, openai, etc.)
        // Prepare API request
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }

        // Add authentication
        if (chatbot.apiAuthType !== 'none' && chatbot.apiAuthValue) {
          if (chatbot.apiAuthType === 'bearer') {
            headers['Authorization'] = `Bearer ${chatbot.apiAuthValue}`
          } else if (chatbot.apiAuthType === 'api_key') {
            headers['X-API-Key'] = chatbot.apiAuthValue
          } else if (chatbot.apiAuthType === 'custom') {
            headers['X-Custom-Auth'] = chatbot.apiAuthValue
          }
        }

        const response = await fetch(chatbot.apiEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: content.trim() || '',
            attachments: userMessage.attachments || [],
            conversation_history: messages.map(m => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments
            }))
          })
        })

        if (response.ok) {
          const data = await response.json()
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response || data.message || data.text || 'No response received',
            timestamp: new Date(),
            citations: chatbot.showCitations ? (data.citations || data.sources || []) : undefined
          }
          const finalMessages = [...updatedMessages, assistantMessage]
          setMessages(finalMessages)
          
          // Update current chat if exists
          if (currentChatId && previewDeploymentType === 'fullpage' && !isInIframe) {
            setChatHistory(prev => prev.map(ch => 
              ch.id === currentChatId ? { ...ch, messages: finalMessages } : ch
            ))
          }
        } else {
          throw new Error('API request failed')
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }
      const errorMessages = [...updatedMessages, errorMessage]
      setMessages(errorMessages)
      
      // Update current chat if exists
      if (currentChatId && previewDeploymentType === 'fullpage' && !isInIframe) {
        setChatHistory(prev => prev.map(ch => 
          ch.id === currentChatId ? { ...ch, messages: errorMessages } : ch
        ))
      }
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Please select an image or video file')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        setAttachments(prev => [...prev, {
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url,
          name: file.name
        }])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      sendMessage(input, attachments.length > 0 ? attachments : undefined)
    }
  }

  const handleFollowUpClick = (question: string) => {
    setSelectedFollowUp(question)
    sendMessage(question)
  }

  // Initialize voice recognition when chatbot loads
  useEffect(() => {
    if (chatbot?.enableVoiceAgent) {
      setIsVoiceEnabled(true)
      // Initialize Speech Recognition (Web Speech API)
      if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = false
          recognition.interimResults = false
          recognition.lang = 'en-US'
          
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setInput(transcript)
            setIsRecording(false)
            // Auto-send the message
            sendMessage(transcript)
          }
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)
            setIsRecording(false)
            if (event.error === 'no-speech') {
              toast.error('No speech detected. Please try again.')
            } else if (event.error === 'not-allowed') {
              toast.error('Microphone permission denied. Please enable microphone access.')
            } else {
              toast.error('Speech recognition error. Please try again.')
            }
          }
          
          recognition.onend = () => {
            setIsRecording(false)
          }
          
          recognitionRef.current = recognition
        } else {
          toast.error('Speech recognition is not supported in your browser.')
          setIsVoiceEnabled(false)
        }
        
        // Initialize Speech Synthesis for text-to-speech
        if ('speechSynthesis' in window) {
          synthRef.current = window.speechSynthesis
        }
      }
    } else {
      setIsVoiceEnabled(false)
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [chatbot?.enableVoiceAgent])

  // Speak assistant responses
  useEffect(() => {
    if (chatbot?.enableVoiceAgent && isVoiceEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && lastMessage.content && !isLoading) {
        // Cancel any ongoing speech
        if (synthRef.current) {
          synthRef.current.cancel()
        }
        
        // Speak the response
        const utterance = new SpeechSynthesisUtterance(lastMessage.content)
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0
        
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)
        
        if (synthRef.current) {
          synthRef.current.speak(utterance)
        }
      }
    }
  }, [messages, chatbot?.enableVoiceAgent, isVoiceEnabled, isLoading])

  const handleStartRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
        toast.success('Listening...')
      } catch (error) {
        console.error('Error starting recognition:', error)
        toast.error('Failed to start voice recording')
      }
    }
  }

  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleVoiceOutput = () => {
    if (synthRef.current) {
      if (isSpeaking) {
        synthRef.current.cancel()
        setIsSpeaking(false)
        toast.success('Voice output stopped')
      } else {
        // Resume speaking the last assistant message
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
        if (lastAssistantMessage?.content) {
          const utterance = new SpeechSynthesisUtterance(lastAssistantMessage.content)
          utterance.onstart = () => setIsSpeaking(true)
          utterance.onend = () => setIsSpeaking(false)
          utterance.onerror = () => setIsSpeaking(false)
          synthRef.current.speak(utterance)
          toast.success('Voice output resumed')
        }
      }
    }
  }

  if (!chatbot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const chatStyle: React.CSSProperties = {
    fontFamily: chatbot.fontFamily,
    fontSize: chatbot.fontSize,
    color: chatbot.fontColor,
    backgroundColor: chatbot.messageBoxColor
  }

  // Render chat content (header, messages, input) - reusable for full page layout
  const renderChatContent = () => {
    if (!chatbot) return null
    
    return (
      <>
        {/* Header */}
        <div 
          className="flex items-center gap-3"
          style={{ 
            paddingLeft: (chatbot as any).headerPaddingX || '16px',
            paddingRight: (chatbot as any).headerPaddingX || '16px',
            paddingTop: (chatbot as any).headerPaddingY || '16px',
            paddingBottom: (chatbot as any).headerPaddingY || '16px',
            borderColor: (chatbot as any).headerBorderColor || chatbot.borderColor,
            borderBottomWidth: (chatbot as any).headerBorderEnabled === false ? 0 : (parseInt((chatbot.borderWidth || '1').toString()) || 1),
            backgroundColor: chatbot.headerBgColor || chatbot.primaryColor,
            color: chatbot.headerFontColor || 'white',
            fontFamily: chatbot.headerFontFamily || chatbot.fontFamily,
            borderTopLeftRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
            borderTopRightRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius
          }}
        >
          {/* Header Logo (separate from avatar) - if logo is set, don't show avatar */}
          {chatbot.headerLogo ? (
            <img 
              src={chatbot.headerLogo} 
              alt={chatbot.name}
              className="w-8 h-8 object-contain flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : ((chatbot as any).headerShowAvatar !== false) && (() => {
            // Use header avatar config, fallback to message avatar config for backward compatibility
            const headerAvatarType = chatbot.headerAvatarType || chatbot.avatarType || 'icon'
            if (headerAvatarType === 'image' && (chatbot.headerLogo || chatbot.headerAvatarImageUrl)) {
              return (
                <img 
                  src={chatbot.headerLogo || chatbot.headerAvatarImageUrl || ''} 
                  alt={chatbot.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )
            } else if (headerAvatarType === 'icon') {
              const IconName = chatbot.headerAvatarIcon || chatbot.avatarIcon || 'Bot'
              const IconComponent = (Icons as any)[IconName] || Bot
              const iconColor = chatbot.headerAvatarIconColor || chatbot.avatarIconColor || '#ffffff'
              const bgColor = chatbot.headerAvatarBackgroundColor || chatbot.avatarBackgroundColor || chatbot.primaryColor || '#3b82f6'
              return (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: bgColor }}
                >
                  <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
                </div>
              )
            }
            return null
          })()}
          <div className="flex-1">
            <h3 className="font-semibold">{chatbot.headerTitle || chatbot.name}</h3>
            {chatbot.headerDescription && (
              <p className="text-xs opacity-90">{chatbot.headerDescription}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const showAvatar = chatbot.showMessageAvatar !== undefined ? chatbot.showMessageAvatar : true
              const showUserAvatar = chatbot.showUserAvatar !== undefined ? chatbot.showUserAvatar : showAvatar
              const showName = chatbot.showMessageName !== undefined ? chatbot.showMessageName : false
              const namePosition = (chatbot.messageNamePosition || 'top-of-message') as 'top-of-message' | 'top-of-avatar' | 'right-of-avatar'
              // Debug: uncomment to check the actual value
              // console.log('namePosition:', namePosition, 'chatbot.messageNamePosition:', chatbot.messageNamePosition)
              const avatarPosition = (chatbot as any).messageAvatarPosition || 'top-of-message'
              const displayName = chatbot.messageName || chatbot.headerTitle || chatbot.name || 'Assistant'
              
              // Helper function to render bot avatar
              const renderBotAvatar = () => {
                if (!showAvatar) return null
                const avatarType = chatbot.avatarType || 'icon'
                if (avatarType === 'image' && chatbot.avatarImageUrl) {
                  return (
                    <img 
                      src={chatbot.avatarImageUrl} 
                      alt={chatbot.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  )
                } else {
                  const IconName = chatbot.avatarIcon || 'Bot'
                  const IconComponent = (Icons as any)[IconName] || Bot
                  const iconColor = chatbot.avatarIconColor || '#ffffff'
                  const bgColor = chatbot.avatarBackgroundColor || chatbot.primaryColor || '#3b82f6'
                  return (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: bgColor }}
                    >
                      <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
                    </div>
                  )
                }
              }
              
              return (
                <div key={message.id} className={message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                  {/* Name and Avatar Row - Above message (when avatar position is top-of-message) */}
                  {message.role === 'assistant' && avatarPosition === 'top-of-message' && (showName || showAvatar) && (
                    <div className="flex items-center gap-2 mb-1 justify-start">
                      {/* Message Name - Left of Avatar (when name position is top-of-avatar) */}
                      {showName && namePosition === 'top-of-avatar' && (
                        <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                          {displayName}
                        </span>
                      )}
                      {/* Avatar */}
                      {renderBotAvatar()}
                      {/* Message Name - Right of Avatar (when name position is right-of-avatar) */}
                      {showName && namePosition === 'right-of-avatar' && (
                        <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                          {displayName}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Name and Avatar Row - When name position is right-of-avatar and avatar is top-of-message (ensure it shows) */}
                  {message.role === 'assistant' && avatarPosition === 'top-of-message' && showName && namePosition === 'right-of-avatar' && !showAvatar && (
                    <div className="flex items-center gap-2 mb-1 justify-start">
                      {renderBotAvatar()}
                      <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                        {displayName}
                      </span>
                    </div>
                  )}
                  {/* Message Name - Above message (when name position is top-of-message) */}
                  {message.role === 'assistant' && showName && namePosition === 'top-of-message' && (
                    <div className="mb-1">
                      <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                        {displayName}
                      </span>
                    </div>
                  )}
                  {/* Message Name - Above avatar (when name position is top-of-avatar and avatar is left-of-message) */}
                  {message.role === 'assistant' && avatarPosition === 'left-of-message' && showName && namePosition === 'top-of-avatar' && (
                    <div className="mb-1">
                      <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                        {displayName}
                      </span>
                    </div>
                  )}
                  {/* Message Name - Right of avatar (when name position is right-of-avatar and avatar is left-of-message) */}
                  {message.role === 'assistant' && avatarPosition === 'left-of-message' && showName && namePosition === 'right-of-avatar' && (
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                        {displayName}
                      </span>
                    </div>
                  )}
                  {/* Message Bubble */}
                  <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* Bot Avatar - Left of message (when avatar position is left-of-message) */}
                    {message.role === 'assistant' && avatarPosition === 'left-of-message' && renderBotAvatar()}
                    {/* User Avatar (if enabled) */}
                    {message.role === 'user' && showUserAvatar && (() => {
                      const userAvatarType = (chatbot as any).userAvatarType || 'icon'
                      if (userAvatarType === 'image' && (chatbot as any).userAvatarImageUrl) {
                        return (
                          <img 
                            src={(chatbot as any).userAvatarImageUrl} 
                            alt="User"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )
                      } else {
                        const UserIconName = (chatbot as any).userAvatarIcon || 'User'
                        const UserIconComponent = (Icons as any)[UserIconName] || User
                        const userIconColor = (chatbot as any).userAvatarIconColor || '#6b7280'
                        const userBgColor = (chatbot as any).userAvatarBackgroundColor || '#e5e7eb'
                        return (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: userBgColor }}
                          >
                            <UserIconComponent className="h-5 w-5" style={{ color: userIconColor }} />
                          </div>
                        )
                      }
                    })()}
                    <div
                      className={`max-w-[80%] rounded-lg ${
                        message.role === 'user'
                          ? 'rounded-br-none'
                          : 'rounded-bl-none'
                      }`}
                      style={{
                        padding: message.role === 'user' 
                          ? ((chatbot as any).userBubblePadding || (chatbot as any).bubblePadding || '12px')
                          : ((chatbot as any).botBubblePadding || (chatbot as any).bubblePadding || '12px'),
                        backgroundColor: message.role === 'user' 
                          ? (chatbot.userMessageBackgroundColor || chatbot.primaryColor)
                          : (chatbot.botMessageBackgroundColor || '#f3f4f6'),
                        color: message.role === 'user' 
                          ? (chatbot.userMessageFontColor || 'white')
                          : chatbot.fontColor,
                        fontFamily: message.role === 'user' 
                          ? (chatbot.userMessageFontFamily || chatbot.fontFamily)
                          : chatbot.fontFamily,
                        fontSize: message.role === 'user' 
                          ? (chatbot.userMessageFontSize || chatbot.fontSize)
                          : chatbot.fontSize,
                        borderColor: chatbot.bubbleBorderColor || chatbot.borderColor,
                        borderWidth: chatbot.bubbleBorderWidth || chatbot.borderWidth,
                        borderRadius: chatbot.bubbleBorderRadius || undefined,
                      }}
                    >
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {message.attachments.map((attachment, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden">
                              {attachment.type === 'image' ? (
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name || 'Image'} 
                                  className="max-w-full h-auto max-h-64 object-contain rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              ) : (
                                <video 
                                  src={attachment.url} 
                                  controls 
                                  className="max-w-full h-auto max-h-64 rounded"
                                  onError={(e) => {
                                    (e.target as HTMLVideoElement).style.display = 'none'
                                  }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              )}
                              {attachment.name && (
                                <p className="text-xs text-gray-500 mt-1">{attachment.name}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: chatbot.borderColor }}>
                          <p className="text-xs font-semibold mb-1">Sources:</p>
                          <div className="space-y-1">
                            {message.citations.map((citation, idx) => (
                              <a
                                key={idx}
                                href={citation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline block"
                              >
                                {citation}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {message.role === 'user' && showUserAvatar && (() => {
                      const userAvatarType = chatbot.userAvatarType || 'icon'
                      if (userAvatarType === 'image' && chatbot.userAvatarImageUrl) {
                        return (
                          <img 
                            src={chatbot.userAvatarImageUrl} 
                            alt="User"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )
                      } else {
                        const UserIconName = chatbot.userAvatarIcon || 'User'
                        const UserIconComponent = (Icons as any)[UserIconName] || User
                        const userIconColor = chatbot.userAvatarIconColor || '#6b7280'
                        const userBgColor = chatbot.userAvatarBackgroundColor || '#e5e7eb'
                        return (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: userBgColor }}
                          >
                            <UserIconComponent className="h-5 w-5" style={{ color: userIconColor }} />
                          </div>
                        )
                      }
                    })()}
                  </div>
                </div>
              )
            })}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                {(() => {
                  const avatarType = chatbot.avatarType || 'icon'
                  if (avatarType === 'image' && chatbot.avatarImageUrl) {
                    return (
                      <img 
                        src={chatbot.avatarImageUrl} 
                        alt={chatbot.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )
                  } else {
                    const IconName = chatbot.avatarIcon || 'Bot'
                    const IconComponent = (Icons as any)[IconName] || Bot
                    const iconColor = chatbot.avatarIconColor || '#ffffff'
                    const bgColor = chatbot.avatarBackgroundColor || chatbot.primaryColor || '#3b82f6'
                    return (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: bgColor }}
                      >
                        <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
                      </div>
                    )
                  }
                })()}
                <div
                  className="rounded-lg p-3 rounded-bl-none flex items-center justify-center"
                  style={{
                    backgroundColor: '#f3f4f6',
                    borderColor: chatbot.bubbleBorderColor || chatbot.borderColor,
                    borderWidth: chatbot.bubbleBorderWidth || chatbot.borderWidth,
                    color: chatbot.typingIndicatorColor || '#6b7280'
                  }}
                >
                  {(() => {
                    const c = chatbot.typingIndicatorColor || '#6b7280'
                    switch (chatbot.typingIndicatorStyle || 'spinner') {
                      case 'dots':
                        return (
                          <div className="flex gap-1 items-end" aria-label="Assistant is typing">
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out' }} />
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out 0.15s' }} />
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out 0.3s' }} />
                            <style jsx>{`
                              @keyframes ai-dot { 0%, 80%, 100% { transform: translateY(0); opacity: .4 } 40% { transform: translateY(-3px); opacity: 1 } }
                            `}</style>
                          </div>
                        )
                      case 'pulse':
                        return (
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c, animation: 'ai-pulse 1.2s infinite ease-in-out' }} aria-label="Assistant is typing">
                            <style jsx>{`
                              @keyframes ai-pulse { 0% { transform: scale(1); opacity: .6 } 50% { transform: scale(1.2); opacity: 1 } 100% { transform: scale(1); opacity: .6 } }
                            `}</style>
                          </div>
                        )
                      case 'bounce':
                        return (
                          <div className="flex gap-1 items-end" aria-label="Assistant is typing">
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0s' }} />
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0.2s' }} />
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0.4s' }} />
                            <style jsx>{`
                              @keyframes ai-bounce { 0%, 80%, 100% { transform: translateY(0) } 40% { transform: translateY(-5px) } }
                            `}</style>
                          </div>
                        )
                      case 'spinner':
                      default:
                        return <Loader2 className="h-4 w-4 animate-spin" style={{ color: c }} aria-label="Assistant is typing" />
                    }
                  })()}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Follow-up Questions */}
        {chatbot.followUpQuestions && chatbot.followUpQuestions.length > 0 && !isLoading && (
          <div className="px-4 pb-2 space-y-2">
            {chatbot.followUpQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleFollowUpClick(question)}
                disabled={isLoading || selectedFollowUp === question}
                className="w-full text-left p-2 rounded text-sm hover:opacity-80 transition-opacity"
                style={{
                  borderColor: chatbot.borderColor,
                  borderWidth: chatbot.borderWidth,
                  backgroundColor: chatbot.messageBoxColor,
                  color: chatbot.fontColor,
                }}
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="p-4 border-t" style={{ borderColor: chatbot.borderColor, borderWidth: chatbot.borderWidth }}>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative group">
                  <div className="rounded-lg overflow-hidden border" style={{ borderColor: chatbot.borderColor }}>
                    {attachment.type === 'image' ? (
                      <img 
                        src={attachment.url} 
                        alt={attachment.name || 'Image'} 
                        className="w-20 h-20 object-cover"
                      />
                    ) : (
                      <video 
                        src={attachment.url} 
                        className="w-20 h-20 object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {attachment.name && (
                    <p className="text-xs text-gray-500 mt-1 truncate w-20">{attachment.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form 
          onSubmit={handleSubmit} 
          style={{ 
            paddingLeft: (chatbot as any).footerPaddingX || chatbot.headerPaddingX || '16px',
            paddingRight: (chatbot as any).footerPaddingX || chatbot.headerPaddingX || '16px',
            paddingTop: (chatbot as any).footerPaddingY || chatbot.headerPaddingY || '16px',
            paddingBottom: (chatbot as any).footerPaddingY || chatbot.headerPaddingY || '16px',
            borderTopColor: (chatbot as any).footerBorderColor || chatbot.borderColor,
            borderTopWidth: (chatbot as any).footerBorderWidth || chatbot.borderWidth,
            borderBottomLeftRadius: (chatbot as any).footerBorderRadius || chatbot.chatWindowBorderRadius || chatbot.borderRadius,
            borderBottomRightRadius: (chatbot as any).footerBorderRadius || chatbot.chatWindowBorderRadius || chatbot.borderRadius,
            backgroundColor: (chatbot as any).footerBgColor || chatbot.messageBoxColor
          }}
        >
          <div className="flex gap-2">
            {(() => {
              const fileUploadLayout = (chatbot as any).fileUploadLayout || 'attach-first'
              const attachButton = chatbot.enableFileUpload ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </>
              ) : null

              const voiceButton = chatbot.enableVoiceAgent ? (
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isLoading || !isVoiceEnabled}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              ) : null

              const voiceOutputButton = chatbot.enableVoiceAgent ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleVoiceOutput}
                  disabled={isLoading || !isVoiceEnabled}
                  title={isSpeaking ? "Stop voice output" : "Resume voice output"}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              ) : null

              const inputField = (
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                  style={{
                    fontFamily: chatbot.fontFamily,
                    fontSize: chatbot.fontSize,
                    color: (chatbot as any).footerInputFontColor || chatbot.fontColor,
                    backgroundColor: (chatbot as any).footerInputBgColor || chatbot.messageBoxColor,
                    borderColor: (chatbot as any).footerInputBorderColor || chatbot.borderColor,
                    borderWidth: (chatbot as any).footerInputBorderWidth || chatbot.borderWidth,
                    borderRadius: (chatbot as any).footerInputBorderRadius || chatbot.borderRadius,
                  }}
                />
              )

              const sendButtonIconName = (chatbot as any).sendButtonIcon || 'Send'
              const SendIconComponent = (Icons as any)[sendButtonIconName] || Send
              const sendButtonRounded = (chatbot as any).sendButtonRounded !== undefined ? (chatbot as any).sendButtonRounded : false
              const sendButtonBgColor = (chatbot as any).sendButtonBgColor || chatbot.primaryColor
              const sendButtonIconColor = (chatbot as any).sendButtonIconColor || '#ffffff'
              const sendButtonShadowColor = (chatbot as any).sendButtonShadowColor || '#000000'
              const sendButtonShadowBlur = (chatbot as any).sendButtonShadowBlur || '0px'
              const sendButtonPaddingX = (chatbot as any).sendButtonPaddingX || '8px'
              const sendButtonPaddingY = (chatbot as any).sendButtonPaddingY || '8px'
              
              const sendButton = (
                <Button
                  type="submit"
                  disabled={(!input.trim() && attachments.length === 0) || isLoading}
                  style={{
                    backgroundColor: sendButtonBgColor,
                    borderRadius: sendButtonRounded ? '50%' : undefined,
                    boxShadow: sendButtonShadowBlur !== '0px' ? `0 0 ${sendButtonShadowBlur} ${sendButtonShadowColor}` : undefined,
                    paddingLeft: sendButtonPaddingX,
                    paddingRight: sendButtonPaddingX,
                    paddingTop: sendButtonPaddingY,
                    paddingBottom: sendButtonPaddingY,
                  }}
                >
                  <SendIconComponent className="h-4 w-4" style={{ color: sendButtonIconColor }} />
                </Button>
              )

              // Render based on layout
              if (fileUploadLayout === 'input-first') {
                return (
                  <>
                    {inputField}
                    {attachButton}
                    {voiceButton}
                    {voiceOutputButton}
                    {sendButton}
                  </>
                )
              } else {
                // attach-first (default)
                return (
                  <>
                    {attachButton}
                    {voiceButton}
                    {voiceOutputButton}
                    {inputField}
                    {sendButton}
                  </>
                )
              }
            })()}
          </div>
        </form>
      </>
    )
  }

  const popoverPositionStyle = (): React.CSSProperties => {
    const x = chatbot as any
    const pos = (x.widgetPosition || 'bottom-right') as string
    const offsetX = x.widgetOffsetX || '20px'
    const offsetY = x.widgetOffsetY || '20px'
    const style: React.CSSProperties = { position: 'fixed' }
    if (pos.includes('bottom')) (style as any).bottom = offsetY; else (style as any).top = offsetY
    if (pos.includes('right')) (style as any).right = offsetX
    if (pos.includes('left')) (style as any).left = offsetX
    if (pos.includes('center')) {
      (style as any).left = '50%'
      ;(style as any).transform = 'translateX(-50%)'
    }
    return style
  }

  const containerStyle: React.CSSProperties = (() => {
    const shadowColor = (chatbot as any).chatWindowShadowColor || chatbot.shadowColor || '#000000'
    const shadowBlur = (chatbot as any).chatWindowShadowBlur || chatbot.shadowBlur || '4px'
    
    // Base background style from emulator config
    const backgroundStyle: React.CSSProperties = {}
    if (emulatorConfig.backgroundColor) {
      backgroundStyle.backgroundColor = emulatorConfig.backgroundColor
    }
    if (emulatorConfig.backgroundImage) {
      backgroundStyle.backgroundImage = `url(${emulatorConfig.backgroundImage})`
      backgroundStyle.backgroundSize = 'cover'
      backgroundStyle.backgroundPosition = 'center'
      backgroundStyle.backgroundRepeat = 'no-repeat'
    }
    
    if (previewDeploymentType === 'popover') {
      const x = chatbot as any
      const pos = (x.widgetPosition || 'bottom-right') as string
      const offsetX = x.widgetOffsetX || '20px'
      const offsetY = x.widgetOffsetY || '20px'
      const widgetSize = parseFloat(x.widgetSize || '60px') || 60
      const widgetSizePx = typeof x.widgetSize === 'string' && x.widgetSize.includes('px') 
        ? parseFloat(x.widgetSize) 
        : widgetSize
      
      // Calculate popover position - place it to the right of the widget button
      const popoverStyle: React.CSSProperties = {
        position: 'fixed',
        width: (chatbot as any).chatWindowWidth || '380px',
        height: (chatbot as any).chatWindowHeight || '600px',
        border: `${chatbot.chatWindowBorderWidth || chatbot.borderWidth} solid ${chatbot.chatWindowBorderColor || chatbot.borderColor}`,
        borderRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
        boxShadow: `0 0 ${shadowBlur} ${shadowColor}`,
        zIndex: (chatbot as any).widgetZIndex || 9999,
        backgroundColor: emulatorConfig.backgroundColor || chatbot.messageBoxColor,
        backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
        backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
        backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
        overflow: 'hidden',
        paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
        paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
        paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
        paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
      }
      
      // Position popover relative to widget button
      if (pos.includes('bottom')) {
        (popoverStyle as any).bottom = offsetY
      } else {
        (popoverStyle as any).top = offsetY
      }
      
      // Place popover to the right of widget button (horizontally adjacent)
      // Calculate widget button's right edge position
      if (pos.includes('right')) {
        // Widget is on right side, popover appears to the left of widget
        // Position popover so its right edge is at widget's left edge minus gap
        const rightOffset = `calc(${offsetX} + ${widgetSizePx}px + 10px)`
        ;(popoverStyle as any).right = rightOffset
      } else if (pos.includes('left')) {
        // Widget is on left side, popover appears to the right of widget
        // Position popover so its left edge is at widget's right edge plus gap
        const leftOffset = `calc(${offsetX} + ${widgetSizePx}px + 10px)`
        ;(popoverStyle as any).left = leftOffset
      } else if (pos.includes('center')) {
        // For center positions, place popover to the right of widget
        ;(popoverStyle as any).left = `calc(50% + ${widgetSizePx / 2}px + 10px)`
        ;(popoverStyle as any).transform = 'translateX(0)'
      }
      
      return popoverStyle
    }
    if (previewDeploymentType === 'popup-center') {
      return {
        width: '90%',
        maxWidth: '640px',
        maxHeight: '80vh',
        height: '80vh',
        border: `${chatbot.chatWindowBorderWidth || chatbot.borderWidth} solid ${chatbot.chatWindowBorderColor || chatbot.borderColor}`,
        borderRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
        boxShadow: `0 0 ${shadowBlur} ${shadowColor}`,
        zIndex: 10001,
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: emulatorConfig.backgroundColor || chatbot.messageBoxColor,
        backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
        backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
        backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
        paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
        paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
        paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
      }
    }
    // fullpage
    return { 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: emulatorConfig.backgroundColor,
      backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
      backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
      backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
      backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
      paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
      paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
      paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
      paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
    }
  })()

  const overlayStyle: React.CSSProperties | undefined = previewDeploymentType === 'popup-center'
    ? { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000 }
    : undefined

  const shouldShowWidgetButton = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'
  const shouldShowContainer = previewDeploymentType === 'fullpage' ? true : isOpen

  // Render ChatKit if engine type is chatkit
  // Note: ChatKit supports all deployment types (popover, fullpage, popup-center)
  if (chatbot.engineType === 'chatkit' && chatbot.chatkitAgentId) {
    return <ChatKitRenderer chatbot={chatbot} previewDeploymentType={previewDeploymentType} isInIframe={isInIframe} />
  }

  // Full page layout with sidebar
  if (previewDeploymentType === 'fullpage' && !isInIframe) {
    return (
      <div className="flex h-screen w-screen overflow-hidden" style={{
        backgroundColor: emulatorConfig.backgroundColor,
        backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
        backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
        backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
      }}>
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r bg-white/95 backdrop-blur-sm flex flex-col overflow-hidden`}>
          {sidebarOpen && (
            <>
              {/* Sidebar Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg">Chat History</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* New Chat Button */}
              <div className="p-4 border-b">
                <Button onClick={handleNewChat} className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
              
              {/* Chat History List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group ${
                        currentChatId === chat.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <p className="text-sm font-medium truncate">{chat.title}</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {chat.messages.length} messages
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {chat.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {chatHistory.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No chat history</p>
                      <p className="text-xs mt-1">Start a new chat to begin</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Bar with Menu and Preview Type */}
          <div className="h-14 border-b bg-white/95 backdrop-blur-sm flex items-center justify-between px-4 z-10">
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <h1 className="font-semibold">{chatbot?.name || 'Chat'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Preview Type:</Label>
              <Select 
                value={previewDeploymentType} 
                onValueChange={(value: 'popover' | 'fullpage' | 'popup-center') => {
                  setPreviewDeploymentType(value)
                  if (value === 'popover' || value === 'popup-center') {
                    setIsOpen(false)
                  } else {
                    setIsOpen(true)
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popover">Popover</SelectItem>
                  <SelectItem value="popup-center">Popup Center</SelectItem>
                  <SelectItem value="fullpage">Full Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Chat Container */}
          <div className="flex-1 flex flex-col" style={chatStyle}>
            {renderChatContent()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Preview Type Selector - Fixed at top right (only show when not in iframe) */}
      {!isInIframe && (
        <div className="fixed top-4 right-4 z-[10004] flex items-center gap-2 bg-white/90 backdrop-blur-sm border rounded-md p-2 shadow-lg">
          <Label className="text-xs whitespace-nowrap">Preview Type:</Label>
          <Select 
            value={previewDeploymentType} 
            onValueChange={(value: 'popover' | 'fullpage' | 'popup-center') => {
              setPreviewDeploymentType(value)
              if (value === 'popover' || value === 'popup-center') {
                setIsOpen(false)
              } else {
                setIsOpen(true)
              }
            }}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popover">Popover</SelectItem>
              <SelectItem value="popup-center">Popup Center</SelectItem>
              <SelectItem value="fullpage">Full Page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {overlayStyle && shouldShowContainer && <div style={overlayStyle} aria-hidden="true" onClick={() => setIsOpen(false)} />}
      {/* Widget launcher button */}
      {shouldShowWidgetButton && (
        <button
          type="button"
          aria-label={isOpen ? "Close chat" : "Open chat"}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            ...popoverPositionStyle(),
            width: (chatbot as any).widgetSize || '60px',
            height: (chatbot as any).widgetSize || '60px',
            borderRadius: (chatbot as any).widgetBorderRadius || '50%',
            border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
            background: (chatbot as any).widgetBackgroundColor || chatbot.primaryColor,
            boxShadow: (chatbot as any).widgetShadowBlur ? `0 0 ${(chatbot as any).widgetShadowBlur} ${(chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'}` : undefined,
            zIndex: ((chatbot as any).widgetZIndex || 9999) + 1, // Higher than popover to stay on top
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isOpen ? (
            <X className="h-6 w-6" style={{ color: chatbot?.avatarIconColor || '#ffffff' }} />
          ) : (
            (() => {
              const avatarType = chatbot?.avatarType || 'icon'
              if (avatarType === 'image' && chatbot?.avatarImageUrl) {
                return <img src={chatbot.avatarImageUrl} alt="Chat" style={{ width: '60%', height: '60%', borderRadius: '50%', objectFit: 'cover' }} />
              }
              const IconName = (chatbot?.avatarIcon || 'Bot') as string
              const IconComponent = (Icons as any)[IconName] || Bot
              const iconColor = chatbot?.avatarIconColor || '#ffffff'
              return <IconComponent className="h-6 w-6" style={{ color: iconColor }} />
            })()
          )}
        </button>
      )}

      {/* Chat container */}
      {shouldShowContainer && (
        <div className="flex flex-col relative" style={containerStyle}>
          {/* Emulator text and description overlay - positioned below header */}
          {(emulatorConfig.text || emulatorConfig.description) && (
            <div className="absolute top-0 left-0 right-0 z-[10003] p-4 bg-black/50 text-white backdrop-blur-sm">
              {emulatorConfig.text && (
                <h2 className="text-lg font-semibold mb-2">{emulatorConfig.text}</h2>
              )}
              {emulatorConfig.description && (
                <p className="text-sm opacity-90">{emulatorConfig.description}</p>
              )}
            </div>
          )}
          {/* Close for popover/popup-center */}
          {shouldShowWidgetButton && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{ 
                position: 'absolute', 
                top: (chatbot as any).closeButtonOffsetY || '8px', 
                right: (chatbot as any).closeButtonOffsetX || '8px', 
                background: 'transparent', 
                border: 0, 
                color: chatbot.headerFontColor || '#fff', 
                zIndex: 10002 
              }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="flex flex-col h-full" style={chatStyle}>
      {/* Header */}
      <div 
        className="flex items-center gap-3"
        style={{ 
          paddingLeft: (chatbot as any).headerPaddingX || '16px',
          paddingRight: (chatbot as any).headerPaddingX || '16px',
          paddingTop: (chatbot as any).headerPaddingY || '16px',
          paddingBottom: (chatbot as any).headerPaddingY || '16px',
          borderColor: (chatbot as any).headerBorderColor || chatbot.borderColor,
          borderBottomWidth: (chatbot as any).headerBorderEnabled === false ? 0 : (parseInt((chatbot.borderWidth || '1').toString()) || 1),
          backgroundColor: chatbot.headerBgColor || chatbot.primaryColor,
          color: chatbot.headerFontColor || 'white',
          fontFamily: chatbot.headerFontFamily || chatbot.fontFamily,
          borderTopLeftRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
          borderTopRightRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius
        }}
      >
        {/* Header Logo (separate from avatar) - if logo is set, don't show avatar */}
        {chatbot.headerLogo ? (
          <img 
            src={chatbot.headerLogo} 
            alt={chatbot.name}
            className="w-8 h-8 object-contain flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : ((chatbot as any).headerShowAvatar !== false) && (() => {
          // Use header avatar config, fallback to message avatar config for backward compatibility
          const headerAvatarType = chatbot.headerAvatarType || chatbot.avatarType || 'icon'
          if (headerAvatarType === 'image' && (chatbot.headerLogo || chatbot.headerAvatarImageUrl)) {
            return (
              <img 
                src={chatbot.headerLogo || chatbot.headerAvatarImageUrl || ''} 
                alt={chatbot.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )
          } else if (headerAvatarType === 'icon') {
            const IconName = chatbot.headerAvatarIcon || chatbot.avatarIcon || 'Bot'
            const IconComponent = (Icons as any)[IconName] || Bot
            const iconColor = chatbot.headerAvatarIconColor || chatbot.avatarIconColor || '#ffffff'
            const bgColor = chatbot.headerAvatarBackgroundColor || chatbot.avatarBackgroundColor || chatbot.primaryColor || '#3b82f6'
            return (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: bgColor }}
              >
                <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
              </div>
            )
          }
          return null
        })()}
        <div className="flex-1">
          <h3 className="font-semibold">{chatbot.headerTitle || chatbot.name}</h3>
          {chatbot.headerDescription && (
            <p className="text-xs opacity-90">{chatbot.headerDescription}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const showAvatar = chatbot.showMessageAvatar !== undefined ? chatbot.showMessageAvatar : true
            const showUserAvatar = chatbot.showUserAvatar !== undefined ? chatbot.showUserAvatar : showAvatar
            const showName = chatbot.showMessageName !== undefined ? chatbot.showMessageName : false
            const namePosition = (chatbot.messageNamePosition || 'top-of-message') as 'top-of-message' | 'top-of-avatar' | 'right-of-avatar'
            const avatarPosition = (chatbot as any).messageAvatarPosition || 'top-of-message'
            const displayName = chatbot.messageName || chatbot.headerTitle || chatbot.name || 'Assistant'
            
            // Helper function to render bot avatar
            const renderBotAvatar = () => {
              if (!showAvatar) return null
              const avatarType = chatbot.avatarType || 'icon'
              if (avatarType === 'image' && chatbot.avatarImageUrl) {
                return (
                  <img 
                    src={chatbot.avatarImageUrl} 
                    alt={chatbot.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )
              } else {
                const IconName = chatbot.avatarIcon || 'Bot'
                const IconComponent = (Icons as any)[IconName] || Bot
                const iconColor = chatbot.avatarIconColor || '#ffffff'
                const bgColor = chatbot.avatarBackgroundColor || chatbot.primaryColor || '#3b82f6'
                return (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: bgColor }}
                  >
                    <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
                  </div>
                )
              }
            }
            
            return (
              <div key={message.id} className={message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                {/* Name and Avatar Row - Above message (when avatar position is top-of-message) */}
                {message.role === 'assistant' && avatarPosition === 'top-of-message' && (showName || showAvatar) && (
                  <div className="flex items-center gap-2 mb-1 justify-start">
                    {/* Message Name - Left of Avatar (when name position is top-of-avatar) */}
                    {showName && namePosition === 'top-of-avatar' && (
                      <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                        {displayName}
                      </span>
                    )}
                    {/* Avatar */}
                    {renderBotAvatar()}
                    {/* Message Name - Right of Avatar (when name position is right-of-avatar) */}
                    {showName && namePosition === 'right-of-avatar' && (
                      <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                        {displayName}
                      </span>
                    )}
                  </div>
                )}
                {/* Name and Avatar Row - When name position is right-of-avatar and avatar is top-of-message (ensure it shows) */}
                {message.role === 'assistant' && avatarPosition === 'top-of-message' && showName && namePosition === 'right-of-avatar' && !showAvatar && (
                  <div className="flex items-center gap-2 mb-1 justify-start">
                    {renderBotAvatar()}
                    <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                      {displayName}
                    </span>
                  </div>
                )}
                {/* Message Name - Above message (when name position is top-of-message) */}
                {message.role === 'assistant' && showName && namePosition === 'top-of-message' && (
                  <div className="mb-1">
                    <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                      {displayName}
                    </span>
                  </div>
                )}
                {/* Message Name - Above avatar (when name position is top-of-avatar and avatar is left-of-message) */}
                {message.role === 'assistant' && avatarPosition === 'left-of-message' && showName && namePosition === 'top-of-avatar' && (
                  <div className="mb-1">
                    <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                      {displayName}
                    </span>
                  </div>
                )}
                {/* Message Name - Right of avatar (when name position is right-of-avatar and avatar is left-of-message) */}
                {message.role === 'assistant' && avatarPosition === 'left-of-message' && showName && namePosition === 'right-of-avatar' && (
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                      {displayName}
                    </span>
                  </div>
                )}
                {/* Message Bubble */}
                <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Bot Avatar - Left of message (when avatar position is left-of-message) */}
                  {message.role === 'assistant' && avatarPosition === 'left-of-message' && renderBotAvatar()}
                  {/* User Avatar (if enabled) */}
                  {message.role === 'user' && showUserAvatar && (() => {
                    const userAvatarType = (chatbot as any).userAvatarType || 'icon'
                    if (userAvatarType === 'image' && (chatbot as any).userAvatarImageUrl) {
                      return (
                        <img 
                          src={(chatbot as any).userAvatarImageUrl} 
                          alt="User"
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )
                    } else {
                      const UserIconName = (chatbot as any).userAvatarIcon || 'User'
                      const UserIconComponent = (Icons as any)[UserIconName] || User
                      const userIconColor = (chatbot as any).userAvatarIconColor || '#6b7280'
                      const userBgColor = (chatbot as any).userAvatarBackgroundColor || '#e5e7eb'
                      return (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: userBgColor }}
                        >
                          <UserIconComponent className="h-5 w-5" style={{ color: userIconColor }} />
                        </div>
                      )
                    }
                  })()}
                  <div
                className={`max-w-[80%] rounded-lg ${
                  message.role === 'user'
                    ? 'rounded-br-none'
                    : 'rounded-bl-none'
                }`}
                style={{
                  padding: message.role === 'user' 
                    ? ((chatbot as any).userBubblePadding || (chatbot as any).bubblePadding || '12px')
                    : ((chatbot as any).botBubblePadding || (chatbot as any).bubblePadding || '12px'),
                  backgroundColor: message.role === 'user' 
                    ? (chatbot.userMessageBackgroundColor || chatbot.primaryColor)
                    : (chatbot.botMessageBackgroundColor || '#f3f4f6'),
                  color: message.role === 'user' 
                    ? (chatbot.userMessageFontColor || 'white')
                    : chatbot.fontColor,
                  fontFamily: message.role === 'user' 
                    ? (chatbot.userMessageFontFamily || chatbot.fontFamily)
                    : chatbot.fontFamily,
                  fontSize: message.role === 'user' 
                    ? (chatbot.userMessageFontSize || chatbot.fontSize)
                    : chatbot.fontSize,
                  borderColor: chatbot.bubbleBorderColor || chatbot.borderColor,
                  borderWidth: chatbot.bubbleBorderWidth || chatbot.borderWidth,
                  borderRadius: chatbot.bubbleBorderRadius || undefined,
                }}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {message.attachments.map((attachment, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden">
                        {attachment.type === 'image' ? (
                          <img 
                            src={attachment.url} 
                            alt={attachment.name || 'Image'} 
                            className="max-w-full h-auto max-h-64 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <video 
                            src={attachment.url} 
                            controls 
                            className="max-w-full h-auto max-h-64 rounded"
                            onError={(e) => {
                              (e.target as HTMLVideoElement).style.display = 'none'
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                        {attachment.name && (
                          <p className="text-xs text-gray-500 mt-1">{attachment.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: chatbot.borderColor }}>
                    <p className="text-xs font-semibold mb-1">Sources:</p>
                    <div className="space-y-1">
                      {message.citations.map((citation, idx) => (
                        <a
                          key={idx}
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline block"
                        >
                          {citation}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
                  {message.role === 'user' && showUserAvatar && (() => {
                    const userAvatarType = chatbot.userAvatarType || 'icon'
                    if (userAvatarType === 'image' && chatbot.userAvatarImageUrl) {
                      return (
                        <img 
                          src={chatbot.userAvatarImageUrl} 
                          alt="User"
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )
                    } else {
                      const UserIconName = chatbot.userAvatarIcon || 'User'
                      const UserIconComponent = (Icons as any)[UserIconName] || User
                      const userIconColor = chatbot.userAvatarIconColor || '#6b7280'
                      const userBgColor = chatbot.userAvatarBackgroundColor || '#e5e7eb'
                      return (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: userBgColor }}
                        >
                          <UserIconComponent className="h-5 w-5" style={{ color: userIconColor }} />
                        </div>
                      )
                    }
                  })()}
                </div>
              </div>
            )
          })}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              {(() => {
                const avatarType = chatbot.avatarType || 'icon'
                if (avatarType === 'image' && chatbot.avatarImageUrl) {
                  return (
                    <img 
                      src={chatbot.avatarImageUrl} 
                      alt={chatbot.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  )
                } else {
                  const IconName = chatbot.avatarIcon || 'Bot'
                  const IconComponent = (Icons as any)[IconName] || Bot
                  const iconColor = chatbot.avatarIconColor || '#ffffff'
                  const bgColor = chatbot.avatarBackgroundColor || chatbot.primaryColor || '#3b82f6'
                  return (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: bgColor }}
                    >
                      <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
                    </div>
                  )
                }
              })()}
              <div
                className="rounded-lg p-3 rounded-bl-none flex items-center justify-center"
                style={{
                  backgroundColor: '#f3f4f6',
                  borderColor: chatbot.bubbleBorderColor || chatbot.borderColor,
                  borderWidth: chatbot.bubbleBorderWidth || chatbot.borderWidth,
                  color: chatbot.typingIndicatorColor || '#6b7280'
                }}
              >
                {(() => {
                  const c = chatbot.typingIndicatorColor || '#6b7280'
                  switch (chatbot.typingIndicatorStyle || 'spinner') {
                    case 'dots':
                      return (
                        <div className="flex gap-1 items-end" aria-label="Assistant is typing">
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out' }} />
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out 0.15s' }} />
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out 0.3s' }} />
                          <style jsx>{`
                            @keyframes ai-dot { 0%, 80%, 100% { transform: translateY(0); opacity: .4 } 40% { transform: translateY(-3px); opacity: 1 } }
                          `}</style>
                        </div>
                      )
                    case 'pulse':
                      return (
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c, animation: 'ai-pulse 1.2s infinite ease-in-out' }} aria-label="Assistant is typing">
                          <style jsx>{`
                            @keyframes ai-pulse { 0% { transform: scale(1); opacity: .6 } 50% { transform: scale(1.2); opacity: 1 } 100% { transform: scale(1); opacity: .6 } }
                          `}</style>
                        </div>
                      )
                    case 'bounce':
                      return (
                        <div className="flex gap-1 items-end" aria-label="Assistant is typing">
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0s' }} />
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0.2s' }} />
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0.4s' }} />
                          <style jsx>{`
                            @keyframes ai-bounce { 0%, 80%, 100% { transform: translateY(0) } 40% { transform: translateY(-5px) } }
                          `}</style>
                        </div>
                      )
                    case 'spinner':
                    default:
                      return <Loader2 className="h-4 w-4 animate-spin" style={{ color: c }} aria-label="Assistant is typing" />
                  }
                })()}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Follow-up Questions */}
      {chatbot.followUpQuestions && chatbot.followUpQuestions.length > 0 && !isLoading && (
        <div className="px-4 pb-2 space-y-2">
          {chatbot.followUpQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleFollowUpClick(question)}
              disabled={isLoading || selectedFollowUp === question}
              className="w-full text-left p-2 rounded text-sm hover:opacity-80 transition-opacity"
              style={{
                borderColor: chatbot.borderColor,
                borderWidth: chatbot.borderWidth,
                backgroundColor: chatbot.messageBoxColor,
                color: chatbot.fontColor,
              }}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="p-4 border-t" style={{ borderColor: chatbot.borderColor, borderWidth: chatbot.borderWidth }}>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group">
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: chatbot.borderColor }}>
                  {attachment.type === 'image' ? (
                    <img 
                      src={attachment.url} 
                      alt={attachment.name || 'Image'} 
                      className="w-20 h-20 object-cover"
                    />
                  ) : (
                    <video 
                      src={attachment.url} 
                      className="w-20 h-20 object-cover"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                {attachment.name && (
                  <p className="text-xs text-gray-500 mt-1 truncate w-20">{attachment.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          paddingLeft: (chatbot as any).footerPaddingX || chatbot.headerPaddingX || '16px',
          paddingRight: (chatbot as any).footerPaddingX || chatbot.headerPaddingX || '16px',
          paddingTop: (chatbot as any).footerPaddingY || chatbot.headerPaddingY || '16px',
          paddingBottom: (chatbot as any).footerPaddingY || chatbot.headerPaddingY || '16px',
          borderTopColor: (chatbot as any).footerBorderColor || chatbot.borderColor,
          borderTopWidth: (chatbot as any).footerBorderWidth || chatbot.borderWidth,
          borderBottomLeftRadius: (chatbot as any).footerBorderRadius || chatbot.chatWindowBorderRadius || chatbot.borderRadius,
          borderBottomRightRadius: (chatbot as any).footerBorderRadius || chatbot.chatWindowBorderRadius || chatbot.borderRadius,
          backgroundColor: (chatbot as any).footerBgColor || chatbot.messageBoxColor
        }}
      >
        <div className="flex gap-2">
          {(() => {
            const fileUploadLayout = (chatbot as any).fileUploadLayout || 'attach-first'
            const attachButton = chatbot.enableFileUpload ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </>
            ) : null

            const voiceButton = chatbot.enableVoiceAgent ? (
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isLoading || !isVoiceEnabled}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            ) : null

            const voiceOutputButton = chatbot.enableVoiceAgent ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleVoiceOutput}
                disabled={isLoading || !isVoiceEnabled}
                title={isSpeaking ? "Stop voice output" : "Resume voice output"}
              >
                {isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            ) : null

            const inputField = (
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
                style={{
                  fontFamily: chatbot.fontFamily,
                  fontSize: chatbot.fontSize,
                  color: (chatbot as any).footerInputFontColor || chatbot.fontColor,
                  backgroundColor: (chatbot as any).footerInputBgColor || chatbot.messageBoxColor,
                  borderColor: (chatbot as any).footerInputBorderColor || chatbot.borderColor,
                  borderWidth: (chatbot as any).footerInputBorderWidth || chatbot.borderWidth,
                  borderRadius: (chatbot as any).footerInputBorderRadius || chatbot.borderRadius,
                }}
              />
            )

            const sendButtonIconName = (chatbot as any).sendButtonIcon || 'Send'
            const SendIconComponent = (Icons as any)[sendButtonIconName] || Send
            const sendButtonRounded = (chatbot as any).sendButtonRounded !== undefined ? (chatbot as any).sendButtonRounded : false
            const sendButtonBgColor = (chatbot as any).sendButtonBgColor || chatbot.primaryColor
            const sendButtonIconColor = (chatbot as any).sendButtonIconColor || '#ffffff'
            const sendButtonShadowColor = (chatbot as any).sendButtonShadowColor || '#000000'
            const sendButtonShadowBlur = (chatbot as any).sendButtonShadowBlur || '0px'
            
            const sendButton = (
              <Button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                style={{
                  backgroundColor: sendButtonBgColor,
                  borderRadius: sendButtonRounded ? '50%' : undefined,
                  boxShadow: sendButtonShadowBlur !== '0px' ? `0 0 ${sendButtonShadowBlur} ${sendButtonShadowColor}` : undefined,
                }}
              >
                <SendIconComponent className="h-4 w-4" style={{ color: sendButtonIconColor }} />
              </Button>
            )

            // Render based on layout
            if (fileUploadLayout === 'input-first') {
              return (
                <>
                  {inputField}
                  {attachButton}
                  {voiceButton}
                  {voiceOutputButton}
                  {sendButton}
                </>
              )
            } else {
              // attach-first (default)
              return (
                <>
                  {attachButton}
                  {voiceButton}
                  {voiceOutputButton}
                  {inputField}
                  {sendButton}
                </>
              )
            }
          })()}
        </div>
      </form>
          </div>
        </div>
      )}
    </div>
  )
}
