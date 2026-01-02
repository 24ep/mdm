'use client'

import React from 'react'
import { X, Bot, Menu, Loader2, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'
import { getOverlayStyle } from '../utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'
import { extractNumericValue, convertToHex, isLightColor, hexToRgb } from './chatkit/themeUtils'
import { buildChatKitTheme } from './chatkit/configBuilder'
import { loadGoogleFont } from './chatkit/fontLoader'
import { ChatKitGlobalStyles, getContainerStyle } from './chatkit/ChatKitStyles'
import { ChatKitStyleEnforcer } from './chatkit/ChatKitStyleEnforcer'
import { PWAInstallBanner } from './PWAInstallBanner'

// Helper function to get icon component by name dynamically
const getIconComponent = async (iconName: string) => {
  try {
    const module = await import('lucide-react')
    return module[iconName as keyof typeof module] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  } catch {
    return Bot
  }
}

// Separate component for dynamic icon to avoid hooks in conditionals
function DynamicIcon({ iconName, iconColor, size = 'h-5 w-5' }: { iconName: string; iconColor?: string; size?: string }) {
  const [IconComponent, setIconComponent] = React.useState<React.ComponentType<any>>(Bot)

  React.useEffect(() => {
    if (typeof iconName === 'string' && iconName.trim() !== '' && iconName !== 'Bot') {
      getIconComponent(iconName).then(setIconComponent)
    } else {
      setIconComponent(Bot)
    }
  }, [iconName])

  return <IconComponent className={size} style={{ color: iconColor }} />
}

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
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NO CONDITIONALS OR TRY-CATCH AROUND HOOKS

  // Error state for catching errors outside of hooks
  const [initError, setInitError] = React.useState<string | null>(null)

  // Trigger resize when popover opens to help ChatKit recalculate its internal iframe dimensions
  const prevIsOpenRef = React.useRef(isOpen)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const chatkitControlRef = React.useRef<any>(null)  // Store ChatKit control for runtime updates
  const chatkitOptionsRef = React.useRef<any>(null)  // Store options for setOptions calls

  // Detect if we're in an embedded context (this is needed for resize message sync)
  const isEmbed = isInIframe || (typeof window !== 'undefined' && window.self !== window.top)

  // Use ref to track isMobile without causing effect re-runs
  // This prevents loops where isMobile change -> resize message -> iframe resize -> isMobile change
  const isMobileRef = React.useRef(isMobile)
  React.useEffect(() => { isMobileRef.current = isMobile }, [isMobile])

  // Lifted from try block to allow hooks
  const chatkitOptions = chatbot.chatkitOptions || {}
  const useChatKitInRegularStyle = propUseChatKitInRegularStyle ?? (chatbot as any).useChatKitInRegularStyle === true

  // Memoize theme calculation
  const theme = React.useMemo(() => buildChatKitTheme(chatbot), [chatbot])

  // Compute values needed for hooks upfront
  const deploymentType = previewDeploymentType || chatbot.deploymentType || 'fullpage'
  const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
  const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
  const apiKey = isAgentSDK ? chatbot.openaiAgentSdkApiKey : chatbot.chatkitApiKey

  // CRITICAL: Send resize messages to parent when isOpen changes in embed mode
  // This ensures the parent iframe size stays in sync with ChatKitWrapper's popover state
  // IMPORTANT: Do NOT include isMobile in dependencies - use ref instead to prevent loops
  React.useEffect(() => {
    if (!isEmbed) return
    if (previewDeploymentType === 'fullpage') return

    const isPopover = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'
    if (!isPopover) return

    let width = '100%'
    let height = '100%'

    if (!isOpen) {
      // If PWA overlay is enabled and we are on mobile, we must keep the iframe full scale
      // so the banner (fixed at top) remains visible.
      // The pointer-events: none on the container (in page.tsx) will allow clicks to pass through.
      const isPwaOverlay = (chatbot as any).pwaInstallScope === 'website'
      if (isPwaOverlay && isMobileRef.current) {
        width = '100%'
        height = '100%'
      } else {
        width = '120px'
        height = '120px'
      }
    } else if (!isMobileRef.current) {
      // Desktop popover open size (use ref to avoid dependency loop)
      width = '450px'
      height = '800px'
    }
    // Mobile open popover remains 100%


    window.parent.postMessage({
      type: 'chat-widget-resize',
      isOpen,
      width,
      height,
      deploymentType: previewDeploymentType
    }, '*')
  }, [isOpen, isEmbed, previewDeploymentType, chatbot])  // Removed isMobile - use ref instead

  React.useEffect(() => {
    // Skip in embed mode - internal resize event can trigger isMobile changes that cause loops
    // The iframe resize is handled by postMessage above, not by window resize events
    if (isEmbed) return

    if (!prevIsOpenRef.current && isOpen && previewDeploymentType !== 'fullpage') {
      // Delay the resize event to ensure DOM is ready
      const t = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 100)
      return () => clearTimeout(t)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, previewDeploymentType, isEmbed])

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

  // Force theme refresh when popover opens
  // This helps apply styles that may not have been ready during initial mount
  React.useEffect(() => {
    if (isOpen && chatkitControlRef.current && chatkitOptionsRef.current) {
      // Delay the setOptions call to ensure ChatKit iframe is ready
      const refreshTheme = () => {
        try {
          if (chatkitControlRef.current?.setOptions) {
            chatkitControlRef.current.setOptions(chatkitOptionsRef.current)
          }
        } catch (e) {
          console.warn('[ChatKitWrapper] setOptions failed, likely not ready yet:', e)
        }
      }

      // Try multiple times with increasing delays to catch the iframe becoming ready
      const t1 = setTimeout(refreshTheme, 100)
      const t2 = setTimeout(refreshTheme, 500)
      const t3 = setTimeout(refreshTheme, 1000)
      const t4 = setTimeout(refreshTheme, 2000)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    }
  }, [isOpen])

  // Dynamically load Google Fonts if specified in theme
  React.useEffect(() => {
    const fontFamily = theme?.typography?.fontFamily || chatbot.fontFamily
    if (fontFamily) {
      loadGoogleFont(fontFamily)
    }
  }, [theme, chatbot.fontFamily])

  // Force font application in embed mode (moved outside try block)
  React.useEffect(() => {
    if (isEmbed) {
      const fontFamily = theme?.typography?.fontFamily || chatbot.fontFamily
      if (fontFamily && fontFamily !== 'inherit') {
        // 1. Force load the font
        loadGoogleFont(fontFamily)

        // 2. Force apply to body to ensure inheritance works if ChatKit falls back to inherit
        document.body.style.setProperty('font-family', fontFamily, 'important')

        // 3. Create a hidden element to force browser to download the font immediately
        // This fixes issues where the font is defined but not downloaded until used
        const probe = document.createElement('span')
        probe.textContent = 'font-probe'
        probe.style.fontFamily = fontFamily
        probe.style.position = 'absolute'
        probe.style.top = '-9999px'
        probe.style.left = '-9999px'
        probe.style.opacity = '0'
        probe.style.pointerEvents = 'none'
        document.body.appendChild(probe)

        // Allow some time for download, then cleanup
        const cleanup = setTimeout(() => {
          if (document.body.contains(probe)) {
            document.body.removeChild(probe)
          }
        }, 3000)

        return () => {
          clearTimeout(cleanup)
          if (document.body.contains(probe)) {
            document.body.removeChild(probe)
          }
        }
      }
    }
  }, [isEmbed, theme, chatbot.fontFamily])

  // Get useChatKit hook from the chatkit module
  // This must be called unconditionally at the top level
  const { useChatKit, ChatKit } = chatkitModule

  // Get the server origin for API calls
  // IMPORTANT: When embedded via iframe, relative URLs would go to the host website
  // We need to use the origin of the chatbot server (where the iframe is loaded from)
  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  // Build chatkit options for the hook
  const chatkitHookOptions = React.useMemo(() => ({
    api: {
      async getClientSecret(existing: any) {
        try {
          // Use absolute URL to ensure API calls go to the chatbot server, not the host website
          const apiUrl = `${serverOrigin}/api/chatkit/session`
          
          if (existing) {
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'omit', // Don't send cookies - this is a public API
              body: JSON.stringify({
                agentId: agentId,
                chatbotId: chatbot.id,
                existing
              }),
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
              console.error('❌ Session refresh failed:', errorData)
              const errorMessage = errorData.details
                ? `${errorData.error}: ${errorData.details}`
                : errorData.error || 'Failed to refresh ChatKit session'
              throw new Error(errorMessage)
            }
            const { client_secret } = await res.json()
            return client_secret
          }

          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit', // Don't send cookies - this is a public API
            body: JSON.stringify({
              agentId: agentId,
              chatbotId: chatbot.id
            }),
          })
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
          if (!sessionData.client_secret) {
            console.error('❌ No client secret in response')
            throw new Error('No client secret received from session endpoint')
          }
          const clientSecret = String(sessionData.client_secret).trim()
          if (!clientSecret) {
            console.error('❌ Client secret is empty after trimming')
            throw new Error('Client secret is empty')
          }
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

      // Force removal of rightAction if it exists in source config to prevent errors
      if (supportedHeader.rightAction) {
        delete supportedHeader.rightAction
      }

      if (Object.keys(supportedHeader).length > 0) {
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
  }), [agentId, apiKey, chatbot, theme, chatkitOptions, useChatKitInRegularStyle, serverOrigin])

  // Call useChatKit hook unconditionally at the top level
  const { control } = useChatKit(chatkitHookOptions)

  // Store control and options in refs for runtime updates
  React.useEffect(() => {
    chatkitControlRef.current = control
    chatkitOptionsRef.current = {
      theme: theme as any,
      locale: chatkitOptions.locale,
    }
  }, [control, theme, chatkitOptions.locale])

  // Report any initialization errors
  React.useEffect(() => {
    if (initError) {
      onError(initError)
      toast.error(`Failed to initialize ChatKit: ${initError}`)
    }
  }, [initError, onError])

  // If there's an error, show error UI
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 mb-4">
          <h2 className="text-xl font-semibold mb-2">ChatKit Error</h2>
          <p className="text-sm">{initError}</p>
        </div>
      </div>
    )
  }

  // Hide ChatKit widget button when:
  // - using regular style header
  // - OR on mobile when chat is open (fullpage covers screen)
  // - OR in embed mode (parent embed script handles the launcher button)
  // EXCEPTION: In emulator preview mode (isPreview=true from URL), always show widget
  const shouldShowWidgetButton = (deploymentType === 'popover' || deploymentType === 'popup-center') &&
    !useChatKitInRegularStyle &&
    (!isEmbed || isPreview) && // Hide internal button in embed mode as parent script handles it, unless in preview
    !(isMobile && isOpen && !isPreview)  // Don't hide in emulator preview mode

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

  const containerPositionStyle = (): React.CSSProperties => {
    // If we're in embed mode (and not preview), the iframe is positioned by parent, 
    // so we fill the iframe. The embedContainerOverride handles this.
    if (isEmbed && !isPreview) return {};

    // Fullpage deployment handles its own sizing/positioning (usually static/flow)
    if (deploymentType === 'fullpage') return {};

    // For mobile (unless we are previewing desktop on mobile device?), always full screen
    // Note: isMobile here comes from User-Agent or prop. 
    // If in emulator 'desktop' mode, isMobile is false.
    if (isMobile) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        borderRadius: '0',
        zIndex: (chatbot as any).widgetZIndex || Z_INDEX.chatWidgetWindow
      }
    }

    if (deploymentType === 'popup-center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: (chatbot as any).widgetZIndex || Z_INDEX.chatWidgetWindow
      }
    }

    // Popover positioning
    const pos = (chatbot as any).widgetPosition || 'bottom-right'
    const popoverPos = (chatbot as any).popoverPosition || 'left' // UI defaults to left
    const offsetX = (chatbot as any).widgetOffsetX || '20px'
    const offsetY = (chatbot as any).widgetOffsetY || '20px'
    const widgetSizeVal = parseInt(extractNumericValue((chatbot as any).widgetSize || '60px'))
    const spacing = 16 // Space between button and window

    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: (chatbot as any).widgetZIndex || Z_INDEX.chatWidgetWindow
    }

    const offsetXVal = parseInt(extractNumericValue(offsetX))
    const offsetYVal = parseInt(extractNumericValue(offsetY))

    // Vertical Stack (Above/Below) - corresponds to 'top' setting (naming is confusing in UI, implies 'stacked')
    if (popoverPos === 'top') {
      const totalVerticalOffset = `${offsetYVal + widgetSizeVal + spacing}px`

      if (pos.includes('bottom')) {
        (style as any).bottom = totalVerticalOffset
      } else {
        (style as any).top = totalVerticalOffset
      }

      if (pos.includes('right')) (style as any).right = offsetX
      if (pos.includes('left')) (style as any).left = offsetX
      if (pos.includes('center')) {
        (style as any).left = '50%';
        (style as any).transform = 'translateX(-50%)'
      }
    }
    // Horizontal Stack (Side) - corresponds to 'left' setting
    else {
      const totalSideOffset = `${offsetXVal + widgetSizeVal + spacing}px`

      // Vertical alignment matches the widget
      if (pos.includes('bottom')) (style as any).bottom = offsetY
      else (style as any).top = offsetY

      // Horizontal placement
      if (pos.includes('right')) {
        // Widget is on right, popover goes to its left
        (style as any).right = totalSideOffset
      } else if (pos.includes('left')) {
        // Widget is on left, popover goes to its right
        (style as any).left = totalSideOffset
      } else if (pos.includes('center')) {
        // Center widget: 'left' setting is ambiguous/tricky.
        // Fallback to top behavior (centered above)
        (style as any).left = '50%';
        (style as any).transform = 'translateX(-50%)';
        (style as any).bottom = `${offsetYVal + widgetSizeVal + spacing}px`;
      }
    }

    return style
  }

  // Styles for embed mode to ensure it fills the iframe correctly without double borders/shadows
  // BUT skip this override in preview mode to allow simulating the popover positioning inside the fixed-size emulator iframe
  const embedContainerOverride: React.CSSProperties = (isEmbed && !isPreview) ? {
    position: 'relative',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    padding: 0,
    boxShadow: 'none',
    border: 'none',
    borderRadius: 0,
    transform: 'none', // Prevent double transforms
  } : {}

  // Widget button styles
  const widgetAvatarStyle = chatbot.widgetAvatarStyle || 'circle'
  const widgetSize = (chatbot as any).widgetSize || '60px'

  let borderRadius: string
  if (widgetAvatarStyle === 'square') {
    borderRadius = (chatbot as any).widgetBorderRadius || '8px'
  } else {
    borderRadius = (chatbot as any).widgetBorderRadius || '50%'
  }

  const widgetBgValue = (chatbot as any).widgetBackgroundColor || chatbot.primaryColor || '#3b82f6'
  const defaultIconColor = isLightColor(widgetBgValue) ? '#000000' : '#ffffff'

  // Render widget button content
  const renderWidgetButtonContent = () => {
    if (isOpen) {
      return <X className="h-6 w-6" style={{ color: chatbot?.avatarIconColor || defaultIconColor }} />
    }

    const widgetAvatarType = (chatbot as any).widgetAvatarType || chatbot?.avatarType || 'icon'
    const widgetAvatarImageUrl = (chatbot as any).widgetAvatarImageUrl || chatbot?.avatarImageUrl
    const widgetAvatarIcon = (chatbot as any).widgetAvatarIcon || chatbot?.avatarIcon || 'Bot'

    if (widgetAvatarType === 'image' && widgetAvatarImageUrl) {
      return <img src={widgetAvatarImageUrl} alt="Chat" style={{ width: '60%', height: '60%', borderRadius: widgetAvatarStyle === 'square' ? '8px' : '50%', objectFit: 'cover' }} />
    }

    return <DynamicIcon iconName={widgetAvatarIcon} iconColor={chatbot?.avatarIconColor || defaultIconColor} size="h-6 w-6" />
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

  const widgetBlur = (chatbot as any).widgetBackgroundBlur || 0
  const widgetOpacity = (chatbot as any).widgetBackgroundOpacity !== undefined ? (chatbot as any).widgetBackgroundOpacity : 100

  const getWidgetBackground = (): React.CSSProperties => {
    const style: React.CSSProperties = {}

    // Check if it's an image URL or gradient
    const isGradient = widgetBgValue.includes('gradient')
    const isUrl = widgetBgValue.startsWith('url(') || widgetBgValue.startsWith('http://') || widgetBgValue.startsWith('https://') || widgetBgValue.startsWith('/')

    if (isUrl) {
      const imageUrl = widgetBgValue.startsWith('url(') ? widgetBgValue : `url(${widgetBgValue})`
      style.backgroundImage = imageUrl
      style.backgroundSize = 'cover'
      style.backgroundPosition = 'center'
      style.backgroundRepeat = 'no-repeat'
      // Apply opacity to background image
      if (widgetOpacity < 100) {
        style.backgroundColor = `rgba(255, 255, 255, ${widgetOpacity / 100})` // Fallback color with opacity
      }
    } else if (isGradient) {
      // Apply gradient directly to background
      style.background = widgetBgValue
    } else {
      // It's a color value - apply opacity
      if (widgetOpacity < 100) {
        if (widgetBgValue.startsWith('rgba') || widgetBgValue.startsWith('rgb')) {
          const rgbMatch = widgetBgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
          if (rgbMatch) {
            style.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${widgetOpacity / 100})`
          } else {
            style.backgroundColor = widgetBgValue
          }
        } else {
          // Try to convert hex to rgb, fallback to original value if it fails (e.g. named color)
          try {
            const rgb = hexToRgb(widgetBgValue)
            if (rgb) {
              style.backgroundColor = `rgba(${rgb}, ${widgetOpacity / 100})`
            } else {
              style.backgroundColor = widgetBgValue
            }
          } catch (e) {
            style.backgroundColor = widgetBgValue
          }
        }
      } else {
        style.backgroundColor = widgetBgValue
      }
    }

    return style
  }

  // Render circle-with-label widget button
  const renderCircleWithLabelButton = () => {
    const widgetLabelText = (chatbot as any).widgetLabelText || 'Chat'
    const defaultLabelColor = isLightColor(widgetBgValue) ? '#000000' : '#ffffff'
    const widgetLabelColor = (chatbot as any).widgetLabelColor || defaultLabelColor
    const widgetLabelFontSize = (chatbot as any).widgetLabelFontSize || '14px'
    const widgetLabelShowIcon = (chatbot as any).widgetLabelShowIcon !== false
    const widgetLabelIconPosition = (chatbot as any).widgetLabelIconPosition || 'left'

    // Use widgetLabelBorderRadius for circle-with-label, fallback to general borderRadius or default
    const labelBorderRadius = (chatbot as any).widgetLabelBorderRadius || borderRadius || '8px'

    const buttonStyle: React.CSSProperties = {
      ...popoverPositionStyle(),
      ...getWidgetBackground(),
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

    const widgetAvatarType = (chatbot as any).widgetAvatarType || chatbot?.avatarType || 'icon'
    const widgetAvatarImageUrl = (chatbot as any).widgetAvatarImageUrl || chatbot?.avatarImageUrl
    const widgetAvatarIcon = (chatbot as any).widgetAvatarIcon || chatbot?.avatarIcon || 'Bot'
    const iconColor = chatbot?.avatarIconColor || widgetLabelColor

    const renderIcon = () => {
      if (widgetAvatarType === 'image' && widgetAvatarImageUrl) {
        return <img src={widgetAvatarImageUrl} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
      }
      return <DynamicIcon iconName={widgetAvatarIcon} iconColor={iconColor} />
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

  // Render standard widget button
  const renderStandardWidgetButton = () => {
    const buttonStyle: React.CSSProperties = {
      ...popoverPositionStyle(),
      ...getWidgetBackground(),
      width: widgetSize,
      height: widgetSize,
      borderRadius: borderRadius,
      border: `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
      boxShadow: boxShadow,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: Math.max(
        ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget),
        Z_INDEX.chatWidgetWindow + 10
      ),
    }

    // Apply glassmorphism effect
    if (widgetBlur > 0) {
      buttonStyle.backdropFilter = `blur(${widgetBlur}px)`
      buttonStyle.WebkitBackdropFilter = `blur(${widgetBlur}px)`
    }

    return (
      <button
        type="button"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyle}
      >
        {renderWidgetButtonContent()}
      </button>
    )
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

      {(shouldShowWidgetButton && !useChatKitInRegularStyle) && (
        widgetAvatarStyle === 'circle-with-label'
          ? renderCircleWithLabelButton()
          : renderStandardWidgetButton()
      )}

      {shouldShowContainer && (
        <div
          ref={containerRef}
          className={`chatkit-embedded-container ${(deploymentType === 'popover' || deploymentType === 'popup-center') ? 'chatbot-popover-enter' : ''}`}
          style={{
            ...containerStyle,
            ...containerPositionStyle(),
            ...embedContainerOverride,
            zIndex: (deploymentType === 'popover' || deploymentType === 'popup-center')
              ? (chatbot as any).widgetZIndex || Z_INDEX.chatWidgetWindow
              : undefined,
          }}
        >
          <ChatKitGlobalStyles chatbot={chatbot} chatkitOptions={chatkitOptions} />
          <ChatKitStyleEnforcer chatbot={chatbot} containerRef={containerRef} isOpen={isOpen} />

          <ChatKit
            control={control}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
            }}
          />

          {/* CSS transitions for animations */}
          <style>{`
            @keyframes chatbotPopoverFadeIn {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes chatbotPopoverFadeOut {
              from {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
              to {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
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
}
