'use client'

import { useTheme } from 'next-themes'
import { useThemeContext } from '@/contexts/theme-context'
import { Moon, Sun, Monitor, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import { ThemeConfig } from '@/lib/themes'

interface ThemeSelectorProps {
  variant?: 'default' | 'icon' | 'dropdown'
  showLabel?: boolean
}

export function ThemeSelector({ 
  variant = 'dropdown', 
  showLabel = true 
}: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()
  const { currentTheme, setThemeById, lightThemes, darkThemes, mounted } = useThemeContext()
  const [mountedState, setMountedState] = useState(false)

  useEffect(() => {
    setMountedState(true)
  }, [])

  if (!mounted || !mountedState) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const resolvedTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme || 'light'

  const handleThemeSelect = (themeId: string) => {
    setThemeById(themeId)
  }

  const renderThemeItem = (themeConfig: ThemeConfig) => {
    const isSelected = currentTheme?.id === themeConfig.id
    return (
      <DropdownMenuRadioItem
        key={themeConfig.id}
        checked={currentTheme?.id === themeConfig.id}
        onClick={() => handleThemeSelect(themeConfig.id)}
        className="cursor-pointer"
      >
        <div className="flex items-center gap-2 w-full">
          <div
            className="w-4 h-4 rounded-full border border-border"
            style={{
              backgroundColor: `hsl(${themeConfig.colors.primary})`,
            }}
          />
          <span className={isSelected ? 'font-semibold' : ''}>
            {themeConfig.name}
          </span>
          {isSelected && <span className="ml-auto text-xs">✓</span>}
        </div>
      </DropdownMenuRadioItem>
    )
  }

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Select theme">
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Theme Mode</DropdownMenuLabel>
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
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Light Themes</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={currentTheme?.id || ''}>
            {lightThemes.map(renderThemeItem)}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Dark Themes</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={currentTheme?.id || ''}>
            {darkThemes.map(renderThemeItem)}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (variant === 'default') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Palette className="mr-2 h-4 w-4" />
            {showLabel && (currentTheme?.name || 'Select Theme')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Theme Mode</DropdownMenuLabel>
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
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Light Themes</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={currentTheme?.id || ''}>
            {lightThemes.map(renderThemeItem)}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Dark Themes</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={currentTheme?.id || ''}>
            {darkThemes.map(renderThemeItem)}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default: dropdown with submenus
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Select theme">
          {resolvedTheme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme Mode</DropdownMenuLabel>
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
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Themes</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={currentTheme?.id || ''}>
              {lightThemes.map(renderThemeItem)}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Themes</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={currentTheme?.id || ''}>
              {darkThemes.map(renderThemeItem)}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


