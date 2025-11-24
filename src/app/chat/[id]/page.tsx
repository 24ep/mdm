'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { X, Bot, Menu, Loader2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ChatbotConfig } from './types'
import { ChatKitRenderer } from './components/ChatKitRenderer'
import { ChatSidebar } from './components/ChatSidebar'
import { ChatContent } from './components/ChatContent'
import { ChatHeader } from './components/ChatHeader'
import { ThreadSelector } from './components/ThreadSelector'
import { useChatMessages } from './hooks/useChatMessages'
import { useChatHistory } from './hooks/useChatHistory'
import { useChatFileHandling } from './hooks/useChatFileHandling'
import { useChatbotLoader } from './hooks/useChatbotLoader'
import { useChatVoice } from './hooks/useChatVoice'
import { useOpenAIRealtimeVoice } from './hooks/useOpenAIRealtimeVoice'
import { useAgentThread } from './hooks/useAgentThread'
import {
  getChatStyle,
  getPopoverPositionStyle,
  getContainerStyle,
  getOverlayStyle,
  getWidgetButtonStyle,
} from './utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'

export default function ChatPage() {
  const params = useParams()
  const chatbotId = params?.id as string
  const [previewDeploymentType, setPreviewDeploymentType] = useState<'popover' | 'fullpage' | 'popup-center'>('fullpage')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isInIframe, setIsInIframe] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'liked' | 'disliked' | null>>({})
  const [input, setInput] = useState('')
  const [currentTranscript, setCurrentTranscript] = useState('') // Separate state for voice transcript display
  // Track if ChatKit is unavailable (for fallback to regular chat)
  const [chatKitUnavailable, setChatKitUnavailable] = useState(false)

  // Check if page is loaded in an iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  // Load chatbot
  const { chatbot, setChatbot, emulatorConfig, setEmulatorConfig } = useChatbotLoader({
    chatbotId,
    previewDeploymentType,
    isInIframe,
    onChatbotLoaded: (loadedChatbot) => {
      if (loadedChatbot.deploymentType) {
        setPreviewDeploymentType(loadedChatbot.deploymentType)
      }
      // Add greeting message for non-fullpage modes
      const greetingMessage = loadedChatbot.openaiAgentSdkGreeting || loadedChatbot.conversationOpener
      if (greetingMessage && (previewDeploymentType !== 'fullpage' || isInIframe)) {
        // This will be handled by chat history for fullpage mode
      }
    },
  })

  // Message management (must be initialized first to provide setMessages)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  
  // OpenAI Agent SDK Thread management (must be initialized before useChatMessages)
  const {
    currentThreadId,
    setCurrentThreadId,
    threads,
    isLoading: threadsLoading,
    createThread,
    updateThreadTitle,
    deleteThread,
    isEnabled: threadManagementEnabled,
  } = useAgentThread({
    chatbot,
    chatbotId,
    spaceId: (chatbot as any)?.spaceId || null,
  })

  const {
    messages,
    setMessages,
    isLoading,
    selectedFollowUp,
    sendMessage,
    handleFollowUpClick,
    messagesEndRef,
    scrollAreaRef,
  } = useChatMessages({
    chatbot,
    currentChatId,
    previewDeploymentType,
    isInIframe,
    threadId: threadManagementEnabled ? currentThreadId : null,
    chatbotId: threadManagementEnabled ? chatbotId : undefined,
    spaceId: threadManagementEnabled ? ((chatbot as any)?.spaceId || null) : undefined,
    onThreadIdChange: (newThreadId) => {
      if (threadManagementEnabled) {
        setCurrentThreadId(newThreadId)
        // Create thread record if it doesn't exist
        if (newThreadId && !threads.find(t => t.threadId === newThreadId)) {
          createThread(newThreadId)
      }
    }
    },
  })

  // Chat history management (only for non-OpenAI Agent SDK chatbots)
  const {
    chatHistory,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
  } = useChatHistory({
    chatbotId,
    chatbot,
    previewDeploymentType,
    isInIframe,
    messages,
    setMessages,
    currentChatId,
    setCurrentChatId,
  })

  // File handling
  const {
    attachments,
    setAttachments,
    fileInputRef,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
  } = useChatFileHandling()

  // Voice agent - select provider based on chatbot config
  const voiceProvider = chatbot?.voiceProvider || 'browser'
  
  // Browser-based voice (Web Speech API)
  const browserVoice = useChatVoice({
    chatbot: voiceProvider === 'browser' ? chatbot : null,
    messages,
    isLoading,
    onTranscript: (transcript) => {
      setInput(transcript)
    },
    onSendMessage: (content) => {
      sendMessage(content)
    },
  })

  // OpenAI Realtime API voice
  const openaiRealtimeVoice = useOpenAIRealtimeVoice({
    chatbot: voiceProvider === 'openai-realtime' ? chatbot : null,
    onTranscript: (transcript, isUserInput) => {
      // For realtime voice, distinguish between user input and AI response
      if (isUserInput) {
        // User is speaking - update input field
        setInput(transcript)
        setCurrentTranscript(transcript) // Also show in VoiceWaveUI
      } else {
        // AI is responding - only show in VoiceWaveUI subtitle, not in input field
        setCurrentTranscript(transcript)
        // Don't update input field for AI responses
      }
      console.log('📝 Transcript updated:', transcript, isUserInput ? '(user)' : '(AI)')
    },
  })

  // Select the appropriate voice hook based on provider
  const voiceState = voiceProvider === 'openai-realtime' 
    ? {
        isRecording: openaiRealtimeVoice.isRecording,
        isVoiceEnabled: openaiRealtimeVoice.isVoiceEnabled,
        isSpeaking: openaiRealtimeVoice.isSpeaking,
        audioLevel: openaiRealtimeVoice.audioLevel, // Real-time audio level for visualization
        handleStartRecording: openaiRealtimeVoice.startRecording,
        handleStopRecording: openaiRealtimeVoice.stopRecording,
        toggleVoiceOutput: () => {
          // For OpenAI Realtime, toggle is handled by the API
          if (openaiRealtimeVoice.isSpeaking) {
            openaiRealtimeVoice.stopRecording()
          }
        },
      }
    : {
        isRecording: browserVoice.isRecording,
        isVoiceEnabled: browserVoice.isVoiceEnabled,
        isSpeaking: browserVoice.isSpeaking,
        handleStartRecording: browserVoice.handleStartRecording,
        handleStopRecording: browserVoice.handleStopRecording,
        toggleVoiceOutput: browserVoice.toggleVoiceOutput,
      }

  const {
    isRecording,
    isVoiceEnabled,
    isSpeaking,
    audioLevel = 0, // Default to 0 if not available
    handleStartRecording,
    handleStopRecording,
    toggleVoiceOutput,
  } = voiceState

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

  // Listen for preview mode changes
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (data.type === 'chatbot-preview-mode') {
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
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      sendMessage(input, attachments.length > 0 ? attachments : undefined)
      setInput('')
      clearAttachments()
    }
  }

  if (!chatbot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Check if chatbot is enabled (default to true if not set)
  const chatbotEnabled = (chatbot as any).chatbotEnabled !== false
  
  // If chatbot is disabled, don't render anything
  if (!chatbotEnabled) {
    return null
  }

  const chatStyle = getChatStyle(chatbot)
  const containerStyle = getContainerStyle(chatbot, previewDeploymentType, emulatorConfig)
  const overlayStyle = getOverlayStyle(previewDeploymentType, chatbot, isOpen)
  const popoverPositionStyle = getPopoverPositionStyle(chatbot)
  const widgetButtonStyle = getWidgetButtonStyle(chatbot)

  const shouldShowWidgetButton = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'
  const shouldShowContainer = previewDeploymentType === 'fullpage' ? true : isOpen

  // Render ChatKit only if engine type is chatkit (not openai-agent-sdk)
  // Note: If ChatKit fails to load, it will fall back to regular chat style
  // Also check useChatKitInRegularStyle - if true, render ChatKit inside regular style container with regular header
  const useChatKitInRegularStyle = (chatbot as any).useChatKitInRegularStyle === true
  const shouldRenderChatKit =
    !chatKitUnavailable &&
    chatbot.engineType === 'chatkit' &&
    chatbot.chatkitAgentId

  // Render ChatKit with regular style header overlay (only for popover/popup-center, not fullpage)
  if (shouldRenderChatKit && useChatKitInRegularStyle && (previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center')) {
    // Always show container when using regular style header (no widget button to toggle)
    return (
      <div 
        style={{ 
          position: 'relative', 
          height: '100%',
          // Apply emulator background to page container (not popover)
          backgroundColor: emulatorConfig.backgroundColor,
          backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
          backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
          backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
          backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
        }}
      >
        {/* Regular style container with ChatKit inside */}
        {shouldShowContainer && (
          <div className="flex flex-col relative" style={containerStyle}>
            {/* Regular Header on top */}
            <ChatHeader 
              chatbot={chatbot} 
              onClearSession={() => setMessages([])}
              onClose={shouldShowWidgetButton ? () => setIsOpen(false) : undefined}
            />
            
            {/* ChatKit rendered below header - fills remaining space */}
            <div 
              className="flex-1 relative overflow-hidden chatkit-in-regular-style" 
              style={{ 
                flex: '1 1 auto',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ChatKitRenderer 
                chatbot={chatbot} 
                previewDeploymentType={previewDeploymentType} 
                isInIframe={isInIframe}
                onChatKitUnavailable={() => setChatKitUnavailable(true)}
              />
            </div>
          </div>
        )}
        
        {/* Widget button and overlay for popover/popup-center - OUTSIDE the popover container */}
        {overlayStyle && (
          <div style={overlayStyle} aria-hidden="true" onClick={() => setIsOpen(false)} />
        )}
        {shouldShowWidgetButton && (
          <button
            type="button"
            aria-label={isOpen ? 'Close chat' : 'Open chat'}
            onClick={() => setIsOpen(!isOpen)}
            style={{
              ...popoverPositionStyle,
              ...widgetButtonStyle,
            }}
          >
            {isOpen ? (
              <X className="h-6 w-6" style={{ color: chatbot?.avatarIconColor || '#ffffff' }} />
            ) : (
              (() => {
                const avatarType = chatbot?.avatarType || 'icon'
                if (avatarType === 'image' && chatbot?.avatarImageUrl) {
                  return (
                    <img
                      src={chatbot.avatarImageUrl}
                      alt="Chat"
                      style={{ width: '60%', height: '60%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )
                }
                const IconName = (chatbot?.avatarIcon || 'Bot') as string
                const IconComponent = (Icons as any)[IconName] || Bot
                const iconColor = chatbot?.avatarIconColor || '#ffffff'
                return <IconComponent className="h-6 w-6" style={{ color: iconColor }} />
              })()
            )}
          </button>
        )}
      </div>
    )
  }

  // Render ChatKit normally (without regular style wrapper)
  if (shouldRenderChatKit && !useChatKitInRegularStyle) {
    return (
      <div 
        style={{ 
          position: 'relative', 
          height: '100%',
          // Apply emulator background to page container (not popover)
          backgroundColor: emulatorConfig.backgroundColor,
          backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
          backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
          backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
          backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
        }}
      >
        <ChatKitRenderer 
          chatbot={chatbot} 
          previewDeploymentType={previewDeploymentType} 
          isInIframe={isInIframe}
          onChatKitUnavailable={() => setChatKitUnavailable(true)}
        />
      </div>
    )
  }

  // Render chat content (header, messages, input) - reusable for full page layout
  const renderChatContent = () => {
    if (!chatbot) return null
    
    return (
      <ChatContent
        chatbot={chatbot}
        messages={messages}
        input={input}
        setInput={setInput}
        attachments={attachments}
        setAttachments={setAttachments}
        isLoading={isLoading}
        selectedFollowUp={selectedFollowUp}
        messageFeedback={messageFeedback}
        setMessageFeedback={setMessageFeedback}
        setMessages={setMessages}
        sendMessage={sendMessage}
        onFileSelect={handleFileSelect}
        onFollowUpClick={handleFollowUpClick}
        removeAttachment={removeAttachment}
        handleSubmit={handleSubmit}
        isRecording={isRecording}
        isVoiceEnabled={isVoiceEnabled}
        isSpeaking={isSpeaking}
        audioLevel={audioLevel}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onToggleVoiceOutput={toggleVoiceOutput}
        scrollAreaRef={scrollAreaRef}
        messagesEndRef={messagesEndRef}
        currentTranscript={currentTranscript}
        chatbotId={chatbotId}
        threadId={threadManagementEnabled ? currentThreadId : null}
      />
    )
  }

  // Full page layout with sidebar
  if (previewDeploymentType === 'fullpage' && !isInIframe) {
    
    return (
      <div
        className="flex h-screen w-screen overflow-hidden"
        style={{
        backgroundColor: emulatorConfig.backgroundColor,
        backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
        backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
        backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
        }}
      >
        {/* Thread Selector for OpenAI Agent SDK */}
        {threadManagementEnabled && (
          <ThreadSelector
            threads={threads}
            currentThreadId={currentThreadId}
            onSelectThread={(threadId: string) => {
              setCurrentThreadId(threadId)
              // Messages will be loaded by useChatMessages hook when threadId changes
            }}
            onNewThread={() => {
              setCurrentThreadId(null)
              setMessages([]) // Clear messages for new thread
            }}
            onDeleteThread={deleteThread}
            onUpdateThreadTitle={updateThreadTitle}
            isLoading={threadsLoading}
            chatbot={chatbot}
          />
        )}

        {/* Sidebar for regular chat history */}
        {!threadManagementEnabled && (
        <ChatSidebar
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />
        )}
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Bar with Menu and Preview Type */}
          <div className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 z-10 transition-all duration-200 ease-out">
            <div className="flex items-center gap-2">
              {!threadManagementEnabled && !sidebarOpen && (
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <h1 className="font-semibold">{chatbot?.name || 'Chat'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Preview Type:</Label>
              <Select 
                value={previewDeploymentType} 
                onValueChange={(value: string) => {
                  const deploymentType = value as 'popover' | 'fullpage' | 'popup-center'
                  setPreviewDeploymentType(deploymentType)
                  if (deploymentType === 'popover' || deploymentType === 'popup-center') {
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
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="flex-1 flex flex-col overflow-hidden" style={chatStyle}>
                {renderChatContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      style={{ 
        position: 'relative', 
        height: '100%',
        // Apply emulator background to page container (not popover)
        backgroundColor: emulatorConfig.backgroundColor,
        backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
        backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
        backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
      }}
    >
      {/* Preview Type Selector - Fixed at top right (only show when not in iframe) */}
      {!isInIframe && (
        <div className="fixed top-4 right-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-md p-2 shadow-lg" style={{ zIndex: Z_INDEX.chatWidgetPreview }}>
          <Label className="text-xs whitespace-nowrap">Preview Type:</Label>
          <Select 
            value={previewDeploymentType} 
            onValueChange={(value: string) => {
              const deploymentType = value as 'popover' | 'fullpage' | 'popup-center'
              setPreviewDeploymentType(deploymentType)
              if (deploymentType === 'popover' || deploymentType === 'popup-center') {
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
      
      {overlayStyle && (
        <div style={overlayStyle} aria-hidden="true" onClick={() => setIsOpen(false)} />
      )}

      {/* Widget launcher button */}
      {shouldShowWidgetButton && (
        <button
          type="button"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            ...popoverPositionStyle,
            ...widgetButtonStyle,
          }}
        >
          {isOpen ? (
            <X className="h-6 w-6" style={{ color: chatbot?.avatarIconColor || '#ffffff' }} />
          ) : (
            (() => {
              const avatarType = chatbot?.avatarType || 'icon'
              if (avatarType === 'image' && chatbot?.avatarImageUrl) {
                return (
                  <img
                    src={chatbot.avatarImageUrl}
                    alt="Chat"
                    style={{ width: '60%', height: '60%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                )
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
            <div className="absolute top-0 left-0 right-0 p-4 bg-black/50 text-white backdrop-blur-sm" style={{ zIndex: Z_INDEX.chatWidgetOverlayText }}>
              {emulatorConfig.text && <h2 className="text-lg font-semibold mb-2">{emulatorConfig.text}</h2>}
              {emulatorConfig.description && <p className="text-sm opacity-90">{emulatorConfig.description}</p>}
            </div>
          )}

          {/* Close button - only show if headerShowCloseButton is not false */}
          {((chatbot as any).headerShowCloseButton !== false && (chatbot as any).headerShowCloseButton !== null) && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{ 
                position: 'absolute', 
                top: chatbot.headerPaddingY || '16px', 
                right: '8px', 
                background: 'transparent', 
                border: 0, 
                color: chatbot.headerFontColor || '#fff', 
                zIndex: Z_INDEX.chatWidgetControl,
              }}
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="flex flex-col h-full" style={chatStyle}>
            {renderChatContent()}
              </div>
        </div>
      )}
    </div>
  )
}
