/**
 * Branding loader functions
 * Loads branding configuration from API and initializes branding
 */

import { BrandingConfig } from '@/app/admin/features/system/types'
import { applyBrandingColors } from './colors'
import { applyComponentStyling } from './component-styling'

/**
 * Load branding configuration from API
 */
export async function loadBrandingConfig(): Promise<BrandingConfig | null> {
  try {
    const response = await fetch('/api/admin/branding')
    if (response.ok) {
      const data = await response.json()
      return data.branding || null
    }
  } catch (error) {
    console.error('Error loading branding config:', error)
  }
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

