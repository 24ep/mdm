/**
 * Border color override logic
 * Handles rgba border colors that need special CSS overrides
 */

import { BrandingConfig } from '@/app/admin/features/system/types'
import { hasAlphaChannel } from './utils'

/**
 * Generate CSS rules to override globals.css when --border is rgba
 */
export function generateBorderOverrideCSS(branding: BrandingConfig): string {
  // Override globals.css rules that use hsl(var(--border)) when --border is rgba
  // This is necessary because hsl(var(--border)) fails when --border is set to rgba value
  // Check both uiBorderColor and globalStyling.borderColor to see which one has alpha
  const uiBorderColor = branding.uiBorderColor ? branding.uiBorderColor.trim() : 'rgba(0, 0, 0, 0.1)'
  const globalBorderColor = branding.globalStyling?.borderColor ? branding.globalStyling.borderColor.trim() : null
  const borderColorToCheck = globalBorderColor || uiBorderColor
  const hasAlpha = hasAlphaChannel(borderColorToCheck)
  console.log('[Branding] Component styling - uiBorderColor:', uiBorderColor, 'globalBorderColor:', globalBorderColor, 'hasAlpha:', hasAlpha)
  
  if (!hasAlpha) {
    return ''
  }

  let cssRules = ''
  cssRules += `  /* Override globals.css rules that use hsl(var(--border)) - --border is rgba, so use var(--border) directly */\n`
  cssRules += `  /* Use more specific selectors to avoid conflicts */\n`
  cssRules += `  body:not([data-space]) * {\n`
  cssRules += `    border-color: var(--border) !important;\n`
  cssRules += `  }\n`
  cssRules += `  /* Override Tailwind's border-border class which uses hsl(var(--border)) */\n`
  cssRules += `  /* Use maximum specificity to override Tailwind utilities */\n`
  cssRules += `  .border-border,\n`
  cssRules += `  [class*="border-border"],\n`
  cssRules += `  .border-t.border-border,\n`
  cssRules += `  .border-b.border-border,\n`
  cssRules += `  .border-l.border-border,\n`
  cssRules += `  .border-r.border-border,\n`
  cssRules += `  body:not([data-space]) .border-border,\n`
  cssRules += `  body:not([data-space]) [class*="border-border"],\n`
  cssRules += `  body:not([data-space]) .border-t.border-border,\n`
  cssRules += `  body:not([data-space]) .border-b.border-border,\n`
  cssRules += `  body:not([data-space]) .border-l.border-border,\n`
  cssRules += `  body:not([data-space]) .border-r.border-border,\n`
  cssRules += `  [data-sidebar] .border-border,\n`
  cssRules += `  [data-sidebar="primary"] .border-border,\n`
  cssRules += `  [data-sidebar="secondary"] .border-border,\n`
  cssRules += `  [data-sidebar] .border-t.border-border,\n`
  cssRules += `  [data-sidebar="primary"] .border-t.border-border,\n`
  cssRules += `  [data-sidebar="secondary"] .border-t.border-border,\n`
  cssRules += `  [data-component="platform-sidebar"] .border-t.border-border,\n`
  cssRules += `  [data-component="platform-sidebar"][data-sidebar="primary"] .border-t.border-border,\n`
  cssRules += `  [data-component="platform-sidebar"][data-sidebar="secondary"] .border-t.border-border {\n`
  cssRules += `    border-color: var(--border) !important;\n`
  cssRules += `    border-top-color: var(--border) !important;\n`
  cssRules += `  }\n`
  cssRules += `  input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]),\n`
  cssRules += `  textarea,\n`
  cssRules += `  select {\n`
  cssRules += `    background-color: var(--border) !important;\n`
  cssRules += `  }\n\n`
  
  return cssRules
}

