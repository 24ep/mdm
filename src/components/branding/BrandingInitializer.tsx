'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { applyBrandingColors, applyGlobalStyling, applyComponentStyling } from '@/lib/branding'

/**
 * BrandingInitializer component
 * Initializes branding colors on app load and applies theme mode from active theme
 * Should be placed in the root layout or providers
 */
export function BrandingInitializer() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Skip theme config application if page is in an iframe (emulator mode)
    // This ensures chatbot style settings from ai-chat-ui are used instead of theme config
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top
    if (isInIframe) {
      // In iframe mode, don't apply theme config - let chatbot styles from formData take precedence
      return
    }
    
    // Load user's selected theme or active theme and apply its themeMode and branding
    const loadAndApplyTheme = async () => {
      try {
        // First, check for user's selected theme from localStorage
        const userSelectedThemeId = typeof window !== 'undefined' ? localStorage.getItem('theme-variant-id') : null
        
        let themeToApply = null
        let themeId = null
        
        if (userSelectedThemeId) {
          // Fetch user's selected theme
          const userThemeResponse = await fetch(`/api/themes/${userSelectedThemeId}`)
          if (userThemeResponse.ok) {
            const userThemeData = await userThemeResponse.json()
            themeToApply = userThemeData.theme
            themeId = userThemeData.theme?.id
          }
        }
        
        // If no user theme found, fall back to active theme
        if (!themeToApply) {
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
                themeToApply = themeData.theme
              }
            }
          }
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
            const brandingConfig = themeToApply.config
            
            console.log('[BrandingInitializer] Applying theme branding:', {
              themeId: themeToApply.id,
              themeName: themeToApply.name,
              themeMode: themeToApply.themeMode,
              hasConfig: !!brandingConfig,
              configKeys: Object.keys(brandingConfig || {})
            })
            
            // Apply all branding functions
            applyBrandingColors(brandingConfig)
            applyGlobalStyling(brandingConfig)
            
            // Reapply component styling after a short delay to ensure DOM is ready
            setTimeout(() => {
              applyComponentStyling(brandingConfig)
            }, 100)
          }
        } else {
          // No theme found, use light as default
          if (theme !== 'light') {
            setTheme('light')
          }
          document.documentElement.classList.remove('dark')
        }
      } catch (error) {
        console.error('[BrandingInitializer] Error loading theme:', error)
        // On error, default to light
        if (theme !== 'light') {
          setTheme('light')
        }
        document.documentElement.classList.remove('dark')
      }
    }

    loadAndApplyTheme()
  }, [mounted, setTheme, theme])

  return null
}

