/**
 * Branding loader functions
 * Loads branding configuration from API and initializes branding
 */

import { BrandingConfig } from '@/app/admin/features/system/types'
import { applyBrandingColors } from './colors'
import { applyComponentStyling } from './component-styling'
import { THEME_STORAGE_KEYS } from '@/lib/theme-constants'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * Load branding configuration from API
 * First tries to load from the active database theme, then falls back to system_settings
 */
export async function loadBrandingConfig(): Promise<BrandingConfig | null> {
  try {
    // First, check for stored database theme ID
    if (typeof window !== 'undefined') {
      const storedDbThemeId = localStorage.getItem(THEME_STORAGE_KEYS.DATABASE_THEME_ID)
      
      if (storedDbThemeId && isValidUUID(storedDbThemeId)) {
        const response = await fetch(`/api/themes/${storedDbThemeId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.theme?.config) {
            console.log('[Branding] Loaded config from stored theme:', storedDbThemeId)
            return data.theme.config as BrandingConfig
          }
        }
      }
    }

    // Try to get the active theme from the database
    const themesResponse = await fetch('/api/themes')
    if (themesResponse.ok) {
      const themesData = await themesResponse.json()
      const activeTheme = themesData.themes?.find((t: any) => t.isActive)
      
      if (activeTheme?.id && isValidUUID(activeTheme.id)) {
        const themeResponse = await fetch(`/api/themes/${activeTheme.id}`)
        if (themeResponse.ok) {
          const themeData = await themeResponse.json()
          if (themeData.theme?.config) {
            // Save the theme ID for future use
            if (typeof window !== 'undefined') {
              localStorage.setItem(THEME_STORAGE_KEYS.DATABASE_THEME_ID, activeTheme.id)
            }
            console.log('[Branding] Loaded config from active theme:', activeTheme.id)
            return themeData.theme.config as BrandingConfig
          }
        }
      }
    }

    // Fall back to system_settings (legacy support)
    const response = await fetch('/api/admin/branding')
    if (response.ok) {
      const data = await response.json()
      if (data.branding) {
        console.log('[Branding] Loaded config from system_settings (legacy)')
        return data.branding
      }
    }
  } catch (error) {
    console.error('Error loading branding config:', error)
  }
  
  console.warn('[Branding] No branding config found')
  return null
}

/**
 * Apply branding on page load
 * This should be called in the root layout or app component
 * Returns a cleanup function
 */
export async function initializeBranding(): Promise<(() => void) | null> {
  const branding = await loadBrandingConfig()
  if (branding) {
    console.log('[Branding] Initializing branding with config:', {
      hasComponentStyling: !!branding.componentStyling,
      componentStylingKeys: Object.keys(branding.componentStyling || {}),
      hasPlatformSidebarPrimary: !!branding.componentStyling?.['platform-sidebar-primary'],
      platformSidebarPrimary: branding.componentStyling?.['platform-sidebar-primary']
    })
    
    // Apply all branding functions
    applyBrandingColors(branding)
    
    // Reapply component styling after a short delay to ensure DOM is ready
    // This helps with components that render after initial page load
    setTimeout(() => {
      applyComponentStyling(branding)
    }, 100)

    // Note: Theme switching is now handled by selecting different themes
    // rather than toggling light/dark mode within a single theme
    // Return empty cleanup function
    return () => {
      // Cleanup if needed
    }
  } else {
    console.warn('[Branding] No branding config loaded')
  }
  return null
}

