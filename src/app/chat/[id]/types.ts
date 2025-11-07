export interface Message {
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
  bubbleBorderColor?: string
  bubbleBorderWidth?: string
  bubbleBorderRadius?: string
  bubblePadding?: string
  // Message bubble padding (separate for user and bot)
  userBubblePadding?: string
  botBubblePadding?: string
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
  headerAvatarType?: 'icon' | 'image'
  headerAvatarIcon?: string
  headerAvatarIconColor?: string
  headerAvatarBackgroundColor?: string
  headerAvatarImageUrl?: string
  headerBorderEnabled?: boolean
  headerBorderColor?: string
  headerPaddingX?: string
  headerPaddingY?: string
  // Close Button
  closeButtonOffsetX?: string
  closeButtonOffsetY?: string
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
  sendButtonIcon?: string
  sendButtonRounded?: boolean
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
  chatWindowBorderColor?: string
  chatWindowBorderWidth?: string
  chatWindowBorderRadius?: string
  chatWindowShadowColor?: string
  chatWindowShadowBlur?: string
  chatWindowPaddingX?: string
  chatWindowPaddingY?: string
}

