'use client'

import * as React from "react"
import { Moon, Sun, LucideIcon } from 'lucide-react'
import { cn } from "@/lib/utils"

export interface SwitchWithIconsProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Icon to show when unchecked (left side) */
  uncheckedIcon?: LucideIcon
  /** Icon to show when checked (right side) */
  checkedIcon?: LucideIcon
  /** Size of the icons */
  iconSize?: number
  /** Whether to show icons inside the switch track */
  showIconsOnTrack?: boolean
}

/**
 * Switch component with icons displayed on the track
 * 
 * @example
 * ```tsx
 * <SwitchWithIcons
 *   checked={isDarkMode}
 *   onCheckedChange={setIsDarkMode}
 *   uncheckedIcon={Sun}
 *   checkedIcon={Moon}
 * />
 * ```
 */
const SwitchWithIcons = React.forwardRef<HTMLInputElement, SwitchWithIconsProps>(
  ({ 
    className, 
    checked, 
    onCheckedChange, 
    onChange,
    uncheckedIcon: UncheckedIcon = Sun,
    checkedIcon: CheckedIcon = Moon,
    iconSize = 14,
    showIconsOnTrack = true,
    ...props 
  }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
      onChange?.(e)
    }

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          className="sr-only peer"
          role="switch"
          aria-checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "peer relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            "peer-checked:bg-primary peer-checked:border-primary",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            !checked && "bg-input",
            className
          )}
        >
          {/* Icons on the track */}
          {showIconsOnTrack && (
            <>
              {/* Unchecked icon (left side) */}
              <div className={cn(
                "absolute left-1 transition-opacity duration-200",
                !checked ? "opacity-100" : "opacity-30"
              )}>
                <UncheckedIcon 
                  size={iconSize} 
                  className={cn(
                    !checked ? "text-amber-500" : "text-muted-foreground"
                  )}
                />
              </div>
              
              {/* Checked icon (right side) */}
              <div className={cn(
                "absolute right-1 transition-opacity duration-200",
                checked ? "opacity-100" : "opacity-30"
              )}>
                <CheckedIcon 
                  size={iconSize} 
                  className={cn(
                    checked ? "text-blue-500" : "text-muted-foreground"
                  )}
                />
              </div>
            </>
          )}
          
          {/* Switch thumb */}
          <span
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200",
              "peer-checked:translate-x-5 translate-x-0"
            )}
          />
        </div>
      </label>
    )
  }
)
SwitchWithIcons.displayName = "SwitchWithIcons"

export { SwitchWithIcons }

