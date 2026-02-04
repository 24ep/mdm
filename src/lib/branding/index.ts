/**
 * Branding module - exports all branding functions
 * This module is split into multiple files for better organization
 */

// Utility functions
export { hexToHsl, clearBrandingStyles } from './utils'

// Color and styling functions
export { applyBrandingColors } from './colors'
export { applyGlobalStyling } from './global-styling'
export { applyComponentStyling } from './component-styling'

// Drawer functions
export { applyDrawerOverlay, getDrawerOverlaySettings } from './drawer'

// Login functions
export { applyLoginBackground } from './login'

// Application branding functions
export { applyApplicationBranding } from './application'

// Loader functions
export { loadBrandingConfig, initializeBranding } from './loader'

// Theme presets
export * from './themes'

