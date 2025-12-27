'use client'

import React from 'react'
import { X, Bot, Menu, Loader2, Paperclip } from 'lucide-react'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'
import { getOverlayStyle } from '../utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'
import { extractNumericValue, convertToHex, isLightColor, hexToRgb } from './chatkit/themeUtils'
import { buildChatKitTheme } from './chatkit/configBuilder'
import { ChatKitGlobalStyles, getContainerStyle } from './chatkit/ChatKitStyles'
import { ChatKitStyleEnforcer } from './chatkit/ChatKitStyleEnforcer'
import { PWAInstallBanner } from './PWAInstallBanner'

interface ChatKitWrapperProps {
  chatkitModule: any
  chatbot: ChatbotConfig
  onError: (error: string) => void
  previewDeploymentType?: 'popover' | 'fullpage' | 'popup-center'
  isInIframe?: boolean
  isMobile?: boolean
  isPreview?: boolean  // True when in emulator preview mode (always show widget on popover)
  isDesktopPreview?: boolean  // True when in emulator desktop view
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  useChatKitInRegularStyle?: boolean
  isNative?: boolean
}

export function ChatKitWrapper({
  chatkitModule,
  chatbot,
  onError,
  previewDeploymentType = 'fullpage',
  isInIframe = false,
  isMobile = false,
  isPreview = false,
  isDesktopPreview = false,
  isOpen,
  setIsOpen,
  useChatKitInRegularStyle: propUseChatKitInRegularStyle,
  isNative = false
}: ChatKitWrapperProps) {
  // Trigger resize when popover opens to help ChatKit recalculate its internal iframe dimensions
  const prevIsOpenRef = React.useRef(isOpen)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!prevIsOpenRef.current && isOpen && previewDeploymentType !== 'fullpage') {
      // Delay the resize event to ensure DOM is ready
      const t = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 100)
      return () => clearTimeout(t)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, previewDeploymentType])

  // Handle file upload tool click
  React.useEffect(() => {
    if (!containerRef.current) return

    const handleToolClick = (e: MouseEvent) => {
      // Check if the clicked element is part of the file upload tool
      // Accessing DOM elements created by ChatKit is tricky as we don't control the render
      // But we know we injected a tool with label 'Attach file' and id 'file-upload'
      // ChatKit usually renders buttons with aria-label same as tool label or similar
      const target = e.target as HTMLElement
      const button = target.closest('button')

      if (button) {
        // Check for aria-label or title matching our tool
        const label = button.getAttribute('aria-label') || button.getAttribute('title') || ''
        const type = button.getAttribute('type')

        // If we identify it's our file upload button
        if (label.includes('Attach file') || label.includes('file-upload')) {
          e.preventDefault()
          e.stopPropagation()
          fileInputRef.current?.click()
        }
      }
    }

    const container = containerRef.current
    container.addEventListener('click', handleToolClick, true) // Capture phase to intercept early

    return () => {
      container.removeEventListener('click', handleToolClick, true)
    }
  }, [])

  // Handle file selection and inject into ChatKit via drag-and-drop simulation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && containerRef.current) {
      const files = Array.from(e.target.files)
      const container = containerRef.current

      // Find the textarea or input within ChatKit
      // ChatKit usually puts the composer in a textarea
      const composerInput = container.querySelector('textarea') || container.querySelector('input[type="text"]')

      if (composerInput) {
        // Create a DataTransfer object to simulate drag-and-drop
        const dt = new DataTransfer()
        files.forEach(file => dt.items.add(file))

        // Dispatch drop event
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer: dt
        })

        composerInput.dispatchEvent(dropEvent)

        // Also dispatch input event to ensure state update if needed, though drop usually handles it
        // Or if ChatKit listens to 'change' on a file input we can't see...
        // But drop is the standard way to inject files into a complex editor

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        console.warn('ChatKit composer input not found, cannot attach file')
        toast.error('Could not attach file: Editor input not found')
      }
    }
  }

  try {
    const chatkitOptions = chatbot.chatkitOptions || {}
    const useChatKitInRegularStyle = propUseChatKitInRegularStyle ?? (chatbot as any).useChatKitInRegularStyle === true

    // Build complete theme object
    const theme = buildChatKitTheme(chatbot)

    try {
      const { useChatKit, ChatKit } = chatkitModule

      const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
      const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
      const apiKey = isAgentSDK ? chatbot.openaiAgentSdkApiKey : chatbot.chatkitApiKey

      const { control } = useChatKit({
        api: {
          async getClientSecret(existing: any) {
            console.log('🔑 ChatKit getClientSecret called', {
              hasExisting: !!existing,
              agentId: agentId?.substring(0, 20) + '...',
              chatbotId: chatbot.id,
              hasApiKey: !!apiKey
            })
            try {
              if (existing) {
                console.log('🔄 Refreshing existing ChatKit session')
                const res = await fetch('/api/chatkit/session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'omit', // Don't send cookies - this is a public API
                  body: JSON.stringify({
                    agentId: agentId,
                    chatbotId: chatbot.id,
                    existing,
                    apiKey: apiKey
                  }),
                })
                console.log('🌐 Session refresh response status:', res.status)
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                  console.error('❌ Session refresh failed:', errorData)
                  const errorMessage = errorData.details
                    ? `${errorData.error}: ${errorData.details}`
                    : errorData.error || 'Failed to refresh ChatKit session'
                  throw new Error(errorMessage)
                }
                const { client_secret } = await res.json()
                console.log('✅ Session refreshed successfully')
                return client_secret
              }

              console.log('🆕 Creating new ChatKit session')
              const res = await fetch('/api/chatkit/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'omit', // Don't send cookies - this is a public API
                body: JSON.stringify({
                  agentId: agentId,
                  chatbotId: chatbot.id,
                  apiKey: apiKey
                }),
              })
              console.log('🌐 Session creation response status:', res.status)
              if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                console.error('❌ ChatKit session creation failed:', {
                  status: res.status,
                  statusText: res.statusText,
                  errorData
                })
                const errorMessage = errorData.details
                  ? `${errorData.error}: ${errorData.details}`
                  : errorData.error || 'Failed to create ChatKit session'
                throw new Error(errorMessage)
              }
              const sessionData = await res.json()
              console.log('📦 ChatKit session data received:', {
                has_secret: !!sessionData.client_secret,
                session_id: sessionData.session_id,
                secret_length: sessionData.client_secret?.length,
                secret_type: typeof sessionData.client_secret
              })
              if (!sessionData.client_secret) {
                console.error('❌ No client secret in response')
                throw new Error('No client secret received from session endpoint')
              }
              const clientSecret = String(sessionData.client_secret).trim()
              if (!clientSecret) {
                console.error('❌ Client secret is empty after trimming')
                throw new Error('Client secret is empty')
              }
              console.log('✅ Client secret validated, returning to ChatKit (first 20 chars):', clientSecret.substring(0, 20) + '...')
              return clientSecret
            } catch (error) {
              console.error('❌ Error in getClientSecret:', error)
              throw error
            }
          },
        },
        theme: theme as any,
        locale: chatkitOptions.locale as any,
        composer: (() => {
          // Build composer tools array
          const composerTools: any[] = []

          // Add file upload tool if enabled
          if (chatbot.enableFileUpload) {
            composerTools.push({
              id: 'file-upload',
              label: 'Attach file',
              icon: 'document',
              pinned: true
            })
          }

          // Add custom tools from chatkitOptions
          if (chatkitOptions.composer?.tools && Array.isArray(chatkitOptions.composer.tools)) {
            const customTools = chatkitOptions.composer.tools.map((tool: any) => {
              const supportedTool: any = {}
              if (tool.id !== undefined && tool.id !== null && tool.id !== '') supportedTool.id = tool.id
              if (tool.label !== undefined && tool.label !== null && tool.label !== '') supportedTool.label = tool.label
              if (tool.shortLabel !== undefined && tool.shortLabel !== null && tool.shortLabel !== '') supportedTool.shortLabel = tool.shortLabel
              if (tool.icon !== undefined && tool.icon !== null && tool.icon !== '') supportedTool.icon = tool.icon
              if (tool.pinned !== undefined) supportedTool.pinned = tool.pinned
              if (tool.type !== undefined && tool.type !== null && tool.type !== '') supportedTool.type = tool.type
              if (tool.accept !== undefined && tool.accept !== null && tool.accept !== '') supportedTool.accept = tool.accept
              if (tool.placeholderOverride !== undefined && tool.placeholderOverride !== null && tool.placeholderOverride !== '') supportedTool.placeholderOverride = tool.placeholderOverride
              return supportedTool
            }).filter((tool: any) => tool.id || tool.label)
            composerTools.push(...customTools)
          }

          // Return composer config if there's any configuration
          if (chatkitOptions.composer?.placeholder || composerTools.length > 0) {
            return {
              placeholder: chatkitOptions.composer?.placeholder,
              tools: composerTools.length > 0 ? composerTools : undefined
            }
          }
          return undefined
        })(),
        // Don't pass header config to ChatKit when using regular style header (regular header will be used instead)
        // Note: ChatKit header only supports specific properties - description, logo are NOT supported
        // The title should be an object with 'text' property, not a plain string
        header: useChatKitInRegularStyle ? undefined : (() => {
          const header = { ...(chatkitOptions.header || {}) }
          const supportedHeader: any = {}

          // ChatKit expects title as an object with 'text' property
          if (header.title !== undefined) {
            if (typeof header.title === 'object' && header.title !== null) {
              // Already an object, pass through
              supportedHeader.title = header.title
            } else if (typeof header.title === 'string' && header.title !== '') {
              // Convert string to expected object format
              supportedHeader.title = { text: header.title }
            }
          } else if ((chatbot as any).headerTitle) {
            // Support legacy formData.headerTitle - convert to object format
            supportedHeader.title = { text: (chatbot as any).headerTitle }
          }

          // Note: 'description' and 'logo' are NOT supported by ChatKit header
          // These fields are ignored to prevent "Unrecognized keys" errors

          // Pass customButtonLeft if present
          // FIXME: ChatKit error: Unrecognized key: "customButtonLeft"
          // This feature is currently unsupported by the underlying ChatKit library.
          /*
          if (header.customButtonLeft && Array.isArray(header.customButtonLeft) && header.customButtonLeft.length > 0) {
            supportedHeader.customButtonLeft = header.customButtonLeft.map((button: any) => {
              const supportedButton: any = {}
              if (button.icon !== undefined && button.icon !== null && button.icon !== '') {
                supportedButton.icon = button.icon
              }
              if (button.label !== undefined && button.label !== null && button.label !== '') {
                supportedButton.label = button.label
              }
              if (button.onClick !== undefined && typeof button.onClick === 'function') {
                supportedButton.onClick = button.onClick
              }
              return supportedButton
            }).filter((button: any) => button.icon || button.label)
          }
          */

          // Note: rightAction for close button is not added as ChatKit's rightAction API doesn't 
          // seem to accept icon property correctly. Close is handled by clicking overlay or
          // using the custom widget button to toggle.

          // Force removal of rightAction if it exists in source config to prevent errors
          if (supportedHeader.rightAction) {
            delete supportedHeader.rightAction
          }

          if (Object.keys(supportedHeader).length > 0) {
            console.log('ChatKitWrapper Header Config (sanitized):', JSON.stringify(supportedHeader, null, 2))
            return supportedHeader
          }
          return undefined
        })(),
        startScreen: chatkitOptions.startScreen ? (() => {
          const supportedStartScreen: any = {}

          if (chatkitOptions.startScreen.greeting) {
            supportedStartScreen.greeting = chatkitOptions.startScreen.greeting
          }

          if (chatkitOptions.startScreen.prompts && chatkitOptions.startScreen.prompts.length > 0) {
            // Valid ChatKit icon names (ChatKitIcon type)
            const validChatKitIcons = [
              'agent', 'analytics', 'atom', 'bolt', 'book-open', 'calendar', 'chart', 'check', 'check-circle',
              'chevron-left', 'chevron-right', 'circle-question', 'compass', 'confetti', 'cube', 'document',
              'dots-horizontal', 'empty-circle', 'globe', 'keys', 'lab', 'images', 'info', 'lifesaver',
              'lightbulb', 'mail', 'map-pin', 'maps', 'name', 'notebook', 'notebook-pencil', 'page-blank',
              'phone', 'plus', 'profile', 'profile-card', 'star', 'star-filled', 'search', 'sparkle',
              'sparkle-double', 'square-code', 'square-image', 'square-text', 'suitcase', 'settings-slider',
              'user', 'wreath', 'write', 'write-alt', 'write-alt2', 'bug'
            ]

            const filteredPrompts = chatkitOptions.startScreen.prompts.map((prompt: any) => {
              const supportedPrompt: any = {}
              // ChatKit supports 'label', 'prompt', and 'icon' properties
              // 'name' is not supported and will cause errors
              if (prompt.label !== undefined && prompt.label !== null && prompt.label !== '') {
                supportedPrompt.label = prompt.label
              }
              if (prompt.prompt !== undefined && prompt.prompt !== null && prompt.prompt !== '') {
                supportedPrompt.prompt = prompt.prompt
              }
              // Only include icon if it's a valid ChatKitIcon value
              if (prompt.icon !== undefined && prompt.icon !== null && prompt.icon !== '' &&
                validChatKitIcons.includes(prompt.icon)) {
                supportedPrompt.icon = prompt.icon
              }
              return supportedPrompt
            }).filter((prompt: any) => prompt.label || prompt.prompt)

            if (filteredPrompts.length > 0) {
              supportedStartScreen.prompts = filteredPrompts
            }
          }

          return Object.keys(supportedStartScreen).length > 0 ? supportedStartScreen : undefined
        })() : undefined,
        entities: chatkitOptions.entities ? {
          onTagSearch: chatkitOptions.entities.onTagSearch,
          onRequestPreview: chatkitOptions.entities.onRequestPreview,
        } : undefined,
        disclaimer: chatkitOptions.disclaimer && chatkitOptions.disclaimer.text && chatkitOptions.disclaimer.text.trim() !== '' ? {
          text: chatkitOptions.disclaimer.text.trim(),
        } : undefined,
        threadItemActions: (chatkitOptions.threadItemActions &&
          (chatkitOptions.threadItemActions.feedback === true || chatkitOptions.threadItemActions.retry === true)) ? {
          feedback: chatkitOptions.threadItemActions.feedback === true,
          retry: chatkitOptions.threadItemActions.retry === true,
        } : undefined,
        // History panel configuration
        history: chatkitOptions.history !== undefined ? (() => {
          const historyConfig: any = {}
          if (chatkitOptions.history.enabled !== undefined) {
            historyConfig.enabled = chatkitOptions.history.enabled
          }
          if (chatkitOptions.history.showDelete !== undefined) {
            historyConfig.showDelete = chatkitOptions.history.showDelete
          }
          if (chatkitOptions.history.showRename !== undefined) {
            historyConfig.showRename = chatkitOptions.history.showRename
          }
          return Object.keys(historyConfig).length > 0 ? historyConfig : undefined
        })() : undefined,
      })

      const deploymentType = previewDeploymentType || chatbot.deploymentType || 'fullpage'
      // Hide ChatKit widget button when:
      // - using regular style header
      // - OR on mobile when chat is open (fullpage covers screen)
      // EXCEPTION: In emulator preview mode (isPreview=true from URL), always show widget
      const shouldShowWidgetButton = (deploymentType === 'popover' || deploymentType === 'popup-center') &&
        !useChatKitInRegularStyle &&
        !(isMobile && isOpen && !isPreview)  // Don't hide in emulator preview mode

      const shouldShowContainer = deploymentType === 'fullpage' ? true : isOpen

      // Debug: Trace widget button visibility
      console.log('ChatKitWrapper Debug:', {
        shouldShowWidgetButton,
        shouldShowContainer,
        deploymentType,
        useChatKitInRegularStyle,
        isMobile,
        isOpen,
        isPreview,
        isDesktopPreview,
        // Show the breakdown of the condition
        condition1_deploymentOK: (deploymentType === 'popover' || deploymentType === 'popup-center'),
        condition2_notRegularStyle: !useChatKitInRegularStyle,
        condition3_shouldNotHide: !(isMobile && isOpen && !isPreview),
        hideExpression: (isMobile && isOpen && !isPreview)
      })

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
            ; (style as any).transform = 'translateX(-50%)'
        }
        return style
      }

      const containerStyle = getContainerStyle(deploymentType, chatbot)

      const overlayStyle = getOverlayStyle(deploymentType, chatbot, isOpen)

      // Check if we're in an embedded context
      const isEmbed = isInIframe || (typeof window !== 'undefined' && window.self !== window.top)

      // Handler for closing that also notifies parent
      const handleBackdropClose = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(false)
        // Also notify parent window for embed mode
        if (isEmbed) {
          window.parent.postMessage({ type: 'close-chat' }, '*')
        }
      }

      return (
        <>
          {/* Transparent click-to-close backdrop for embed mode (when no visible overlay) */}
          {isEmbed && (deploymentType === 'popover' || deploymentType === 'popup-center') && isOpen && !overlayStyle && !useChatKitInRegularStyle && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'transparent',
                zIndex: Z_INDEX.chatWidgetOverlay,
              }}
              aria-hidden="true"
              onClick={handleBackdropClose}
            />
          )}

          {overlayStyle && !useChatKitInRegularStyle && (
            <div style={overlayStyle} onClick={handleBackdropClose} />
          )}

          {(shouldShowWidgetButton && !useChatKitInRegularStyle) && (() => {
            const widgetAvatarStyle = chatbot.widgetAvatarStyle || 'circle'
            const widgetSize = (chatbot as any).widgetSize || '60px'

            let borderRadius: string
            if (widgetAvatarStyle === 'square') {
              borderRadius = (chatbot as any).widgetBorderRadius || '8px'
            } else {
              borderRadius = (chatbot as any).widgetBorderRadius || '50%'
            }



            if (widgetAvatarStyle === 'circle-with-label') {
              const widgetBgValue = (chatbot as any).widgetBackgroundColor || chatbot.primaryColor || '#3b82f6'
              const widgetLabelText = (chatbot as any).widgetLabelText || 'Chat'
              const defaultLabelColor = isLightColor(widgetBgValue) ? '#000000' : '#ffffff'
              const widgetLabelColor = (chatbot as any).widgetLabelColor || defaultLabelColor
              const widgetLabelFontSize = (chatbot as any).widgetLabelFontSize || '14px'
              const widgetBlur = (chatbot as any).widgetBackgroundBlur || 0
              const widgetOpacity = (chatbot as any).widgetBackgroundOpacity !== undefined ? (chatbot as any).widgetBackgroundOpacity : 100
              const widgetLabelShowIcon = (chatbot as any).widgetLabelShowIcon !== false
              const widgetLabelIconPosition = (chatbot as any).widgetLabelIconPosition || 'left'

              // Build box-shadow with all properties (offsetX offsetY blur spread color)
              const shadowX = extractNumericValue((chatbot as any).widgetShadowX || '0px')
              const shadowY = extractNumericValue((chatbot as any).widgetShadowY || '0px')
              const shadowBlur = extractNumericValue((chatbot as any).widgetShadowBlur || '0px')
              const shadowSpread = extractNumericValue((chatbot as any).widgetShadowSpread || '0px')
              const shadowColor = (chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'
              const boxShadow = (shadowBlur !== '0' || shadowX !== '0' || shadowY !== '0' || shadowSpread !== '0')
                ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
                : undefined

              // Use widgetLabelBorderRadius for circle-with-label, fallback to general borderRadius or default
              const labelBorderRadius = (chatbot as any).widgetLabelBorderRadius || borderRadius || '8px'

              const buttonStyle: React.CSSProperties = {
                ...popoverPositionStyle(),
                height: widgetSize,
                borderRadius: labelBorderRadius,
                border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
                boxShadow: boxShadow,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '0 16px',
                zIndex: Math.max(
                  ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget),
                  Z_INDEX.chatWidgetWindow + 10
                ),
                color: widgetLabelColor,
                fontSize: widgetLabelFontSize,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }

              // Apply glassmorphism effect
              if (widgetBlur > 0) {
                buttonStyle.backdropFilter = `blur(${widgetBlur}px)`
                buttonStyle.WebkitBackdropFilter = `blur(${widgetBlur}px)`
              }

              // Check if it's an image URL (starts with url(, http://, https://, or /)
              if (widgetBgValue.startsWith('url(') || widgetBgValue.startsWith('http://') || widgetBgValue.startsWith('https://') || widgetBgValue.startsWith('/')) {
                const imageUrl = widgetBgValue.startsWith('url(') ? widgetBgValue : `url(${widgetBgValue})`
                buttonStyle.backgroundImage = imageUrl
                buttonStyle.backgroundSize = 'cover'
                buttonStyle.backgroundPosition = 'center'
                buttonStyle.backgroundRepeat = 'no-repeat'
                // Apply opacity to background image
                if (widgetOpacity < 100) {
                  buttonStyle.backgroundColor = `rgba(255, 255, 255, ${widgetOpacity / 100})` // Fallback color with opacity
                }
              } else {
                // It's a color value - apply opacity
                if (widgetOpacity < 100) {
                  if (widgetBgValue.startsWith('rgba') || widgetBgValue.startsWith('rgb')) {
                    const rgbMatch = widgetBgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
                    if (rgbMatch) {
                      buttonStyle.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${widgetOpacity / 100})`
                    } else {
                      buttonStyle.backgroundColor = widgetBgValue
                    }
                  } else {
                    buttonStyle.backgroundColor = `rgba(${hexToRgb(widgetBgValue)}, ${widgetOpacity / 100})`
                  }
                } else {
                  buttonStyle.backgroundColor = widgetBgValue
                }
              }

              // Get the icon component for display
              const widgetAvatarType = (chatbot as any).widgetAvatarType || chatbot?.avatarType || 'icon'
              const widgetAvatarImageUrl = (chatbot as any).widgetAvatarImageUrl || chatbot?.avatarImageUrl
              const widgetAvatarIcon = (chatbot as any).widgetAvatarIcon || chatbot?.avatarIcon || 'Bot'
              const iconColor = chatbot?.avatarIconColor || widgetLabelColor

              const renderIcon = () => {
                if (widgetAvatarType === 'image' && widgetAvatarImageUrl) {
                  return <img src={widgetAvatarImageUrl} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                }
                const IconName = widgetAvatarIcon
                const IconComponent = (typeof IconName === 'string' && IconName.trim() !== '')
                  ? ((Icons as any)[IconName] || Bot)
                  : Bot
                return <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
              }

              return (
                <button
                  type="button"
                  aria-label={isOpen ? "Close chat" : "Open chat"}
                  onClick={() => setIsOpen(!isOpen)}
                  style={buttonStyle}
                >
                  {isOpen ? (
                    <X className="h-5 w-5" style={{ color: widgetLabelColor }} />
                  ) : (
                    <>
                      {widgetLabelShowIcon && widgetLabelIconPosition === 'left' && renderIcon()}
                      <span>{widgetLabelText}</span>
                      {widgetLabelShowIcon && widgetLabelIconPosition === 'right' && renderIcon()}
                    </>
                  )}
                </button>
              )
            }

            const widgetBgValue = (chatbot as any).widgetBackgroundColor || chatbot.primaryColor || '#3b82f6'
            const defaultIconColor = isLightColor(widgetBgValue) ? '#000000' : '#ffffff'

            const buttonContent = isOpen ? (
              <X className="h-6 w-6" style={{ color: chatbot?.avatarIconColor || defaultIconColor }} />
            ) : (() => {
              const widgetAvatarType = (chatbot as any).widgetAvatarType || chatbot?.avatarType || 'icon'
              const widgetAvatarImageUrl = (chatbot as any).widgetAvatarImageUrl || chatbot?.avatarImageUrl
              const widgetAvatarIcon = (chatbot as any).widgetAvatarIcon || chatbot?.avatarIcon || 'Bot'

              if (widgetAvatarType === 'image' && widgetAvatarImageUrl) {
                return <img src={widgetAvatarImageUrl} alt="Chat" style={{ width: '60%', height: '60%', borderRadius: widgetAvatarStyle === 'square' ? '8px' : '50%', objectFit: 'cover' }} />
              }
              const IconName = widgetAvatarIcon
              // Ensure IconName is a valid string before lookup
              const IconComponent = (typeof IconName === 'string' && IconName.trim() !== '')
                ? ((Icons as any)[IconName] || Bot)
                : Bot
              const iconColor = chatbot?.avatarIconColor || defaultIconColor
              return <IconComponent className="h-6 w-6" style={{ color: iconColor }} />
            })()

            const widgetBlur = (chatbot as any).widgetBackgroundBlur || 0
            const widgetOpacity = (chatbot as any).widgetBackgroundOpacity !== undefined ? (chatbot as any).widgetBackgroundOpacity : 100

            // Build box-shadow with all properties
            const shadowX = extractNumericValue((chatbot as any).widgetShadowX || '0px')
            const shadowY = extractNumericValue((chatbot as any).widgetShadowY || '0px')
            const shadowBlur = extractNumericValue((chatbot as any).widgetShadowBlur || '0px')
            const shadowSpread = extractNumericValue((chatbot as any).widgetShadowSpread || '0px')
            const shadowColor = (chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'
            const boxShadow = (shadowBlur !== '0' || shadowX !== '0' || shadowY !== '0' || shadowSpread !== '0')
              ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
              : undefined

            const buttonStyle: React.CSSProperties = {
              ...popoverPositionStyle(),
              width: widgetSize,
              height: widgetSize,
              borderRadius: borderRadius,
              border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
              boxShadow: boxShadow,
              zIndex: Math.max(
                ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget),
                Z_INDEX.chatWidgetWindow + 10
              ),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }

            // Apply glassmorphism effect
            if (widgetBlur > 0) {
              buttonStyle.backdropFilter = `blur(${widgetBlur}px)`
              buttonStyle.WebkitBackdropFilter = `blur(${widgetBlur}px)`
            }

            // Check if it's an image URL (starts with url(, http://, https://, or /)
            if (widgetBgValue.startsWith('url(') || widgetBgValue.startsWith('http://') || widgetBgValue.startsWith('https://') || widgetBgValue.startsWith('/')) {
              const imageUrl = widgetBgValue.startsWith('url(') ? widgetBgValue : `url(${widgetBgValue})`
              buttonStyle.backgroundImage = imageUrl
              buttonStyle.backgroundSize = 'cover'
              buttonStyle.backgroundPosition = 'center'
              buttonStyle.backgroundRepeat = 'no-repeat'
              // Apply opacity to background image
              if (widgetOpacity < 100) {
                buttonStyle.backgroundColor = `rgba(255, 255, 255, ${widgetOpacity / 100})` // Fallback color with opacity
              }
            } else {
              // It's a color value - apply opacity
              if (widgetOpacity < 100) {
                if (widgetBgValue.startsWith('rgba') || widgetBgValue.startsWith('rgb')) {
                  const rgbMatch = widgetBgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
                  if (rgbMatch) {
                    buttonStyle.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${widgetOpacity / 100})`
                  } else {
                    buttonStyle.backgroundColor = widgetBgValue
                  }
                } else {
                  buttonStyle.backgroundColor = `rgba(${hexToRgb(widgetBgValue)}, ${widgetOpacity / 100})`
                }
              } else {
                buttonStyle.backgroundColor = widgetBgValue
              }
            }

            return (
              <button
                type="button"
                aria-label={isOpen ? "Close chat" : "Open chat"}
                onClick={() => setIsOpen(!isOpen)}
                style={buttonStyle}
              >
                {buttonContent}
              </button>
            )
          })()}

          {shouldShowContainer && (
            <div
              className={`chatbot-popover-container ${isOpen ? 'chatbot-popover-enter' : 'chatbot-popover-exit'}`}
              style={{
                // When using regular style header, remove positioning and fill container
                ...(useChatKitInRegularStyle ? {
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  margin: 0,
                  padding: 0,
                } : {
                  ...containerStyle,
                  position: (deploymentType === 'popover' || deploymentType === 'popup-center') ? 'fixed' : 'relative',
                  ...(deploymentType === 'popover' ? (() => {
                    const pos = (chatbot as any).widgetPosition || 'bottom-right'
                    const offsetX = (chatbot as any).widgetOffsetX || '20px'
                    const offsetY = (chatbot as any).widgetOffsetY || '20px'
                    const widgetSize = (chatbot as any).widgetSize || '60px'
                    const style: React.CSSProperties = { position: 'fixed' }

                    if (pos.includes('bottom')) {
                      (style as any).bottom = `calc(${offsetY} + ${widgetSize} + 10px)`
                    } else {
                      (style as any).top = `calc(${offsetY} + ${widgetSize} + 10px)`
                    }

                    if (pos.includes('right')) {
                      (style as any).right = offsetX
                    } else if (pos.includes('left')) {
                      (style as any).left = offsetX
                    } else if (pos.includes('center')) {
                      (style as any).left = '50%';
                      (style as any).transform = 'translateX(-50%)'
                    }

                    return style
                  })() : deploymentType === 'popup-center' ? ({
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget
                      ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) + 1
                      : Z_INDEX.chatWidgetWindow,
                  } as React.CSSProperties) : {}),
                  zIndex: (chatbot as any).widgetZIndex || Z_INDEX.chatWidget,
                }),
              }}
            >
              <ChatKitGlobalStyles chatbot={chatbot} chatkitOptions={chatkitOptions} />
              <ChatKitStyleEnforcer chatbot={chatbot} />

              <div
                ref={containerRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Render banner only if we are in native mode AND NOT fullpage (since FullPageChatLayout handles fullpage) */}
                {(isNative && deploymentType !== 'fullpage') && (
                  <PWAInstallBanner chatbot={chatbot} isMobile={isMobile} />
                )}
                <div style={{ flex: 1, width: '100%', position: 'relative', overflow: 'hidden' }}>
                  <ChatKit control={control} style={{ width: '100%', height: '100%' }} />
                </div>
              </div>

              {/* Smooth Animation Styles */}
              <style jsx>{`
                @keyframes chatbotPopoverFadeIn {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 1;
                  }
                }

                @keyframes chatbotPopoverFadeOut {
                  from {
                    opacity: 1;
                  }
                  to {
                    opacity: 0;
                  }
                }

                .chatbot-popover-container {
                  transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
                }

                .chatbot-popover-enter {
                  animation: chatbotPopoverFadeIn 0.25s ease-out forwards;
                }

                .chatbot-popover-exit {
                  animation: chatbotPopoverFadeOut 0.2s ease-in forwards;
                }
              `}</style>
            </div>
          )}

          {/* Debug overlay removed */}


          {/* Hidden File Input for manual upload handling */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            onChange={handleFileSelect}
          />
        </>
      )
    } catch (error) {
      console.error('Error in inner ChatKit render:', error) // More specific logging
      throw error // Re-throw to be caught by outer catch
    }
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
