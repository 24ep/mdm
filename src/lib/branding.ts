/**
 * Branding utility functions
 * Applies branding colors throughout the platform (except space module)
 */

import { BrandingConfig } from '@/app/admin/features/system/types'

/**
 * Convert hex color to HSL format for CSS variables
 */
export function hexToHsl(hex: string): string {
  if (!hex || !hex.startsWith('#')) {
    return hex // Return as-is if not a hex color
  }

  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

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

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Apply branding colors to the platform
 * This applies colors to CSS variables that are used throughout the platform
 */
export function applyBrandingColors(branding: BrandingConfig, isDarkMode: boolean = false) {
  const root = document.documentElement
  const colors = isDarkMode ? branding.darkMode : branding.lightMode

  // Apply primary and secondary colors
  root.style.setProperty('--primary', hexToHsl(colors.primaryColor))
  root.style.setProperty('--secondary', hexToHsl(colors.secondaryColor))
  
  // Apply warning and danger colors as CSS variables
  root.style.setProperty('--warning', hexToHsl(colors.warningColor))
  root.style.setProperty('--destructive', hexToHsl(colors.dangerColor))
  
  // Also set as custom properties for direct use
  root.style.setProperty('--brand-primary', colors.primaryColor)
  root.style.setProperty('--brand-secondary', colors.secondaryColor)
  root.style.setProperty('--brand-warning', colors.warningColor)
  root.style.setProperty('--brand-danger', colors.dangerColor)
  
  // Apply UI component colors
  root.style.setProperty('--brand-top-menu-bg', colors.topMenuBackgroundColor)
  root.style.setProperty('--brand-platform-sidebar-bg', colors.platformSidebarBackgroundColor)
  root.style.setProperty('--brand-secondary-sidebar-bg', colors.secondarySidebarBackgroundColor)
  root.style.setProperty('--brand-top-menu-text', colors.topMenuTextColor)
  root.style.setProperty('--brand-platform-sidebar-text', colors.platformSidebarTextColor)
  root.style.setProperty('--brand-secondary-sidebar-text', colors.secondarySidebarTextColor)
  root.style.setProperty('--brand-body-bg', colors.bodyBackgroundColor)
  
  // Apply body background directly
  document.body.style.backgroundColor = colors.bodyBackgroundColor
  
  // Apply global styling (not to space modules)
  applyGlobalStyling(branding)
  
  // Apply component-specific styling
  applyComponentStyling(branding, isDarkMode)
}

/**
 * Apply global styling to buttons, inputs, selects, and textareas
 * Excludes space modules by checking for space-specific classes/attributes
 */
export function applyGlobalStyling(branding: BrandingConfig) {
  const root = document.documentElement
  const styling = branding.globalStyling
  
  // Set CSS variables for global styling
  root.style.setProperty('--brand-border-radius', styling.borderRadius)
  root.style.setProperty('--brand-border-color', styling.borderColor)
  root.style.setProperty('--brand-border-width', styling.borderWidth)
  root.style.setProperty('--brand-button-border-radius', styling.buttonBorderRadius)
  root.style.setProperty('--brand-button-border-width', styling.buttonBorderWidth)
  root.style.setProperty('--brand-input-border-radius', styling.inputBorderRadius)
  root.style.setProperty('--brand-input-border-width', styling.inputBorderWidth)
  root.style.setProperty('--brand-select-border-radius', styling.selectBorderRadius)
  root.style.setProperty('--brand-select-border-width', styling.selectBorderWidth)
  root.style.setProperty('--brand-textarea-border-radius', styling.textareaBorderRadius)
  root.style.setProperty('--brand-textarea-border-width', styling.textareaBorderWidth)
  
  // Inject CSS that applies to platform components but excludes space modules
  // Space modules typically have [data-space] attribute or are within [space] routes
  const styleId = 'branding-global-styling'
  let styleElement = document.getElementById(styleId) as HTMLStyleElement
  
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = styleId
    document.head.appendChild(styleElement)
  }
  
  // CSS that excludes space modules (elements with [data-space] or within [space] routes)
  styleElement.textContent = `
    /* Global styling - excludes space modules */
    body:not([data-space]) button,
    body:not([data-space]) [role="button"],
    body:not([data-space]) .btn,
    body:not([data-space]) [class*="button"]:not([data-space]):not([data-space] *) {
      border-radius: var(--brand-button-border-radius, ${styling.buttonBorderRadius}) !important;
      border-width: var(--brand-button-border-width, ${styling.buttonBorderWidth}) !important;
      border-color: var(--brand-border-color, ${styling.borderColor}) !important;
      border-style: solid !important;
    }
    
    body:not([data-space]) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]),
    body:not([data-space]) input[type="text"],
    body:not([data-space]) input[type="email"],
    body:not([data-space]) input[type="password"],
    body:not([data-space]) input[type="number"],
    body:not([data-space]) input[type="search"],
    body:not([data-space]) input[type="tel"],
    body:not([data-space]) input[type="url"] {
      border-radius: var(--brand-input-border-radius, ${styling.inputBorderRadius}) !important;
      border-width: var(--brand-input-border-width, ${styling.inputBorderWidth}) !important;
      border-color: var(--brand-border-color, ${styling.borderColor}) !important;
      border-style: solid !important;
    }
    
    body:not([data-space]) select,
    body:not([data-space]) [role="combobox"] {
      border-radius: var(--brand-select-border-radius, ${styling.selectBorderRadius}) !important;
      border-width: var(--brand-select-border-width, ${styling.selectBorderWidth}) !important;
      border-color: var(--brand-border-color, ${styling.borderColor}) !important;
      border-style: solid !important;
    }
    
    body:not([data-space]) textarea {
      border-radius: var(--brand-textarea-border-radius, ${styling.textareaBorderRadius}) !important;
      border-width: var(--brand-textarea-border-width, ${styling.textareaBorderWidth}) !important;
      border-color: var(--brand-border-color, ${styling.borderColor}) !important;
      border-style: solid !important;
    }
    
    /* Exclude space studio and space-specific components */
    [data-space],
    [data-space] *,
    [class*="space-studio"],
    [class*="space-studio"] *,
    [id*="space-"],
    [id*="space-"] * {
      /* Reset to default - space modules use their own styling */
    }
  `
}

/**
 * Apply component-specific styling to UI components
 * Excludes space modules
 */
export function applyComponentStyling(branding: BrandingConfig, isDarkMode: boolean = false) {
  if (!branding.componentStyling || Object.keys(branding.componentStyling).length === 0) {
    return
  }

  const styleId = 'branding-component-styling'
  let styleElement = document.getElementById(styleId) as HTMLStyleElement

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = styleId
    document.head.appendChild(styleElement)
  }

  const mode = isDarkMode ? 'dark' : 'light'
  let cssRules = '/* Component-specific styling - excludes space modules */\n'

  // Map component IDs to CSS selectors
  const componentSelectors: Record<string, string[]> = {
    'text-input': [
      'body:not([data-space]) input[type="text"]',
      'body:not([data-space]) input[type="email"]',
      'body:not([data-space]) input[type="password"]',
      'body:not([data-space]) input[type="number"]',
      'body:not([data-space]) input[type="search"]',
      'body:not([data-space]) input[type="tel"]',
      'body:not([data-space]) input[type="url"]',
      'body:not([data-space]) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
    ],
    'select': [
      'body:not([data-space]) select',
      'body:not([data-space]) [role="combobox"]',
      'body:not([data-space]) [data-radix-select-content]',
      'body:not([data-space]) [class*="SelectContent"]',
      'body:not([data-space]) [role="listbox"]',
      // Target the dropdown content div (portaled to body)
      'body:not([data-space]) > div[style*="position: fixed"][style*="z-index"]:has([role="option"])',
    ],
    'multi-select': [
      'body:not([data-space]) select[multiple]',
      'body:not([data-space]) [role="listbox"]',
      'body:not([data-space]) [data-radix-select-content]',
      'body:not([data-space]) [class*="SelectContent"]',
      // Target the dropdown content div (portaled to body)
      'body:not([data-space]) > div[style*="position: fixed"][style*="z-index"]:has([role="option"])',
    ],
    'textarea': [
      'body:not([data-space]) textarea',
    ],
    'button': [
      'body:not([data-space]) button',
      'body:not([data-space]) [role="button"]',
      'body:not([data-space]) .btn',
      'body:not([data-space]) [class*="button"]:not([data-space]):not([data-space] *)',
    ],
    'card': [
      'body:not([data-space]) [class*="card"]:not([data-space]):not([data-space] *)',
      'body:not([data-space]) .card',
    ],
    'checkbox': [
      'body:not([data-space]) input[type="checkbox"]',
    ],
    'radio': [
      'body:not([data-space]) input[type="radio"]',
    ],
    'switch': [
      'body:not([data-space]) [role="switch"]',
      'body:not([data-space]) [class*="switch"]:not([data-space]):not([data-space] *)',
    ],
    'platform-sidebar-primary': [
      'body:not([data-space]) [data-sidebar="primary"]',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="primary"]',
    ],
    'platform-sidebar-secondary': [
      'body:not([data-space]) [data-sidebar="secondary"]',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"]',
    ],
    'platform-sidebar-menu-normal': [
      'body:not([data-space]) .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
    ],
    'platform-sidebar-menu-hover': [
      'body:not([data-space]) .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
    ],
    'platform-sidebar-menu-active': [
      'body:not([data-space]) .platform-sidebar-menu-button-active',
      'body:not([data-space]) .platform-sidebar-menu-button.platform-sidebar-menu-button-active',
    ],
    'vertical-tab-menu-normal': [
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] [role="tab"]:not([aria-selected="true"])',
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] button[role="tab"]:not([aria-selected="true"])',
    ],
    'vertical-tab-menu-hover': [
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] [role="tab"]:hover:not([aria-selected="true"])',
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] button[role="tab"]:hover:not([aria-selected="true"])',
    ],
    'vertical-tab-menu-active': [
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] [role="tab"][aria-selected="true"]',
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] button[role="tab"][aria-selected="true"]',
    ],
  }

  // Generate CSS for each component
  Object.entries(branding.componentStyling).forEach(([componentId, styling]) => {
    const componentStyle = styling[mode]
    const selectors = componentSelectors[componentId] || []

    if (selectors.length === 0 || !componentStyle) return

    // Check if there are any non-empty style properties
    const hasStyles = componentStyle.backgroundColor || 
                     componentStyle.textColor || 
                     componentStyle.borderColor || 
                     componentStyle.borderRadius || 
                     componentStyle.borderWidth || 
                     componentStyle.padding || 
                     componentStyle.fontSize || 
                     componentStyle.fontWeight

    if (!hasStyles) return

    const selector = selectors.join(',\n    ')
    let componentCSS = `    ${selector} {\n`

    if (componentStyle.backgroundColor && componentStyle.backgroundColor.trim()) {
      componentCSS += `      background-color: ${componentStyle.backgroundColor.trim()} !important;\n`
    }
    if (componentStyle.textColor && componentStyle.textColor.trim()) {
      componentCSS += `      color: ${componentStyle.textColor.trim()} !important;\n`
    }
    if (componentStyle.borderColor && componentStyle.borderColor.trim()) {
      componentCSS += `      border-color: ${componentStyle.borderColor.trim()} !important;\n`
    }
    if (componentStyle.borderRadius && componentStyle.borderRadius.trim()) {
      componentCSS += `      border-radius: ${componentStyle.borderRadius.trim()} !important;\n`
    }
    if (componentStyle.borderWidth && componentStyle.borderWidth.trim()) {
      const borderWidth = componentStyle.borderWidth.trim()
      componentCSS += `      border-width: ${borderWidth} !important;\n`
      // If border width is 0, set border-style to none, otherwise use solid
      if (borderWidth === '0px' || borderWidth === '0') {
        componentCSS += `      border-style: none !important;\n`
      } else {
        componentCSS += `      border-style: solid !important;\n`
      }
    }
    if (componentStyle.padding && componentStyle.padding.trim()) {
      componentCSS += `      padding: ${componentStyle.padding.trim()} !important;\n`
    }
    if (componentStyle.fontSize && componentStyle.fontSize.trim()) {
      componentCSS += `      font-size: ${componentStyle.fontSize.trim()} !important;\n`
    }
    if (componentStyle.fontWeight && componentStyle.fontWeight.trim()) {
      componentCSS += `      font-weight: ${componentStyle.fontWeight.trim()} !important;\n`
    }

    componentCSS += `    }\n\n`
    cssRules += componentCSS
  })

  // Exclude space modules
  cssRules += `    /* Exclude space studio and space-specific components */\n`
  cssRules += `    [data-space],\n`
  cssRules += `    [data-space] *,\n`
  cssRules += `    [class*="space-studio"],\n`
  cssRules += `    [class*="space-studio"] *,\n`
  cssRules += `    [id*="space-"],\n`
  cssRules += `    [id*="space-"] * {\n`
  cssRules += `      /* Reset to default - space modules use their own styling */\n`
  cssRules += `    }\n`

  styleElement.textContent = cssRules
}

/**
 * Load branding configuration from API
 */
export async function loadBrandingConfig(): Promise<BrandingConfig | null> {
  try {
    const response = await fetch('/api/admin/branding')
    if (response.ok) {
      const data = await response.json()
      return data.branding || null
    }
  } catch (error) {
    console.error('Error loading branding config:', error)
  }
  return null
}

/**
 * Apply branding on page load
 * This should be called in the root layout or app component
 * Returns a cleanup function
 */
export async function initializeBranding(): Promise<(() => void) | null> {
  const branding = await loadBrandingConfig()
  if (branding) {
    // Check if dark mode is active
    const isDark = document.documentElement.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches
    
    applyBrandingColors(branding, isDark)
    applyGlobalStyling(branding)
    applyComponentStyling(branding, isDark)
    
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = () => {
      const isDarkNow = document.documentElement.classList.contains('dark') ||
                       mediaQuery.matches
      applyBrandingColors(branding, isDarkNow)
      applyGlobalStyling(branding)
      applyComponentStyling(branding, isDarkNow)
    }
    
    // Watch for class changes on document element
    const observer = new MutationObserver(handleThemeChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    mediaQuery.addEventListener('change', handleThemeChange)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }
  return null
}

