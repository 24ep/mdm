'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { applyBrandingColors, applyGlobalStyling, applyComponentStyling, clearBrandingStyles } from '@/lib/branding'
import { THEME_STORAGE_KEYS, THEME_DEFAULTS, THEME_ERROR_MESSAGES } from '@/lib/theme-constants'
import { safeParseBrandingConfig, type BrandingConfig } from '@/lib/theme-types'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * BrandingInitializer component
 * Initializes branding colors on app load and applies theme mode from active theme
 * Should be placed in the root layout or providers
 * 
 * Note: This handles database themes (BrandingConfig), while ThemeContext handles
 * client-side theme variants (ThemeConfig). They work together but serve different purposes.
 * 
 * IMPORTANT: This component uses DATABASE_THEME_ID for database theme UUIDs,
 * which is separate from VARIANT_ID used by ThemeContext for client-side variants.
 */
export function BrandingInitializer() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const appliedRef = useRef<string | null>(null) // Track last applied theme ID to prevent re-applying
  const fetchingRef = useRef(false) // Prevent concurrent fetches

  useEffect(() => {
    setMounted(true)
  }, [])

  const applyThemeConfig = useCallback((themeId: string, themeName: string, themeMode: 'light' | 'dark', config: BrandingConfig) => {
    try {
      console.log('[BrandingInitializer] Applying theme branding:', {
        themeId,
        themeName,
        themeMode,
        hasConfig: !!config,
        configKeys: Object.keys(config || {})
      })

      // Apply dark/light mode
      const root = document.documentElement
      if (themeMode === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      // Sync with next-themes
      if (theme !== themeMode) {
        setTheme(themeMode)
      }

      // Apply all branding functions with error handling
      try {
        applyBrandingColors(config)
      } catch (err) {
        console.error('[BrandingInitializer] Error applying branding colors:', err)
      }

      try {
        applyGlobalStyling(config)
      } catch (err) {
        console.error('[BrandingInitializer] Error applying global styling:', err)
      }

      // Reapply component styling after a short delay to ensure DOM is ready
      setTimeout(() => {
        try {
          applyComponentStyling(config)
        } catch (err) {
          console.error('[BrandingInitializer] Error applying component styling:', err)
        }
      }, 100)

      appliedRef.current = themeId
      localStorage.setItem(THEME_STORAGE_KEYS.DATABASE_THEME_ID, themeId)
      localStorage.setItem(THEME_STORAGE_KEYS.LAST_APPLIED, Date.now().toString())
      setError(null)
    } catch (configError) {
      console.error('[BrandingInitializer] Error applying branding config:', configError)
      setError(THEME_ERROR_MESSAGES.FAILED_TO_APPLY)
    }
  }, [theme, setTheme])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    // Skip theme config application if page is in an iframe (emulator mode)
    // This ensures chatbot style settings from ai-chat-ui are used instead of theme config
    const isInIframe = window.self !== window.top
    if (isInIframe) {
      return
    }

    // Prevent concurrent fetches
    if (fetchingRef.current) return

    const loadAndApplyTheme = async () => {
      fetchingRef.current = true

      try {
        setError(null)

        // Check system settings for enableThemeConfig
        try {
          const settingsResponse = await fetch('/api/system-settings')
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            if (settingsData.success && settingsData.settings?.enableThemeConfig === false) {
              console.log('[BrandingInitializer] Theme configuration is disabled in system settings. Clearing branding styles.')
              clearBrandingStyles()
              
              // Apply default mode
              if (theme !== THEME_DEFAULTS.MODE) {
                setTheme(THEME_DEFAULTS.MODE)
              }
              if (THEME_DEFAULTS.MODE === 'light') {
                document.documentElement.classList.remove('dark')
              } else {
                document.documentElement.classList.add('dark')
              }
              
              appliedRef.current = null
              fetchingRef.current = false
              return
            }
          }
        } catch (settingsError) {
          console.warn('[BrandingInitializer] Failed to fetch system settings:', settingsError)
          // Continue with theme loading if settings fetch fails
        }

        // Check for stored database theme ID (UUID format)
        const storedDbThemeId = localStorage.getItem(THEME_STORAGE_KEYS.DATABASE_THEME_ID)

        // Try to fetch user's stored theme first (only if valid UUID)
        if (storedDbThemeId && isValidUUID(storedDbThemeId)) {
          // Prevent re-applying the same theme
          if (appliedRef.current === storedDbThemeId) {
            fetchingRef.current = false
            return
          }

          try {
            const response = await fetch(`/api/themes/${storedDbThemeId}`)
            if (response.ok) {
              const data = await response.json()
              const themeData = data.theme

              if (themeData?.config) {
                const configResult = safeParseBrandingConfig(themeData.config)
                if (configResult.success) {
                  const themeMode = themeData.themeMode === 'dark' ? 'dark' : 'light'
                  applyThemeConfig(themeData.id, themeData.name, themeMode, configResult.data)
                  fetchingRef.current = false
                  return
                }
              }
            }
          } catch (fetchError) {
            console.warn('[BrandingInitializer] Failed to fetch stored theme:', fetchError)
          }
        }

        // Fall back to active theme from database
        try {
          const response = await fetch('/api/themes')
          if (response.ok) {
            const data = await response.json()
            const activeTheme = data.themes?.find((t: any) => t.isActive)

            if (activeTheme?.id && isValidUUID(activeTheme.id)) {
              // Prevent re-applying the same theme
              if (appliedRef.current === activeTheme.id) {
                fetchingRef.current = false
                return
              }

              // Fetch full theme details with config
              const themeResponse = await fetch(`/api/themes/${activeTheme.id}`)
              if (themeResponse.ok) {
                const themeData = (await themeResponse.json()).theme

                if (themeData?.config) {
                  const configResult = safeParseBrandingConfig(themeData.config)
                  if (configResult.success) {
                    const themeMode = themeData.themeMode === 'dark' ? 'dark' : 'light'
                    applyThemeConfig(themeData.id, themeData.name, themeMode, configResult.data)
                    fetchingRef.current = false
                    return
                  }
                }
              }
            }
          }
        } catch (fetchError) {
          console.warn('[BrandingInitializer] Failed to fetch active theme:', fetchError)
        }

        // No valid theme found - clear all branding and use defaults from globals.css
        console.log('[BrandingInitializer] No active theme found in database, clearing branding and using defaults')
        clearBrandingStyles()
        localStorage.removeItem(THEME_STORAGE_KEYS.DATABASE_THEME_ID)
        if (theme !== THEME_DEFAULTS.MODE) {
          setTheme(THEME_DEFAULTS.MODE)
        }
        if (THEME_DEFAULTS.MODE === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          document.documentElement.classList.add('dark')
        }
        appliedRef.current = null

      } catch (error) {
        console.error('[BrandingInitializer] Error loading theme:', error)
        setError(THEME_ERROR_MESSAGES.FAILED_TO_LOAD)
        // On error, clear branding and apply default mode
        clearBrandingStyles()
        localStorage.removeItem(THEME_STORAGE_KEYS.DATABASE_THEME_ID)
        if (theme !== THEME_DEFAULTS.MODE) {
          setTheme(THEME_DEFAULTS.MODE)
        }
        document.documentElement.classList.remove('dark')
        appliedRef.current = null
      } finally {
        fetchingRef.current = false
      }
    }

    loadAndApplyTheme()
  }, [mounted, applyThemeConfig, setTheme, theme])

  // This component doesn't render anything
  return null
}

