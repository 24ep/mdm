import React from 'react'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

export type ComponentType = 'sidebar' | 'top' | 'footer'

export type ComponentConfig = {
  type: ComponentType
  visible: boolean
  position?: 'left' | 'right' | 'top' | 'bottom' | 'topOfSidebar'
  width?: number
  height?: number
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
  fontSize?: number
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold'
  opacity?: number
  zIndex?: number
  shadow?: boolean
  sticky?: boolean
  menuItems?: Record<string, boolean>
}

export type ComponentStyle = {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
  fontSize?: number
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold'
  fontFamily?: string
  opacity?: number
  shadow?: boolean
}

export type GlobalStyleConfig = {
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  backgroundColor?: string
  fontFamily?: string
  fontSize?: number
  borderRadius?: string
  logoUrl?: string
  faviconUrl?: string
  components?: {
    input?: ComponentStyle
    select?: ComponentStyle
    button?: ComponentStyle
    tabs?: ComponentStyle
    card?: ComponentStyle
    table?: ComponentStyle
    modal?: ComponentStyle
    tooltip?: ComponentStyle
  }
}

export type UnifiedPage = { 
  id: string
  name: string
  type: 'built-in' | 'custom' | 'separator' | 'label' | 'text' | 'header' | 'image' | 'badge' | 'login'
  icon?: React.ComponentType<{ className?: string }>
  page?: SpacesEditorPage
  label?: string // For label type
  text?: string // For text type
  headerText?: string // For header type
  imageUrl?: string // For image type
  imageAlt?: string // For image type
  badgeText?: string // For badge type
  badgeColor?: string // For badge type
  sidebarPosition?: 'top' | 'bottom' // For pages in sidebar
  backgroundColor?: string // For page background color
}

