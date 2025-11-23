/**
 * Drawer overlay functions
 * Applies drawer overlay settings and style configuration
 */

import { BrandingConfig } from '@/app/admin/features/system/types'

/**
 * Apply drawer overlay settings
 */
export function applyDrawerOverlay(branding: BrandingConfig) {
  const root = document.documentElement
  const overlay = branding.drawerOverlay
  const drawerStyle = branding.drawerStyle

  if (overlay) {
    root.style.setProperty('--drawer-overlay-color', overlay.color)
    root.style.setProperty('--drawer-overlay-opacity', String(overlay.opacity))
    root.style.setProperty('--drawer-overlay-blur', `${overlay.blur}px`)
  } else {
    // Default values
    root.style.setProperty('--drawer-overlay-color', '#FAFAFA')
    root.style.setProperty('--drawer-overlay-opacity', '15')
    root.style.setProperty('--drawer-overlay-blur', '8px')
  }

  // Apply drawer style configuration
  if (drawerStyle) {
    root.style.setProperty('--drawer-style-type', drawerStyle.type)
    root.style.setProperty('--drawer-style-margin', drawerStyle.margin || '16px')
    root.style.setProperty('--drawer-style-border-radius', drawerStyle.borderRadius || '12px')
    root.style.setProperty('--drawer-style-width', drawerStyle.width || '500px')
    root.style.setProperty('--drawer-style-background-blur', drawerStyle.backgroundBlur ? `${drawerStyle.backgroundBlur}px` : '10px')
    root.style.setProperty('--drawer-style-background-opacity', drawerStyle.backgroundOpacity ? String(drawerStyle.backgroundOpacity) : '95')
  } else {
    // Default values - modern style positions drawers on right side
    root.style.setProperty('--drawer-style-type', 'modern')
    root.style.setProperty('--drawer-style-margin', '16px')
    root.style.setProperty('--drawer-style-border-radius', '12px')
    root.style.setProperty('--drawer-style-width', '500px')
    root.style.setProperty('--drawer-style-background-blur', '10px')
    root.style.setProperty('--drawer-style-background-opacity', '95')
  }
}

/**
 * Get drawer overlay settings from branding config
 */
export function getDrawerOverlaySettings(branding: BrandingConfig | null): {
  color: string
  opacity: number
  blur: number
} {
  if (branding?.drawerOverlay) {
    return {
      color: branding.drawerOverlay.color,
      opacity: branding.drawerOverlay.opacity,
      blur: branding.drawerOverlay.blur,
    }
  }
  return {
    color: '#FAFAFA',
    opacity: 15,
    blur: 8,
  }
}

