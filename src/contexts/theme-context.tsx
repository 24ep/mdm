'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { ThemeConfig, getThemeById, getThemeByVariant, lightThemes, darkThemes } from '@/lib/themes'
import { THEME_STORAGE_KEYS, THEME_DEFAULTS, THEME_ERROR_MESSAGES } from '@/lib/theme-constants'

interface ThemeContextType {
  currentTheme: ThemeConfig | null
  setThemeVariant: (variant: string, mode: 'light' | 'dark') => void
  setThemeById: (id: string) => void
  lightThemes: ThemeConfig[]
  darkThemes: ThemeConfig[]
  mounted: boolean
  error: string | null
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Fallback theme for error cases
const getFallbackTheme = (mode: 'light' | 'dark'): ThemeConfig | null => {
  return getThemeByVariant(THEME_DEFAULTS.VARIANT, mode) || null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useNextTheme()
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const applyTheme = useCallback((themeConfig: ThemeConfig) => {
    try {
      const root = document.documentElement

      // Ensure the dark class is added/removed based on theme mode
      // This is critical for Tailwind's dark mode to work
      if (themeConfig.mode === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      // Apply CSS variables
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

      setError(null)
    } catch (err) {
      console.error('[ThemeContext] Error applying theme:', err)
      setError(THEME_ERROR_MESSAGES.FAILED_TO_APPLY)
      // Try to apply fallback theme
      const fallback = getFallbackTheme(themeConfig.mode)
      if (fallback) {
        try {
          applyTheme(fallback)
        } catch {
          // If fallback also fails, just log it
          console.error('[ThemeContext] Failed to apply fallback theme')
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const getResolvedTheme = (): 'light' | 'dark' => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return (theme as 'light' | 'dark') || THEME_DEFAULTS.MODE
    }

    const loadTheme = () => {
      try {
        const savedThemeId = localStorage.getItem(THEME_STORAGE_KEYS.VARIANT_ID)
        const resolvedTheme = getResolvedTheme()

        if (savedThemeId) {
          const savedTheme = getThemeById(savedThemeId)
          if (savedTheme) {
            // If saved theme matches current mode, use it
            if (savedTheme.mode === resolvedTheme) {
              setCurrentTheme(savedTheme)
              applyTheme(savedTheme)
              localStorage.setItem(THEME_STORAGE_KEYS.LAST_APPLIED, Date.now().toString())
              return
            }
            // If mode changed, try to find same variant in new mode
            const variantTheme = getThemeByVariant(savedTheme.variant, resolvedTheme)
            if (variantTheme) {
              setCurrentTheme(variantTheme)
              applyTheme(variantTheme)
              localStorage.setItem(THEME_STORAGE_KEYS.VARIANT_ID, variantTheme.id)
              localStorage.setItem(THEME_STORAGE_KEYS.LAST_APPLIED, Date.now().toString())
              return
            }
          }
        }

        // Default theme based on mode
        const defaultTheme = getThemeByVariant(THEME_DEFAULTS.VARIANT, resolvedTheme)
        if (defaultTheme) {
          setCurrentTheme(defaultTheme)
          applyTheme(defaultTheme)
          localStorage.setItem(THEME_STORAGE_KEYS.VARIANT_ID, defaultTheme.id)
          localStorage.setItem(THEME_STORAGE_KEYS.LAST_APPLIED, Date.now().toString())
        } else {
          setError(THEME_ERROR_MESSAGES.THEME_NOT_FOUND)
        }
      } catch (err) {
        console.error('[ThemeContext] Error loading theme:', err)
        setError(THEME_ERROR_MESSAGES.FAILED_TO_LOAD)
        // Try fallback
        const fallback = getFallbackTheme(getResolvedTheme())
        if (fallback) {
          setCurrentTheme(fallback)
          applyTheme(fallback)
        }
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
  }, [theme, mounted, applyTheme])

  const setThemeVariant = useCallback((variant: string, mode: 'light' | 'dark') => {
    try {
      const newTheme = getThemeByVariant(variant as any, mode)
      if (newTheme) {
        setCurrentTheme(newTheme)
        applyTheme(newTheme)
        localStorage.setItem(THEME_STORAGE_KEYS.VARIANT_ID, newTheme.id)
        localStorage.setItem(THEME_STORAGE_KEYS.LAST_APPLIED, Date.now().toString())
        // Update the base theme mode
        if (theme !== mode) {
          setTheme(mode)
        }
        setError(null)
      } else {
        setError(THEME_ERROR_MESSAGES.THEME_NOT_FOUND)
      }
    } catch (err) {
      console.error('[ThemeContext] Error setting theme variant:', err)
      setError(THEME_ERROR_MESSAGES.FAILED_TO_APPLY)
    }
  }, [theme, setTheme, applyTheme])

  const setThemeById = useCallback((id: string) => {
    try {
      const newTheme = getThemeById(id)
      if (newTheme) {
        setCurrentTheme(newTheme)
        applyTheme(newTheme)
        localStorage.setItem(THEME_STORAGE_KEYS.VARIANT_ID, newTheme.id)
        localStorage.setItem(THEME_STORAGE_KEYS.LAST_APPLIED, Date.now().toString())
        // Update the base theme mode
        if (theme !== newTheme.mode) {
          setTheme(newTheme.mode)
        }
        setError(null)
      } else {
        setError(THEME_ERROR_MESSAGES.THEME_NOT_FOUND)
      }
    } catch (err) {
      console.error('[ThemeContext] Error setting theme by ID:', err)
      setError(THEME_ERROR_MESSAGES.FAILED_TO_APPLY)
    }
  }, [theme, setTheme, applyTheme])

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setThemeVariant,
        setThemeById,
        lightThemes,
        darkThemes,
        mounted,
        error,
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

