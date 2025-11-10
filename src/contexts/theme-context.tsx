'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { ThemeConfig, getThemeById, getThemeByVariant, lightThemes, darkThemes } from '@/lib/themes'

interface ThemeContextType {
  currentTheme: ThemeConfig | null
  setThemeVariant: (variant: string, mode: 'light' | 'dark') => void
  setThemeById: (id: string) => void
  lightThemes: ThemeConfig[]
  darkThemes: ThemeConfig[]
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useNextTheme()
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const getResolvedTheme = () => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return theme || 'light'
    }

    const loadTheme = () => {
      const savedThemeId = localStorage.getItem('theme-variant-id')
      const resolvedTheme = getResolvedTheme()

      if (savedThemeId) {
        const savedTheme = getThemeById(savedThemeId)
        if (savedTheme) {
          // If saved theme matches current mode, use it
          if (savedTheme.mode === resolvedTheme) {
            setCurrentTheme(savedTheme)
            applyTheme(savedTheme)
            return
          }
          // If mode changed, try to find same variant in new mode
          const variantTheme = getThemeByVariant(savedTheme.variant, resolvedTheme as 'light' | 'dark')
          if (variantTheme) {
            setCurrentTheme(variantTheme)
            applyTheme(variantTheme)
            localStorage.setItem('theme-variant-id', variantTheme.id)
            return
          }
        }
      }

      // Default theme based on mode
      const defaultTheme = getThemeByVariant('default', resolvedTheme as 'light' | 'dark')
      if (defaultTheme) {
        setCurrentTheme(defaultTheme)
        applyTheme(defaultTheme)
        localStorage.setItem('theme-variant-id', defaultTheme.id)
      }
    }

    loadTheme()

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => loadTheme()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, mounted])

  const applyTheme = (themeConfig: ThemeConfig) => {
    const root = document.documentElement
    root.style.setProperty('--background', themeConfig.colors.background)
    root.style.setProperty('--foreground', themeConfig.colors.foreground)
    root.style.setProperty('--card', themeConfig.colors.card)
    root.style.setProperty('--card-foreground', themeConfig.colors.cardForeground)
    root.style.setProperty('--popover', themeConfig.colors.popover)
    root.style.setProperty('--popover-foreground', themeConfig.colors.popoverForeground)
    root.style.setProperty('--primary', themeConfig.colors.primary)
    root.style.setProperty('--primary-foreground', themeConfig.colors.primaryForeground)
    root.style.setProperty('--secondary', themeConfig.colors.secondary)
    root.style.setProperty('--secondary-foreground', themeConfig.colors.secondaryForeground)
    root.style.setProperty('--muted', themeConfig.colors.muted)
    root.style.setProperty('--muted-foreground', themeConfig.colors.mutedForeground)
    root.style.setProperty('--accent', themeConfig.colors.accent)
    root.style.setProperty('--accent-foreground', themeConfig.colors.accentForeground)
    root.style.setProperty('--destructive', themeConfig.colors.destructive)
    root.style.setProperty('--destructive-foreground', themeConfig.colors.destructiveForeground)
    root.style.setProperty('--border', themeConfig.colors.border)
    root.style.setProperty('--input', themeConfig.colors.input)
    root.style.setProperty('--ring', themeConfig.colors.ring)
  }

  const setThemeVariant = (variant: string, mode: 'light' | 'dark') => {
    const newTheme = getThemeByVariant(variant as any, mode)
    if (newTheme) {
      setCurrentTheme(newTheme)
      applyTheme(newTheme)
      localStorage.setItem('theme-variant-id', newTheme.id)
      // Update the base theme mode
      if (theme !== mode) {
        setTheme(mode)
      }
    }
  }

  const setThemeById = (id: string) => {
    const newTheme = getThemeById(id)
    if (newTheme) {
      setCurrentTheme(newTheme)
      applyTheme(newTheme)
      localStorage.setItem('theme-variant-id', newTheme.id)
      // Update the base theme mode
      if (theme !== newTheme.mode) {
        setTheme(newTheme.mode)
      }
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setThemeVariant,
        setThemeById,
        lightThemes,
        darkThemes,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}

