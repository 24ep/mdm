'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Paperclip, X, Bot, User, Loader2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'

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

interface ChatbotConfig {
  id: string
  name: string
  apiEndpoint: string
  apiAuthType: 'none' | 'bearer' | 'api_key' | 'custom'
  apiAuthValue: string
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
  messageNamePosition?: 'top-of-message' | 'top-of-avatar'
  showMessageAvatar?: boolean
  messageBoxColor: string
  shadowColor: string
  shadowBlur: string
  conversationOpener: string
  followUpQuestions: string[]
  enableFileUpload: boolean
  showCitations: boolean
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
            if (data.chatbot.conversationOpener) {
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
          // Add conversation opener as first message
          if (found.conversationOpener) {
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

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setAttachments([])
    setSelectedFollowUp(null)
    setIsLoading(true)

    try {
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
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('API request failed')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
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
        backgroundColor: chatbot.messageBoxColor,
        overflow: 'hidden'
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
        backgroundColor: chatbot.messageBoxColor,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    }
    // fullpage
    return { height: '100%', display: 'flex', flexDirection: 'column' }
  })()

  const overlayStyle: React.CSSProperties | undefined = previewDeploymentType === 'popup-center'
    ? { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000 }
    : undefined

  const shouldShowWidgetButton = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'
  const shouldShowContainer = previewDeploymentType === 'fullpage' ? true : isOpen

  return (
    <div style={{ position: 'relative', height: '100%' }}>
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
        <div className="flex flex-col" style={containerStyle}>
          {/* Close for popover/popup-center */}
          {shouldShowWidgetButton && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 0, color: chatbot.headerFontColor || '#fff', zIndex: 10002 }}
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
        {((chatbot as any).headerShowAvatar !== false) && (() => {
          const avatarType = chatbot.avatarType || 'icon'
          if (avatarType === 'image' && (chatbot.avatarImageUrl || chatbot.headerLogo || chatbot.logo)) {
            return (
              <img 
                src={chatbot.avatarImageUrl || chatbot.headerLogo || chatbot.logo || ''} 
                alt={chatbot.name}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )
          } else if (avatarType === 'icon') {
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
            const showName = chatbot.showMessageName !== undefined ? chatbot.showMessageName : false
            const namePosition = chatbot.messageNamePosition || 'top-of-message'
            const displayName = chatbot.messageName || chatbot.headerTitle || chatbot.name || 'Assistant'
            
            return (
              <div key={message.id} className={message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                {/* Message Name - Top of Message */}
                {showName && message.role === 'assistant' && namePosition === 'top-of-message' && (
                  <div className="mb-1 px-1">
                    <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                      {displayName}
                    </span>
                  </div>
                )}
                
                <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar with Name on Top */}
                  {message.role === 'assistant' && showAvatar && (
                    <div className="flex flex-col items-center">
                      {/* Message Name - Top of Avatar */}
                      {showName && namePosition === 'top-of-avatar' && (
                        <div className="mb-1">
                          <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                            {displayName}
                          </span>
                        </div>
                      )}
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
                    </div>
                  )}
                  {message.role === 'assistant' && !showAvatar && showName && namePosition === 'top-of-avatar' && (
                    <div className="mb-1">
                      <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
                        {displayName}
                      </span>
                    </div>
                  )}
                  <div
                className={`max-w-[80%] rounded-lg ${
                  message.role === 'user'
                    ? 'rounded-br-none'
                    : 'rounded-bl-none'
                }`}
                style={{
                  padding: (chatbot as any).bubblePadding || '12px',
                  backgroundColor: message.role === 'user' 
                    ? (chatbot.userMessageBackgroundColor || chatbot.primaryColor)
                    : (chatbot.botMessageBackgroundColor || '#f3f4f6'),
                  color: message.role === 'user' ? 'white' : chatbot.fontColor,
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
                  {message.role === 'user' && showAvatar && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#e5e7eb' }}
                    >
                      <User className="h-5 w-5" style={{ color: chatbot.fontColor }} />
                    </div>
                  )}
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
                  {sendButton}
                </>
              )
            } else {
              // attach-first (default)
              return (
                <>
                  {attachButton}
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
