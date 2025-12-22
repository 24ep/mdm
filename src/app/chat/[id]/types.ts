export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: string[]
  traceId?: string // Langfuse trace ID for observability
  attachments?: Array<{
    type: 'image' | 'video'
    url: string
    name?: string
  }>
}

export interface ChatKitColorAccent {
  primary?: string
  level?: number
}

export interface ChatKitColor {
  accent?: ChatKitColorAccent
  [key: string]: any
}

export interface ChatKitTypography {
  fontFamily?: string
  [key: string]: any
}

export interface ChatKitTheme {
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

export interface ChatKitComposer {
  placeholder?: string
  tools?: any[]
  [key: string]: any
}

export interface ChatKitStartScreen {
  greeting?: string
  prompts?: Array<{ label: string; prompt: string }>
}

export interface ChatKitOptions {
  theme?: ChatKitTheme
  locale?: string
  composer?: ChatKitComposer
  startScreen?: ChatKitStartScreen
  [key: string]: any
}

export interface ChatbotConfig {
  id: string
  name: string
  engineType?: 'custom' | 'openai' | 'chatkit' | 'dify' | 'openai-agent-sdk'
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
  openaiAgentSdkEnableWebSearch?: boolean
  openaiAgentSdkEnableCodeInterpreter?: boolean
  openaiAgentSdkEnableComputerUse?: boolean
  openaiAgentSdkEnableImageGeneration?: boolean
  openaiAgentSdkUseWorkflowConfig?: boolean
  logo?: string
  primaryColor: string
  fontFamily: string
  fontSize: string
  fontColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  bubbleBorderColor?: string
  bubbleBorderWidth?: string
  bubbleBorderRadius?: string
  bubblePadding?: string
  // Message bubble padding (separate for user and bot)
  userBubblePadding?: string
  userBubblePaddingTop?: string
  userBubblePaddingRight?: string
  userBubblePaddingBottom?: string
  userBubblePaddingLeft?: string
  botBubblePadding?: string
  botBubblePaddingTop?: string
  botBubblePaddingRight?: string
  botBubblePaddingBottom?: string
  botBubblePaddingLeft?: string
  userMessageBackgroundColor?: string
  botMessageBackgroundColor?: string
  userMessageFontColor?: string
  userMessageFontFamily?: string
  userMessageFontSize?: string
  showMessageName?: boolean
  messageName?: string
  messageNamePosition?: 'top-of-message' | 'top-of-avatar' | 'right-of-avatar'
  showMessageAvatar?: boolean
  messageAvatarPosition?: 'top-of-message' | 'left-of-message'
  messageBoxColor: string
  shadowColor: string
  shadowBlur: string
  conversationOpener: string
  showStartConversation?: boolean // Show/hide the start conversation message
  // Start Screen Prompts (for Agent SDK and other engines)
  startScreenPrompts?: Array<{ label?: string; prompt: string; icon?: string }> // Quick prompt buttons shown when chat starts
  // Start Screen Prompts Styling
  startScreenPromptsStyle?: 'list' | 'card' // Style type: list or card
  startScreenPromptsPosition?: 'center' | 'bottom' | 'list' // Position of prompts
  startScreenPromptsIconDisplay?: 'suffix' | 'show-all' | 'none' // How to display icons
  startScreenPromptsBackgroundColor?: string // Background color of prompt buttons
  startScreenPromptsFontColor?: string // Font color of prompt buttons
  startScreenPromptsFontFamily?: string // Font family of prompt buttons
  startScreenPromptsFontSize?: string // Font size of prompt buttons
  startScreenPromptsPadding?: string // Padding of prompt buttons
  startScreenPromptsBorderColor?: string // Border color of prompt buttons
  startScreenPromptsBorderWidth?: string // Border width of prompt buttons
  startScreenPromptsBorderRadius?: string // Border radius of prompt buttons
  // Conversation Opener Styling
  conversationOpenerFontSize?: string
  conversationOpenerFontColor?: string
  conversationOpenerFontFamily?: string
  conversationOpenerPosition?: 'center' | 'left' | 'right' | 'top' | 'bottom'
  conversationOpenerAlignment?: 'left' | 'center' | 'right' | 'justify'
  conversationOpenerBackgroundColor?: string
  conversationOpenerPadding?: string
  conversationOpenerBorderRadius?: string
  conversationOpenerFontWeight?: string | number
  conversationOpenerLineHeight?: string | number
  followUpQuestions: string[]
  openaiAgentSdkGreeting?: string
  openaiAgentSdkPlaceholder?: string
  openaiAgentSdkBackgroundColor?: string
  enableFileUpload: boolean
  showCitations: boolean
  enableVoiceAgent?: boolean
  voiceProvider?: 'browser' | 'openai-realtime' // Voice provider: 'browser' for Web Speech API, 'openai-realtime' for OpenAI Realtime API
  voiceUIStyle?: 'chat' | 'wave' // Voice UI style: 'chat' for chat-like UI, 'wave' for background wave animation
  showMessageFeedback?: boolean
  showMessageRetry?: boolean
  typingIndicatorStyle?: 'spinner' | 'dots' | 'pulse' | 'bounce'
  typingIndicatorColor?: string
  showThinkingMessage?: boolean // Show "Thinking..." text like OpenAI
  thinkingMessageText?: string // Custom text for thinking message (default: "Thinking...")
  // Page styling (for fullpage/embed view)
  pageBackgroundColor?: string
  pageBackgroundImage?: string
  pageTitle?: string
  pageDescription?: string
  headerEnabled?: boolean // Manually show/hide header
  headerTitle?: string
  headerDescription?: string
  headerLogo?: string
  headerBgColor?: string
  headerFontColor?: string
  headerFontFamily?: string
  headerShowAvatar?: boolean
  headerAvatarType?: 'icon' | 'image'
  headerAvatarIcon?: string
  headerAvatarIconColor?: string
  headerAvatarBackgroundColor?: string
  headerAvatarImageUrl?: string
  headerBorderEnabled?: boolean
  headerBorderColor?: string
  headerPaddingX?: string
  headerPaddingY?: string
  headerPaddingTop?: string
  headerPaddingRight?: string
  headerPaddingBottom?: string
  headerPaddingLeft?: string
  headerBorderWidthTop?: string
  headerBorderWidthRight?: string
  headerBorderWidthBottom?: string
  headerBorderWidthLeft?: string
  // Close Button
  closeButtonOffsetX?: string
  closeButtonOffsetY?: string
  // Footer Styling
  footerBgColor?: string
  footerBorderColor?: string
  footerBorderWidth?: string
  footerBorderWidthTop?: string
  footerBorderWidthRight?: string
  footerBorderWidthBottom?: string
  footerBorderWidthLeft?: string
  footerBorderRadius?: string
  footerBorderRadiusTopLeft?: string
  footerBorderRadiusTopRight?: string
  footerBorderRadiusBottomRight?: string
  footerBorderRadiusBottomLeft?: string
  footerPaddingX?: string
  footerPaddingY?: string
  footerInputBgColor?: string
  footerInputBorderColor?: string
  footerInputBorderWidth?: string
  footerInputBorderWidthTop?: string
  footerInputBorderWidthRight?: string
  footerInputBorderWidthBottom?: string
  footerInputBorderWidthLeft?: string
  footerInputBorderRadius?: string
  footerInputBorderRadiusTopLeft?: string
  footerInputBorderRadiusTopRight?: string
  footerInputBorderRadiusBottomRight?: string
  footerInputBorderRadiusBottomLeft?: string
  footerInputFontColor?: string
  sendButtonIcon?: string
  sendButtonRounded?: boolean // Deprecated - use sendButtonBorderRadius instead
  sendButtonBorderRadius?: string
  sendButtonBorderRadiusTopLeft?: string
  sendButtonBorderRadiusTopRight?: string
  sendButtonBorderRadiusBottomRight?: string
  sendButtonBorderRadiusBottomLeft?: string
  sendButtonBgColor?: string
  sendButtonIconColor?: string
  sendButtonShadowColor?: string
  sendButtonShadowBlur?: string
  sendButtonPaddingX?: string
  sendButtonPaddingY?: string
  fileUploadLayout?: 'attach-first' | 'input-first'
  avatarType?: 'icon' | 'image'
  avatarIcon?: string
  avatarIconColor?: string
  avatarBackgroundColor?: string
  avatarImageUrl?: string
  showUserAvatar?: boolean
  userAvatarType?: 'icon' | 'image'
  userAvatarIcon?: string
  userAvatarIconColor?: string
  userAvatarBackgroundColor?: string
  userAvatarImageUrl?: string
  deploymentType?: 'popover' | 'fullpage' | 'popup-center'
  widgetAvatarStyle?: 'circle' | 'square' | 'circle-with-label'
  widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center'
  widgetSize?: string
  widgetBackgroundColor?: string
  widgetBackgroundBlur?: number // Blur percentage (0-100) for glassmorphism effect
  widgetBackgroundOpacity?: number // Background opacity (0-100) for glassmorphism effect
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
  chatWindowWidth?: string
  chatWindowHeight?: string
  chatWindowBackgroundBlur?: number // Blur percentage (0-100) for glassmorphism effect
  chatWindowBackgroundOpacity?: number // Background opacity (0-100) for glassmorphism effect
  // Overlay configuration (shown when chat is open)
  overlayEnabled?: boolean // Enable/disable overlay when chat is open
  overlayColor?: string // Overlay background color (hex, rgb, rgba)
  overlayOpacity?: number // Overlay opacity (0-100)
  overlayBlur?: number // Overlay blur percentage (0-100) for glassmorphism effect
  chatWindowBorderColor?: string
  chatWindowBorderWidth?: string
  chatWindowBorderRadius?: string
  chatWindowShadowColor?: string
  chatWindowShadowBlur?: string

  chatWindowPaddingX?: string
  chatWindowPaddingY?: string
  // PWA Configuration
  enablePWA?: boolean
  pwaName?: string
  pwaShortName?: string
  pwaDescription?: string
  pwaBackgroundColor?: string
  pwaThemeColor?: string
  pwaStartUrl?: string
  pwaDisplay?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  pwaIcon192?: string
  pwaIcon512?: string
  pwaManifestPath?: string
  pwaServiceWorkerPath?: string

  popoverPosition?: 'top' | 'left' // Position of popover relative to widget: 'top' = above widget, 'left' = to the left of widget
  widgetPopoverMargin?: string // Margin/spacing between widget button and popover window
}

