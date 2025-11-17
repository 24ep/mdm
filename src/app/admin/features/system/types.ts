/**
 * System Feature Types
 * Centralized type definitions for the system feature
 */

export interface SystemSettings {
  // General
  siteName: string
  siteDescription: string
  siteUrl: string
  supportEmail: string
  
  // Database
  dbHost: string
  dbPort: number
  dbName: string
  dbUser: string
  dbPassword: string
  
  // Email
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpSecure: boolean
  
  // Security
  sessionTimeout: number
  maxLoginAttempts: number
  passwordMinLength: number
  requireTwoFactor: boolean
  
  // Features
  allowRegistration: boolean
  allowGuestAccess: boolean
  enableNotifications: boolean
  enableAnalytics: boolean
  
  // Storage
  maxFileSize: number
  allowedFileTypes: string[]
  storageProvider: 'local' | 's3' | 'supabase'
}

export interface Theme {
  id: string
  name: string
  type: 'system' | 'space'
  spaceId?: string
  spaceName?: string
  isActive: boolean
  isDefault: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
    input?: string
    ring?: string
  }
  typography?: {
    fontFamily: string
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
    }
    fontWeight: {
      normal: string
      medium: string
      semibold: string
      bold: string
    }
  }
  spacing?: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius?: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  shadows?: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  customCSS?: string
  logo?: {
    url: string
    alt: string
    width: number
    height: number
  }
  favicon?: {
    url: string
    type: string
  }
  fonts?: {
    heading: string
    body: string
    mono: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface BrandingConfig {
  // Application branding
  applicationLogo?: string
  applicationLogoType?: 'image' | 'icon'
  applicationLogoIcon?: string // Icon name from lucide-react
  applicationLogoIconColor?: string
  applicationLogoBackgroundColor?: string
  applicationName: string
  
  // Light mode colors
  lightMode: {
    primaryColor: string
    secondaryColor: string
    warningColor: string
    dangerColor: string
    topMenuBackgroundColor: string
    platformSidebarBackgroundColor: string
    secondarySidebarBackgroundColor: string
    topMenuTextColor: string
    platformSidebarTextColor: string
    secondarySidebarTextColor: string
    bodyBackgroundColor: string
  }
  
  // Dark mode colors
  darkMode: {
    primaryColor: string
    secondaryColor: string
    warningColor: string
    dangerColor: string
    topMenuBackgroundColor: string
    platformSidebarBackgroundColor: string
    secondarySidebarBackgroundColor: string
    topMenuTextColor: string
    platformSidebarTextColor: string
    secondarySidebarTextColor: string
    bodyBackgroundColor: string
  }
  
  // Login background
  loginBackground: {
    type: 'color' | 'gradient' | 'image'
    color?: string
    gradient?: {
      from: string
      to: string
      angle: number
    }
    image?: string
  }
  
  // Global styling (not applied to space modules)
  globalStyling: {
    borderRadius: string // e.g., "0.5rem", "8px"
    borderColor: string // e.g., "#e2e8f0"
    borderWidth: string // e.g., "1px"
    buttonBorderRadius: string
    buttonBorderWidth: string
    inputBorderRadius: string
    inputBorderWidth: string
    selectBorderRadius: string
    selectBorderWidth: string
    textareaBorderRadius: string
    textareaBorderWidth: string
  }

  // Component-specific styling
  componentStyling: {
    [componentId: string]: {
      // Light mode styling
      light: {
        backgroundColor?: string
        textColor?: string
        borderColor?: string
        borderRadius?: string
        borderWidth?: string
        padding?: string
        fontSize?: string
        fontWeight?: string
      }
      // Dark mode styling
      dark: {
        backgroundColor?: string
        textColor?: string
        borderColor?: string
        borderRadius?: string
        borderWidth?: string
        padding?: string
        fontSize?: string
        fontWeight?: string
      }
    }
  }
}

export interface TemplateItem {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  version: string
  scope?: 'global' | 'space'
  visibleToSpaces?: string[]
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'push' | 'sms' | 'webhook'
  subject?: string
  content: string
  variables: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationSettings {
  email: {
    enabled: boolean
    smtp: {
      host: string
      port: number
      username: string
      password: string
      secure: boolean
    }
    from: string
    replyTo: string
  }
  push: {
    enabled: boolean
    vapidKeys?: {
      publicKey: string
      privateKey: string
    }
  }
  sms: {
    enabled: boolean
    provider?: string
    apiKey?: string
    apiSecret?: string
  }
  webhook: {
    enabled: boolean
    url?: string
    secret?: string
  }
}

