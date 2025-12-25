'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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
import { ChatWidgetButton } from './components/ChatWidgetButton'
import { WidgetChatContainer } from './components/WidgetChatContainer'
import { FullPageChatLayout } from './components/FullPageChatLayout'

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('mode') === 'embed'
  const urlDeploymentType = searchParams.get('deploymentType') || searchParams.get('type')
  const chatbotId = params?.id as string
  const [previewDeploymentType, setPreviewDeploymentType] = useState<'popover' | 'fullpage' | 'popup-center'>(
    (urlDeploymentType === 'popover' || urlDeploymentType === 'popup-center') ? urlDeploymentType : 'fullpage'
  )
  const [isOpen, setIsOpen] = useState<boolean>(urlDeploymentType === 'fullpage' || (!urlDeploymentType && !isEmbed))
  const [isInIframe, setIsInIframe] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'liked' | 'disliked' | null>>({})
  const [input, setInput] = useState('')
  const [currentTranscript, setCurrentTranscript] = useState('') // Separate state for voice transcript display
  // Track if ChatKit is unavailable (for fallback to regular chat)
  const [chatKitUnavailable, setChatKitUnavailable] = useState(false)
  // Track if viewport is mobile
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check if page is loaded in an iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  // Auto-open on mobile fullpage embed (since popover was converted to fullpage)
  useEffect(() => {
    if (isMobile && isEmbed) {
      setIsOpen(true)
    }
  }, [isMobile, isEmbed])

  // Load chatbot
  const { chatbot, setChatbot, emulatorConfig, setEmulatorConfig } = useChatbotLoader({
    chatbotId,
    previewDeploymentType,
    isInIframe,
    onChatbotLoaded: (loadedChatbot) => {
      if (loadedChatbot.deploymentType) {
        setPreviewDeploymentType(loadedChatbot.deploymentType)
        // Update isOpen state based on the loaded deployment type
        if (loadedChatbot.deploymentType === 'popover' || loadedChatbot.deploymentType === 'popup-center') {
          // Check for auto-show setting, otherwise default to closed (false)
          // Note: Logic in useEffect below handles auto-show timing, but we should set initial state correctly
          // If we set it to false here, the useEffect regarding valid deployment types might not trigger if it was already false?
          // Actually, let's just let the state update trigger the effect logic if needed, or explicitly set it.
          // For Popover/Popup, usually starts closed unless autoShow is strictly true and delay is 0.
          // To match Embed logic:
          const shouldAuto = (loadedChatbot as any).widgetAutoShow !== undefined ? (loadedChatbot as any).widgetAutoShow : true
          if (!shouldAuto) {
            setIsOpen(false)
          }
          // If shouldAuto is true, the useEffect [chatbot, previewDeploymentType] will handle opening it after delay
        } else {
          // Fullpage always open
          setIsOpen(true)
        }
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

  // Listen for preview mode changes and external control commands
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
      if (data.type === 'clear-session') {
        setMessages([])
      }
      // Handle external control commands from parent window (embed script)
      if (data.type === 'open-chat') {
        setIsOpen(true)
      }
      if (data.type === 'close-chat') {
        setIsOpen(false)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleClose = () => {
    if (isEmbed || isInIframe) {
      window.parent.postMessage({ type: 'close-chat' }, '*')
    }
    setIsOpen(false)
  }

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

  // Determine deployment type - force fullpage on mobile/tablet for popover modes
  const baseDeploymentType = (isEmbed && searchParams.get('type'))
    ? (searchParams.get('type') as 'popover' | 'fullpage' | 'popup-center')
    : (isEmbed ? 'fullpage' : previewDeploymentType)

  // On mobile/tablet, auto-switch popover/popup-center to fullpage for better UX
  const effectiveDeploymentType = (isMobile && (baseDeploymentType === 'popover' || baseDeploymentType === 'popup-center'))
    ? 'fullpage'
    : baseDeploymentType

  const chatStyle = getChatStyle(chatbot)
  const containerStyle = getContainerStyle(chatbot, effectiveDeploymentType, emulatorConfig, isMobile, isEmbed)
  const overlayStyle = getOverlayStyle(effectiveDeploymentType, chatbot, isOpen)
  const popoverPositionStyle = getPopoverPositionStyle(chatbot)
  const widgetButtonStyle = getWidgetButtonStyle(chatbot)

  // Render ChatKit only if engine type is chatkit or openai-agent-sdk with agent ID
  const useChatKitInRegularStyle = (chatbot as any).useChatKitInRegularStyle === true || isMobile
  const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
  const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
  const shouldRenderChatKit =
    !chatKitUnavailable &&
    (chatbot.engineType === 'chatkit' || chatbot.engineType === 'openai-agent-sdk') &&
    agentId

  // Debug: Trace ChatKit rendering conditions
  console.log('ChatKit Debug:', {
    shouldRenderChatKit,
    chatKitUnavailable,
    engineType: chatbot.engineType,
    agentId: agentId,
    useChatKitInRegularStyle,
    isMobile
  })

  const isNativeChatKit = shouldRenderChatKit && !useChatKitInRegularStyle

  // On mobile, when chat is open, hide widget button (fullpage mode covers entire screen)
  // Widget button should show in embed mode if deployment type is popover/popup-center
  // Also show widget button on mobile embed when chat is closed (so user can re-open)
  // IMPORTANT: In preview/emulator mode (!isInIframe), always show widget for popover/popup-center
  const shouldShowWidgetButton = !isNativeChatKit && (
    (effectiveDeploymentType === 'popover' || effectiveDeploymentType === 'popup-center') ||
    (isMobile && isEmbed && !isOpen)  // Mobile embed: show button when closed
  ) && !(isMobile && isOpen && isEmbed) // Hide on mobile when open in embed mode
  // For mobile embed (where popover was converted to fullpage), respect isOpen state
  // Regular fullpage always shows container, but mobile embed fullpage can be closed
  const isMobileEmbedFullpage = isMobile && isEmbed && effectiveDeploymentType === 'fullpage'
  const shouldShowContainer = !isNativeChatKit && (
    effectiveDeploymentType === 'fullpage'
      ? (isMobileEmbedFullpage ? isOpen : true)  // Mobile embed respects isOpen
      : isOpen
  )

  const renderChatContent = () => {
    if (!chatbot) return null

    // If it's ChatKit but NOT in regular style mode, use native ChatKit (Desktop only, if enabled)
    if (shouldRenderChatKit && !useChatKitInRegularStyle) {
      return (
        <ChatKitRenderer
          chatbot={chatbot}
          previewDeploymentType={effectiveDeploymentType}
          isInIframe={isInIframe}
          isMobile={isMobile}
          onChatKitUnavailable={() => setChatKitUnavailable(true)}
        />
      )
    }

    // If it's ChatKit in regular style mode (Desktop windowed OR Mobile Popover/Fullpage), use platform container + headless ChatKit
    if (shouldRenderChatKit && useChatKitInRegularStyle) {
      return (
        <div
          className="flex-1 relative overflow-hidden chatkit-in-regular-style"
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            height: '100%', // Ensure full height for ChatKit on mobile
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatKitRenderer
            chatbot={chatbot}
            previewDeploymentType={effectiveDeploymentType}
            isInIframe={isInIframe}
            isMobile={isMobile}
            onChatKitUnavailable={() => setChatKitUnavailable(true)}
          />
        </div>
      )
    }

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
        hideHeader={true} // Main loop handles header rendering now for consistency
      />
    )
  }

  // Full page layout with sidebar - Only use this layout when:
  // 1. Deployment type is fullpage AND not in iframe (normal fullpage access)
  // 2. OR when not in iframe regardless of deployment type (non-embed access without sidebar uses widget/container below)
  // In emulator (isInIframe=true), always use the widget/container rendering path below to properly show popover button
  const isPreview = searchParams.get('preview') === 'true'
  if (effectiveDeploymentType === 'fullpage' && !isInIframe && !isPreview) {
    return (
      <FullPageChatLayout
        emulatorConfig={emulatorConfig}
        chatbot={chatbot}
        threadManagementEnabled={!!threadManagementEnabled}
        currentThreadId={currentThreadId}
        threads={threads}
        threadsLoading={threadsLoading}
        setCurrentThreadId={setCurrentThreadId}
        setMessages={setMessages}
        deleteThread={deleteThread}
        updateThreadTitle={updateThreadTitle}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        handleSelectChat={handleSelectChat}
        handleNewChat={handleNewChat}
        handleDeleteChat={handleDeleteChat}
        previewDeploymentType={previewDeploymentType}
        setPreviewDeploymentType={setPreviewDeploymentType}
        setIsOpen={setIsOpen}
        isMobile={isMobile}
        isEmbed={isEmbed}
        useChatKitInRegularStyle={useChatKitInRegularStyle}
        shouldRenderChatKit={!!shouldRenderChatKit}
        handleClose={handleClose}
      >
        {renderChatContent()}
      </FullPageChatLayout>
    )
  }

  // Debug logging
  console.log('ChatPage Render:', {
    chatbotId,
    previewDeploymentType,
    isEmbed,
    isInIframe,
    isMobile,
    isOpen,
    shouldShowWidgetButton,
    shouldShowContainer,
    isNativeChatKit,
    useChatKitInRegularStyle,
    effectiveDeploymentType
  })

  // Debug: Log container style for embed debugging
  console.log('Container Style Debug:', {
    effectiveDeploymentType,
    isEmbed,
    isMobile,
    containerStyle,
    shouldShowContainer,
    shouldShowWidgetButton
  })

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

      {/* Native ChatKit rendering (renders its own widget/container) */}
      {isNativeChatKit && renderChatContent()}

      {/* Widget launcher button */}
      {shouldShowWidgetButton && (
        <ChatWidgetButton
          chatbot={chatbot}
          isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          widgetButtonStyle={widgetButtonStyle}
          popoverPositionStyle={popoverPositionStyle}
        />
      )}

      {/* Chat container */}
      {shouldShowContainer && (
        <WidgetChatContainer
          chatbot={chatbot}
          containerStyle={containerStyle}
          chatStyle={chatStyle}
          emulatorConfig={emulatorConfig}
          isMobile={isMobile}
          isEmbed={isEmbed}
          useChatKitInRegularStyle={useChatKitInRegularStyle}
          shouldRenderChatKit={!!shouldRenderChatKit}
          effectiveDeploymentType={effectiveDeploymentType}
          handleClose={handleClose}
          onClearSession={() => setMessages([])}
        >
          {renderChatContent()}
        </WidgetChatContainer>
      )}
    </div>
  )
}
