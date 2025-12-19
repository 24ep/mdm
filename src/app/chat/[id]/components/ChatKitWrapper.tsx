'use client'

import React from 'react'
import { X, Bot } from 'lucide-react'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'
import { getOverlayStyle } from '../utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'

interface ChatKitWrapperProps {
  chatkitModule: any
  chatbot: ChatbotConfig
  onError: (error: string) => void
  previewDeploymentType?: 'popover' | 'fullpage' | 'popup-center'
  isInIframe?: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function ChatKitWrapper({ 
  chatkitModule, 
  chatbot, 
  onError,
  previewDeploymentType = 'fullpage',
  isInIframe = false,
  isOpen,
  setIsOpen
}: ChatKitWrapperProps) {
  const chatkitOptions = chatbot.chatkitOptions || {}
  const useChatKitInRegularStyle = (chatbot as any).useChatKitInRegularStyle === true
  
  // Helper to extract numeric value from string like "8px" -> "8"
  const extractNumericValue = (value: string | undefined): string => {
    if (!value) return '0'
    const match = value.toString().match(/(\d+(?:\.\d+)?)/)
    return match ? match[1] : '0'
  }
  
  // Build complete theme object with only valid ChatKit properties
  const theme = (() => {
    const validTheme: any = {}
    
    if (chatkitOptions.theme) {
      // Validate colorScheme - handle 'system' by detecting browser preference
      const colorScheme = chatkitOptions.theme.colorScheme as 'light' | 'dark' | 'system' | undefined
      if (colorScheme) {
        if (colorScheme === 'system') {
          // Detect system preference for light/dark mode
          const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          validTheme.colorScheme = prefersDark ? 'dark' : 'light'
        } else if (colorScheme === 'light' || colorScheme === 'dark') {
          validTheme.colorScheme = colorScheme
        }
      }
      
      // Validate density
      if (chatkitOptions.theme.density && 
          ['compact', 'normal', 'spacious'].includes(chatkitOptions.theme.density)) {
        validTheme.density = chatkitOptions.theme.density
      }
      
      // Validate radius
      if (chatkitOptions.theme.radius && 
          ['pill', 'round', 'soft', 'sharp'].includes(chatkitOptions.theme.radius)) {
        validTheme.radius = chatkitOptions.theme.radius
      }
    }
    
    // Helper function to validate and convert color values to hex format
    // ChatKit primarily supports hex color format (e.g., #D7263D)
    const isValidColor = (color: string): boolean => {
      if (!color || typeof color !== 'string' || color.trim() === '') {
        return false
      }
      const trimmed = color.trim()
      
      // ChatKit supports hex format - validate hex colors
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (hexPattern.test(trimmed)) {
        return true
      }
      
      // Reject rgba/rgb colors with opacity 0 (transparent) - ChatKit doesn't accept these
      if (trimmed.startsWith('rgba')) {
        const rgbaMatch = trimmed.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
        if (rgbaMatch) {
          const opacity = parseFloat(rgbaMatch[4])
          // Reject colors with opacity 0 or very close to 0
          if (opacity <= 0) {
            return false
          }
        }
        // ChatKit may not support rgba format - reject for now
        return false
      }
      
      // Reject rgb format - ChatKit expects hex
      if (trimmed.startsWith('rgb')) {
        return false
      }
      
      // Reject named colors - ChatKit expects hex
      return false
    }
    
    // Helper function to convert color to hex format for ChatKit
    const convertToHex = (color: string): string | null => {
      if (!color || typeof color !== 'string') {
        return null
      }
      const trimmed = color.trim()
      
      // Already hex format
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (hexPattern.test(trimmed)) {
        // Expand 3-digit hex to 6-digit
        if (trimmed.length === 4) {
          const r = trimmed[1]
          const g = trimmed[2]
          const b = trimmed[3]
          return `#${r}${r}${g}${g}${b}${b}`
        }
        return trimmed
      }
      
      // Convert rgb/rgba to hex (only if opacity > 0)
      const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(,\s*([\d.]+))?\)/)
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])
        const opacity = rgbMatch[5] ? parseFloat(rgbMatch[5]) : 1
        
        // Only convert if opacity > 0
        if (opacity > 0) {
          const toHex = (n: number) => {
            const hex = Math.round(n).toString(16)
            return hex.length === 1 ? '0' + hex : hex
          }
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`
        }
      }
      
      return null
    }
    
    // Build color object with validation
    const colorObj: any = {}
    let hasColor = false
    
    if (chatkitOptions.theme?.color) {
      // Accent color (required) - ChatKit expects hex format
      const accentPrimaryRaw = chatkitOptions.theme.color.accent?.primary || chatbot.primaryColor || '#3b82f6'
      const accentPrimaryHex = convertToHex(accentPrimaryRaw) || '#3b82f6'
      const accentLevel = chatkitOptions.theme.color.accent?.level ?? 2
      
      // Validate accent level (0-4)
      const validLevel = typeof accentLevel === 'number' && accentLevel >= 0 && accentLevel <= 4 
        ? accentLevel 
        : 2
      
      colorObj.accent = {
        primary: accentPrimaryHex,
        level: validLevel,
      }
      hasColor = true
      
      // Add icon color if provided - convert to hex
      if ((chatkitOptions.theme.color.accent as any)?.icon) {
        const iconHex = convertToHex((chatkitOptions.theme.color.accent as any).icon)
        if (iconHex) {
          ;(colorObj.accent as any).icon = iconHex
        }
      }
      
      // Only include color properties that are confirmed to be supported by ChatKit
      // ChatKit primarily supports accent colors - other color properties may not be supported
      // Commenting out unsupported properties to avoid "Invalid input" errors
      // if (chatkitOptions.theme.color.background) {
      //   const bgHex = convertToHex(chatkitOptions.theme.color.background)
      //   if (bgHex) {
      //     colorObj.background = bgHex
      //   }
      // }
      // if (chatkitOptions.theme.color.text) {
      //   const textHex = convertToHex(chatkitOptions.theme.color.text)
      //   if (textHex) {
      //     colorObj.text = textHex
      //   }
      // }
      // if (chatkitOptions.theme.color.secondary) {
      //   const secondaryHex = convertToHex(chatkitOptions.theme.color.secondary)
      //   if (secondaryHex) {
      //     colorObj.secondary = secondaryHex
      //   }
      // }
      // if (chatkitOptions.theme.color.border) {
      //   const borderHex = convertToHex(chatkitOptions.theme.color.border)
      //   if (borderHex) {
      //     colorObj.border = borderHex
      //   }
      // }
      // Surface colors - ChatKit supports SurfaceColors with background and foreground
      if (chatkitOptions.theme.color.surface) {
        const surface = chatkitOptions.theme.color.surface
        if (typeof surface === 'object' && surface !== null) {
          const surfaceObj: any = {}
          if (surface.background) {
            const bgHex = convertToHex(surface.background)
            if (bgHex) {
              surfaceObj.background = bgHex
            }
          }
          if (surface.foreground) {
            const fgHex = convertToHex(surface.foreground)
            if (fgHex) {
              surfaceObj.foreground = fgHex
            }
          }
          if (Object.keys(surfaceObj).length > 0) {
            colorObj.surface = surfaceObj
          }
        } else if (typeof surface === 'string') {
          // Legacy support: if surface is a string, convert to object with background
          const surfaceHex = convertToHex(surface)
          if (surfaceHex) {
            colorObj.surface = { background: surfaceHex }
          }
        }
      }
    } else {
      // Default color if none provided
      colorObj.accent = {
        primary: chatbot.primaryColor || '#3b82f6',
        level: 2,
      }
      hasColor = true
    }
    
    // Only add color if it has at least accent
    if (hasColor && colorObj.accent) {
      validTheme.color = colorObj
    }
    
    // Add typography if present and valid
    if (chatkitOptions.theme?.typography) {
      const typographyObj: any = {}
      let hasTypography = false
      
      // Include fontFamily - ChatKit accepts full font stacks
      if (chatkitOptions.theme.typography.fontFamily && 
          typeof chatkitOptions.theme.typography.fontFamily === 'string' &&
          chatkitOptions.theme.typography.fontFamily.trim() !== '') {
        typographyObj.fontFamily = chatkitOptions.theme.typography.fontFamily.trim()
        hasTypography = true
      }
      
      // Commenting out other typography properties as they may not be supported
      // if (chatkitOptions.theme.typography.fontSize !== undefined && 
      //     chatkitOptions.theme.typography.fontSize !== null &&
      //     chatkitOptions.theme.typography.fontSize !== '') {
      //   typographyObj.fontSize = chatkitOptions.theme.typography.fontSize
      //   hasTypography = true
      // }
      // if (chatkitOptions.theme.typography.fontWeight !== undefined && 
      //     chatkitOptions.theme.typography.fontWeight !== null &&
      //     chatkitOptions.theme.typography.fontWeight !== '') {
      //   typographyObj.fontWeight = chatkitOptions.theme.typography.fontWeight
      //   hasTypography = true
      // }
      // if (chatkitOptions.theme.typography.lineHeight !== undefined && 
      //     chatkitOptions.theme.typography.lineHeight !== null &&
      //     chatkitOptions.theme.typography.lineHeight !== '') {
      //   typographyObj.lineHeight = chatkitOptions.theme.typography.lineHeight
      //   hasTypography = true
      // }
      // if (chatkitOptions.theme.typography.letterSpacing !== undefined && 
      //     chatkitOptions.theme.typography.letterSpacing !== null &&
      //     chatkitOptions.theme.typography.letterSpacing !== '') {
      //   typographyObj.letterSpacing = chatkitOptions.theme.typography.letterSpacing
      //   hasTypography = true
      // }
      
      // Only add typography if it has at least one property
      if (hasTypography && Object.keys(typographyObj).length > 0) {
        validTheme.typography = typographyObj
      }
    }
    
    // Return undefined if theme is empty, otherwise return valid theme
    return Object.keys(validTheme).length > 0 ? validTheme : undefined
  })()

  console.log('ChatKit theme object:', JSON.stringify(theme, null, 2))

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
                  body: JSON.stringify({ 
                    agentId: agentId, 
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
                body: JSON.stringify({ 
                  agentId: agentId,
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
      header: useChatKitInRegularStyle ? undefined : (chatkitOptions.header ? (() => {
        const header = { ...chatkitOptions.header }
        
        const supportedHeader: any = {}
        if (header.title !== undefined) {
          if (typeof header.title === 'object' && header.title !== null) {
            supportedHeader.title = header.title
          } else if (typeof header.title === 'string' && header.title !== '') {
            supportedHeader.title = header.title
          }
        } else if ((chatbot as any).headerTitle) {
          // Support legacy formData.headerTitle
          supportedHeader.title = (chatbot as any).headerTitle
        }
        if (header.description !== undefined) {
          if (typeof header.description === 'object' && header.description !== null) {
            supportedHeader.description = header.description
          } else if (typeof header.description === 'string' && header.description !== '') {
            supportedHeader.description = header.description
          }
        } else if ((chatbot as any).headerDescription) {
          // Support legacy formData.headerDescription
          supportedHeader.description = (chatbot as any).headerDescription
        }
        if (header.logo !== undefined) {
          supportedHeader.logo = header.logo
        } else if ((chatbot as any).headerLogo) {
          // Support legacy formData.headerLogo
          supportedHeader.logo = (chatbot as any).headerLogo
        }
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
      // Note: modelPicker and personaPicker are not supported by ChatKit API
      // These options are removed to prevent "Unrecognized keys" errors
    })

    const deploymentType = previewDeploymentType || chatbot.deploymentType || 'fullpage'
    // Hide ChatKit widget button when using regular style header (regular widget button will be used instead)
    const shouldShowWidgetButton = (deploymentType === 'popover' || deploymentType === 'popup-center') && !useChatKitInRegularStyle
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
        ;(style as any).transform = 'translateX(-50%)'
      }
      return style
    }

    // Helper to convert hex to RGB
    const hexToRgb = (hex: string): string => {
      hex = hex.replace('#', '')
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('')
      }
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `${r}, ${g}, ${b}`
    }

    const containerStyle: React.CSSProperties = (() => {
      if (deploymentType === 'popover' || deploymentType === 'popup-center') {
        const bgValue = chatbot.messageBoxColor || '#ffffff'
        const blurAmount = (chatbot as any).chatWindowBackgroundBlur || 0
        const opacity = (chatbot as any).chatWindowBackgroundOpacity !== undefined ? (chatbot as any).chatWindowBackgroundOpacity : 100
        
        const style: React.CSSProperties = {
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
        }
        
        // Apply glassmorphism effect
        if (blurAmount > 0) {
          style.backdropFilter = `blur(${blurAmount}px)`
          style.WebkitBackdropFilter = `blur(${blurAmount}px)`
        }
        
        // Check if it's an image URL
        if (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/')) {
          const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
          style.backgroundImage = imageUrl
          style.backgroundSize = 'cover'
          style.backgroundPosition = 'center'
          style.backgroundRepeat = 'no-repeat'
          style.backgroundColor = opacity < 100 ? `rgba(255, 255, 255, ${opacity / 100})` : '#ffffff' // Fallback color with opacity
        } else {
          // It's a color value - apply opacity
          if (opacity < 100) {
            if (bgValue.startsWith('rgba') || bgValue.startsWith('rgb')) {
              const rgbMatch = bgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
              if (rgbMatch) {
                style.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})`
              } else {
                style.backgroundColor = bgValue
              }
            } else {
              style.backgroundColor = `rgba(${hexToRgb(bgValue)}, ${opacity / 100})`
            }
          } else {
            style.backgroundColor = bgValue
          }
        }
        
        return style
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

    const overlayStyle = getOverlayStyle(deploymentType, chatbot, isOpen)

    return (
      <>
        {overlayStyle && (
          <div style={overlayStyle} onClick={() => setIsOpen(false)} />
        )}

        {shouldShowWidgetButton && (() => {
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
            const IconName = widgetAvatarIcon as string
            const IconComponent = (Icons as any)[IconName] || Bot
            const iconColor = chatbot?.avatarIconColor || '#ffffff'
            return <IconComponent className="h-6 w-6" style={{ color: iconColor }} />
          })()
          
          if (widgetAvatarStyle === 'circle-with-label') {
            const widgetBgValue = (chatbot as any).widgetBackgroundColor || chatbot.primaryColor || '#3b82f6'
            const widgetLabelText = (chatbot as any).widgetLabelText || 'Chat'
            const widgetLabelColor = (chatbot as any).widgetLabelColor || '#ffffff'
            const widgetLabelFontSize = (chatbot as any).widgetLabelFontSize || '12px'
            const widgetBlur = (chatbot as any).widgetBackgroundBlur || 0
            const widgetOpacity = (chatbot as any).widgetBackgroundOpacity !== undefined ? (chatbot as any).widgetBackgroundOpacity : 100
            
            // Helper to convert hex to RGB
            const hexToRgb = (hex: string): string => {
              hex = hex.replace('#', '')
              if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('')
              }
              const r = parseInt(hex.substring(0, 2), 16)
              const g = parseInt(hex.substring(2, 4), 16)
              const b = parseInt(hex.substring(4, 6), 16)
              return `${r}, ${g}, ${b}`
            }
            
            // Build box-shadow with all properties (offsetX offsetY blur spread color)
            const shadowX = extractNumericValue((chatbot as any).widgetShadowX || '0px')
            const shadowY = extractNumericValue((chatbot as any).widgetShadowY || '0px')
            const shadowBlur = extractNumericValue((chatbot as any).widgetShadowBlur || '0px')
            const shadowSpread = extractNumericValue((chatbot as any).widgetShadowSpread || '0px')
            const shadowColor = (chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'
            const boxShadow = (shadowBlur !== '0' || shadowX !== '0' || shadowY !== '0' || shadowSpread !== '0')
              ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
              : undefined
            
            const buttonStyle: React.CSSProperties = {
              width: widgetSize,
              height: widgetSize,
              borderRadius: borderRadius,
              border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
              boxShadow: boxShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
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
              <div
                style={{
                  ...popoverPositionStyle(),
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 0,
                  zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget 
                    ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) + 1 
                    : Z_INDEX.chatWidgetWindow,
                }}
              >
                <button
                  type="button"
                  aria-label={isOpen ? "Close chat" : "Open chat"}
                  onClick={() => setIsOpen(!isOpen)}
                  style={buttonStyle}
                >
                  {buttonContent}
                </button>
                <div
                  style={{
                    ...(() => {
                      const widgetBgValue = (chatbot as any).widgetBackgroundColor || chatbot.primaryColor || '#3b82f6'
                      // Check if it's an image URL
                      if (widgetBgValue.startsWith('url(') || widgetBgValue.startsWith('http://') || widgetBgValue.startsWith('https://') || widgetBgValue.startsWith('/')) {
                        const imageUrl = widgetBgValue.startsWith('url(') ? widgetBgValue : `url(${widgetBgValue})`
                        return {
                          backgroundImage: imageUrl,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          ...(widgetOpacity < 100 ? { backgroundColor: `rgba(255, 255, 255, ${widgetOpacity / 100})` } : {})
                        }
                      } else {
                        // It's a color value
                        if (widgetOpacity < 100) {
                          if (widgetBgValue.startsWith('rgba') || widgetBgValue.startsWith('rgb')) {
                            const rgbMatch = widgetBgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
                            if (rgbMatch) {
                              return { backgroundColor: `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${widgetOpacity / 100})` }
                            }
                          }
                          return { backgroundColor: `rgba(${hexToRgb(widgetBgValue)}, ${widgetOpacity / 100})` }
                        }
                        return { backgroundColor: widgetBgValue }
                      }
                    })(),
                    ...(widgetBlur > 0 ? {
                      backdropFilter: `blur(${widgetBlur}px)`,
                      WebkitBackdropFilter: `blur(${widgetBlur}px)`,
                    } : {}),
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
                    boxShadow: (() => {
                      const shadowX = extractNumericValue((chatbot as any).widgetShadowX || '0px')
                      const shadowY = extractNumericValue((chatbot as any).widgetShadowY || '0px')
                      const shadowBlur = extractNumericValue((chatbot as any).widgetShadowBlur || '0px')
                      const shadowSpread = extractNumericValue((chatbot as any).widgetShadowSpread || '0px')
                      const shadowColor = (chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'
                      return (shadowBlur !== '0' || shadowX !== '0' || shadowY !== '0' || shadowSpread !== '0')
                        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
                        : undefined
                    })(),
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
          
          const widgetBgValue = (chatbot as any).widgetBackgroundColor || chatbot.primaryColor || '#3b82f6'
          const widgetBlur = (chatbot as any).widgetBackgroundBlur || 0
          const widgetOpacity = (chatbot as any).widgetBackgroundOpacity !== undefined ? (chatbot as any).widgetBackgroundOpacity : 100
          
          // Helper to convert hex to RGB
          const hexToRgb = (hex: string): string => {
            hex = hex.replace('#', '')
            if (hex.length === 3) {
              hex = hex.split('').map(char => char + char).join('')
            }
            const r = parseInt(hex.substring(0, 2), 16)
            const g = parseInt(hex.substring(2, 4), 16)
            const b = parseInt(hex.substring(4, 6), 16)
            return `${r}, ${g}, ${b}`
          }
          
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
            <style>{`
              ${(() => {
                const radiusValue = chatkitOptions?.theme?.radius || 'round'
                let borderRadius = '12px'
                if (radiusValue === 'pill') borderRadius = '9999px'
                else if (radiusValue === 'round') borderRadius = '12px'
                else if (radiusValue === 'soft') borderRadius = '6px'
                else if (radiusValue === 'sharp') borderRadius = '0px'
                
                return `
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
                ${(chatbot as any).sendButtonBorderRadiusTopLeft || (chatbot as any).sendButtonBorderRadiusTopRight || (chatbot as any).sendButtonBorderRadiusBottomRight || (chatbot as any).sendButtonBorderRadiusBottomLeft
                  ? `border-top-left-radius: ${(chatbot as any).sendButtonBorderRadiusTopLeft || (chatbot as any).sendButtonBorderRadius || '8px'} !important;
                     border-top-right-radius: ${(chatbot as any).sendButtonBorderRadiusTopRight || (chatbot as any).sendButtonBorderRadius || '8px'} !important;
                     border-bottom-right-radius: ${(chatbot as any).sendButtonBorderRadiusBottomRight || (chatbot as any).sendButtonBorderRadius || '8px'} !important;
                     border-bottom-left-radius: ${(chatbot as any).sendButtonBorderRadiusBottomLeft || (chatbot as any).sendButtonBorderRadius || '8px'} !important;`
                  : (chatbot as any).sendButtonBorderRadius
                    ? `border-radius: ${(chatbot as any).sendButtonBorderRadius} !important;`
                    : (chatbot as any).sendButtonRounded
                      ? 'border-radius: 50% !important;'
                      : ''}
                ${(chatbot as any).sendButtonShadowBlur ? `box-shadow: 0 0 ${(chatbot as any).sendButtonShadowBlur} ${(chatbot as any).sendButtonShadowColor || '#000000'} !important;` : ''}
                ${(chatbot as any).sendButtonPaddingX || (chatbot as any).sendButtonPaddingY ? `padding: ${(chatbot as any).sendButtonPaddingY || '8px'} ${(chatbot as any).sendButtonPaddingX || '8px'} !important;` : ''}
              }
              
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

