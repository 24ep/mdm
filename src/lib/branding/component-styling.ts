/**
 * Component styling functions
 * Applies component-specific styling to UI components
 * Excludes space modules
 */

import { BrandingConfig } from '@/app/admin/features/system/types'
import { rgbaToHsl, hasAlphaChannel } from './utils'
import { componentSelectors } from './component-selectors'

/**
 * Maps camelCase style properties to CSS kebab-case
 */
const propertyMap: Record<string, string> = {
  backgroundColor: 'background',
  textColor: 'color',
  borderColor: 'border-color',
  borderRadius: 'border-radius',
  borderWidth: 'border-width',
  borderStyle: 'border-style',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  fontStyle: 'font-style',
  fontFamily: 'font-family',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  textAlign: 'text-align',
  textTransform: 'text-transform',
  textDecoration: 'text-decoration',
  boxShadow: 'box-shadow',
  backdropFilter: 'backdrop-filter',
  transition: 'transition',
  opacity: 'opacity',
  zIndex: 'z-index',
  padding: 'padding',
  margin: 'margin',
  gap: 'gap',
  width: 'width',
  height: 'height',
  minWidth: 'min-width',
  minHeight: 'min-height',
  maxWidth: 'max-width',
  maxHeight: 'max-height',
  display: 'display',
  flexDirection: 'flex-direction',
  justifyContent: 'justify-content',
  alignItems: 'align-items',
  overflow: 'overflow',
  cursor: 'cursor',
  outline: 'outline',
  outlineColor: 'outline-color',
  outlineWidth: 'outline-width',
}

/**
 * Special handlers for certain properties or components to inject required CSS variables
 */
function getSpecialCSS(componentId: string, prop: string, value: string): string {
  if (!value) return ''

  // Special handling for background colors to sync related CSS variables
  if (prop === 'backgroundColor') {
    const hsl = rgbaToHsl(value)
    
    if (componentId === 'text-input' || componentId === 'textarea') {
      return `  --input: ${hsl} !important;\n  --border: ${hsl} !important;\n`
    }
    if (componentId === 'button-destructive') {
      return `  --destructive: ${hsl} !important;\n  --tw-bg-opacity: 1 !important;\n`
    }
    if (componentId === 'card') {
      return `  --card: ${hsl} !important;\n  --popover: ${hsl} !important;\n`
    }
    if (componentId.includes('vertical-tab-menu-active') || componentId.includes('space-settings-menu-active')) {
      return `  --muted: ${hsl} !important;\n  --brand-current-bg: ${hsl} !important;\n`
    }
  }

  // Special handling for text colors
  if (prop === 'textColor') {
    const hsl = rgbaToHsl(value)
    if (componentId === 'button-destructive') {
      return `  --destructive-foreground: ${hsl} !important;\n`
    }
    if (componentId === 'text-input' || componentId === 'vertical-tab-menu-active') {
      return `  --foreground: ${hsl} !important;\n`
    }
  }

  return ''
}

export function applyComponentStyling(branding: BrandingConfig) {
  const styleId = 'branding-component-styling'
  const root = document.documentElement

  // Sync basic vars (moved to colors.ts but kept here for double-safety)
  root.style.setProperty('--brand-platform-sidebar-bg', branding.platformSidebarBackgroundColor)
  root.style.setProperty('--brand-platform-sidebar-text', branding.platformSidebarTextColor)

  let styleElement = document.getElementById(styleId) as HTMLStyleElement
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = styleId
    document.head.appendChild(styleElement)
  }

  let css = '/* Optimized Component-specific styling */\n'

  if (!branding.componentStyling) {
    styleElement.textContent = ''
    return
  }

  // Sort to ensure base components are processed before sub-variants
  const sortedIds = Object.keys(branding.componentStyling).sort()

  sortedIds.forEach(id => {
    const selectors = componentSelectors[id]
    if (!selectors || selectors.length === 0) return

    const rawStyle = branding.componentStyling[id]
    
    // Support both mode-based (light/dark) and flat structures
    const modes = {
      light: (rawStyle as any).light || (rawStyle.backgroundColor || rawStyle.textColor ? rawStyle : null),
      dark: (rawStyle as any).dark || null
    }

    const generateBlock = (mode: 'light' | 'dark' | 'none', style: any) => {
      if (!style || Object.keys(style).length === 0) return ''
      
      const prefix = mode === 'dark' ? '.dark ' : ''
      const combinedSelector = selectors.map(s => `${prefix}${s}`).join(',\n')
      
      let block = `${combinedSelector} {\n`
      
      Object.entries(style).forEach(([prop, value]) => {
        if (!value || typeof value !== 'string') return
        
        const cssProp = propertyMap[prop] || prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
        block += `  ${cssProp}: ${value} !important;\n`
        
        // Inject special variables
        block += getSpecialCSS(id, prop, value)
      })

      // Extra fixes for inputs/forms
      if (id === 'text-input' || id === 'textarea') {
        block += `  background-image: none !important;\n`
      }

      block += '}\n\n'
      return block
    }

    if (modes.light) css += generateBlock('none', modes.light)
    if (modes.dark) css += generateBlock('dark', modes.dark)
  })

  // Prevent leaking into space modules
  css += `
[data-space], [data-space] *, [class*="space-studio"], [id*="space-"] {
  /* Resets for space-specific modules if needed */
}
`

  styleElement.textContent = css
}
