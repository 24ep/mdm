export interface ChatbotVersion {
  id: string
  version: string
  createdAt: Date
  createdBy: string
  isPublished: boolean
  changes?: string
}

export interface Chatbot {
  id: string
  name: string
  website: string
  description?: string
  apiEndpoint: string
  apiAuthType: 'none' | 'bearer' | 'api_key' | 'custom'
  apiAuthValue: string
  // Style config
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
  // Config
  conversationOpener: string
  followUpQuestions: string[]
  enableFileUpload: boolean
  showCitations: boolean
  // Deployment
  deploymentType: 'popover' | 'fullpage' | 'popup-center'
  embedCode?: string
  // Widget styling (for popover)
  widgetAvatarStyle: 'circle' | 'square' | 'circle-with-label'
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center'
  widgetSize: string
  widgetBackgroundColor: string
  widgetBorderColor: string
  widgetBorderWidth: string
  widgetBorderRadius: string
  widgetShadowColor: string
  widgetShadowBlur: string
  widgetLabelText?: string
  widgetLabelColor?: string
  // Widget behavior
  widgetAnimation: 'none' | 'fade' | 'slide' | 'bounce'
  widgetAutoShow: boolean
  widgetAutoShowDelay: number // seconds
  widgetOffsetX: string // horizontal offset from edge
  widgetOffsetY: string // vertical offset from edge
  widgetZIndex: number
  showNotificationBadge: boolean
  notificationBadgeColor: string
  // Chat window size
  chatWindowWidth: string
  chatWindowHeight: string
  // Chat window border (popover/fullpage frame)
  chatWindowBorderColor?: string
  chatWindowBorderWidth?: string
  chatWindowBorderRadius?: string
  // Chat window shadow
  chatWindowShadowColor?: string
  chatWindowShadowBlur?: string
  // Typing indicator
  typingIndicatorStyle?: 'spinner' | 'dots' | 'pulse' | 'bounce'
  typingIndicatorColor?: string
  // Header
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
  // Avatar
  avatarType?: 'icon' | 'image'
  avatarIcon?: string
  avatarIconColor?: string
  avatarBackgroundColor?: string
  avatarImageUrl?: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  versions: ChatbotVersion[]
  currentVersion: string
}

