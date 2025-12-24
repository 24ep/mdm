'use client'

import React from 'react'
import { X, Bot } from 'lucide-react'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'
import { getOverlayStyle } from '../utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'
import { extractNumericValue, convertToHex, isLightColor, hexToRgb } from './chatkit/themeUtils'
import { buildChatKitTheme } from './chatkit/configBuilder'
import { ChatKitGlobalStyles, getContainerStyle } from './chatkit/ChatKitStyles'
import { ChatKitStyleEnforcer } from './chatkit/ChatKitStyleEnforcer'

interface ChatKitWrapperProps {
  chatkitModule: any
  chatbot: ChatbotConfig
  onError: (error: string) => void
  previewDeploymentType?: 'popover' | 'fullpage' | 'popup-center'
  isInIframe?: boolean
  isMobile?: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function ChatKitWrapper({
  chatkitModule,
  chatbot,
  onError,
  previewDeploymentType = 'fullpage',
  isInIframe = false,
  isMobile = false,
  isOpen,
  setIsOpen
}: ChatKitWrapperProps) {
  try {
    const chatkitOptions = chatbot.chatkitOptions || {}
    const useChatKitInRegularStyle = (chatbot as any).useChatKitInRegularStyle === true

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
            try {
              if (existing) {
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
                credentials: 'omit', // Don't send cookies - this is a public API
                body: JSON.stringify({
                  agentId: agentId,
                  chatbotId: chatbot.id,
                  apiKey: apiKey
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
        theme: theme as any,
        locale: chatkitOptions.locale as any,
        composer: chatkitOptions.composer ? {
          placeholder: chatkitOptions.composer.placeholder,
          tools: chatkitOptions.composer.tools?.map((tool: any) => {
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
        } : undefined,
        // Don't pass header config to ChatKit when using regular style header (regular header will be used instead)
        // Note: ChatKit header only supports specific properties - description, logo are NOT supported
        // The title should be an object with 'text' property, not a plain string
        header: useChatKitInRegularStyle ? undefined : (chatkitOptions.header ? (() => {
          const header = { ...chatkitOptions.header }

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
          return Object.keys(supportedHeader).length > 0 ? supportedHeader : undefined
        })() : undefined),
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
      // Hide ChatKit widget button when using regular style header OR when on mobile and chat is open (prevent overlap)
      const shouldShowWidgetButton = (deploymentType === 'popover' || deploymentType === 'popup-center') &&
        !useChatKitInRegularStyle &&
        !(isMobile && isOpen)

      const shouldShowContainer = deploymentType === 'fullpage' ? true : isOpen

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

      return (
        <>
          {overlayStyle && !useChatKitInRegularStyle && (
            <div style={overlayStyle} onClick={() => setIsOpen(false)} />
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

            const buttonContent = isOpen ? (
              <X className="h-6 w-6" style={{ color: chatbot?.avatarIconColor || '#ffffff' }} />
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
              const iconColor = chatbot?.avatarIconColor || '#ffffff'
              return <IconComponent className="h-6 w-6" style={{ color: iconColor }} />
            })()

            if (widgetAvatarStyle === 'circle-with-label') {
              const widgetBgValue = (chatbot as any).widgetBackgroundColor || chatbot.primaryColor || '#3b82f6'
              const widgetLabelText = (chatbot as any).widgetLabelText || 'Chat'
              const widgetLabelColor = (chatbot as any).widgetLabelColor || '#ffffff'
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
                zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget
                  ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) + 1
                  : Z_INDEX.chatWidgetWindow,
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
              zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget
                ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) + 1
                : Z_INDEX.chatWidgetWindow,
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
                  display: 'flex',
                  flexDirection: 'column'
                }),
              }}
            >
              <ChatKitGlobalStyles chatbot={chatbot} chatkitOptions={chatkitOptions} />
              <ChatKitStyleEnforcer chatbot={chatbot} />

              <div className="w-full h-full relative">
                <ChatKit control={control} className="w-full h-full" />
              </div>
            </div>
          )}
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
