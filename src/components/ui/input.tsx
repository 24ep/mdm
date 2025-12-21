import * as React from "react"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null)

    // Function to apply theme-aware styles
    const applyThemeStyles = React.useCallback((node: HTMLInputElement) => {
      if (!node) return

      // Skip if inside a space (data-space attribute)
      if (node.closest('[data-space]')) return

      // Get theme-aware colors from CSS variables
      const root = document.documentElement
      const borderHsl = root.style.getPropertyValue('--border') || getComputedStyle(root).getPropertyValue('--border')
      const mutedHsl = root.style.getPropertyValue('--muted') || getComputedStyle(root).getPropertyValue('--muted')
      const foregroundHsl = root.style.getPropertyValue('--foreground') || getComputedStyle(root).getPropertyValue('--foreground')

      // Apply background - use --muted (same as globals.css)
      if (mutedHsl) {
        node.style.setProperty('background-color', `hsl(${mutedHsl})`, 'important')
      } else {
        // Fallback for light theme
        node.style.setProperty('background-color', 'hsl(210 40% 96%)', 'important')
      }
      node.style.setProperty('background-image', 'none', 'important')

      // Apply text color
      if (foregroundHsl) {
        node.style.setProperty('color', `hsl(${foregroundHsl})`, 'important')
      } else {
        node.style.setProperty('color', 'rgb(15, 23, 42)', 'important')
      }

      // Apply border (using --border)
      if (borderHsl) {
        node.style.setProperty('border', `1px solid hsl(${borderHsl})`, 'important')
      } else {
        node.style.setProperty('border', '1px solid hsl(214.3 31.8% 91.4%)', 'important')
      }
    }, [])

    // Update styles when theme changes
    useEffect(() => {
      if (inputRef.current) {
        applyThemeStyles(inputRef.current)

        // Watch for theme changes by observing the document element
        const observer = new MutationObserver(() => {
          if (inputRef.current) {
            applyThemeStyles(inputRef.current)
          }
        })

        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'style'],
        })

        return () => observer.disconnect()
      }
    }, [applyThemeStyles])

    const handleRef = React.useCallback((node: HTMLInputElement | null) => {
      // Handle forwarded ref
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }

      inputRef.current = node

      if (node) {
        applyThemeStyles(node)
      }
    }, [ref, applyThemeStyles])

    return (
      <input
        type={type}
        className={cn(
          "w-full px-3 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
          className
        )}
        style={style}
        ref={handleRef}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
