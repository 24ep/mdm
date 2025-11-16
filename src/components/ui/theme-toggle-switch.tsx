'use client'

import { Moon, Sun } from 'lucide-react'
import { SwitchWithIcons } from './switch-with-icons'
import { cn } from '@/lib/utils'

interface ThemeToggleSwitchProps {
  /** Whether dark mode is currently active */
  isDarkMode: boolean
  /** Whether system mode is active (optional) */
  isSystemMode?: boolean
  /** Whether component is mounted/ready (optional) */
  mounted?: boolean
  /** Callback when theme changes */
  onCheckedChange: (checked: boolean) => void
  /** Additional className for the container */
  className?: string
  /** Alignment of the toggle */
  align?: 'left' | 'center' | 'right'
  /** Whether to show labels */
  showLabels?: boolean
}

/**
 * Theme toggle using a Switch with icons
 * 
 * @example
 * ```tsx
 * <ThemeToggleSwitch
 *   isDarkMode={isDarkMode}
 *   onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
 * />
 * ```
 */
export function ThemeToggleSwitch({
  isDarkMode,
  isSystemMode = false,
  mounted = true,
  onCheckedChange,
  className,
  align = 'right',
  showLabels = false,
}: ThemeToggleSwitchProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  return (
    <div className={cn('flex items-center gap-3', alignmentClasses[align], className)}>
      {showLabels && (
        <div className="flex items-center gap-2">
          <Sun className={cn(
            'h-4 w-4',
            !isDarkMode && !isSystemMode 
              ? 'text-amber-500' 
              : isSystemMode && !isDarkMode
              ? 'text-amber-500/70'
              : 'text-muted-foreground'
          )} />
          <span className={cn(
            "text-sm transition-colors",
            !isDarkMode && !isSystemMode 
              ? 'font-medium text-foreground' 
              : 'text-muted-foreground'
          )}>
            Light
          </span>
        </div>
      )}
      
      <div className={cn(isSystemMode && "opacity-60")}>
        <SwitchWithIcons
          checked={isDarkMode}
          onCheckedChange={onCheckedChange}
          disabled={!mounted}
          uncheckedIcon={Sun}
          checkedIcon={Moon}
          iconSize={14}
          showIconsOnTrack={true}
        />
      </div>
      
      {showLabels && (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm transition-colors",
            isDarkMode && !isSystemMode 
              ? 'font-medium text-foreground' 
              : 'text-muted-foreground'
          )}>
            Dark
          </span>
          <Moon className={cn(
            'h-4 w-4',
            isDarkMode && !isSystemMode 
              ? 'text-blue-500' 
              : isSystemMode && isDarkMode
              ? 'text-blue-500/70'
              : 'text-muted-foreground'
          )} />
        </div>
      )}
    </div>
  )
}

