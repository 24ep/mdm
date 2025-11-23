/**
 * Application branding functions
 * Applies application name, logo, and related settings
 */

import { BrandingConfig } from '@/app/admin/features/system/types'

/**
 * Apply application branding (name, logo)
 * This sets CSS variables and data attributes for use throughout the app
 */
export function applyApplicationBranding(branding: BrandingConfig) {
  const root = document.documentElement

  // Set application name as data attribute and CSS variable
  if (branding.applicationName) {
    root.setAttribute('data-application-name', branding.applicationName)
    root.style.setProperty('--application-name', `"${branding.applicationName}"`)
  }

  // Set application logo
  if (branding.applicationLogo) {
    root.setAttribute('data-application-logo', branding.applicationLogo)
    root.style.setProperty('--application-logo', `url(${branding.applicationLogo})`)
  }

  // Set logo type
  if (branding.applicationLogoType) {
    root.setAttribute('data-application-logo-type', branding.applicationLogoType)
  }

  // Set logo icon settings
  if (branding.applicationLogoIcon) {
    root.setAttribute('data-application-logo-icon', branding.applicationLogoIcon)
  }
  if (branding.applicationLogoIconColor) {
    root.style.setProperty('--application-logo-icon-color', branding.applicationLogoIconColor)
  }
  if (branding.applicationLogoBackgroundColor) {
    root.style.setProperty('--application-logo-bg-color', branding.applicationLogoBackgroundColor)
  }
}

