import React from 'react'

export interface WidgetStyleProps {
  showBackground?: boolean
  backgroundColor?: string
  fillOpacity?: number
  textColor?: string
  fontFamily?: string
  googleFontFamily?: string
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  showBorder?: boolean
  borderWidth?: number
  borderColor?: string
  borderStyle?: string
  borderSides?: {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
  }
  borderRadius?: number | {
    topLeft?: { value: number; unit: string }
    topRight?: { value: number; unit: string }
    bottomRight?: { value: number; unit: string }
    bottomLeft?: { value: number; unit: string }
  }
  padding?: number | {
    top: number
    right: number
    bottom: number
    left: number
  }
  margin?: number
  opacity?: number
  shadow?: boolean
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  shadowSpread?: number
  shadowColor?: string
  shadowOpacity?: number
  rotation?: number
  flipX?: boolean
  flipY?: boolean
  flipHorizontal?: boolean
  flipVertical?: boolean
}

/**
 * Compute border radius from legacy (number) or new (object) format
 */
export const getBorderRadius = (borderRadius?: WidgetStyleProps['borderRadius']): string | undefined => {
  if (!borderRadius) return undefined
  
  // Legacy format: single number
  if (typeof borderRadius === 'number') {
    return `${borderRadius}px`
  }
  
  // New format: object with per-side values
  if (typeof borderRadius === 'object' && borderRadius !== null) {
    const br = borderRadius as any
    const topLeft = br.topLeft ? `${br.topLeft.value}${br.topLeft.unit}` : '0px'
    const topRight = br.topRight ? `${br.topRight.value}${br.topRight.unit}` : '0px'
    const bottomRight = br.bottomRight ? `${br.bottomRight.value}${br.bottomRight.unit}` : '0px'
    const bottomLeft = br.bottomLeft ? `${br.bottomLeft.value}${br.bottomLeft.unit}` : '0px'
    
    return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`
  }
  
  return undefined
}

/**
 * Compute box shadow from properties
 */
export const computeBoxShadow = (props: WidgetStyleProps): string | undefined => {
  if (!props.shadow) return 'none'
  const x = Number(props.shadowX ?? 0)
  const y = Number(props.shadowY ?? 0)
  const blur = Number(props.shadowBlur ?? 4)
  const spread = Number(props.shadowSpread ?? 0)
  const colorHex = String(props.shadowColor || '#000000')
  const opacity = Number(props.shadowOpacity ?? 0.25)
  const toRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '')
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const color = colorHex.startsWith('#') ? toRgba(colorHex, opacity) : colorHex
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`
}

/**
 * Compute padding from number or per-side object
 */
export const computePadding = (padding?: WidgetStyleProps['padding']): string | undefined => {
  if (padding === undefined) return undefined
  if (typeof padding === 'number') return `${padding}px`
  try {
    const top = Number((padding as any).top ?? 0)
    const right = Number((padding as any).right ?? 0)
    const bottom = Number((padding as any).bottom ?? 0)
    const left = Number((padding as any).left ?? 0)
    return `${top}px ${right}px ${bottom}px ${left}px`
  } catch {
    return undefined
  }
}

/**
 * Helper to get background style (supports solid, gradient, pattern, image, video)
 */
export const getBackgroundStyle = (props: WidgetStyleProps): React.CSSProperties => {
  if (props.showBackground === false || !props.backgroundColor) {
    return { background: 'transparent' }
  }
  const bg = props.backgroundColor
  const fillOpacity = props.fillOpacity !== undefined ? props.fillOpacity : 1
  
  // Check if it's a gradient, pattern, or image URL
  if (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient') || bg.startsWith('url(')) {
    const bgStyle: React.CSSProperties = { 
      background: bg, 
      backgroundSize: bg.startsWith('url(') ? 'cover' : undefined, 
      backgroundPosition: 'center', 
      backgroundRepeat: 'no-repeat' 
    }
    // Apply opacity if needed
    if (fillOpacity < 1) {
      bgStyle.opacity = fillOpacity
    }
    return bgStyle
  }
  // Solid color - apply opacity if needed
  if (fillOpacity < 1 && bg.startsWith('#')) {
    // Convert hex to rgba if opacity is needed
    const hex = bg.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${fillOpacity})` }
  } else if (fillOpacity < 1 && bg.startsWith('rgb(')) {
    // Convert rgb to rgba if opacity is needed
    const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      return { backgroundColor: `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${fillOpacity})` }
    }
  }
  // Solid color with full opacity or already rgba
  return { backgroundColor: bg }
}

/**
 * Compute complete style object from widget properties
 */
export const computeWidgetStyle = (props: WidgetStyleProps): React.CSSProperties => {
  const borderSides = props.borderSides || {
    top: true,
    right: true,
    bottom: true,
    left: true
  }
  
  const borderColor = (props.showBorder && props.borderWidth) ? (props.borderColor || '#e5e7eb') : undefined
  const borderWidth = (props.showBorder && props.borderWidth) ? props.borderWidth : 0
  const borderStyle = (props.showBorder && props.borderWidth) ? (props.borderStyle || 'solid') : undefined
  
  return {
    ...getBackgroundStyle(props),
    color: props.textColor || '#000000',
    fontFamily: (String(props.fontFamily) === '__custom_google__' && props.googleFontFamily)
      ? String(props.googleFontFamily)
      : (props.fontFamily || 'inherit'),
    fontSize: props.fontSize ? `${props.fontSize}px` : undefined,
    fontWeight: props.fontWeight || 'normal',
    fontStyle: props.fontStyle || 'normal',
    textAlign: props.textAlign || 'left',
    borderTop: borderColor && borderSides.top ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    borderRight: borderColor && borderSides.right ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    borderBottom: borderColor && borderSides.bottom ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    borderLeft: borderColor && borderSides.left ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    borderRadius: getBorderRadius(props.borderRadius),
    padding: computePadding(props.padding),
    margin: props.margin ? `${props.margin}px` : undefined,
    opacity: props.opacity !== undefined ? props.opacity : 1,
    boxShadow: computeBoxShadow(props),
    transform: (() => {
      const r = Number(props.rotation || 0)
      const flipX = (props.flipX || props.flipHorizontal) ? -1 : 1
      const flipY = (props.flipY || props.flipVertical) ? -1 : 1
      const parts = [] as string[]
      if (flipX !== 1 || flipY !== 1) parts.push(`scale(${flipX}, ${flipY})`)
      if (r) parts.push(`rotate(${r}deg)`)
      return parts.length ? parts.join(' ') : undefined
    })(),
    transformOrigin: (props.rotation || props.flipX || props.flipY || props.flipHorizontal || props.flipVertical) ? 'center center' : undefined,
  }
}

