import * as React from "react"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    
    // Function to apply theme-aware styles
    const applyThemeStyles = React.useCallback((node: HTMLTextAreaElement) => {
      if (!node) return
      
      // Skip if inside a space (data-space attribute)
      if (node.closest('[data-space]')) return
      
      // Get theme-aware colors from CSS variables
      const root = document.documentElement
      const borderHsl = root.style.getPropertyValue('--border') || getComputedStyle(root).getPropertyValue('--border')
      const inputHsl = root.style.getPropertyValue('--input') || getComputedStyle(root).getPropertyValue('--input')
      const foregroundHsl = root.style.getPropertyValue('--foreground') || getComputedStyle(root).getPropertyValue('--foreground')
      
      // Apply background
      if (inputHsl) {
        node.style.setProperty('background-color', `hsl(${inputHsl})`, 'important')
      } else {
        // Fallback for light theme
        node.style.setProperty('background-color', 'rgba(0, 0, 0, 0.04)', 'important')
      }
      node.style.setProperty('background-image', 'none', 'important')
      
      // Apply text color
      if (foregroundHsl) {
        node.style.setProperty('color', `hsl(${foregroundHsl})`, 'important')
      } else {
        node.style.setProperty('color', 'rgb(15, 23, 42)', 'important')
      }
      
      // Apply padding and fontSize from theme to match text-input
      // Get values from CSS custom properties set by component-styling.ts
      // Try textarea-specific values first, then fall back to text-input values
      const textareaPadding = root.style.getPropertyValue('--textarea-padding')?.trim() || 
                              getComputedStyle(root).getPropertyValue('--textarea-padding')?.trim() ||
                              root.style.getPropertyValue('--text-input-padding')?.trim() ||
                              getComputedStyle(root).getPropertyValue('--text-input-padding')?.trim()
      
      const textareaFontSize = root.style.getPropertyValue('--textarea-font-size')?.trim() || 
                               getComputedStyle(root).getPropertyValue('--textarea-font-size')?.trim() ||
                               root.style.getPropertyValue('--text-input-font-size')?.trim() ||
                               getComputedStyle(root).getPropertyValue('--text-input-font-size')?.trim()
      
      if (textareaPadding) {
        node.style.setProperty('padding', textareaPadding, 'important')
      }
      if (textareaFontSize) {
        node.style.setProperty('font-size', textareaFontSize, 'important')
      }
      
      // Border color: use theme-aware border color from CSS variable
      // Don't set border-color directly - let CSS variable handle it via globals.css
      // This ensures it updates when theme changes
    }, [])
    
    // Update styles when theme changes
    useEffect(() => {
      if (textareaRef.current) {
        applyThemeStyles(textareaRef.current)
        
        // Watch for theme changes by observing the document element
        const observer = new MutationObserver(() => {
          if (textareaRef.current) {
            applyThemeStyles(textareaRef.current)
          }
        })
        
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'style'],
        })
        
        return () => observer.disconnect()
      }
    }, [applyThemeStyles])
    
    const handleRef = React.useCallback((node: HTMLTextAreaElement | null) => {
      // Handle forwarded ref
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
      
      textareaRef.current = node
      
      if (node) {
        applyThemeStyles(node)
      }
    }, [ref, applyThemeStyles])
    
    return (
      <textarea
        className={cn(
          "w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground",
          className
        )}
        style={style}
        ref={handleRef}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }