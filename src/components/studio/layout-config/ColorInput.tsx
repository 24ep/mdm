'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { ColorPickerPopover } from './ColorPickerPopover'
import { getSwatchStyle, SWATCH_SIZE } from './color-utils'

interface ColorInputProps {
  value: string
  onChange: (color: string) => void
  allowImageVideo?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
  inputClassName?: string
  isSpaceLayoutConfig?: boolean
}

// Global styles for color input trigger button
const COLOR_INPUT_TRIGGER_STYLES = `
  body:not([data-space]) button.color-input-trigger,
  body:not([data-space]) button.color-input-trigger[type="button"] {
    width: ${SWATCH_SIZE.width} !important;
    height: ${SWATCH_SIZE.height} !important;
    min-width: ${SWATCH_SIZE.minWidth} !important;
    min-height: ${SWATCH_SIZE.minHeight} !important;
    max-width: ${SWATCH_SIZE.maxWidth} !important;
    max-height: ${SWATCH_SIZE.maxHeight} !important;
    border: none !important;
    border-width: 0 !important;
    border-style: none !important;
    border-color: transparent !important;
    outline: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
`

const DEFAULT_INPUT_CLASS_NAME = 'h-7 text-xs pl-9 w-full rounded-[2px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0'

const TRIGGER_BUTTON_STYLE: React.CSSProperties = {
  pointerEvents: 'auto',
  zIndex: 30,
  display: 'block',
  width: SWATCH_SIZE.width,
  height: SWATCH_SIZE.height,
  minWidth: SWATCH_SIZE.minWidth,
  minHeight: SWATCH_SIZE.minHeight,
  maxWidth: SWATCH_SIZE.maxWidth,
  maxHeight: SWATCH_SIZE.maxHeight,
  backgroundColor: 'transparent',
  background: 'transparent',
  boxSizing: 'border-box',
  border: 'none',
  borderWidth: 0,
  borderStyle: 'none',
  borderColor: 'transparent'
}

export function ColorInput({
  value,
  onChange,
  allowImageVideo = false,
  disabled = false,
  className = 'relative w-32',
  placeholder,
  inputClassName,
  isSpaceLayoutConfig = false,
}: ColorInputProps) {
  const finalInputClassName = inputClassName || DEFAULT_INPUT_CLASS_NAME

  // Recalculate swatch style when value changes
  const swatchStyle = React.useMemo(() => getSwatchStyle(value), [value])

  const swatchContainerStyle: React.CSSProperties = {
    display: 'block',
    width: SWATCH_SIZE.width,
    height: SWATCH_SIZE.height,
    minWidth: SWATCH_SIZE.minWidth,
    minHeight: SWATCH_SIZE.minHeight,
    maxWidth: SWATCH_SIZE.maxWidth,
    maxHeight: SWATCH_SIZE.maxHeight,
    boxSizing: 'border-box',
    background: swatchStyle.background || undefined,
    backgroundColor: swatchStyle.backgroundColor || '#e5e5e5',
    backgroundImage: swatchStyle.backgroundImage || undefined,
    backgroundSize: swatchStyle.backgroundSize || undefined,
    backgroundPosition: swatchStyle.backgroundPosition || 'center',
    backgroundRepeat: swatchStyle.backgroundRepeat || 'no-repeat',
    outline: 'none'
  }

  return (
    <>
      <style>{COLOR_INPUT_TRIGGER_STYLES}</style>
      <div className={className}>
        <ColorPickerPopover
          value={value}
          onChange={onChange}
          allowImageVideo={allowImageVideo}
          disabled={disabled}
          isSpaceLayoutConfig={isSpaceLayoutConfig}
        >
          <button
            type="button"
            data-component="color-input-trigger"
            className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-sm z-30 border-0 outline-none shadow-none flex-shrink-0 p-0 color-input-trigger"
            style={TRIGGER_BUTTON_STYLE}
            onClick={(e) => {
              e.stopPropagation()
            }}
            aria-label="Open color picker"
          />
        </ColorPickerPopover>
        
        {/* Color swatch - positioned above button so it's visible and updates */}
        <div
          key={`swatch-${value}`}
          className="absolute left-1 top-1/2 -translate-y-1/2 rounded-sm z-40 pointer-events-none"
          style={swatchContainerStyle}
          aria-hidden="true"
        />
        
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={finalInputClassName}
          placeholder={placeholder}
          disabled={disabled}
          style={{ pointerEvents: 'auto' }}
          onPointerDown={(e) => {
            // Don't prevent pointer events on the input itself, but allow button clicks
            const target = e.target as HTMLElement
            if (target.closest('button')) {
              return
            }
          }}
        />
      </div>
    </>
  )
}

