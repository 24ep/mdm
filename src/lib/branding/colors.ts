/**
 * Apply branding colors to the platform
 * This applies colors to CSS variables that are used throughout the platform
 */

import { BrandingConfig } from '@/app/admin/features/system/types'
import { hexToHsl, rgbaToHsl, hasAlphaChannel } from './utils'
import { applyGlobalStyling } from './global-styling'
import { applyComponentStyling } from './component-styling'
import { applyDrawerOverlay } from './drawer'
import { applyLoginBackground } from './login'
import { applyApplicationBranding } from './application'

export function applyBrandingColors(branding: BrandingConfig) {
  const root = document.documentElement

  // Helper to set semantic token (HSL numbers) and direct brand variable
  const setBrandColor = (semanticName: string, color: string) => {
    if (!color) return
    const hsl = rgbaToHsl(color)
    root.style.setProperty(semanticName, hsl)
    // Direct usage variable (e.g. --brand-primary-raw if needed, but usually --brand-primary is the HSL numbers)
  }

  // 1. Core Branding Colors (Mainly for Shadcn/Tailwind internals)
  root.style.setProperty('--primary', rgbaToHsl(branding.primaryColor))
  root.style.setProperty('--secondary', rgbaToHsl(branding.secondaryColor))
  root.style.setProperty('--warning', rgbaToHsl(branding.warningColor))
  root.style.setProperty('--destructive', rgbaToHsl(branding.dangerColor))

  // 2. Map to Semantic Tokens (The new way)
  setBrandColor('--brand-primary', branding.primaryColor)
  setBrandColor('--brand-secondary', branding.secondaryColor)
  setBrandColor('--brand-warning', branding.warningColor)
  setBrandColor('--brand-danger', branding.dangerColor)

  setBrandColor('--brand-body-bg', branding.bodyBackgroundColor)
  setBrandColor('--brand-body-text', branding.bodyTextColor || (hasAlphaChannel(branding.bodyBackgroundColor) ? '#000000' : '#111827'))

  setBrandColor('--brand-ui-bg', branding.uiBackgroundColor || branding.topMenuBackgroundColor)
  setBrandColor('--brand-ui-border', branding.uiBorderColor || 'rgba(0, 0, 0, 0.1)')

  setBrandColor('--brand-top-menu-bg', branding.topMenuBackgroundColor)
  setBrandColor('--brand-top-menu-text', branding.topMenuTextColor)

  // Sidebar mapping
  setBrandColor('--brand-sidebar-primary-bg', branding.platformSidebarBackgroundColor)
  setBrandColor('--brand-sidebar-primary-text', branding.platformSidebarTextColor)
  setBrandColor('--brand-sidebar-secondary-bg', branding.secondarySidebarBackgroundColor)
  setBrandColor('--brand-sidebar-secondary-text', branding.secondarySidebarTextColor)

  // Component mapping
  const inputStyling = branding.componentStyling?.['text-input']
  if (inputStyling?.backgroundColor) {
    setBrandColor('--brand-input-bg', inputStyling.backgroundColor)
  }
  if (inputStyling?.borderColor) {
    setBrandColor('--brand-input-border', inputStyling.borderColor)
  }

  // 3. Legacy compatibility mappings (for components still using these variables)
  root.style.setProperty('--brand-platform-sidebar-bg', branding.platformSidebarBackgroundColor)
  root.style.setProperty('--brand-secondary-sidebar-bg', branding.secondarySidebarBackgroundColor)
  root.style.setProperty('--brand-top-menu-bg-raw', branding.topMenuBackgroundColor) // For direct usage if needed
  
  // Set --border and --input specifically as HSL numbers for Tailwind
  const uiBorderColor = branding.uiBorderColor || 'rgba(0, 0, 0, 0.1)'
  const borderHsl = rgbaToHsl(uiBorderColor)
  root.style.setProperty('--border', borderHsl)
  root.style.setProperty('--input', borderHsl)

  // Space module specifics

  // Set CSS variables for space settings menu (for inline style fallback)
  const spaceSettingsActive = branding.componentStyling?.['space-settings-menu-active']
  const spaceSettingsNormal = branding.componentStyling?.['space-settings-menu-normal']
  const spaceSettingsHover = branding.componentStyling?.['space-settings-menu-hover']

  console.log('[Branding] Space settings menu config:', {
    hasActive: !!spaceSettingsActive,
    activeBg: spaceSettingsActive?.backgroundColor,
    activeText: spaceSettingsActive?.textColor,
    hasNormal: !!spaceSettingsNormal,
    hasHover: !!spaceSettingsHover
  })

  if (spaceSettingsActive?.backgroundColor) {
    root.style.setProperty('--space-settings-menu-active-bg', spaceSettingsActive.backgroundColor)
    console.log('[Branding] Set --space-settings-menu-active-bg to:', spaceSettingsActive.backgroundColor)
  }
  if (spaceSettingsActive?.textColor) {
    root.style.setProperty('--space-settings-menu-active-text', spaceSettingsActive.textColor)
    console.log('[Branding] Set --space-settings-menu-active-text to:', spaceSettingsActive.textColor)
  }
  if (spaceSettingsNormal?.backgroundColor) {
    root.style.setProperty('--space-settings-menu-normal-bg', spaceSettingsNormal.backgroundColor)
  }
  if (spaceSettingsNormal?.textColor) {
    root.style.setProperty('--space-settings-menu-normal-text', spaceSettingsNormal.textColor)
  }
  if (spaceSettingsHover?.backgroundColor) {
    root.style.setProperty('--space-settings-menu-hover-bg', spaceSettingsHover.backgroundColor)
  }
  if (spaceSettingsHover?.textColor) {
    root.style.setProperty('--space-settings-menu-hover-text', spaceSettingsHover.textColor)
  }

  // Override CSS variables for platform sidebar if component styling has backgroundColor
  // This ensures inline styles in PlatformSidebar use theme colors
  const platformSidebarPrimary = branding.componentStyling?.['platform-sidebar-primary']
  if (platformSidebarPrimary?.backgroundColor) {
    root.style.setProperty('--brand-platform-sidebar-bg', platformSidebarPrimary.backgroundColor)
  }
  if (platformSidebarPrimary?.textColor) {
    root.style.setProperty('--brand-platform-sidebar-text', platformSidebarPrimary.textColor)
  }

  const platformSidebarSecondary = branding.componentStyling?.['platform-sidebar-secondary']
  if (platformSidebarSecondary?.backgroundColor) {
    root.style.setProperty('--brand-secondary-sidebar-bg', platformSidebarSecondary.backgroundColor)
  }
  if (platformSidebarSecondary?.textColor) {
    root.style.setProperty('--brand-secondary-sidebar-text', platformSidebarSecondary.textColor)
  }

  // Apply global text/foreground color if provided
  if (branding.bodyTextColor) {
    root.style.setProperty('--brand-body-text', branding.bodyTextColor)
    root.style.setProperty('--foreground', rgbaToHsl(branding.bodyTextColor))
    // Apply to body and all text elements (excluding space modules)
    document.body.style.color = branding.bodyTextColor
  } else {
    // Default fallback based on theme mode (inferred from background color)
    // If body background is dark, use light text; if light, use dark text
    const isDarkBg = branding.bodyBackgroundColor && (
      branding.bodyBackgroundColor.includes('#000') ||
      branding.bodyBackgroundColor.includes('rgb(0') ||
      branding.bodyBackgroundColor.includes('rgba(0')
    )
    const defaultTextColor = isDarkBg ? '#F5F5F7' : '#1D1D1F'
    root.style.setProperty('--brand-body-text', defaultTextColor)
    root.style.setProperty('--foreground', rgbaToHsl(defaultTextColor))
    document.body.style.color = defaultTextColor
  }

  // Apply body background directly
  document.body.style.backgroundColor = branding.bodyBackgroundColor

  // Apply global styling (not to space modules)
  applyGlobalStyling(branding)

  // Apply component-specific styling
  applyComponentStyling(branding)

  // Override --muted CSS variable in secondary sidebar for active menu items
  // This is needed because PlatformSidebar uses inline style with hsl(var(--muted))
  // The --muted variable must be in HSL format (e.g., "210 100% 50%") for hsl(var(--muted)) to work
  const verticalTabActive = branding.componentStyling?.['vertical-tab-menu-active']
  if (verticalTabActive?.backgroundColor) {
    const styleId = 'branding-secondary-sidebar-vars'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    // Convert backgroundColor to HSL format for --muted variable
    let mutedHsl: string
    const bgColor = verticalTabActive.backgroundColor.trim()
    if (bgColor.startsWith('#')) {
      mutedHsl = hexToHsl(bgColor)
    } else if (bgColor.startsWith('rgb') || bgColor.startsWith('rgba')) {
      // Convert rgba/rgb to HSL
      const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
      if (match) {
        const r = parseInt(match[1]) / 255
        const g = parseInt(match[2]) / 255
        const b = parseInt(match[3]) / 255
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        let h = 0
        let s = 0
        const l = (max + min) / 2
        if (max !== min) {
          const d = max - min
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
            case g: h = ((b - r) / d + 2) / 6; break
            case b: h = ((r - g) / d + 4) / 6; break
          }
        }
        mutedHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
      } else {
        mutedHsl = bgColor // Fallback
      }
    } else if (bgColor.includes('hsl')) {
      // Extract HSL values if already in HSL format
      const match = bgColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
      if (match) {
        mutedHsl = `${match[1]} ${match[2]}% ${match[3]}%`
      } else {
        mutedHsl = bgColor
      }
    } else {
      mutedHsl = bgColor // Fallback
    }

    // Convert textColor to HSL format for --foreground
    let foregroundHsl: string = 'inherit'
    if (verticalTabActive.textColor) {
      const textColor = verticalTabActive.textColor.trim()
      if (textColor.startsWith('#')) {
        foregroundHsl = hexToHsl(textColor)
      } else if (textColor.startsWith('rgb') || textColor.startsWith('rgba')) {
        const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
        if (match) {
          const r = parseInt(match[1]) / 255
          const g = parseInt(match[2]) / 255
          const b = parseInt(match[3]) / 255
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          let h = 0
          let s = 0
          const l = (max + min) / 2
          if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
              case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
              case g: h = ((b - r) / d + 2) / 6; break
              case b: h = ((r - g) / d + 4) / 6; break
            }
          }
          foregroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
        }
      } else if (textColor.includes('hsl')) {
        const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
        if (match) {
          foregroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
        }
      }
    }

    // Create CSS with very specific selectors to override Tailwind dark mode styles
    // Also directly override inline styles with !important
    const bgColorValue = verticalTabActive.backgroundColor.trim()
    styleElement.textContent = `
      /* Override --muted and --foreground for secondary sidebar active menu items */
      /* Also directly override inline styles which have higher specificity */
      body:not([data-space]) [data-sidebar="secondary"] .platform-sidebar-menu-button-active,
      body:not([data-space]) [data-sidebar="secondary"] button.platform-sidebar-menu-button-active,
      body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active,
      body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button-active,
      body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active,
      body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button-active,
      body.dark:not([data-space]) [data-sidebar="secondary"] .platform-sidebar-menu-button-active,
      body.dark:not([data-space]) [data-sidebar="secondary"] button.platform-sidebar-menu-button-active,
      body.dark:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active,
      body.dark:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button-active,
      body.dark:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active,
      body.dark:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button-active {
        --muted: ${mutedHsl} !important;
        --foreground: ${foregroundHsl} !important;
        background-color: ${bgColorValue} !important;
        color: ${verticalTabActive.textColor?.trim() || 'inherit'} !important;
      }
      body:not([data-space]) [data-sidebar="secondary"] .platform-sidebar-menu-button-active *,
      body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active *,
      body.dark:not([data-space]) [data-sidebar="secondary"] .platform-sidebar-menu-button-active *,
      body.dark:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active * {
        --foreground: ${foregroundHsl} !important;
        color: ${verticalTabActive.textColor?.trim() || 'inherit'} !important;
      }
    `
  }

  // Apply drawer overlay settings
  applyDrawerOverlay(branding)

  // Apply login background settings
  applyLoginBackground(branding)

  // Apply application branding (name, logo)
  applyApplicationBranding(branding)
}

