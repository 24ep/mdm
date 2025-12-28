'use client'

import React, { useRef, useEffect } from 'react'
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
// Height and width are set dynamically to match input height
const COLOR_INPUT_TRIGGER_STYLES = `
  body:not([data-space]) button.color-input-trigger,
  body:not([data-space]) button.color-input-trigger[type="button"] {
    border: none !important;
    border-width: 0 !important;
    border-style: none !important;
    border-color: transparent !important;
    outline: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 4px !important;
    aspect-ratio: 1 / 1 !important;
  }
`

// Calculate proper padding: left offset (4px from left-1) + button width (matches input height) + gap (6px)
// Button is absolutely positioned at left-1 (4px), so padding = 4px + buttonWidth + 6px
// Using 6px gap to ensure no overlap
// Default to 28px (h-7) but will be adjusted dynamically
const DEFAULT_BUTTON_SIZE = 28 // h-7 default height
const BUTTON_LEFT_OFFSET = 4 // from left-1 class
const BUTTON_TEXT_GAP = 6
const INPUT_LEFT_PADDING = BUTTON_LEFT_OFFSET + DEFAULT_BUTTON_SIZE + BUTTON_TEXT_GAP // 38px default

const DEFAULT_INPUT_CLASS_NAME = `h-7 text-xs w-full rounded-[2px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0`

const TRIGGER_BUTTON_STYLE: React.CSSProperties = {
  pointerEvents: 'auto',
  zIndex: 30,
  display: 'block',
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
  // Remove only padding-left classes (pl-*) from inputClassName since we manage left padding via inline styles
  // Keep px-* classes as they also set right padding which we want to preserve
  const cleanInputClassName = React.useMemo(() => {
    if (!inputClassName) return DEFAULT_INPUT_CLASS_NAME
    // Remove only pl-* classes (left padding), keep px-* (horizontal padding) for right padding
    const classes = inputClassName.split(' ').filter(cls => !cls.match(/^pl-/))
    return classes.join(' ') || DEFAULT_INPUT_CLASS_NAME
  }, [inputClassName])

  const finalInputClassName = cleanInputClassName
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Recalculate swatch style when value changes
  const swatchStyle = React.useMemo(() => getSwatchStyle(value), [value])

  // Store input ref to reapply padding when needed
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Callback ref to store input reference
  // Padding will be set by the ResizeObserver effect
  const inputRefCallback = React.useCallback((input: HTMLInputElement | null) => {
    inputRef.current = input
  }, [])

  // Padding is now handled by the ResizeObserver in the effect below

  // Match swatch height to input height and update padding accordingly
  useEffect(() => {
    const input = inputRef.current
    const button = buttonRef.current
    if (!input || !button) return

    const updateSwatchHeight = () => {
      // Use getBoundingClientRect for more accurate measurement
      const inputRect = input.getBoundingClientRect()
      const inputHeight = inputRect.height || input.offsetHeight

      if (inputHeight > 0) {
        // Reduce size by 8px to make it smaller than input
        const swatchSize = Math.max(16, inputHeight - 8)
        const height = `${swatchSize}px`
        button.style.setProperty('height', height, 'important')
        button.style.setProperty('min-height', height, 'important')
        button.style.setProperty('max-height', height, 'important')
        // Keep width same as height for square swatch
        button.style.setProperty('width', height, 'important')
        button.style.setProperty('min-width', height, 'important')
        button.style.setProperty('max-width', height, 'important')

        // Update input padding to account for new button size
        // Button is absolutely positioned at left-1 (4px), so padding = left offset + button width + gap
        const newPadding = BUTTON_LEFT_OFFSET + swatchSize + BUTTON_TEXT_GAP
        input.style.setProperty('padding-left', `${newPadding}px`, 'important')
      }
    }

    // Use requestAnimationFrame to ensure DOM is fully rendered
    let rafId: number
    let resizeObserver: ResizeObserver | null = null

    rafId = requestAnimationFrame(() => {
      updateSwatchHeight()

      // Also watch for resize changes
      resizeObserver = new ResizeObserver(() => {
        updateSwatchHeight()
      })
      resizeObserver.observe(input)
    })

    return () => {
      cancelAnimationFrame(rafId)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [inputClassName, value])

  // Apply swatch styles directly to the button element using setProperty with important
  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    // Height and width are set by the resize observer to match input height
    // Keep aspect ratio 1:1 for square swatch
    button.style.setProperty('aspect-ratio', '1 / 1', 'important')
    button.style.setProperty('padding', '0', 'important')
    button.style.setProperty('margin', '0', 'important')
    button.style.setProperty('border', 'none', 'important')
    button.style.setProperty('border-width', '0', 'important')
    button.style.setProperty('border-radius', '4px', 'important')
    button.style.setProperty('box-sizing', 'border-box', 'important')

    // Clear any existing background styles first
    button.style.removeProperty('background')
    button.style.removeProperty('background-color')
    button.style.removeProperty('background-image')
    button.style.removeProperty('background-size')
    button.style.removeProperty('background-position')
    button.style.removeProperty('background-repeat')

    // Apply swatch styles with !important
    if (swatchStyle.background) {
      // For gradients, use the background property and background-image to be safe
      button.style.setProperty('background', String(swatchStyle.background), 'important')
      button.style.setProperty('background-image', String(swatchStyle.background), 'important')
    } else {
      // For other types, use individual properties
      if (swatchStyle.backgroundColor) {
        button.style.setProperty('background-color', swatchStyle.backgroundColor, 'important')
      } else {
        button.style.setProperty('background-color', '#e5e5e5', 'important')
      }
      if (swatchStyle.backgroundImage) {
        button.style.setProperty('background-image', swatchStyle.backgroundImage, 'important')
      }
      if (swatchStyle.backgroundSize) {
        button.style.setProperty('background-size', String(swatchStyle.backgroundSize), 'important')
      }
      if (swatchStyle.backgroundPosition) {
        button.style.setProperty('background-position', String(swatchStyle.backgroundPosition), 'important')
      }
      if (swatchStyle.backgroundRepeat) {
        button.style.setProperty('background-repeat', swatchStyle.backgroundRepeat, 'important')
      }
    }
  }, [swatchStyle])

  // Combined button style with swatch background
  // Height and width will be set dynamically to match input height
  const combinedButtonStyle: React.CSSProperties = {
    pointerEvents: 'auto',
    zIndex: 40,
    display: 'block',
    boxSizing: 'border-box',
    border: 'none',
    borderWidth: 0,
    borderStyle: 'none',
    borderColor: 'transparent',
    padding: 0,
    margin: 0,
    borderRadius: '4px',
    aspectRatio: '1 / 1',
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
            ref={buttonRef}
            type="button"
            data-component="color-input-trigger"
            className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer z-40 border-0 outline-none shadow-none flex-shrink-0 p-0 color-input-trigger"
            style={combinedButtonStyle}
            onClick={(e) => {
              e.stopPropagation()
            }}
            aria-label="Open color picker"
          />
        </ColorPickerPopover>

        <Input
          ref={inputRefCallback}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={finalInputClassName}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            pointerEvents: 'auto'
          }}
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

