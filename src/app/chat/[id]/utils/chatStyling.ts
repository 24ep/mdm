import { ChatbotConfig } from '../types'
import React from 'react'
import { Z_INDEX } from '@/lib/z-index'

interface EmulatorConfig {
  backgroundColor?: string
  backgroundImage?: string
  text?: string
  description?: string
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `${r}, ${g}, ${b}`
}

export function getChatStyle(chatbot: ChatbotConfig): React.CSSProperties {
  const options = (chatbot as any).chatkitOptions
  const theme = options?.theme || {}
  const typography = theme.typography || {}

  return {
    fontFamily: typography.fontFamily || chatbot.fontFamily,
    fontSize: typography.fontSize ? `${typography.fontSize}px` : chatbot.fontSize,
    color: theme.color?.text || theme.textColor || chatbot.fontColor,
    backgroundColor: theme.color?.background || theme.backgroundColor || chatbot.openaiAgentSdkBackgroundColor || chatbot.messageBoxColor,
  }
}

export function getPopoverPositionStyle(chatbot: ChatbotConfig): React.CSSProperties {
  const x = chatbot as any
  const options = x.chatkitOptions || {}

  // Check options.widget or root properties
  // Note: WidgetSection likely saves to root or chatkitOptions.widget. 
  // We'll check both if needed, but prioritizing root for now as usually widget position is a root setting in older code.
  // If WidgetSection saves to chatkitOptions.widget, we should check that too. Assuming root for now as per old code.
  const pos = (x.widgetPosition || 'bottom-right') as string
  const offsetX = x.widgetOffsetX || '20px'
  const offsetY = x.widgetOffsetY || '20px'
  const style: React.CSSProperties = { position: 'fixed' }
  if (pos.includes('bottom')) (style as any).bottom = offsetY
  else (style as any).top = offsetY
  if (pos.includes('right')) (style as any).right = offsetX
  if (pos.includes('left')) (style as any).left = offsetX
  if (pos.includes('center')) {
    ; (style as any).left = '50%'
      ; (style as any).transform = 'translateX(-50%)'
  }
  return style
}

export function getContainerStyle(
  chatbot: ChatbotConfig,
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center',
  emulatorConfig: EmulatorConfig,
  isMobile: boolean = false,
  isEmbed: boolean = false,
  isPreview: boolean = false
): React.CSSProperties {
  const options = (chatbot as any).chatkitOptions || {}
  const theme = options.theme || {}

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

    // Common background logic helper
    const getBackgroundStyle = () => {
    // Priority: Emulator Config > Chatbot Config (Theme) > Chatbot Config (Root) > Default

    // FIX: Do NOT use emulator config here for the Chat Container.
    // Emulator config (Page Background) should only apply to the outer page container (in page.tsx),
    // not to the Chat Window itself. The Chat Window should always use the chatbot's theme config.
    /*
    if (emulatorConfig.backgroundColor || emulatorConfig.backgroundImage) {
      return {
        backgroundColor: emulatorConfig.backgroundColor,
        backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
        backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
        backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
      }
    }
    */

    const bgValue = theme.color?.background || theme.backgroundColor || chatbot.messageBoxColor || '#ffffff'
    const opacity = (chatbot as any).chatWindowBackgroundOpacity !== undefined ? (chatbot as any).chatWindowBackgroundOpacity : 100

    // Check if it's an image URL
    if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
      const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
      return {
        backgroundImage: imageUrl,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: opacity < 100 ? `rgba(255, 255, 255, ${opacity / 100})` : '#ffffff',
      }
    }
    
    // Check if it's a gradient
    if (bgValue && bgValue.includes('gradient')) {
        return {
            background: bgValue,
            // Gradients don't support simple opacity modifiers easily without parsing
            // So we return as-is. User should define opacity in the gradient string.
        }
    }

    // It's a color value
    const bgColor = bgValue
    if (opacity < 100) {
      // Check if it's already rgba/rgb
      if (bgColor.startsWith('rgba') || bgColor.startsWith('rgb')) {
        const rgbMatch = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)/)
        if (rgbMatch) {
          return { backgroundColor: `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})` }
        }
      }
      // Convert hex to rgba
      return { backgroundColor: `rgba(${hexToRgb(bgColor)}, ${opacity / 100})` }
    }
    return { backgroundColor: bgColor }
  }

  if (previewDeploymentType === 'popover') {
    // On mobile only, popover becomes fullpage layout (fills the container/iframe)
    // Desktop embed should still show as popover with proper positioning
    // EXCEPTION: In preview mode (emulator), always show as popover so users can preview the widget behavior
    if (isMobile && !isPreview) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: 0,
        zIndex: Z_INDEX.chatWidget,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...getBackgroundStyle(),
      }
    }

    const x = chatbot as any
    const pos = (x.widgetPosition || 'bottom-right') as string
    const offsetX = x.widgetOffsetX || '20px'
    const offsetY = x.widgetOffsetY || '20px'
    const widgetSize = parseFloat(x.widgetSize || '60px') || 60
    const widgetSizePx =
      typeof x.widgetSize === 'string' && x.widgetSize.includes('px') ? parseFloat(x.widgetSize) : widgetSize

    const popoverMargin = x.widgetPopoverMargin || '10px'
    const popoverMarginPx = parseFloat(popoverMargin) || 10
    const popoverPos = (x.popoverPosition || 'top') as 'top' | 'left'

    // Calculate popover position - place it to the right of the widget button
    const popoverStyle: React.CSSProperties = {
      position: 'fixed',
      width: (chatbot as any).chatWindowWidth || '380px',
      height: (chatbot as any).chatWindowHeight || '600px',
      border: `${chatbot.chatWindowBorderWidth || chatbot.borderWidth} solid ${chatbot.chatWindowBorderColor || chatbot.borderColor}`,
      borderRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
      boxShadow: `0 0 ${shadowBlur} ${shadowColor}`,
      zIndex: (chatbot as any).widgetZIndex || Z_INDEX.chatWidget,
      // Note: Emulator background should NOT be applied to popover - only to page background
      overflow: 'hidden',
      // Glassmorphism effect
      ...((chatbot as any).chatWindowBackgroundBlur && (chatbot as any).chatWindowBackgroundBlur > 0 ? {
        backdropFilter: `blur(${(chatbot as any).chatWindowBackgroundBlur}px)`,
        WebkitBackdropFilter: `blur(${(chatbot as any).chatWindowBackgroundBlur}px)`,
      } : {}),
      // Background color or image with opacity support
      ...getBackgroundStyle(),
      paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
      paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
      paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
      paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
    }

    // Logic ported from embed/route.ts
    if (popoverPos === 'top') {
      // Position popover above the widget button
      if (pos.includes('bottom')) {
        // Widget is at bottom, popover appears above it
        const bottomOffset = `calc(${offsetY} + ${widgetSizePx}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).bottom = bottomOffset
      } else {
        const topOffset = `calc(${offsetY} + ${widgetSizePx}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).top = topOffset
      }

      // Horizontal alignment matches widget position
      if (pos.includes('right')) {
        ; (popoverStyle as any).right = offsetX
      } else if (pos.includes('left')) {
        ; (popoverStyle as any).left = offsetX
      } else if (pos.includes('center')) {
        ; (popoverStyle as any).left = '50%'
          ; (popoverStyle as any).transform = 'translateX(-50%)'
      }
    } else {
      // Position popover to the left/right of widget button (side-by-side)
      if (pos.includes('bottom')) {
        ; (popoverStyle as any).bottom = offsetY
      } else {
        ; (popoverStyle as any).top = offsetY
      }

      // Place popover to the right regarding widget
      // Logic from route.ts:
      if (pos.includes('right')) {
        // Widget is on right side, popover appears to the left of widget
        const rightOffset = `calc(${offsetX} + ${widgetSizePx}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).right = rightOffset
      } else if (pos.includes('left')) {
        // Widget is on left side, popover appears to the right of widget
        const leftOffset = `calc(${offsetX} + ${widgetSizePx}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).left = leftOffset
      } else if (pos.includes('center')) {
        // For center positions, place popover to the right of widget (default)
        ; (popoverStyle as any).left = `calc(50% + ${widgetSizePx / 2}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).transform = 'translateX(0)'
      }
    }

    return popoverStyle
  }

  if (previewDeploymentType === 'popup-center') {
    // On mobile or EMBED, popup-center logic needs careful handling. 
    // If embedded, it should probably fill the frame too if the frame is already the popup.
    // For now assuming popup-center embed script is full page overlay? 
    // Usually popup-center embed script creates a full-page overlay div with the iframe inside.
    // So if isEmbed is true, we want the content to be centered in that full frame? 
    // OR if the iframe itself is the popup box.
    // Current embed script (route.ts) doesn't seem to handle 'popup-center' explicitly with a different container structure 
    // other than 'popover' logic or default. 
    // Let's assume for now isEmbed mainly affects popover/fullpage.
    // EXCEPTION: In preview mode (emulator), always show as popup-center so users can preview the widget behavior
    if (isMobile && !isPreview) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: 0,
        zIndex: Z_INDEX.chatWidgetWindow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: 'none',
        ...getBackgroundStyle(), // Use updated background style helper
      }
    }

    return {
      width: '90%',
      maxWidth: '640px',
      maxHeight: '80vh',
      height: '80vh',
      border: `${chatbot.chatWindowBorderWidth || chatbot.borderWidth} solid ${chatbot.chatWindowBorderColor || chatbot.borderColor}`,
      borderRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
      boxShadow: `0 0 ${shadowBlur} ${shadowColor}`,
      zIndex: Z_INDEX.chatWidgetWindow,
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      ...getBackgroundStyle(), // Use updated background style helper
      // Note: Emulator background should NOT be applied to popup-center - only to page background
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
    // For fullpage/embed, we should apply the chatbot theme unless emulator/preview config overrides it
    ...getBackgroundStyle(),
    paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
    paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
    paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
    paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
    // Apply blur if configured
    ...((chatbot as any).chatWindowBackgroundBlur && (chatbot as any).chatWindowBackgroundBlur > 0 ? {
      backdropFilter: `blur(${(chatbot as any).chatWindowBackgroundBlur}px)`,
      WebkitBackdropFilter: `blur(${(chatbot as any).chatWindowBackgroundBlur}px)`,
    } : {}),
  }
}

export function getOverlayStyle(
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center',
  chatbot?: ChatbotConfig,
  isOpen?: boolean
): React.CSSProperties | undefined {
  // For popup-center, always show overlay (legacy behavior)
  if (previewDeploymentType === 'popup-center') {
    return { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: Z_INDEX.chatWidgetOverlay }
  }

  // For popover mode, check if overlay is enabled and chat is open
  if (previewDeploymentType === 'popover' && chatbot && isOpen) {
    const overlayEnabled = (chatbot as any).overlayEnabled !== undefined
      ? (chatbot as any).overlayEnabled
      : false

    if (!overlayEnabled) {
      return undefined
    }

    const overlayColor = (chatbot as any).overlayColor || '#000000'
    const overlayOpacity = (chatbot as any).overlayOpacity !== undefined
      ? (chatbot as any).overlayOpacity
      : 50
    const overlayBlur = (chatbot as any).overlayBlur || 0

    // Calculate background color with opacity
    let backgroundColor: string
    if (overlayColor.startsWith('rgba') || overlayColor.startsWith('rgb')) {
      // Extract RGB values and apply new opacity
      const rgbMatch = overlayColor.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (rgbMatch) {
        backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${overlayOpacity / 100})`
      } else {
        backgroundColor = overlayColor
      }
    } else {
      // Convert hex to rgba
      backgroundColor = `rgba(${hexToRgb(overlayColor)}, ${overlayOpacity / 100})`
    }

    const overlayStyle: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      backgroundColor,
      zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget
        ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) - 1
        : Z_INDEX.chatWidgetOverlay, // Place overlay below widget and popover
    }

    // Apply blur if specified
    if (overlayBlur > 0) {
      overlayStyle.backdropFilter = `blur(${overlayBlur}px)`
      overlayStyle.WebkitBackdropFilter = `blur(${overlayBlur}px)`
    }

    return overlayStyle
  }

  return undefined
}

// Helper to extract numeric value from string like "8px" -> "8"
function extractNumericValue(value: string | undefined): string {
  if (!value) return '0'
  const match = value.toString().match(/(\d+(?:\.\d+)?)/)
  return match ? match[1] : '0'
}

export function getWidgetButtonStyle(chatbot: ChatbotConfig): React.CSSProperties {
  const options = (chatbot as any).chatkitOptions || {}
  const theme = options.theme || {}

  const widgetBgValue = (chatbot as any).widgetBackgroundColor || theme.color?.accent?.primary || theme.primaryColor || chatbot.primaryColor || '#3b82f6'
  const blurAmount = (chatbot as any).widgetBackgroundBlur || 0
  const opacity = (chatbot as any).widgetBackgroundOpacity !== undefined ? (chatbot as any).widgetBackgroundOpacity : 100

  // Build box-shadow with all properties (offsetX offsetY blur spread color)
  const shadowX = extractNumericValue((chatbot as any).widgetShadowX || '0px')
  const shadowY = extractNumericValue((chatbot as any).widgetShadowY || '0px')
  const shadowBlur = extractNumericValue((chatbot as any).widgetShadowBlur || '0px')
  const shadowSpread = extractNumericValue((chatbot as any).widgetShadowSpread || '0px')
  const shadowColor = (chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'

  const boxShadow = (shadowBlur !== '0' || shadowX !== '0' || shadowY !== '0' || shadowSpread !== '0')
    ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
    : undefined

  // Determine border radius based on avatar style
  const widgetAvatarStyle = (chatbot as any).widgetAvatarStyle || 'circle'
  let borderRadius: string
  if (widgetAvatarStyle === 'circle') {
    borderRadius = '50%' // Always circular for circle style, ignore widgetBorderRadius
  } else if (widgetAvatarStyle === 'square') {
    borderRadius = (chatbot as any).widgetBorderRadius || '8px'
  } else {
    // circle-with-label: use widgetBorderRadius or default to 50%
    borderRadius = (chatbot as any).widgetBorderRadius || '50%'
  }

  const baseStyle: React.CSSProperties = {
    width: (chatbot as any).widgetSize || '60px',
    height: (chatbot as any).widgetSize || '60px',
    borderRadius: borderRadius,
    border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
    boxShadow: boxShadow,
    zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget
      ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) + 1
      : Z_INDEX.chatWidgetWindow, // Higher than popover to stay on top
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }

  // Apply glassmorphism effect
  if (blurAmount > 0) {
    baseStyle.backdropFilter = `blur(${blurAmount}px)`
    baseStyle.WebkitBackdropFilter = `blur(${blurAmount}px)`
  }

  // Check if it's an image URL (starts with url(, http://, https://, or /)
  if (widgetBgValue.startsWith('url(') || widgetBgValue.startsWith('http://') || widgetBgValue.startsWith('https://') || widgetBgValue.startsWith('/')) {
    const imageUrl = widgetBgValue.startsWith('url(') ? widgetBgValue : `url(${widgetBgValue})`
    baseStyle.backgroundImage = imageUrl
    baseStyle.backgroundSize = 'cover'
    baseStyle.backgroundPosition = 'center'
    baseStyle.backgroundRepeat = 'no-repeat'
    // Apply opacity to background image
    if (opacity < 100) {
      baseStyle.backgroundColor = `rgba(255, 255, 255, ${opacity / 100})` // Fallback color with opacity
    }
  } else if (widgetBgValue.includes('gradient')) {
    // Apply gradient to background property
    baseStyle.background = widgetBgValue
    // Gradients don't support simple opacity modifiers easily without parsing
  } else {
    // It's a color value - apply opacity
    if (opacity < 100) {
      if (widgetBgValue.startsWith('rgba') || widgetBgValue.startsWith('rgb')) {
        const rgbMatch = widgetBgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
        if (rgbMatch) {
          baseStyle.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})`
        } else {
          baseStyle.backgroundColor = widgetBgValue
        }
      } else {
        baseStyle.backgroundColor = `rgba(${hexToRgb(widgetBgValue)}, ${opacity / 100})`
      }
    } else {
      baseStyle.backgroundColor = widgetBgValue
    }
  }

  return baseStyle
}

