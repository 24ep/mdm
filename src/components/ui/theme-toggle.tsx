/**
 * Reusable theme toggle component
 * Can be used anywhere in the app
 */

'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  variant?: 'default' | 'icon' | 'dropdown'
  showLabel?: boolean
}

/**
 * Theme toggle component with multiple display variants
 * 
 * @example
 * ```tsx
 * // Icon button
 * <ThemeToggle variant="icon" />
 * 
 * // Dropdown menu
 * <ThemeToggle variant="dropdown" />
 * 
 * // Button with label
 * <ThemeToggle variant="default" showLabel />
 * ```
 */
export function ThemeToggle({ 
  variant = 'dropdown', 
  showLabel = true 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
          setTheme(nextTheme)
        }}
        title={`Current theme: ${theme}`}
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4" />
        ) : theme === 'light' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Monitor className="h-4 w-4" />
        )}
      </Button>
    )
  }

  if (variant === 'default') {
    return (
      <Button
        variant="outline"
        onClick={() => {
          const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
          setTheme(nextTheme)
        }}
      >
        {theme === 'dark' ? (
          <>
            <Moon className="mr-2 h-4 w-4" />
            {showLabel && 'Dark'}
          </>
        ) : theme === 'light' ? (
          <>
            <Sun className="mr-2 h-4 w-4" />
            {showLabel && 'Light'}
          </>
        ) : (
          <>
            <Monitor className="mr-2 h-4 w-4" />
            {showLabel && 'System'}
          </>
        )}
      </Button>
    )
  }

  // Default: dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {theme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : theme === 'light' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme || 'system'} onValueChange={setTheme}>
          <DropdownMenuRadioItem checked={theme === 'light'} onClick={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem checked={theme === 'dark'} onClick={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem checked={theme === 'system'} onClick={() => setTheme('system')}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

