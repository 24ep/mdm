/**
 * Login background functions
 * Applies login background settings (color, gradient, or image)
 */

import { BrandingConfig } from '@/app/admin/features/system/types'

/**
 * Apply login background settings
 * This sets CSS variables that can be used by login pages
 */
export function applyLoginBackground(branding: BrandingConfig) {
  const root = document.documentElement
  const loginBg = branding.loginBackground

  if (!loginBg) return

  // Set login background type
  root.style.setProperty('--login-bg-type', loginBg.type)

  if (loginBg.type === 'color' && loginBg.color) {
    root.style.setProperty('--login-bg-color', loginBg.color)
  } else if (loginBg.type === 'gradient' && loginBg.gradient) {
    root.style.setProperty('--login-bg-gradient-from', loginBg.gradient.from)
    root.style.setProperty('--login-bg-gradient-to', loginBg.gradient.to)
    root.style.setProperty('--login-bg-gradient-angle', `${loginBg.gradient.angle}deg`)
  } else if (loginBg.type === 'image' && loginBg.image) {
    root.style.setProperty('--login-bg-image', `url(${loginBg.image})`)
  } else if (loginBg.type === 'video' && loginBg.video) {
    root.style.setProperty('--login-bg-video', loginBg.video)
  }
}

