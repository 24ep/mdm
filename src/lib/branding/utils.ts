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

