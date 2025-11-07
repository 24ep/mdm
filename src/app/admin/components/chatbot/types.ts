export interface ChatbotVersion {
  id: string
  version: string
  createdAt: Date
  createdBy: string
  isPublished: boolean
  changes?: string
}

export interface ChatKitColorAccent {
  primary?: string
  level?: number // 0-4 intensity level
  icon?: string // Icon color (separate from primary accent)
}

export interface ChatKitColor {
  accent?: ChatKitColorAccent
  background?: string
  text?: string
  secondary?: string
  border?: string
  surface?: string
  [key: string]: any
}

export interface ChatKitTypography {
  fontFamily?: string
  fontSize?: string | number
  fontWeight?: string | number
  lineHeight?: string | number
  letterSpacing?: string | number
  [key: string]: any
}

export interface ChatKitTheme {
  colorScheme?: 'light' | 'dark'
  color?: ChatKitColor
  radius?: 'pill' | 'round' | 'soft' | 'sharp'
  density?: 'compact' | 'normal' | 'spacious'
  typography?: ChatKitTypography
  // Legacy support
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  [key: string]: any
}

export interface ChatKitComposerTool {
  id?: string
  label?: string
  shortLabel?: string // Shorter label variant for compact display
  icon?: string
  pinned?: boolean
  type?: string
  accept?: string // For file_upload tools: e.g., "image/*", "video/*", ".pdf,.doc"
  placeholderOverride?: string // Override placeholder text for this specific tool
  [key: string]: any
}

export interface ChatKitComposer {
  placeholder?: string
  tools?: ChatKitComposerTool[]
  [key: string]: any
}

export interface ChatKitHeaderButton {
  icon?: string
  label?: string
  onClick?: () => void
  [key: string]: any
}

export interface ChatKitHeader {
  customButtonLeft?: ChatKitHeaderButton[]
  [key: string]: any
}

export interface ChatKitStartScreenPrompt {
  name?: string
  label?: string
  prompt: string
  icon?: string
  [key: string]: any
}

export interface ChatKitStartScreen {
  greeting?: string
  prompts?: ChatKitStartScreenPrompt[]
}

export interface ChatKitEntities {
  onTagSearch?: (query: string) => Promise<any[]>
  onRequestPreview?: (entity: any) => Promise<any>
  [key: string]: any
}

export interface ChatKitDisclaimer {
  text?: string
  [key: string]: any
}

export interface ChatKitThreadItemActions {
  feedback?: boolean
  retry?: boolean
  [key: string]: any
}

export interface ChatKitModelPicker {
  enabled?: boolean
  [key: string]: any
}

export interface ChatKitPersonaPicker {
  enabled?: boolean
  personas?: Array<{
    id?: string
    name?: string
    description?: string
    systemPrompt?: string
    [key: string]: any
  }>
  [key: string]: any
}

export interface ChatKitOptions {
  theme?: ChatKitTheme
  locale?: string
  composer?: ChatKitComposer
  header?: ChatKitHeader
  startScreen?: ChatKitStartScreen
  entities?: ChatKitEntities
  disclaimer?: ChatKitDisclaimer
  threadItemActions?: ChatKitThreadItemActions
  modelPicker?: ChatKitModelPicker
  personaPicker?: ChatKitPersonaPicker
  [key: string]: any
}

export interface DifyFile {
  type: 'image' | 'document' | 'audio' | 'video'
  transfer_method: 'remote_url' | 'local_file'
  url?: string // For remote_url
  upload_file_id?: string // For local_file
  [key: string]: any
}

export interface DifyOptions {
  apiBaseUrl?: string // Dify API base URL (e.g., http://ncc-dify.qsncc.com)
  responseMode?: 'streaming' | 'blocking' // Response mode: streaming or blocking
  user?: string // User identifier
  conversationId?: string // Conversation ID for continuing conversations
  inputs?: Record<string, any> // Input variables for the workflow/app
  [key: string]: any
}

export interface Chatbot {
  id: string
  name: string
  website: string
  description?: string
  engineType: 'custom' | 'agentbuilder' | 'openai' | 'chatkit' | 'dify' | 'openai-agent-sdk'
  apiEndpoint: string
  apiAuthType: 'none' | 'bearer' | 'api_key' | 'custom'
  apiAuthValue: string
  selectedModelId?: string
  selectedEngineId?: string
  // ChatKit specific
  chatkitAgentId?: string
  chatkitApiKey?: string
  chatkitOptions?: ChatKitOptions
  // Dify specific
  difyApiKey?: string
  difyOptions?: DifyOptions
  // OpenAI Agent SDK specific
  openaiAgentSdkAgentId?: string
  openaiAgentSdkApiKey?: string
  openaiAgentSdkModel?: string // Model to use (e.g., "gpt-4o", "gpt-5")
  openaiAgentSdkInstructions?: string // Agent instructions
  openaiAgentSdkReasoningEffort?: 'low' | 'medium' | 'high' // Reasoning effort for gpt-5
  openaiAgentSdkStore?: boolean // Whether to store reasoning traces
  openaiAgentSdkVectorStoreId?: string // Vector store ID for file search tool
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
  // Message bubble padding (separate for user and bot)
  userBubblePadding?: string
  botBubblePadding?: string
  // Message background colors
  userMessageBackgroundColor?: string
  botMessageBackgroundColor?: string
  // User message font styling
  userMessageFontColor?: string
  userMessageFontFamily?: string
  userMessageFontSize?: string
  // Message display options
  showMessageName?: boolean
  messageName?: string
  messageNamePosition?: 'top-of-message' | 'top-of-avatar' | 'right-of-avatar'
  showMessageAvatar?: boolean
  messageAvatarPosition?: 'top-of-message' | 'left-of-message'
  messageBoxColor: string
  shadowColor: string
  shadowBlur: string
  // Config
  conversationOpener: string
  followUpQuestions: string[]
  enableFileUpload: boolean
  showCitations: boolean
  enableVoiceAgent?: boolean
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
  // Chat window padding
  chatWindowPaddingX?: string
  chatWindowPaddingY?: string
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
  // Header Avatar (separate from message avatar)
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
  sendButtonPaddingX?: string
  sendButtonPaddingY?: string
  // File Upload Layout
  fileUploadLayout?: 'attach-first' | 'input-first'
  // Avatar (Bot/Assistant)
  avatarType?: 'icon' | 'image'
  avatarIcon?: string
  avatarIconColor?: string
  avatarBackgroundColor?: string
  avatarImageUrl?: string
  // User Avatar
  showUserAvatar?: boolean
  userAvatarType?: 'icon' | 'image'
  userAvatarIcon?: string
  userAvatarIconColor?: string
  userAvatarBackgroundColor?: string
  userAvatarImageUrl?: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  versions: ChatbotVersion[]
  currentVersion: string
}

