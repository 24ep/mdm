'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { ColorPickerPopover } from './ColorPickerPopover'

interface ColorInputProps {
  value: string
  onChange: (color: string) => void
  allowImageVideo?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
  inputClassName?: string
}

// Helper to check if color has transparency
const hasTransparency = (color: string): boolean => {
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

// Pattern definitions (matching ColorPickerPopover)
const patterns = [
  {
    id: 'dots',
    css: 'radial-gradient(circle, #000 1px, transparent 1px)',
    size: '20px 20px'
  },
  {
    id: 'diagonal-lines',
    css: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)',
    size: '20px 20px'
  },
  {
    id: 'horizontal-stripes',
    css: 'repeating-linear-gradient(0deg, transparent, transparent 10px, #000 10px, #000 20px)',
    size: '20px 20px'
  },
  {
    id: 'vertical-stripes',
    css: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #000 10px, #000 20px)',
    size: '20px 20px'
  },
  {
    id: 'grid',
    css: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
    size: '20px 20px'
  },
  {
    id: 'checkerboard',
    css: 'conic-gradient(#000 25%, transparent 0%, transparent 50%, #000 0%, #000 75%, transparent 0%)',
    size: '20px 20px'
  },
  {
    id: 'crosshatch',
    css: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px), repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)',
    size: '20px 20px'
  }
]

// Helper to get swatch style with checkerboard background for transparency
const getSwatchStyle = (color: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    border: 'none',
    outline: 'none',
    backgroundColor: '#ffffff'
  }
  
  if (!color) {
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
      const pattern = patterns.find(p => p.id === patternId)
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

export function ColorInput({
  value,
  onChange,
  allowImageVideo = false,
  disabled = false,
  className = 'relative w-32',
  placeholder,
  inputClassName,
}: ColorInputProps) {
  const defaultInputClassName = 'h-7 text-xs pl-7 w-full rounded-[2px] bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-0 focus:border-0'
  const finalInputClassName = inputClassName || defaultInputClassName

  return (
    <div className={className}>
      <ColorPickerPopover
        value={value}
        onChange={onChange}
        allowImageVideo={allowImageVideo}
        disabled={disabled}
      >
        <button
          type="button"
          className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10"
          style={getSwatchStyle(value)}
          onClick={(e) => e.stopPropagation()}
        />
      </ColorPickerPopover>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={finalInputClassName}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  )
}

