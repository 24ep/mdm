'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { applyBrandingColors, applyGlobalStyling, applyComponentStyling } from '@/lib/branding'
import { THEME_STORAGE_KEYS, THEME_DEFAULTS, THEME_ERROR_MESSAGES } from '@/lib/theme-constants'
import { safeParseTheme, type Theme } from '@/lib/theme-types'

/**
 * BrandingInitializer component
 * Initializes branding colors on app load and applies theme mode from active theme
 * Should be placed in the root layout or providers
 * 
 * Note: This handles database themes (BrandingConfig), while ThemeContext handles
 * client-side theme variants (ThemeConfig). They work together but serve different purposes.
 */
export function BrandingInitializer() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const appliedRef = useRef<string | null>(null) // Track last applied theme ID to prevent re-applying

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    // Skip theme config application if page is in an iframe (emulator mode)
    // This ensures chatbot style settings from ai-chat-ui are used instead of theme config
    const isInIframe = window.self !== window.top
    if (isInIframe) {
      // In iframe mode, don't apply theme config - let chatbot styles from formData take precedence
      return
    }
    
    // Load user's selected theme or active theme and apply its themeMode and branding
    const loadAndApplyTheme = async () => {
      try {
        setError(null)
        
        // First, check for user's selected theme from localStorage
        const userSelectedThemeId = localStorage.getItem(THEME_STORAGE_KEYS.VARIANT_ID)
        
        let themeToApply: Theme | null = null
        let themeId: string | null = null
        
        if (userSelectedThemeId) {
          try {
            // Fetch user's selected theme
            const userThemeResponse = await fetch(`/api/themes/${userSelectedThemeId}`)
            if (userThemeResponse.ok) {
              const userThemeData = await userThemeResponse.json()
              // Validate the theme data
              const parseResult = safeParseTheme(userThemeData.theme)
              if (parseResult.success) {
                themeToApply = parseResult.data
                themeId = parseResult.data.id
              } else {
                console.warn('[BrandingInitializer] Invalid theme data:', parseResult.error)
              }
            }
          } catch (fetchError) {
            console.warn('[BrandingInitializer] Failed to fetch user theme:', fetchError)
            // Continue to fallback
          }
        }
        
        // If no user theme found, fall back to active theme
        if (!themeToApply) {
          try {
            const response = await fetch('/api/themes')
            if (response.ok) {
              const data = await response.json()
              const activeTheme = data.themes?.find((t: any) => t.isActive)
              if (activeTheme) {
                themeId = activeTheme.id
                // Fetch full theme details with config
                const themeResponse = await fetch(`/api/themes/${activeTheme.id}`)
                if (themeResponse.ok) {
                  const themeData = await themeResponse.json()
                  const parseResult = safeParseTheme(themeData.theme)
                  if (parseResult.success) {
                    themeToApply = parseResult.data
                  } else {
                    console.warn('[BrandingInitializer] Invalid active theme data:', parseResult.error)
                  }
                }
              }
            }
          } catch (fetchError) {
            console.warn('[BrandingInitializer] Failed to fetch active theme:', fetchError)
          }
        }
        
        // Prevent re-applying the same theme
        if (themeToApply && appliedRef.current === themeToApply.id) {
          return
        }
        
        if (themeToApply) {
          // Apply theme mode from selected/active theme (overrides next-themes default)
          const themeMode = themeToApply.themeMode === 'dark' ? 'dark' : 'light'
          
          // Only update if current theme doesn't match
          if (theme !== themeMode) {
            setTheme(themeMode)
          }
          
          // Also directly apply dark class to document element to ensure it's applied immediately
          const root = document.documentElement
          if (themeMode === 'dark') {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
          
          // Apply branding config from theme
          if (themeToApply.config) {
            try {
              const brandingConfig = themeToApply.config
              
              console.log('[BrandingInitializer] Applying theme branding:', {
                themeId: themeToApply.id,
                themeName: themeToApply.name,
                themeMode: themeToApply.themeMode,
                hasConfig: !!brandingConfig,
                configKeys: Object.keys(brandingConfig || {})
              })
              
              // Apply all branding functions with error handling
              try {
                applyBrandingColors(brandingConfig)
              } catch (err) {
                console.error('[BrandingInitializer] Error applying branding colors:', err)
              }
              
              try {
                applyGlobalStyling(brandingConfig)
              } catch (err) {
                console.error('[BrandingInitializer] Error applying global styling:', err)
              }
              
              // Reapply component styling after a short delay to ensure DOM is ready
              setTimeout(() => {
                try {
                  applyComponentStyling(brandingConfig)
                } catch (err) {
                  console.error('[BrandingInitializer] Error applying component styling:', err)
                }
              }, 100)
              
              appliedRef.current = themeToApply.id
              localStorage.setItem(THEME_STORAGE_KEYS.LAST_APPLIED, Date.now().toString())
            } catch (configError) {
              console.error('[BrandingInitializer] Error applying branding config:', configError)
              setError(THEME_ERROR_MESSAGES.FAILED_TO_APPLY)
            }
          }
        } else {
          // No theme found, use light as default
          if (theme !== THEME_DEFAULTS.MODE) {
            setTheme(THEME_DEFAULTS.MODE)
          }
          document.documentElement.classList.remove('dark')
          appliedRef.current = null
        }
      } catch (error) {
        console.error('[BrandingInitializer] Error loading theme:', error)
        setError(THEME_ERROR_MESSAGES.FAILED_TO_LOAD)
        // On error, default to light
        if (theme !== THEME_DEFAULTS.MODE) {
          setTheme(THEME_DEFAULTS.MODE)
        }
        document.documentElement.classList.remove('dark')
        appliedRef.current = null
      }
    }

    loadAndApplyTheme()
  }, [mounted, setTheme, theme])

  // Suppress hydration warning for theme-related attributes
  return null
}

