/**
 * Branding utility functions
 * Color conversion and helper functions
 */

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
 * Convert rgba/rgb color to HSL format for CSS variables
 * Handles formats like: rgba(255, 255, 255, 0.08), rgb(255, 255, 255), etc.
 * 
 * IMPORTANT: For rgba colors with alpha < 1, this function will convert to HSL
 * but the alpha channel will be lost. For colors that need alpha, use the
 * color directly in CSS instead of converting to HSL.
 */
export function rgbaToHsl(color: string): string {
  if (!color) {
    return '0 0% 0%' // Default fallback
  }

  const trimmed = color.trim()

  // If already in HSL format, extract and return
  if (trimmed.includes('hsl')) {
    const match = trimmed.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
    if (match) {
      return `${match[1]} ${match[2]}% ${match[3]}%`
    }
  }

  // If hex format, use hexToHsl
  if (trimmed.startsWith('#')) {
    return hexToHsl(trimmed)
  }

  // Parse rgba/rgb format
  const match = trimmed.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
  if (match) {
    const r = parseInt(match[1]) / 255
    const g = parseInt(match[2]) / 255
    const b = parseInt(match[3]) / 255
    const alpha = match[4] ? parseFloat(match[4]) : 1

    // If alpha is less than 1, we need to blend with white/black background
    // to get the effective color. For very transparent colors, this is important.
    // For now, we'll convert the RGB values directly, but note that alpha is lost.
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

  // Fallback: return as-is or default
  return '0 0% 0%'
}

/**
 * Check if a color string contains an alpha channel (rgba with alpha < 1)
 */
export function hasAlphaChannel(color: string): boolean {
  if (!color) return false
  const trimmed = color.trim()
  const match = trimmed.match(/rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([\d.]+))?\)/i)
  if (match && match[1]) {
    const alpha = parseFloat(match[1])
    return alpha < 1
  }
  return false
}

/**
 * Clear all branding styles injected by the branding system
 * This removes injected style elements and resets CSS custom properties
 * so that the default styles from globals.css take effect
 */
export function clearBrandingStyles(): void {
  const root = document.documentElement

  // Remove all injected style elements
  const styleIds = [
    'branding-global-styling',
    'branding-animations',
    'branding-component-styling',
    'branding-secondary-sidebar-vars',
    'branding-drawer-overlay',
    'branding-google-font',
  ]

  styleIds.forEach(id => {
    const el = document.getElementById(id)
    if (el) {
      el.remove()
    }
  })

  // List of CSS variables set by branding that should be cleared
  const brandingVars = [
    '--brand-primary',
    '--brand-secondary',
    '--brand-warning',
    '--brand-danger',
    '--brand-ui-bg',
    '--brand-ui-border',
    '--brand-top-menu-bg',
    '--brand-platform-sidebar-bg',
    '--brand-secondary-sidebar-bg',
    '--brand-top-menu-text',
    '--brand-platform-sidebar-text',
    '--brand-secondary-sidebar-text',
    '--brand-body-bg',
    '--brand-body-text',
    '--brand-border-radius',
    '--brand-border-color',
    '--brand-border-width',
    '--brand-button-border-radius',
    '--brand-button-border-width',
    '--brand-input-border-radius',
    '--brand-input-border-width',
    '--brand-select-border-radius',
    '--brand-select-border-width',
    '--brand-textarea-border-radius',
    '--brand-textarea-border-width',
    '--brand-base-font-size',
    '--brand-input-height',
    '--brand-input-padding',
    '--brand-input-font-size',
    '--brand-button-height',
    '--brand-button-padding',
    '--brand-button-font-size',
    '--brand-font-family',
    '--brand-font-family-mono',
    '--brand-transition-duration',
    '--brand-transition-timing',
    '--brand-shadow-sm',
    '--brand-shadow-md',
    '--brand-shadow-lg',
    '--brand-shadow-xl',
    '--space-settings-menu-active-bg',
    '--space-settings-menu-active-text',
    '--space-settings-menu-normal-bg',
    '--space-settings-menu-normal-text',
    '--space-settings-menu-hover-bg',
    '--space-settings-menu-hover-text',
  ]

  // Remove custom CSS variables from root
  brandingVars.forEach(varName => {
    root.style.removeProperty(varName)
  })

  // Reset body styles that were set directly
  document.body.style.backgroundColor = ''
  document.body.style.color = ''
  document.body.style.fontFamily = ''

  console.log('[Branding] Cleared all branding styles')
}

