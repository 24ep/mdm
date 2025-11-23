import { Circle, Sliders, Minus, GripVertical, Grid3x3, Hash, Layers, type LucideIcon } from 'lucide-react'
import type React from 'react'

/**
 * Pattern definitions for color backgrounds
 */
export interface ColorPattern {
  id: string
  name: string
  icon: LucideIcon
  css: string
  size: string
}

export const COLOR_PATTERNS: ColorPattern[] = [
  {
    id: 'dots',
    name: 'Dots',
    icon: Circle,
    css: 'radial-gradient(circle, #000 1px, transparent 1px)',
    size: '20px 20px'
  },
  {
    id: 'diagonal-lines',
    name: 'Diagonal Lines',
    icon: Sliders,
    css: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)',
    size: '20px 20px'
  },
  {
    id: 'horizontal-stripes',
    name: 'Horizontal Stripes',
    icon: Minus,
    css: 'repeating-linear-gradient(0deg, transparent, transparent 10px, #000 10px, #000 20px)',
    size: '20px 20px'
  },
  {
    id: 'vertical-stripes',
    name: 'Vertical Stripes',
    icon: GripVertical,
    css: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #000 10px, #000 20px)',
    size: '20px 20px'
  },
  {
    id: 'grid',
    name: 'Grid',
    icon: Grid3x3,
    css: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
    size: '20px 20px'
  },
  {
    id: 'checkerboard',
    name: 'Checkerboard',
    icon: Hash,
    css: 'conic-gradient(#000 25%, transparent 0%, transparent 50%, #000 0%, #000 75%, transparent 0%)',
    size: '20px 20px'
  },
  {
    id: 'crosshatch',
    name: 'Crosshatch',
    icon: Layers,
    css: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px), repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)',
    size: '20px 20px'
  }
]

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): ColorPattern | undefined {
  return COLOR_PATTERNS.find(p => p.id === id)
}

/**
 * Get pattern CSS by ID
 */
export function getPatternCss(id: string): string | undefined {
  const pattern = getPatternById(id)
  return pattern?.css
}

/**
 * Check if color has transparency
 */
export function hasTransparency(color: string): boolean {
  if (!color || color === 'transparent') return true
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\([^)]+,\s*([\d.]+)\)/)
    if (match) {
      const alpha = parseFloat(match[1])
      return alpha < 1
    }
  }
  return false
}

/**
 * Get swatch style with checkerboard background for transparency
 */
export function getSwatchStyle(color: string): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    outline: 'none',
    backgroundColor: '#e5e5e5' // Light gray so it's visible even when empty
  }
  
  if (!color || color.trim() === '') {
    return baseStyle
  }
  
  // Handle gradients
  if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
    baseStyle.background = color
    return baseStyle
  }
  
  // Handle patterns
  if (color.startsWith('pattern(')) {
    const match = color.match(/pattern\(([^)]+)\)/)
    if (match) {
      const patternId = match[1]
      const pattern = getPatternById(patternId)
      if (pattern) {
        baseStyle.backgroundImage = pattern.css
        baseStyle.backgroundSize = pattern.size
        baseStyle.backgroundColor = '#ffffff'
        return baseStyle
      }
    }
  }
  
  // Handle images/videos
  if (color.startsWith('url(') || color.startsWith('http')) {
    baseStyle.backgroundImage = color.startsWith('url(') ? color : `url(${color})`
    baseStyle.backgroundSize = 'cover'
    baseStyle.backgroundPosition = 'center'
    baseStyle.backgroundColor = '#f0f0f0'
    return baseStyle
  }
  
  // Handle solid colors
  baseStyle.backgroundColor = color || '#ffffff'
  
  if (hasTransparency(color)) {
    // Checkerboard pattern for transparency
    baseStyle.backgroundImage = `
      linear-gradient(45deg, #d0d0d0 25%, transparent 25%),
      linear-gradient(-45deg, #d0d0d0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #d0d0d0 75%),
      linear-gradient(-45deg, transparent 75%, #d0d0d0 75%)
    `
    baseStyle.backgroundSize = '8px 8px'
    baseStyle.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px'
    // Keep the actual color as an overlay
    baseStyle.backgroundColor = color
  }
  
  return baseStyle
}

/**
 * Swatch size constants
 */
export const SWATCH_SIZE = {
  width: '20px',
  height: '20px',
  minWidth: '20px',
  minHeight: '20px',
  maxWidth: '20px',
  maxHeight: '20px'
} as const

