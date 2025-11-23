/**
 * Component styling functions
 * Applies component-specific styling to UI components
 * Excludes space modules
 */

import { BrandingConfig } from '@/app/admin/features/system/types'
import { hexToHsl } from './utils'

export function applyComponentStyling(branding: BrandingConfig) {
  const styleId = 'branding-component-styling'
  
  // Always ensure platform sidebar CSS variables are set from main branding config
  // This is critical because the inline styles in PlatformSidebar use these variables
  const root = document.documentElement
  root.style.setProperty('--brand-platform-sidebar-bg', branding.platformSidebarBackgroundColor)
  root.style.setProperty('--brand-platform-sidebar-text', branding.platformSidebarTextColor)
  root.style.setProperty('--brand-secondary-sidebar-bg', branding.secondarySidebarBackgroundColor)
  root.style.setProperty('--brand-secondary-sidebar-text', branding.secondarySidebarTextColor)
  
  // Also apply global text color to all text elements (excluding space modules)
  const globalTextColor = branding.bodyTextColor || (
    branding.bodyBackgroundColor && (
      branding.bodyBackgroundColor.includes('#000') || 
      branding.bodyBackgroundColor.includes('rgb(0') ||
      branding.bodyBackgroundColor.includes('rgba(0')
    ) ? '#F5F5F7' : '#1D1D1F'
  )
  let styleElement = document.getElementById(styleId) as HTMLStyleElement

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = styleId
    // Append to end of head to ensure it comes after globals.css and can override it
    document.head.appendChild(styleElement)
  } else {
    // If style element exists, move it to the end to ensure it's after globals.css
    document.head.appendChild(styleElement)
  }

  // Always initialize CSS rules (even if empty, to clear previous styles)
  let cssRules = '/* Component-specific styling - excludes space modules */\n'

  // If no component styling, just set empty CSS to clear previous styles
  if (!branding.componentStyling || Object.keys(branding.componentStyling).length === 0) {
    cssRules += `    /* No component styling configured */\n`
    cssRules += `    /* Exclude space studio and space-specific components */\n`
    cssRules += `    [data-space],\n`
    cssRules += `    [data-space] *,\n`
    cssRules += `    [class*="space-studio"],\n`
    cssRules += `    [class*="space-studio"] *,\n`
    cssRules += `    [id*="space-"],\n`
    cssRules += `    [id*="space-"] * {\n`
    cssRules += `      /* Reset to default - space modules use their own styling */\n`
    cssRules += `    }\n`
    styleElement.textContent = cssRules
    return
  }

  // Map component IDs to CSS selectors
  const componentSelectors: Record<string, string[]> = {
    'text-input': [
      'body:not([data-space]) input:not([type])',
      'body:not([data-space]) input[type="text"]',
      'body:not([data-space]) input[type="email"]',
      'body:not([data-space]) input[type="password"]',
      'body:not([data-space]) input[type="number"]',
      'body:not([data-space]) input[type="search"]',
      'body:not([data-space]) input[type="tel"]',
      'body:not([data-space]) input[type="url"]',
      'body:not([data-space]) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
      // Shadcn/ui Input component wrapper
      'body:not([data-space]) [data-component="input"]',
      'body:not([data-space]) [class*="Input"]',
      'body:not([data-space]) input[class*="input"]',
      'body:not([data-space]) input[class*="Input"]',
    ],
    'text-input-focus': [
      'body:not([data-space]) input:not([type]):focus',
      'body:not([data-space]) input[type="text"]:focus',
      'body:not([data-space]) input[type="email"]:focus',
      'body:not([data-space]) input[type="password"]:focus',
      'body:not([data-space]) input[type="number"]:focus',
      'body:not([data-space]) input[type="search"]:focus',
      'body:not([data-space]) input[type="tel"]:focus',
      'body:not([data-space]) input[type="url"]:focus',
      'body:not([data-space]) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):focus',
      // Shadcn/ui Input component focus states
      'body:not([data-space]) [data-component="input"]:focus-within',
      'body:not([data-space]) [class*="Input"]:focus-within',
      'body:not([data-space]) input[class*="input"]:focus',
      'body:not([data-space]) input[class*="Input"]:focus',
    ],
    'text-input-disabled': [
      'body:not([data-space]) input:not([type]):disabled',
      'body:not([data-space]) input[type="text"]:disabled',
      'body:not([data-space]) input[type="email"]:disabled',
      'body:not([data-space]) input[type="password"]:disabled',
      'body:not([data-space]) input[type="number"]:disabled',
      'body:not([data-space]) input[type="search"]:disabled',
      'body:not([data-space]) input[type="tel"]:disabled',
      'body:not([data-space]) input[type="url"]:disabled',
      'body:not([data-space]) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):disabled',
      // Shadcn/ui Input component disabled states
      'body:not([data-space]) [data-component="input"][aria-disabled="true"]',
      'body:not([data-space]) [data-component="input"]:has(input:disabled)',
      'body:not([data-space]) [class*="Input"][aria-disabled="true"]',
      'body:not([data-space]) input[class*="input"]:disabled',
      'body:not([data-space]) input[class*="Input"]:disabled',
    ],
    'select': [
      'body:not([data-space]) select',
      'body:not([data-space]) [data-component="select-trigger"]',
      'body:not([data-space]) [data-component="select-content"]',
      'body:not([data-space]) [role="combobox"]',
      'body:not([data-space]) [data-radix-select-content]',
      'body:not([data-space]) [class*="SelectContent"]',
      'body:not([data-space]) [class*="SelectTrigger"]',
      'body:not([data-space]) [class*="SelectValue"]',
      'body:not([data-space]) [role="listbox"]',
      // Target the dropdown content div (portaled to body)
      'body:not([data-space]) > div[style*="position: fixed"][style*="z-index"]:has([role="option"])',
    ],
    'select-focus': [
      'body:not([data-space]) select:focus',
      'body:not([data-space]) [data-component="select-trigger"]:focus',
      'body:not([data-space]) [class*="SelectTrigger"]:focus',
      'body:not([data-space]) [role="combobox"]:focus',
      'body:not([data-space]) [role="combobox"][data-state="open"]',
    ],
    'select-disabled': [
      'body:not([data-space]) select:disabled',
      'body:not([data-space]) [data-component="select-trigger"][aria-disabled="true"]',
      'body:not([data-space]) [class*="SelectTrigger"][aria-disabled="true"]',
      'body:not([data-space]) [role="combobox"][aria-disabled="true"]',
      'body:not([data-space]) [role="combobox"]:has(select:disabled)',
    ],
    'multi-select': [
      'body:not([data-space]) select[multiple]',
      'body:not([data-space]) [role="listbox"]',
      'body:not([data-space]) [data-radix-select-content]',
      'body:not([data-space]) [class*="SelectContent"]',
      'body:not([data-space]) [class*="MultiSelect"]',
      'body:not([data-space]) [data-component="multi-select"]',
      // Target the dropdown content div (portaled to body)
      'body:not([data-space]) > div[style*="position: fixed"][style*="z-index"]:has([role="option"])',
    ],
    'multi-select-focus': [
      'body:not([data-space]) select[multiple]:focus',
      'body:not([data-space]) [role="listbox"]:focus',
      'body:not([data-space]) [class*="MultiSelect"]:focus-within',
      'body:not([data-space]) [data-component="multi-select"]:focus-within',
    ],
    'multi-select-disabled': [
      'body:not([data-space]) select[multiple]:disabled',
      'body:not([data-space]) [role="listbox"][aria-disabled="true"]',
      'body:not([data-space]) [class*="MultiSelect"][aria-disabled="true"]',
      'body:not([data-space]) [data-component="multi-select"][aria-disabled="true"]',
    ],
    'textarea': [
      'body:not([data-space]) textarea',
      'body:not([data-space]) [data-component="textarea"]',
      'body:not([data-space]) [class*="Textarea"]',
      'body:not([data-space]) textarea[class*="textarea"]',
      'body:not([data-space]) textarea[class*="Textarea"]',
    ],
    'textarea-focus': [
      'body:not([data-space]) textarea:focus',
      'body:not([data-space]) [data-component="textarea"]:focus-within',
      'body:not([data-space]) [class*="Textarea"]:focus-within',
      'body:not([data-space]) textarea[class*="textarea"]:focus',
      'body:not([data-space]) textarea[class*="Textarea"]:focus',
    ],
    'textarea-disabled': [
      'body:not([data-space]) textarea:disabled',
      'body:not([data-space]) [data-component="textarea"][aria-disabled="true"]',
      'body:not([data-space]) [data-component="textarea"]:has(textarea:disabled)',
      'body:not([data-space]) [class*="Textarea"][aria-disabled="true"]',
      'body:not([data-space]) textarea[class*="textarea"]:disabled',
      'body:not([data-space]) textarea[class*="Textarea"]:disabled',
    ],
    'form': [
      'body:not([data-space]) form',
      'body:not([data-space]) [data-component="form"]',
      'body:not([data-space]) [class*="Form"]',
      'body:not([data-space]) form[class*="form"]',
      'body:not([data-space]) form[class*="Form"]',
    ],
    'button': [
      'body:not([data-space]) button:not([class*="bg-secondary"]):not([class*="secondary"]):not([class*="ghost"]):not([class*="hover:bg-accent"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) [role="button"]:not([class*="bg-secondary"]):not([class*="secondary"]):not([class*="ghost"]):not([class*="hover:bg-accent"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) .btn:not([class*="bg-secondary"]):not([class*="secondary"]):not([class*="ghost"]):not([class*="hover:bg-accent"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([data-component="select-trigger"])',
      'body:not([data-space]) [class*="button"]:not([class*="bg-secondary"]):not([class*="secondary"]):not([class*="ghost"]):not([class*="hover:bg-accent"]):not([data-space]):not([data-space] *):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      /* Exclude buttons inside platform sidebar (primary and secondary) */
      'body:not([data-space]) [data-sidebar] button',
      'body:not([data-space]) [data-sidebar="primary"] button',
      'body:not([data-space]) [data-sidebar="secondary"] button',
      'body:not([data-space]) [data-component="platform-sidebar"] button',
      /* Exclude buttons inside top menu bar */
      'body:not([data-space]) [data-component="top-menu-bar"] button',
      /* Exclude active menu buttons */
      'body:not([data-space]) .platform-sidebar-menu-button-active',
      'body:not([data-space]) .platform-sidebar-menu-button.platform-sidebar-menu-button-active',
      /* Exclude select triggers - they use select component styling */
      'body:not([data-space]) [data-component="select-trigger"]',
    ],
    'button-default': [
      'body:not([data-space]) button[class*="bg-primary"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button:not([class*="bg-destructive"]):not([class*="bg-secondary"]):not([class*="border"]):not([class*="underline"]):not([class*="hover:bg-accent"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'button-destructive': [
      // Match buttons with bg-destructive class (most specific)
      'body button[class*="bg-destructive"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body [role="button"][class*="bg-destructive"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      // Match buttons with destructive in class name
      'body button[class*="destructive"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body [role="button"][class*="destructive"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      // Also match without data-space exclusion to catch space buttons
      'body:not([data-space]) button[class*="bg-destructive"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="destructive"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'button-outline': [
      'body:not([data-space]) button[class*="border"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):not([class*="bg-secondary"]):not([class*="underline"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="outline"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'button-secondary': [
      'body:not([data-space]) button[class*="bg-secondary"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'button-ghost': [
      'body:not([data-space]) button[class*="hover:bg-accent"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):not([class*="bg-secondary"]):not([class*="border"]):not([class*="underline"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="ghost"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'button-link': [
      'body:not([data-space]) button[class*="underline"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="link"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'iconButton': [
      'body:not([data-space]) button[data-icon-button]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-10"][class*="w-10"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-6"][class*="w-6"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="size-icon"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[size="icon"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'iconButton-hover': [
      'body:not([data-space]) button[data-icon-button]:hover:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-10"][class*="w-10"]:hover:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-6"][class*="w-6"]:hover:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="size-icon"]:hover:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[size="icon"]:hover:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'iconButton-active': [
      'body:not([data-space]) button[data-icon-button]:active:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-10"][class*="w-10"]:active:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-6"][class*="w-6"]:active:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="size-icon"]:active:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[size="icon"]:active:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'iconButton-focus': [
      'body:not([data-space]) button[data-icon-button]:focus:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-10"][class*="w-10"]:focus:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-6"][class*="w-6"]:focus:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="size-icon"]:focus:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[size="icon"]:focus:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'iconButton-disabled': [
      'body:not([data-space]) button[data-icon-button]:disabled:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-10"][class*="w-10"]:disabled:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="h-6"][class*="w-6"]:disabled:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[class*="size-icon"]:disabled:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) button[size="icon"]:disabled:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
    ],
    'button-hover': [
      'body:not([data-space]) button:hover:not([class*="bg-secondary"]):not([class*="secondary"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) [role="button"]:hover:not([class*="bg-secondary"]):not([class*="secondary"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) .btn:hover:not([class*="bg-secondary"]):not([class*="secondary"]):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([data-component="select-trigger"])',
    ],
    'button-active': [
      'body:not([data-space]) button:active:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) [role="button"]:active:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) .btn:active:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([data-component="select-trigger"])',
    ],
    'button-focus': [
      'body:not([data-space]) button:focus:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) [role="button"]:focus:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) .btn:focus:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([data-component="select-trigger"])',
    ],
    'button-disabled': [
      'body:not([data-space]) button:disabled:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) [role="button"]:disabled:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"])',
      'body:not([data-space]) .btn:disabled:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([data-component="select-trigger"])',
    ],
    'card': [
      'body:not([data-space]) [class*="card"]:not([data-space]):not([data-space] *)',
      'body:not([data-space]) .card',
      'body:not([data-space]) [data-component="card"]',
      'body:not([data-space]) [class*="Card"]',
      'body:not([data-space]) [role="region"][class*="card"]',
    ],
    'checkbox': [
      'body:not([data-space]) input[type="checkbox"]',
      'body:not([data-space]) input[type="checkbox"] + div', // Visual checkbox wrapper
      'body:not([data-space]) label:has(input[type="checkbox"]) > div', // Checkbox visual element
    ],
    'checkbox-checked': [
      'body:not([data-space]) input[type="checkbox"]:checked',
      'body:not([data-space]) input[type="checkbox"]:checked + div',
      'body:not([data-space]) label:has(input[type="checkbox"]:checked) > div',
    ],
    'checkbox-focus': [
      'body:not([data-space]) input[type="checkbox"]:focus',
      'body:not([data-space]) input[type="checkbox"]:focus + div',
      'body:not([data-space]) label:has(input[type="checkbox"]:focus) > div',
    ],
    'checkbox-disabled': [
      'body:not([data-space]) input[type="checkbox"]:disabled',
      'body:not([data-space]) input[type="checkbox"]:disabled + div',
      'body:not([data-space]) label:has(input[type="checkbox"]:disabled) > div',
    ],
    'radio': [
      'body:not([data-space]) input[type="radio"]',
      'body:not([data-space]) input[type="radio"] + div', // Visual radio wrapper
      'body:not([data-space]) label:has(input[type="radio"]) > div', // Radio visual element
    ],
    'radio-checked': [
      'body:not([data-space]) input[type="radio"]:checked',
      'body:not([data-space]) input[type="radio"]:checked + div',
      'body:not([data-space]) label:has(input[type="radio"]:checked) > div',
    ],
    'radio-focus': [
      'body:not([data-space]) input[type="radio"]:focus',
      'body:not([data-space]) input[type="radio"]:focus + div',
      'body:not([data-space]) label:has(input[type="radio"]:focus) > div',
    ],
    'radio-disabled': [
      'body:not([data-space]) input[type="radio"]:disabled',
      'body:not([data-space]) input[type="radio"]:disabled + div',
      'body:not([data-space]) label:has(input[type="radio"]:disabled) > div',
    ],
    'switch': [
      'body:not([data-space]) [role="switch"]',
      'body:not([data-space]) [role="switch"] + div', // Switch track wrapper
      'body:not([data-space]) label:has([role="switch"]) > div', // Switch track visual element
      'body:not([data-space]) [class*="switch"]:not([data-space]):not([data-space] *)',
      'body:not([data-space]) label:has(input[type="checkbox"][role="switch"]) > div', // Switch track for checkbox-based switches
    ],
    'switch-checked': [
      'body:not([data-space]) [role="switch"][aria-checked="true"]',
      'body:not([data-space]) [role="switch"][aria-checked="true"] + div',
      'body:not([data-space]) label:has([role="switch"][aria-checked="true"]) > div',
      'body:not([data-space]) input[type="checkbox"][role="switch"]:checked + div',
      'body:not([data-space]) label:has(input[type="checkbox"][role="switch"]:checked) > div',
    ],
    'switch-focus': [
      'body:not([data-space]) [role="switch"]:focus',
      'body:not([data-space]) [role="switch"]:focus + div',
      'body:not([data-space]) label:has([role="switch"]:focus) > div',
      'body:not([data-space]) input[type="checkbox"][role="switch"]:focus + div',
      'body:not([data-space]) label:has(input[type="checkbox"][role="switch"]:focus) > div',
    ],
    'switch-disabled': [
      'body:not([data-space]) [role="switch"][aria-disabled="true"]',
      'body:not([data-space]) [role="switch"][aria-disabled="true"] + div',
      'body:not([data-space]) label:has([role="switch"][aria-disabled="true"]) > div',
      'body:not([data-space]) input[type="checkbox"][role="switch"]:disabled + div',
      'body:not([data-space]) label:has(input[type="checkbox"][role="switch"]:disabled) > div',
    ],
    'top-menu-bar': [
      'body:not([data-space]) [data-component="top-menu-bar"]',
      'body:not([data-space]) .top-menu-bar',
    ],
    'platform-sidebar-primary': [
      'body:not([data-space]) [data-sidebar="primary"]',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="primary"]',
      'body:not([data-space]) div[data-sidebar="primary"]', // Target the wrapper div
      // More specific selectors to override inline styles
      'body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"]',
      'body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].h-full',
      'body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].flex',
      'body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].flex-col',
    ],
    'platform-sidebar-secondary': [
      'body:not([data-space]) [data-sidebar="secondary"]',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"]',
      'body:not([data-space]) div[data-sidebar="secondary"]', // Target the wrapper div
      // More specific selectors to override inline styles
      'body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"]',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].h-full',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].flex',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].flex-col',
    ],
    'platform-sidebar-menu-normal': [
      'body:not([data-space]) .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-sidebar] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="platform-sidebar"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-sidebar"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="space-sidebar"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-settings-sidebar"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="space-settings-sidebar"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
    ],
    'platform-sidebar-menu-hover': [
      'body:not([data-space]) .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-sidebar] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="platform-sidebar"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-sidebar"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="space-sidebar"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-settings-sidebar"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="space-settings-sidebar"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
    ],
    'platform-sidebar-menu-active': [
      'body:not([data-space]) .platform-sidebar-menu-button-active',
      'body:not([data-space]) .platform-sidebar-menu-button.platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-sidebar] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="platform-sidebar"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="space-sidebar"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="space-sidebar"] .platform-sidebar-menu-button.platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="space-sidebar"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="space-sidebar"] .platform-sidebar-menu-button.platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="space-settings-sidebar"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="space-settings-sidebar"] .platform-sidebar-menu-button.platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="space-settings-sidebar"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-sidebar="secondary"][data-component="space-settings-sidebar"] .platform-sidebar-menu-button.platform-sidebar-menu-button-active',
    ],
    'vertical-tab-menu-normal': [
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] [role="tab"]:not([aria-selected="true"])',
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] button[role="tab"]:not([aria-selected="true"])',
      // Target secondary sidebar tabs specifically
      'body:not([data-space]) [data-sidebar="secondary"] [role="tablist"][aria-orientation="vertical"] [role="tab"]:not([aria-selected="true"])',
      'body:not([data-space]) [data-sidebar="secondary"] [role="tablist"][aria-orientation="vertical"] button[role="tab"]:not([aria-selected="true"])',
      // Target secondary sidebar normal menu buttons (not active)
      'body:not([data-space]) [data-sidebar="secondary"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-sidebar="secondary"] button.platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button:not(.platform-sidebar-menu-button-active)',
    ],
    'vertical-tab-menu-hover': [
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] [role="tab"]:hover:not([aria-selected="true"])',
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] button[role="tab"]:hover:not([aria-selected="true"])',
      // Target secondary sidebar tabs specifically
      'body:not([data-space]) [data-sidebar="secondary"] [role="tablist"][aria-orientation="vertical"] [role="tab"]:hover:not([aria-selected="true"])',
      'body:not([data-space]) [data-sidebar="secondary"] [role="tablist"][aria-orientation="vertical"] button[role="tab"]:hover:not([aria-selected="true"])',
      // Target secondary sidebar hover menu buttons
      'body:not([data-space]) [data-sidebar="secondary"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-sidebar="secondary"] button.platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
      'body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button:hover:not(.platform-sidebar-menu-button-active)',
    ],
    'vertical-tab-menu-active': [
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] [role="tab"][aria-selected="true"]',
      'body:not([data-space]) [role="tablist"][aria-orientation="vertical"] button[role="tab"][aria-selected="true"]',
      // Target secondary sidebar tabs specifically
      'body:not([data-space]) [data-sidebar="secondary"] [role="tablist"][aria-orientation="vertical"] [role="tab"][aria-selected="true"]',
      'body:not([data-space]) [data-sidebar="secondary"] [role="tablist"][aria-orientation="vertical"] button[role="tab"][aria-selected="true"]',
      // Target secondary sidebar active menu buttons (PlatformSidebar uses platform-sidebar-menu-button-active class)
      'body:not([data-space]) [data-sidebar="secondary"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-sidebar="secondary"] button.platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="space-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="space-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] .platform-sidebar-menu-button-active',
      'body:not([data-space]) [data-component="space-settings-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button-active',
    ],
    'separator': [
      'body:not([data-space]) [role="separator"]',
      'body:not([data-space]) hr',
      'body:not([data-space]) .separator',
      'body:not([data-space]) [class*="Separator"]',
    ],
    'space-settings-menu-normal': [
      'body .space-settings-menu-item-normal',
      'body [class*="space-settings-menu-item"]:not(.space-settings-menu-item-active)',
      'body button.space-settings-menu-item-normal[role="tab"]',
      'body [class*="space-settings-menu-item"]:not(.space-settings-menu-item-active)[role="tab"]',
      'body.dark .space-settings-menu-item-normal',
      'body.dark [class*="space-settings-menu-item"]:not(.space-settings-menu-item-active)',
      'body.dark button.space-settings-menu-item-normal[role="tab"]',
    ],
    'space-settings-menu-hover': [
      'body .space-settings-menu-item-normal:hover',
      'body [class*="space-settings-menu-item"]:not(.space-settings-menu-item-active):hover',
      'body button.space-settings-menu-item-normal[role="tab"]:hover',
      'body [class*="space-settings-menu-item"]:not(.space-settings-menu-item-active)[role="tab"]:hover',
      'body.dark .space-settings-menu-item-normal:hover',
      'body.dark [class*="space-settings-menu-item"]:not(.space-settings-menu-item-active):hover',
      'body.dark button.space-settings-menu-item-normal[role="tab"]:hover',
    ],
    'space-settings-menu-active': [
      'body .space-settings-menu-item-active',
      'body [class*="space-settings-menu-item-active"]',
      'body [data-state="active"][class*="space-settings-menu-item"]',
      'body button.space-settings-menu-item-active[role="tab"][aria-selected="true"]',
      'body [class*="space-settings-menu-item-active"][role="tab"][aria-selected="true"]',
      'body button[role="tab"][aria-selected="true"].space-settings-menu-item-active',
      // Override TabsTrigger's default bg-muted/30 class
      'body button[role="tab"][aria-selected="true"].space-settings-menu-item-active.bg-muted\\/30',
      'body button.space-settings-menu-item-active[role="tab"][aria-selected="true"].bg-muted\\/30',
      // Dark mode overrides
      'body.dark .space-settings-menu-item-active',
      'body.dark [class*="space-settings-menu-item-active"]',
      'body.dark button.space-settings-menu-item-active[role="tab"][aria-selected="true"]',
      'body.dark button[role="tab"][aria-selected="true"].space-settings-menu-item-active',
      'body.dark button[role="tab"][aria-selected="true"].space-settings-menu-item-active.bg-muted\\/30',
    ],
  }

  // Set CSS variables for vertical tab menu active state (to override inline styles in PlatformSidebar)
  // The inline style uses hsl(var(--muted)), so we need to override --muted in the secondary sidebar context
  const verticalTabActive = branding.componentStyling?.['vertical-tab-menu-active']
  if (verticalTabActive?.backgroundColor) {
    root.style.setProperty('--brand-vertical-tab-active-bg', verticalTabActive.backgroundColor)
  }
  if (verticalTabActive?.textColor) {
    root.style.setProperty('--brand-vertical-tab-active-text', verticalTabActive.textColor)
  }

  // Generate CSS for each component
  // Process button-secondary AFTER button to ensure it overrides base button styles
  const sortedEntries = Object.entries(branding.componentStyling).sort(([a], [b]) => {
    if (a === 'button' && b === 'button-secondary') return -1
    if (a === 'button-secondary' && b === 'button') return 1
    return 0
  })
  
  sortedEntries.forEach(([componentId, componentStyle]) => {
    const selectors = componentSelectors[componentId] || []

    if (selectors.length === 0 || !componentStyle) return
    
    // Debug logging for platform sidebar, text-input, and form
    if (componentId === 'platform-sidebar-primary' || componentId === 'platform-sidebar-secondary' || componentId === 'text-input' || componentId === 'form') {
      console.log(`[Branding] Processing ${componentId}:`, componentStyle)
      console.log(`[Branding] Selectors:`, selectors)
    }

    // Check if there are any non-empty style properties
    // Helper to check if a value is non-empty
    const isNonEmpty = (val: any) => val && typeof val === 'string' && val.trim() !== '' || (val && typeof val !== 'string')
    
    const hasStyles = isNonEmpty(componentStyle.backgroundColor) ||
      isNonEmpty(componentStyle.textColor) ||
      isNonEmpty(componentStyle.borderColor) ||
      isNonEmpty(componentStyle.borderRadius) ||
      isNonEmpty(componentStyle.borderWidth) ||
      isNonEmpty(componentStyle.borderStyle) ||
      isNonEmpty(componentStyle.borderTopColor) ||
      isNonEmpty(componentStyle.borderRightColor) ||
      isNonEmpty(componentStyle.borderBottomColor) ||
      isNonEmpty(componentStyle.borderLeftColor) ||
      isNonEmpty(componentStyle.borderTopWidth) ||
      isNonEmpty(componentStyle.borderRightWidth) ||
      isNonEmpty(componentStyle.borderBottomWidth) ||
      isNonEmpty(componentStyle.borderLeftWidth) ||
      isNonEmpty(componentStyle.borderTopStyle) ||
      isNonEmpty(componentStyle.borderRightStyle) ||
      isNonEmpty(componentStyle.borderBottomStyle) ||
      isNonEmpty(componentStyle.borderLeftStyle) ||
      isNonEmpty(componentStyle.padding) ||
      isNonEmpty(componentStyle.margin) ||
      isNonEmpty((componentStyle as any).marginTop) ||
      isNonEmpty((componentStyle as any).marginBottom) ||
      isNonEmpty(componentStyle.width) ||
      isNonEmpty(componentStyle.height) ||
      isNonEmpty(componentStyle.minWidth) ||
      isNonEmpty(componentStyle.maxWidth) ||
      isNonEmpty(componentStyle.minHeight) ||
      isNonEmpty(componentStyle.maxHeight) ||
      isNonEmpty(componentStyle.fontSize) ||
      isNonEmpty(componentStyle.fontWeight) ||
      isNonEmpty(componentStyle.fontStyle) ||
      isNonEmpty(componentStyle.fontFamily) ||
      isNonEmpty(componentStyle.letterSpacing) ||
      isNonEmpty(componentStyle.lineHeight) ||
      isNonEmpty(componentStyle.textAlign) ||
      isNonEmpty(componentStyle.textTransform) ||
      isNonEmpty(componentStyle.textDecoration) ||
      isNonEmpty(componentStyle.textDecorationColor) ||
      isNonEmpty(componentStyle.textDecorationThickness) ||
      isNonEmpty(componentStyle.textDecorationStyle) ||
      isNonEmpty(componentStyle.textUnderlineOffset) ||
      isNonEmpty(componentStyle.textUnderlinePosition) ||
      isNonEmpty(componentStyle.opacity) ||
      isNonEmpty(componentStyle.backdropFilter) ||
      isNonEmpty(componentStyle.boxShadow) ||
      isNonEmpty(componentStyle.filter) ||
      isNonEmpty(componentStyle.transform) ||
      isNonEmpty(componentStyle.cursor) ||
      isNonEmpty(componentStyle.outline) ||
      isNonEmpty(componentStyle.outlineColor) ||
      isNonEmpty(componentStyle.outlineWidth) ||
      isNonEmpty(componentStyle.gap) ||
      isNonEmpty(componentStyle.zIndex) ||
      isNonEmpty(componentStyle.overflow) ||
      isNonEmpty(componentStyle.overflowX) ||
      isNonEmpty(componentStyle.overflowY) ||
      isNonEmpty(componentStyle.whiteSpace) ||
      isNonEmpty(componentStyle.wordBreak) ||
      isNonEmpty(componentStyle.textOverflow) ||
      isNonEmpty(componentStyle.visibility) ||
      isNonEmpty(componentStyle.pointerEvents) ||
      isNonEmpty(componentStyle.userSelect) ||
      isNonEmpty(componentStyle.transition)

    if (!hasStyles) {
      // Debug logging for platform sidebar
      if (componentId === 'platform-sidebar-primary' || componentId === 'platform-sidebar-secondary') {
        console.log(`[Branding] No styles found for ${componentId}`)
      }
      return
    }

    const selector = selectors.join(',\n    ')
    let componentCSS = `    ${selector} {\n`
    
    // Debug logging for platform sidebar and space settings menu
    if (componentId === 'platform-sidebar-primary' || componentId === 'platform-sidebar-secondary' || 
        componentId.startsWith('space-settings-menu')) {
      console.log(`[Branding] Generating CSS for ${componentId} with selector:`, selector)
      console.log(`[Branding] Component style:`, componentStyle)
    }
    
    // Debug logging for button-destructive
    if (componentId === 'button-destructive') {
      console.log(`[Branding] Generating CSS for ${componentId} with selector:`, selector)
      console.log(`[Branding] Component style:`, componentStyle)
    }
    
    // Debug logging for form
    if (componentId === 'form') {
      console.log(`[Branding] Generating CSS for ${componentId} with selector:`, selector)
      console.log(`[Branding] Component style:`, componentStyle)
      console.log(`[Branding] Has borderColor:`, componentStyle.borderColor)
      console.log(`[Branding] Has borderWidth:`, componentStyle.borderWidth)
    }

    if (componentStyle.backgroundColor && componentStyle.backgroundColor.trim()) {
      // Skip setting background-color here for button-destructive - we'll handle it in the special block below
      if (componentId !== 'button-destructive') {
        componentCSS += `      background-color: ${componentStyle.backgroundColor.trim()} !important;\n`
      }
      // For text-input, override Tailwind's bg-border class and globals.css rules
      if (componentId === 'text-input') {
        const bgColor = componentStyle.backgroundColor.trim()
        componentCSS += `      background: ${bgColor} !important;\n`
        componentCSS += `      background-color: ${bgColor} !important;\n`
        componentCSS += `      background-image: none !important;\n`
        // Override Tailwind's bg-border CSS variable
        let borderHsl: string
        if (bgColor.startsWith('#')) {
          borderHsl = hexToHsl(bgColor)
        } else if (bgColor.startsWith('rgb') || bgColor.startsWith('rgba')) {
          const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            borderHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            borderHsl = bgColor
          }
        } else if (bgColor.includes('hsl')) {
          const match = bgColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            borderHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            borderHsl = bgColor
          }
        } else {
          borderHsl = bgColor
        }
        // Override Tailwind's --border CSS variable (used by bg-border class)
        componentCSS += `      --border: ${borderHsl} !important;\n`
      }
      // For platform-sidebar-menu components, aggressively override button styles
      if (componentId.startsWith('platform-sidebar-menu')) {
        const bgColor = componentStyle.backgroundColor.trim()
        componentCSS += `      background: ${bgColor} !important;\n`
        componentCSS += `      background-color: ${bgColor} !important;\n`
        componentCSS += `      background-image: none !important;\n`
      }
      // For space-settings-menu components, also override Tailwind's bg-muted/30 class and dark mode backgrounds
      if (componentId.startsWith('space-settings-menu')) {
        // Aggressively override all background properties to prevent bg-muted/30 from showing
        // The bg-muted/30 class uses hsl(var(--muted) / 0.3), so we need to override both
        // the background property and the CSS variable
        const bgColor = componentStyle.backgroundColor.trim()
        componentCSS += `      background: ${bgColor} !important;\n`
        componentCSS += `      background-color: ${bgColor} !important;\n`
        componentCSS += `      background-image: none !important;\n`
        componentCSS += `      background-size: auto !important;\n`
        componentCSS += `      background-position: initial !important;\n`
        componentCSS += `      background-repeat: initial !important;\n`
        // Override the --muted CSS variable in this context to prevent bg-muted/30 from working
        // Convert the background color to HSL format for --muted override
        if (bgColor.startsWith('#')) {
          const hsl = hexToHsl(bgColor)
          componentCSS += `      --muted: ${hsl} !important;\n`
        } else if (bgColor.startsWith('rgba') || bgColor.startsWith('rgb')) {
          // Convert rgba/rgb to HSL
          const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
            componentCSS += `      --muted: ${hsl} !important;\n`
          }
        }
      }
      // For button-destructive, override CSS variables used by Tailwind's bg-destructive class
      // The bg-destructive class uses hsl(var(--destructive)), so we need to override --destructive
      // Also directly set background-color with !important to ensure it overrides Tailwind classes
      // Use maximum specificity to override Tailwind's utility classes
      if (componentId === 'button-destructive') {
        const bgColor = componentStyle.backgroundColor.trim()
        // Directly set background-color with !important to override Tailwind's bg-destructive class
        // Use multiple declarations with !important for maximum specificity
        componentCSS += `      background: ${bgColor} !important;\n`
        componentCSS += `      background-color: ${bgColor} !important;\n`
        componentCSS += `      background-image: none !important;\n`
        // Override any hover states that might use the CSS variable
        componentCSS += `      --tw-bg-opacity: 1 !important;\n`
        
        // Also override CSS variable for consistency
        let destructiveHsl: string
        if (bgColor.startsWith('#')) {
          destructiveHsl = hexToHsl(bgColor)
        } else if (bgColor.startsWith('rgb') || bgColor.startsWith('rgba')) {
          const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            destructiveHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            destructiveHsl = bgColor
          }
        } else if (bgColor.includes('hsl')) {
          const match = bgColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            destructiveHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            destructiveHsl = bgColor
          }
        } else {
          destructiveHsl = bgColor
        }
        // Override Tailwind's --destructive CSS variable (used by bg-destructive class)
        componentCSS += `      --destructive: ${destructiveHsl} !important;\n`
      }
      
      // For vertical-tab-menu-active, also set CSS variable to override inline styles
      // The inline style uses hsl(var(--muted)), so --muted must be in HSL format
      if (componentId === 'vertical-tab-menu-active') {
        const bgColor = componentStyle.backgroundColor.trim()
        let mutedHsl: string
        if (bgColor.startsWith('#')) {
          mutedHsl = hexToHsl(bgColor)
        } else if (bgColor.startsWith('rgb') || bgColor.startsWith('rgba')) {
          // Convert rgba/rgb to HSL
          const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            mutedHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            mutedHsl = bgColor
          }
        } else if (bgColor.includes('hsl')) {
          // Extract HSL values if already in HSL format
          const match = bgColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            mutedHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            mutedHsl = bgColor
          }
        } else {
          mutedHsl = bgColor
        }
        componentCSS += `      --muted: ${mutedHsl} !important;\n`
        componentCSS += `      --brand-vertical-tab-active-bg: ${componentStyle.backgroundColor.trim()} !important;\n`
        // Also directly override inline styles with !important
        componentCSS += `      background-color: ${componentStyle.backgroundColor.trim()} !important;\n`
      }
    }
    if (componentStyle.textColor && componentStyle.textColor.trim()) {
      componentCSS += `      color: ${componentStyle.textColor.trim()} !important;\n`
      // For button-destructive, override CSS variable used by Tailwind's text-destructive-foreground class
      // Also directly set color with !important to ensure it overrides Tailwind classes
      if (componentId === 'button-destructive') {
        const textColor = componentStyle.textColor.trim()
        // Directly set color with !important to override Tailwind's text-destructive-foreground class
        componentCSS += `      color: ${textColor} !important;\n`
        
        // Also override CSS variable for consistency
        let destructiveForegroundHsl: string
        if (textColor.startsWith('#')) {
          destructiveForegroundHsl = hexToHsl(textColor)
        } else if (textColor.startsWith('rgb') || textColor.startsWith('rgba')) {
          const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            destructiveForegroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            destructiveForegroundHsl = textColor
          }
        } else if (textColor.includes('hsl')) {
          const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            destructiveForegroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            destructiveForegroundHsl = textColor
          }
        } else {
          destructiveForegroundHsl = textColor
        }
        // Override Tailwind's --destructive-foreground CSS variable (used by text-destructive-foreground class)
        componentCSS += `      --destructive-foreground: ${destructiveForegroundHsl} !important;\n`
      }
      // For text-input, override Tailwind's text-foreground class
      if (componentId === 'text-input') {
        const textColor = componentStyle.textColor.trim()
        let foregroundHsl: string
        if (textColor.startsWith('#')) {
          foregroundHsl = hexToHsl(textColor)
        } else if (textColor.startsWith('rgb') || textColor.startsWith('rgba')) {
          const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            foregroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            foregroundHsl = textColor
          }
        } else if (textColor.includes('hsl')) {
          const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            foregroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            foregroundHsl = textColor
          }
        } else {
          foregroundHsl = textColor
        }
        // Override Tailwind's text-foreground class by setting CSS variable
        componentCSS += `      --foreground: ${foregroundHsl} !important;\n`
        // Also directly set color to ensure it overrides
        componentCSS += `      color: ${textColor} !important;\n`
      }
      // For vertical-tab-menu-active, also set CSS variable to override inline styles
      // The inline style may use CSS variables, so --foreground must be in HSL format
      if (componentId === 'vertical-tab-menu-active') {
        const textColor = componentStyle.textColor.trim()
        let foregroundHsl: string
        if (textColor.startsWith('#')) {
          foregroundHsl = hexToHsl(textColor)
        } else if (textColor.startsWith('rgb') || textColor.startsWith('rgba')) {
          const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            foregroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            foregroundHsl = textColor
          }
        } else if (textColor.includes('hsl')) {
          const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            foregroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            foregroundHsl = textColor
          }
        } else {
          foregroundHsl = textColor
        }
        componentCSS += `      --foreground: ${foregroundHsl} !important;\n`
        componentCSS += `      --brand-vertical-tab-active-text: ${componentStyle.textColor.trim()} !important;\n`
        // Also directly override inline styles with !important
        componentCSS += `      color: ${componentStyle.textColor.trim()} !important;\n`
      }
    }
    // Individual border sides (take precedence over general border properties)
    // When individual side colors are set, ensure corresponding widths and styles are also set
    if (componentStyle.borderTopColor && componentStyle.borderTopColor.trim()) {
      componentCSS += `      border-top-color: ${componentStyle.borderTopColor.trim()} !important;\n`
      // Ensure width is set for this side if not explicitly set
      if (componentStyle.borderTopWidth && componentStyle.borderTopWidth.trim()) {
        componentCSS += `      border-top-width: ${componentStyle.borderTopWidth.trim()} !important;\n`
      } else if (componentStyle.borderWidth && componentStyle.borderWidth.trim() && componentStyle.borderWidth.trim() !== '0px' && componentStyle.borderWidth.trim() !== '0') {
        componentCSS += `      border-top-width: ${componentStyle.borderWidth.trim()} !important;\n`
      } else {
        // Default to 1px if color is set but no width
        componentCSS += `      border-top-width: 1px !important;\n`
      }
      // Ensure style is set for this side if not explicitly set
      if (componentStyle.borderTopStyle && componentStyle.borderTopStyle.trim()) {
        componentCSS += `      border-top-style: ${componentStyle.borderTopStyle.trim()} !important;\n`
      } else if (componentStyle.borderStyle && componentStyle.borderStyle.trim()) {
        componentCSS += `      border-top-style: ${componentStyle.borderStyle.trim()} !important;\n`
      } else {
        componentCSS += `      border-top-style: solid !important;\n`
      }
    }
    if (componentStyle.borderRightColor && componentStyle.borderRightColor.trim()) {
      componentCSS += `      border-right-color: ${componentStyle.borderRightColor.trim()} !important;\n`
      // Ensure width is set for this side if not explicitly set
      if (componentStyle.borderRightWidth && componentStyle.borderRightWidth.trim()) {
        componentCSS += `      border-right-width: ${componentStyle.borderRightWidth.trim()} !important;\n`
      } else if (componentStyle.borderWidth && componentStyle.borderWidth.trim() && componentStyle.borderWidth.trim() !== '0px' && componentStyle.borderWidth.trim() !== '0') {
        componentCSS += `      border-right-width: ${componentStyle.borderWidth.trim()} !important;\n`
      } else {
        // Default to 1px if color is set but no width
        componentCSS += `      border-right-width: 1px !important;\n`
      }
      // Ensure style is set for this side if not explicitly set
      if (componentStyle.borderRightStyle && componentStyle.borderRightStyle.trim()) {
        componentCSS += `      border-right-style: ${componentStyle.borderRightStyle.trim()} !important;\n`
      } else if (componentStyle.borderStyle && componentStyle.borderStyle.trim()) {
        componentCSS += `      border-right-style: ${componentStyle.borderStyle.trim()} !important;\n`
      } else {
        componentCSS += `      border-right-style: solid !important;\n`
      }
    }
    if (componentStyle.borderBottomColor && componentStyle.borderBottomColor.trim()) {
      componentCSS += `      border-bottom-color: ${componentStyle.borderBottomColor.trim()} !important;\n`
      // Ensure width is set for this side if not explicitly set
      if (componentStyle.borderBottomWidth && componentStyle.borderBottomWidth.trim()) {
        componentCSS += `      border-bottom-width: ${componentStyle.borderBottomWidth.trim()} !important;\n`
      } else if (componentStyle.borderWidth && componentStyle.borderWidth.trim() && componentStyle.borderWidth.trim() !== '0px' && componentStyle.borderWidth.trim() !== '0') {
        componentCSS += `      border-bottom-width: ${componentStyle.borderWidth.trim()} !important;\n`
      } else {
        // Default to 1px if color is set but no width
        componentCSS += `      border-bottom-width: 1px !important;\n`
      }
      // Ensure style is set for this side if not explicitly set
      if (componentStyle.borderBottomStyle && componentStyle.borderBottomStyle.trim()) {
        componentCSS += `      border-bottom-style: ${componentStyle.borderBottomStyle.trim()} !important;\n`
      } else if (componentStyle.borderStyle && componentStyle.borderStyle.trim()) {
        componentCSS += `      border-bottom-style: ${componentStyle.borderStyle.trim()} !important;\n`
      } else {
        componentCSS += `      border-bottom-style: solid !important;\n`
      }
    }
    if (componentStyle.borderLeftColor && componentStyle.borderLeftColor.trim()) {
      componentCSS += `      border-left-color: ${componentStyle.borderLeftColor.trim()} !important;\n`
      // Ensure width is set for this side if not explicitly set
      if (componentStyle.borderLeftWidth && componentStyle.borderLeftWidth.trim()) {
        componentCSS += `      border-left-width: ${componentStyle.borderLeftWidth.trim()} !important;\n`
      } else if (componentStyle.borderWidth && componentStyle.borderWidth.trim() && componentStyle.borderWidth.trim() !== '0px' && componentStyle.borderWidth.trim() !== '0') {
        componentCSS += `      border-left-width: ${componentStyle.borderWidth.trim()} !important;\n`
      } else {
        // Default to 1px if color is set but no width
        componentCSS += `      border-left-width: 1px !important;\n`
      }
      // Ensure style is set for this side if not explicitly set
      if (componentStyle.borderLeftStyle && componentStyle.borderLeftStyle.trim()) {
        componentCSS += `      border-left-style: ${componentStyle.borderLeftStyle.trim()} !important;\n`
      } else if (componentStyle.borderStyle && componentStyle.borderStyle.trim()) {
        componentCSS += `      border-left-style: ${componentStyle.borderStyle.trim()} !important;\n`
      } else {
        componentCSS += `      border-left-style: solid !important;\n`
      }
    }
    // Apply individual side widths and styles even if colors aren't set (for cases where only width/style is set)
    if (componentStyle.borderTopWidth && componentStyle.borderTopWidth.trim() && !componentStyle.borderTopColor) {
      componentCSS += `      border-top-width: ${componentStyle.borderTopWidth.trim()} !important;\n`
    }
    if (componentStyle.borderRightWidth && componentStyle.borderRightWidth.trim() && !componentStyle.borderRightColor) {
      componentCSS += `      border-right-width: ${componentStyle.borderRightWidth.trim()} !important;\n`
    }
    if (componentStyle.borderBottomWidth && componentStyle.borderBottomWidth.trim() && !componentStyle.borderBottomColor) {
      componentCSS += `      border-bottom-width: ${componentStyle.borderBottomWidth.trim()} !important;\n`
    }
    if (componentStyle.borderLeftWidth && componentStyle.borderLeftWidth.trim() && !componentStyle.borderLeftColor) {
      componentCSS += `      border-left-width: ${componentStyle.borderLeftWidth.trim()} !important;\n`
    }
    if (componentStyle.borderTopStyle && componentStyle.borderTopStyle.trim() && !componentStyle.borderTopColor) {
      componentCSS += `      border-top-style: ${componentStyle.borderTopStyle.trim()} !important;\n`
    }
    if (componentStyle.borderRightStyle && componentStyle.borderRightStyle.trim() && !componentStyle.borderRightColor) {
      componentCSS += `      border-right-style: ${componentStyle.borderRightStyle.trim()} !important;\n`
    }
    if (componentStyle.borderBottomStyle && componentStyle.borderBottomStyle.trim() && !componentStyle.borderBottomColor) {
      componentCSS += `      border-bottom-style: ${componentStyle.borderBottomStyle.trim()} !important;\n`
    }
    if (componentStyle.borderLeftStyle && componentStyle.borderLeftStyle.trim() && !componentStyle.borderLeftColor) {
      componentCSS += `      border-left-style: ${componentStyle.borderLeftStyle.trim()} !important;\n`
    }
    
    // General border properties (applied if individual sides are not specified)
    if (componentStyle.borderColor && componentStyle.borderColor.trim()) {
      componentCSS += `      border-color: ${componentStyle.borderColor.trim()} !important;\n`
      // Ensure width is set if borderColor is set but borderWidth is not explicitly set
      if (!componentStyle.borderWidth || !componentStyle.borderWidth.trim() || componentStyle.borderWidth.trim() === '0px' || componentStyle.borderWidth.trim() === '0') {
        // Check if any individual side widths are set
        const hasIndividualWidths = (componentStyle.borderTopWidth && componentStyle.borderTopWidth.trim()) ||
                                    (componentStyle.borderRightWidth && componentStyle.borderRightWidth.trim()) ||
                                    (componentStyle.borderBottomWidth && componentStyle.borderBottomWidth.trim()) ||
                                    (componentStyle.borderLeftWidth && componentStyle.borderLeftWidth.trim())
        if (!hasIndividualWidths) {
          // Default to 1px if color is set but no width
          componentCSS += `      border-width: 1px !important;\n`
        }
      }
      // Ensure style is set if borderColor is set but borderStyle is not explicitly set
      if (!componentStyle.borderStyle || !componentStyle.borderStyle.trim()) {
        // Check if any individual side styles are set
        const hasIndividualStyles = (componentStyle.borderTopStyle && componentStyle.borderTopStyle.trim()) ||
                                   (componentStyle.borderRightStyle && componentStyle.borderRightStyle.trim()) ||
                                   (componentStyle.borderBottomStyle && componentStyle.borderBottomStyle.trim()) ||
                                   (componentStyle.borderLeftStyle && componentStyle.borderLeftStyle.trim())
        if (!hasIndividualStyles) {
          componentCSS += `      border-style: solid !important;\n`
        }
      }
    }
    if (componentStyle.borderRadius && componentStyle.borderRadius.trim()) {
      componentCSS += `      border-radius: ${componentStyle.borderRadius.trim()} !important;\n`
      // For platform-sidebar-menu, aggressively override button border-radius
      if (componentId.startsWith('platform-sidebar-menu')) {
      componentCSS += `      border-radius: ${componentStyle.borderRadius.trim()} !important;\n`
      }
    }
    if (componentStyle.borderWidth && componentStyle.borderWidth.trim()) {
      const borderWidth = componentStyle.borderWidth.trim()
      componentCSS += `      border-width: ${borderWidth} !important;\n`
      // If border width is 0, set border-style to none and remove all borders
      if (borderWidth === '0px' || borderWidth === '0') {
        componentCSS += `      border-style: none !important;\n`
        componentCSS += `      border: none !important;\n`
        componentCSS += `      border-right: none !important;\n`
        componentCSS += `      border-left: none !important;\n`
        componentCSS += `      border-top: none !important;\n`
        componentCSS += `      border-bottom: none !important;\n`
      } else if (componentStyle.borderStyle && componentStyle.borderStyle.trim()) {
        // Use custom border style if provided
        componentCSS += `      border-style: ${componentStyle.borderStyle.trim()} !important;\n`
      } else {
        // Default to solid if border width is set but no style specified
        componentCSS += `      border-style: solid !important;\n`
      }
    } else if (componentStyle.borderStyle && componentStyle.borderStyle.trim()) {
      // Apply border style even if width is not set (for outline effects)
      componentCSS += `      border-style: ${componentStyle.borderStyle.trim()} !important;\n`
    }
    if (componentStyle.padding && componentStyle.padding.trim()) {
      componentCSS += `      padding: ${componentStyle.padding.trim()} !important;\n`
      // For platform-sidebar-menu, aggressively override button padding
      if (componentId.startsWith('platform-sidebar-menu')) {
      componentCSS += `      padding: ${componentStyle.padding.trim()} !important;\n`
      }
    }
    if (componentStyle.margin && componentStyle.margin.trim()) {
      componentCSS += `      margin: ${componentStyle.margin.trim()} !important;\n`
    }
    // Support marginTop and marginBottom for separator component
    if ((componentStyle as any).marginTop && (componentStyle as any).marginTop.trim()) {
      componentCSS += `      margin-top: ${(componentStyle as any).marginTop.trim()} !important;\n`
    }
    if ((componentStyle as any).marginBottom && (componentStyle as any).marginBottom.trim()) {
      componentCSS += `      margin-bottom: ${(componentStyle as any).marginBottom.trim()} !important;\n`
    }
    if (componentStyle.width && componentStyle.width.trim()) {
      componentCSS += `      width: ${componentStyle.width.trim()} !important;\n`
    }
    if (componentStyle.height && componentStyle.height.trim()) {
      componentCSS += `      height: ${componentStyle.height.trim()} !important;\n`
    }
    if (componentStyle.minWidth && componentStyle.minWidth.trim()) {
      componentCSS += `      min-width: ${componentStyle.minWidth.trim()} !important;\n`
    }
    if (componentStyle.maxWidth && componentStyle.maxWidth.trim()) {
      componentCSS += `      max-width: ${componentStyle.maxWidth.trim()} !important;\n`
    }
    if (componentStyle.minHeight && componentStyle.minHeight.trim()) {
      componentCSS += `      min-height: ${componentStyle.minHeight.trim()} !important;\n`
    }
    if (componentStyle.maxHeight && componentStyle.maxHeight.trim()) {
      componentCSS += `      max-height: ${componentStyle.maxHeight.trim()} !important;\n`
    }
    if (componentStyle.fontSize && componentStyle.fontSize.trim()) {
      componentCSS += `      font-size: ${componentStyle.fontSize.trim()} !important;\n`
    }
    if (componentStyle.fontWeight && componentStyle.fontWeight.trim()) {
      componentCSS += `      font-weight: ${componentStyle.fontWeight.trim()} !important;\n`
    }
    if (componentStyle.fontStyle && componentStyle.fontStyle.trim()) {
      componentCSS += `      font-style: ${componentStyle.fontStyle.trim()} !important;\n`
    }
    if (componentStyle.fontFamily && componentStyle.fontFamily.trim()) {
      componentCSS += `      font-family: ${componentStyle.fontFamily.trim()} !important;\n`
    }
    if (componentStyle.letterSpacing && componentStyle.letterSpacing.trim()) {
      componentCSS += `      letter-spacing: ${componentStyle.letterSpacing.trim()} !important;\n`
    }
    if (componentStyle.lineHeight && componentStyle.lineHeight.trim()) {
      componentCSS += `      line-height: ${componentStyle.lineHeight.trim()} !important;\n`
    }
    if (componentStyle.textAlign && componentStyle.textAlign.trim()) {
      componentCSS += `      text-align: ${componentStyle.textAlign.trim()} !important;\n`
    }
    if (componentStyle.textTransform && componentStyle.textTransform.trim()) {
      componentCSS += `      text-transform: ${componentStyle.textTransform.trim()} !important;\n`
    }
    if (componentStyle.textDecoration && componentStyle.textDecoration.trim()) {
      componentCSS += `      text-decoration: ${componentStyle.textDecoration.trim()} !important;\n`
    }
    if (componentStyle.textDecorationColor && componentStyle.textDecorationColor.trim()) {
      componentCSS += `      text-decoration-color: ${componentStyle.textDecorationColor.trim()} !important;\n`
    }
    if (componentStyle.textDecorationThickness && componentStyle.textDecorationThickness.trim()) {
      componentCSS += `      text-decoration-thickness: ${componentStyle.textDecorationThickness.trim()} !important;\n`
    }
    if (componentStyle.textDecorationStyle && componentStyle.textDecorationStyle.trim()) {
      componentCSS += `      text-decoration-style: ${componentStyle.textDecorationStyle.trim()} !important;\n`
    }
    if (componentStyle.textUnderlineOffset && componentStyle.textUnderlineOffset.trim()) {
      componentCSS += `      text-underline-offset: ${componentStyle.textUnderlineOffset.trim()} !important;\n`
    }
    if (componentStyle.textUnderlinePosition && componentStyle.textUnderlinePosition.trim()) {
      componentCSS += `      text-underline-position: ${componentStyle.textUnderlinePosition.trim()} !important;\n`
    }
    if (componentStyle.opacity && componentStyle.opacity.trim()) {
      componentCSS += `      opacity: ${componentStyle.opacity.trim()} !important;\n`
    }
    if (componentStyle.gap && componentStyle.gap.trim()) {
      componentCSS += `      gap: ${componentStyle.gap.trim()} !important;\n`
    }
    if (componentStyle.zIndex && componentStyle.zIndex.trim()) {
      componentCSS += `      z-index: ${componentStyle.zIndex.trim()} !important;\n`
    }
    if (componentStyle.cursor && componentStyle.cursor.trim()) {
      componentCSS += `      cursor: ${componentStyle.cursor.trim()} !important;\n`
    }
    if (componentStyle.transform && componentStyle.transform.trim()) {
      componentCSS += `      transform: ${componentStyle.transform.trim()} !important;\n`
    }
    if (componentStyle.filter && componentStyle.filter.trim()) {
      componentCSS += `      filter: ${componentStyle.filter.trim()} !important;\n`
    }
    if (componentStyle.outline && componentStyle.outline.trim()) {
      componentCSS += `      outline: ${componentStyle.outline.trim()} !important;\n`
    }
    if (componentStyle.outlineColor && componentStyle.outlineColor.trim()) {
      componentCSS += `      outline-color: ${componentStyle.outlineColor.trim()} !important;\n`
    }
    if (componentStyle.outlineWidth && componentStyle.outlineWidth.trim()) {
      componentCSS += `      outline-width: ${componentStyle.outlineWidth.trim()} !important;\n`
    }
    if (componentStyle.overflow && componentStyle.overflow.trim()) {
      componentCSS += `      overflow: ${componentStyle.overflow.trim()} !important;\n`
    }
    if (componentStyle.overflowX && componentStyle.overflowX.trim()) {
      componentCSS += `      overflow-x: ${componentStyle.overflowX.trim()} !important;\n`
    }
    if (componentStyle.overflowY && componentStyle.overflowY.trim()) {
      componentCSS += `      overflow-y: ${componentStyle.overflowY.trim()} !important;\n`
    }
    if (componentStyle.whiteSpace && componentStyle.whiteSpace.trim()) {
      componentCSS += `      white-space: ${componentStyle.whiteSpace.trim()} !important;\n`
    }
    if (componentStyle.wordBreak && componentStyle.wordBreak.trim()) {
      componentCSS += `      word-break: ${componentStyle.wordBreak.trim()} !important;\n`
    }
    if (componentStyle.textOverflow && componentStyle.textOverflow.trim()) {
      componentCSS += `      text-overflow: ${componentStyle.textOverflow.trim()} !important;\n`
    }
    if (componentStyle.visibility && componentStyle.visibility.trim()) {
      componentCSS += `      visibility: ${componentStyle.visibility.trim()} !important;\n`
    }
    if (componentStyle.pointerEvents && componentStyle.pointerEvents.trim()) {
      componentCSS += `      pointer-events: ${componentStyle.pointerEvents.trim()} !important;\n`
    }
    if (componentStyle.userSelect && componentStyle.userSelect.trim()) {
      componentCSS += `      user-select: ${componentStyle.userSelect.trim()} !important;\n`
      componentCSS += `      -webkit-user-select: ${componentStyle.userSelect.trim()} !important;\n`
      componentCSS += `      -moz-user-select: ${componentStyle.userSelect.trim()} !important;\n`
      componentCSS += `      -ms-user-select: ${componentStyle.userSelect.trim()} !important;\n`
    }
    if (componentStyle.backdropFilter && componentStyle.backdropFilter.trim()) {
      componentCSS += `      backdrop-filter: ${componentStyle.backdropFilter.trim()} !important;\n`
      componentCSS += `      -webkit-backdrop-filter: ${componentStyle.backdropFilter.trim()} !important;\n`
    }
    if (componentStyle.boxShadow !== undefined) {
      if (componentStyle.boxShadow && componentStyle.boxShadow.trim() && componentStyle.boxShadow.trim() !== 'none') {
        componentCSS += `      box-shadow: ${componentStyle.boxShadow.trim()} !important;\n`
      } else {
        componentCSS += `      box-shadow: none !important;\n`
      }
    }
    if (componentStyle.transition && componentStyle.transition.trim()) {
      componentCSS += `      transition: ${componentStyle.transition.trim()} !important;\n`
    } else {
      // Apply default smooth transitions for micro-interactions
      componentCSS += `      transition: all var(--brand-transition-duration, 200ms) var(--brand-transition-timing, cubic-bezier(0.4, 0, 0.2, 1)) !important;\n`
    }

    componentCSS += `    }\n\n`
    cssRules += componentCSS
    
    // For button-destructive, add additional high-specificity rules to ensure it overrides everything
    if (componentId === 'button-destructive') {
      const bgColor = componentStyle.backgroundColor?.trim()
      const textColor = componentStyle.textColor?.trim()
      
      if (bgColor || textColor) {
        cssRules += `    /* High-specificity override for destructive buttons */\n`
        cssRules += `    body button.bg-destructive,\n`
        cssRules += `    body button[class*="bg-destructive"],\n`
        cssRules += `    body button[class*="destructive"]:not([class*="text-destructive"]):not([class*="hover:text-destructive"]) {\n`
        if (bgColor) {
          cssRules += `      background: ${bgColor} !important;\n`
          cssRules += `      background-color: ${bgColor} !important;\n`
          cssRules += `      --destructive: ${hexToHsl(bgColor)} !important;\n`
        }
        if (textColor) {
          cssRules += `      color: ${textColor} !important;\n`
          cssRules += `      --destructive-foreground: ${hexToHsl(textColor)} !important;\n`
        }
        cssRules += `    }\n\n`
        
        // Also handle hover state
        cssRules += `    body button.bg-destructive:hover,\n`
        cssRules += `    body button[class*="bg-destructive"]:hover,\n`
        cssRules += `    body button[class*="destructive"]:hover:not([class*="text-destructive"]) {\n`
        if (bgColor) {
          // Create a slightly darker version for hover (90% opacity equivalent)
          cssRules += `      background-color: ${bgColor} !important;\n`
          cssRules += `      opacity: 0.9 !important;\n`
        }
        cssRules += `    }\n\n`
      }
    }
    
    // For platform-sidebar-primary, always set CSS variables and apply styles directly
    // This ensures the inline style backgroundColor uses the theme color
    // Use main branding config colors if component styling doesn't have them
    if (componentId === 'platform-sidebar-primary') {
      cssRules += `    /* Override CSS variable and apply styles directly for platform sidebar primary */\n`
      cssRules += `    body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"],\n`
      cssRules += `    body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].h-full,\n`
      cssRules += `    body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].flex,\n`
      cssRules += `    body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].flex-col {\n`
      const bgColor = componentStyle.backgroundColor?.trim() || branding.platformSidebarBackgroundColor
      const textColor = componentStyle.textColor?.trim() || branding.platformSidebarTextColor
      if (bgColor) {
        cssRules += `      --brand-platform-sidebar-bg: ${bgColor} !important;\n`
        // Also set directly to override inline style
        cssRules += `      background-color: ${bgColor} !important;\n`
      }
      if (textColor) {
        cssRules += `      --brand-platform-sidebar-text: ${textColor} !important;\n`
        // Also set directly to override inline style
        cssRules += `      color: ${textColor} !important;\n`
      }
      cssRules += `    }\n\n`
    }
    
    // For platform-sidebar-secondary, always set CSS variables and apply styles directly
    // This ensures the inline style backgroundColor uses the theme color
    // Use main branding config colors if component styling doesn't have them
    if (componentId === 'platform-sidebar-secondary') {
      cssRules += `    /* Override CSS variable and apply styles directly for platform sidebar secondary */\n`
      cssRules += `    body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"],\n`
      cssRules += `    body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].h-full,\n`
      cssRules += `    body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].flex,\n`
      cssRules += `    body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].flex-col {\n`
      const bgColor = componentStyle.backgroundColor?.trim() || branding.secondarySidebarBackgroundColor
      const textColor = componentStyle.textColor?.trim() || branding.secondarySidebarTextColor
      if (bgColor) {
        cssRules += `      --brand-secondary-sidebar-bg: ${bgColor} !important;\n`
        // Also set directly to override inline style
        cssRules += `      background-color: ${bgColor} !important;\n`
      }
      if (textColor) {
        cssRules += `      --brand-secondary-sidebar-text: ${textColor} !important;\n`
        // Also set directly to override inline style
        cssRules += `      color: ${textColor} !important;\n`
      }
      cssRules += `    }\n\n`
    }
    
    // For platform-sidebar-menu components, add aggressive overrides to ensure button styles don't interfere
    if (componentId.startsWith('platform-sidebar-menu')) {
      cssRules += `    /* Aggressive override for platform-sidebar-menu to prevent button styles from interfering */\n`
      cssRules += `    body:not([data-space]) button.platform-sidebar-menu-button,\n`
      cssRules += `    body:not([data-space]) .platform-sidebar-menu-button,\n`
      cssRules += `    body:not([data-space]) [data-sidebar] button.platform-sidebar-menu-button,\n`
      cssRules += `    body:not([data-space]) [data-component="platform-sidebar"] button.platform-sidebar-menu-button {\n`
      // Reset all button-specific styles that might interfere
      if (componentStyle.borderRadius) {
        cssRules += `      border-radius: ${componentStyle.borderRadius.trim()} !important;\n`
      }
      if (componentStyle.padding) {
        cssRules += `      padding: ${componentStyle.padding.trim()} !important;\n`
      }
      if (componentStyle.backgroundColor) {
        cssRules += `      background: ${componentStyle.backgroundColor.trim()} !important;\n`
        cssRules += `      background-color: ${componentStyle.backgroundColor.trim()} !important;\n`
      }
      if (componentStyle.textColor) {
        cssRules += `      color: ${componentStyle.textColor.trim()} !important;\n`
      }
      if (componentStyle.fontSize) {
        cssRules += `      font-size: ${componentStyle.fontSize.trim()} !important;\n`
      }
      if (componentStyle.fontWeight) {
        cssRules += `      font-weight: ${componentStyle.fontWeight.trim()} !important;\n`
      }
      if (componentStyle.borderWidth) {
        cssRules += `      border-width: ${componentStyle.borderWidth.trim()} !important;\n`
        if (componentStyle.borderWidth.trim() === '0px' || componentStyle.borderWidth.trim() === '0') {
          cssRules += `      border: none !important;\n`
        }
      }
      if (componentStyle.boxShadow !== undefined) {
        if (componentStyle.boxShadow && componentStyle.boxShadow.trim()) {
          cssRules += `      box-shadow: ${componentStyle.boxShadow.trim()} !important;\n`
        } else {
          cssRules += `      box-shadow: none !important;\n`
        }
      }
      cssRules += `    }\n\n`
      
      // Special handling for active state - override Tailwind's !bg-muted and !text-foreground
      if (componentId === 'platform-sidebar-menu-active') {
        cssRules += `    /* Override Tailwind classes for active state - PRIMARY AND SECONDARY SIDEBARS */\n`
        cssRules += `    body:not([data-space]) button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) button.platform-sidebar-menu-button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) .platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) .platform-sidebar-menu-button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) [data-sidebar="primary"] button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) [data-sidebar="primary"] button.platform-sidebar-menu-button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) [data-sidebar="secondary"] button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) [data-sidebar="secondary"] button.platform-sidebar-menu-button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"] button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="primary"] button.platform-sidebar-menu-button-active,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] button.platform-sidebar-menu-button-active {\n`
        if (componentStyle.backgroundColor) {
          const bgColor = componentStyle.backgroundColor.trim()
          cssRules += `      background: ${bgColor} !important;\n`
          cssRules += `      background-color: ${bgColor} !important;\n`
          cssRules += `      background-image: none !important;\n`
          // Override Tailwind's bg-muted class by converting color to HSL format
          let mutedHsl: string
          if (bgColor.startsWith('#')) {
            mutedHsl = hexToHsl(bgColor)
          } else if (bgColor.startsWith('rgba') || bgColor.startsWith('rgb')) {
            // Convert rgba/rgb to HSL
            const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
            if (match) {
              const r = parseInt(match[1]) / 255
              const g = parseInt(match[2]) / 255
              const b = parseInt(match[3]) / 255
              const max = Math.max(r, g, b)
              const min = Math.min(r, g, b)
              let h = 0
              let s = 0
              const l = (max + min) / 2
              if (max !== min) {
                const d = max - min
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
                switch (max) {
                  case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                  case g: h = ((b - r) / d + 2) / 6; break
                  case b: h = ((r - g) / d + 4) / 6; break
                }
              }
              mutedHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
            } else {
              mutedHsl = bgColor
            }
          } else if (bgColor.includes('hsl')) {
            const match = bgColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
            if (match) {
              mutedHsl = `${match[1]} ${match[2]}% ${match[3]}%`
            } else {
              mutedHsl = bgColor
            }
          } else {
            mutedHsl = bgColor
          }
          cssRules += `      --muted: ${mutedHsl} !important;\n`
        }
        if (componentStyle.textColor) {
          const textColor = componentStyle.textColor.trim()
          cssRules += `      color: ${textColor} !important;\n`
          // Override Tailwind's text-foreground class by converting color to HSL format
          let foregroundHsl: string
          if (textColor.startsWith('#')) {
            foregroundHsl = hexToHsl(textColor)
          } else if (textColor.startsWith('rgba') || textColor.startsWith('rgb')) {
            const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
            if (match) {
              const r = parseInt(match[1]) / 255
              const g = parseInt(match[2]) / 255
              const b = parseInt(match[3]) / 255
              const max = Math.max(r, g, b)
              const min = Math.min(r, g, b)
              let h = 0
              let s = 0
              const l = (max + min) / 2
              if (max !== min) {
                const d = max - min
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
                switch (max) {
                  case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                  case g: h = ((b - r) / d + 2) / 6; break
                  case b: h = ((r - g) / d + 4) / 6; break
                }
              }
              foregroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
            } else {
              foregroundHsl = textColor
            }
          } else if (textColor.includes('hsl')) {
            const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
            if (match) {
              foregroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
            } else {
              foregroundHsl = textColor
            }
          } else {
            foregroundHsl = textColor
          }
          cssRules += `      --foreground: ${foregroundHsl} !important;\n`
        }
        if (componentStyle.borderRadius) {
          cssRules += `      border-radius: ${componentStyle.borderRadius.trim()} !important;\n`
        }
        if (componentStyle.fontWeight) {
          cssRules += `      font-weight: ${componentStyle.fontWeight.trim()} !important;\n`
        }
        if (componentStyle.boxShadow && componentStyle.boxShadow.trim()) {
          cssRules += `      box-shadow: ${componentStyle.boxShadow.trim()} !important;\n`
        }
        cssRules += `    }\n\n`
      }
    }
    
    // Special handling for text-input to override Tailwind classes and globals.css
    // This must come AFTER the main component CSS to ensure it overrides globals.css
    if (componentId === 'text-input') {
      cssRules += `    /* Aggressive override for text-input to override Tailwind classes and globals.css */\n`
      cssRules += `    /* This rule has higher specificity and comes after globals.css */\n`
      cssRules += `    /* Target all text input types including number inputs */\n`
      cssRules += `    body:not([data-space]) input:not([type]),\n`
      cssRules += `    body:not([data-space]) input[type="text"],\n`
      cssRules += `    body:not([data-space]) input[type="email"],\n`
      cssRules += `    body:not([data-space]) input[type="password"],\n`
      cssRules += `    body:not([data-space]) input[type="number"],\n`
      cssRules += `    body:not([data-space]) input[type="search"],\n`
      cssRules += `    body:not([data-space]) input[type="tel"],\n`
      cssRules += `    body:not([data-space]) input[type="url"],\n`
      cssRules += `    body:not([data-space]) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]),\n`
      cssRules += `    body:not([data-space]) [data-component="input"],\n`
      cssRules += `    body:not([data-space]) [data-component="input"] input,\n`
      cssRules += `    body:not([data-space]) [class*="Input"],\n`
      cssRules += `    body:not([data-space]) [class*="Input"] input,\n`
      cssRules += `    body:not([data-space]) input[class*="input"],\n`
      cssRules += `    body:not([data-space]) input[class*="Input"],\n`
      cssRules += `    body:not([data-space]) input.text-foreground,\n`
      cssRules += `    body:not([data-space]) input.bg-border,\n`
      cssRules += `    body:not([data-space]) input.bg-input,\n`
      cssRules += `    body:not([data-space]) input[class*="bg-border"],\n`
      cssRules += `    body:not([data-space]) input[class*="text-foreground"],\n`
      cssRules += `    body:not([data-space]) input[class*="bg-input"] {\n`
      if (componentStyle.backgroundColor) {
        const bgColor = componentStyle.backgroundColor.trim()
        cssRules += `      background: ${bgColor} !important;\n`
        cssRules += `      background-color: ${bgColor} !important;\n`
        cssRules += `      background-image: none !important;\n`
        // Override Tailwind's bg-border CSS variable
        let borderHsl: string
        if (bgColor.startsWith('#')) {
          borderHsl = hexToHsl(bgColor)
        } else if (bgColor.startsWith('rgb') || bgColor.startsWith('rgba')) {
          const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            borderHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            borderHsl = bgColor
          }
        } else if (bgColor.includes('hsl')) {
          const match = bgColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            borderHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            borderHsl = bgColor
          }
        } else {
          borderHsl = bgColor
        }
        cssRules += `      --border: ${borderHsl} !important;\n`
        cssRules += `      --input: ${borderHsl} !important;\n`
      }
      if (componentStyle.textColor) {
        const textColor = componentStyle.textColor.trim()
        cssRules += `      color: ${textColor} !important;\n`
        // Override Tailwind's text-foreground class by setting CSS variable
        let foregroundHsl: string
        if (textColor.startsWith('#')) {
          foregroundHsl = hexToHsl(textColor)
        } else if (textColor.startsWith('rgb') || textColor.startsWith('rgba')) {
          const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            foregroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            foregroundHsl = textColor
          }
        } else if (textColor.includes('hsl')) {
          const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            foregroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            foregroundHsl = textColor
          }
        } else {
          foregroundHsl = textColor
        }
        cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      }
      if (componentStyle.borderColor) {
        cssRules += `      border-color: ${componentStyle.borderColor.trim()} !important;\n`
      }
      if (componentStyle.borderWidth) {
        cssRules += `      border-width: ${componentStyle.borderWidth.trim()} !important;\n`
        if (componentStyle.borderWidth.trim() === '0px' || componentStyle.borderWidth.trim() === '0') {
          cssRules += `      border: none !important;\n`
        }
      }
      if (componentStyle.borderRadius) {
        cssRules += `      border-radius: ${componentStyle.borderRadius.trim()} !important;\n`
      }
      if (componentStyle.padding) {
        cssRules += `      padding: ${componentStyle.padding.trim()} !important;\n`
      }
      if (componentStyle.fontSize) {
        cssRules += `      font-size: ${componentStyle.fontSize.trim()} !important;\n`
      }
      cssRules += `    }\n\n`
      
      // Additional override specifically for Input component with Tailwind classes
      cssRules += `    /* Override Input component with Tailwind classes - including number inputs */\n`
      cssRules += `    body:not([data-space]) input:not([type]).text-foreground,\n`
      cssRules += `    body:not([data-space]) input:not([type]).bg-border,\n`
      cssRules += `    body:not([data-space]) input[type="text"].text-foreground,\n`
      cssRules += `    body:not([data-space]) input[type="text"].bg-border,\n`
      cssRules += `    body:not([data-space]) input[type="number"].text-foreground,\n`
      cssRules += `    body:not([data-space]) input[type="number"].bg-border,\n`
      cssRules += `    body:not([data-space]) input[type="email"].text-foreground,\n`
      cssRules += `    body:not([data-space]) input[type="email"].bg-border,\n`
      cssRules += `    body:not([data-space]) input[type="password"].text-foreground,\n`
      cssRules += `    body:not([data-space]) input[type="password"].bg-border,\n`
      cssRules += `    body:not([data-space]) input.text-foreground,\n`
      cssRules += `    body:not([data-space]) input.bg-border,\n`
      cssRules += `    body:not([data-space]) input.bg-input,\n`
      cssRules += `    body:not([data-space]) input[class*="text-foreground"],\n`
      cssRules += `    body:not([data-space]) input[class*="bg-border"],\n`
      cssRules += `    body:not([data-space]) input[class*="bg-input"] {\n`
      if (componentStyle.backgroundColor) {
        const bgColor = componentStyle.backgroundColor.trim()
        cssRules += `      background: ${bgColor} !important;\n`
        cssRules += `      background-color: ${bgColor} !important;\n`
        cssRules += `      background-image: none !important;\n`
      }
      if (componentStyle.textColor) {
        const textColor = componentStyle.textColor.trim()
        cssRules += `      color: ${textColor} !important;\n`
        // Convert to HSL for --foreground
        let foregroundHsl: string
        if (textColor.startsWith('#')) {
          foregroundHsl = hexToHsl(textColor)
        } else if (textColor.startsWith('rgb') || textColor.startsWith('rgba')) {
          const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            foregroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          } else {
            foregroundHsl = textColor
          }
        } else if (textColor.includes('hsl')) {
          const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            foregroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
          } else {
            foregroundHsl = textColor
          }
        } else {
          foregroundHsl = textColor
        }
        cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      }
      cssRules += `    }\n\n`
    }
  })
  
  // Final aggressive override for text-input - must come after all component CSS to override globals.css
  // This uses maximum specificity to override globals.css rule: input:not([type="checkbox"])... { background-color: hsl(var(--border)) !important; }
  const textInputStyle = branding.componentStyling?.['text-input']
  if (textInputStyle) {
    console.log('[Branding] Final override for text-input:', textInputStyle)
    cssRules += `    /* Final override for text-input - MAXIMUM specificity to override globals.css */\n`
    cssRules += `    /* This must override: input:not([type="checkbox"])... { background-color: hsl(var(--border)) !important; } */\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input:not([type]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]):not([type="hidden"]),\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="text"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]):not([type="hidden"]),\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="email"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]):not([type="hidden"]),\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="password"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]):not([type="hidden"]),\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="number"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]):not([type="hidden"]),\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="search"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]):not([type="hidden"]),\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="tel"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]):not([type="hidden"]),\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="url"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="color"]):not([type="hidden"]),\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input:not([type]).text-foreground,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input:not([type]).bg-border,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="text"].text-foreground,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="text"].bg-border,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="number"].text-foreground,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[type="number"].bg-border,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input.text-foreground,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input.bg-border,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) [data-component="input"] input,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) input[class*="Input"] {\n`
    if (textInputStyle.backgroundColor) {
      const bgColor = textInputStyle.backgroundColor.trim()
      cssRules += `      background: ${bgColor} !important;\n`
      cssRules += `      background-color: ${bgColor} !important;\n`
      cssRules += `      background-image: none !important;\n`
      // Override both --border and --input CSS variables (used by bg-border and bg-input classes)
      let borderHsl: string
      if (bgColor.startsWith('#')) {
        borderHsl = hexToHsl(bgColor)
      } else if (bgColor.startsWith('rgb') || bgColor.startsWith('rgba')) {
        const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
        if (match) {
          const r = parseInt(match[1]) / 255
          const g = parseInt(match[2]) / 255
          const b = parseInt(match[3]) / 255
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          let h = 0
          let s = 0
          const l = (max + min) / 2
          if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
              case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
              case g: h = ((b - r) / d + 2) / 6; break
              case b: h = ((r - g) / d + 4) / 6; break
            }
          }
          borderHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
        } else {
          borderHsl = bgColor
        }
      } else if (bgColor.includes('hsl')) {
        const match = bgColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
        if (match) {
          borderHsl = `${match[1]} ${match[2]}% ${match[3]}%`
        } else {
          borderHsl = bgColor
        }
      } else {
        borderHsl = bgColor
      }
      cssRules += `      --border: ${borderHsl} !important;\n`
      cssRules += `      --input: ${borderHsl} !important;\n`
      console.log('[Branding] Setting text-input background:', bgColor, 'HSL:', borderHsl)
    }
    if (textInputStyle.textColor) {
      const textColor = textInputStyle.textColor.trim()
      cssRules += `      color: ${textColor} !important;\n`
      // Also override CSS variable
      let foregroundHsl: string
      if (textColor.startsWith('#')) {
        foregroundHsl = hexToHsl(textColor)
      } else if (textColor.startsWith('rgb') || textColor.startsWith('rgba')) {
        const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
        if (match) {
          const r = parseInt(match[1]) / 255
          const g = parseInt(match[2]) / 255
          const b = parseInt(match[3]) / 255
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          let h = 0
          let s = 0
          const l = (max + min) / 2
          if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
              case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
              case g: h = ((b - r) / d + 2) / 6; break
              case b: h = ((r - g) / d + 4) / 6; break
            }
          }
          foregroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
        } else {
          foregroundHsl = textColor
        }
      } else if (textColor.includes('hsl')) {
        const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
        if (match) {
          foregroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
        } else {
          foregroundHsl = textColor
        }
      } else {
        foregroundHsl = textColor
      }
      cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      console.log('[Branding] Setting text-input text color:', textColor, 'HSL:', foregroundHsl)
    }
    if (textInputStyle.borderColor) {
      cssRules += `      border-color: ${textInputStyle.borderColor.trim()} !important;\n`
    }
    if (textInputStyle.borderWidth) {
      cssRules += `      border-width: ${textInputStyle.borderWidth.trim()} !important;\n`
    }
    if (textInputStyle.borderRadius) {
      cssRules += `      border-radius: ${textInputStyle.borderRadius.trim()} !important;\n`
    }
    cssRules += `    }\n\n`
    
    // ULTIMATE OVERRIDE - Target ALL inputs with maximum specificity
    cssRules += `    /* ULTIMATE OVERRIDE - Maximum specificity for text inputs */\n`
    cssRules += `    body:not([data-space]) input:not([type]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]),\n`
    cssRules += `    body:not([data-space]) input[type="text"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]),\n`
    cssRules += `    body:not([data-space]) input[type="email"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]),\n`
    cssRules += `    body:not([data-space]) input[type="password"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]),\n`
    cssRules += `    body:not([data-space]) input[type="number"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]),\n`
    cssRules += `    body:not([data-space]) input[type="search"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]),\n`
    cssRules += `    body:not([data-space]) input[type="tel"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]),\n`
    cssRules += `    body:not([data-space]) input[type="url"]:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]),\n`
    cssRules += `    body:not([data-space]) input:not([type]).bg-border,\n`
    cssRules += `    body:not([data-space]) input:not([type]).text-foreground,\n`
    cssRules += `    body:not([data-space]) input[type="text"].bg-border,\n`
    cssRules += `    body:not([data-space]) input[type="text"].text-foreground,\n`
    cssRules += `    body:not([data-space]) input[type="number"].bg-border,\n`
    cssRules += `    body:not([data-space]) input[type="number"].text-foreground,\n`
    cssRules += `    body:not([data-space]) input:not([type])[class*="bg-border"],\n`
    cssRules += `    body:not([data-space]) input:not([type])[class*="text-foreground"],\n`
    cssRules += `    body:not([data-space]) input[type="text"][class*="bg-border"],\n`
    cssRules += `    body:not([data-space]) input[type="text"][class*="text-foreground"],\n`
    cssRules += `    body:not([data-space]) input[type="number"][class*="bg-border"],\n`
    cssRules += `    body:not([data-space]) input[type="number"][class*="text-foreground"] {\n`
    if (textInputStyle.backgroundColor) {
      const bgColor = textInputStyle.backgroundColor.trim()
      cssRules += `      background: ${bgColor} !important;\n`
      cssRules += `      background-color: ${bgColor} !important;\n`
      cssRules += `      background-image: none !important;\n`
    }
    if (textInputStyle.textColor) {
      const textColor = textInputStyle.textColor.trim()
      cssRules += `      color: ${textColor} !important;\n`
      // Convert to HSL for --foreground
      let foregroundHsl: string
      if (textColor.startsWith('#')) {
        foregroundHsl = hexToHsl(textColor)
      } else if (textColor.startsWith('rgb') || textColor.startsWith('rgba')) {
        const match = textColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
        if (match) {
          const r = parseInt(match[1]) / 255
          const g = parseInt(match[2]) / 255
          const b = parseInt(match[3]) / 255
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          let h = 0
          let s = 0
          const l = (max + min) / 2
          if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
              case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
              case g: h = ((b - r) / d + 2) / 6; break
              case b: h = ((r - g) / d + 4) / 6; break
            }
          }
          foregroundHsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
        } else {
          foregroundHsl = textColor
        }
      } else if (textColor.includes('hsl')) {
        const match = textColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
        if (match) {
          foregroundHsl = `${match[1]} ${match[2]}% ${match[3]}%`
        } else {
          foregroundHsl = textColor
        }
      } else {
        foregroundHsl = textColor
      }
      cssRules += `      --foreground: ${foregroundHsl} !important;\n`
    }
    cssRules += `    }\n\n`
  } else {
    console.warn('[Branding] text-input style not found in componentStyling!')
    console.log('[Branding] Available component IDs:', Object.keys(branding.componentStyling || {}))
  }

  // Preserve padding-left for search inputs with icons to prevent icon/placeholder overlap
  // This ensures that inputs in relative containers (which typically contain icons) maintain their padding-left
  cssRules += `    /* Preserve padding-left for search inputs with icons to prevent overlap */\n`
  cssRules += `    /* Target inputs with explicit padding-left classes in relative containers */\n`
  cssRules += `    body:not([data-space]) .relative input.pl-8:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]) {\n`
  cssRules += `      padding-left: 2rem !important;\n`
  cssRules += `    }\n`
  cssRules += `    body:not([data-space]) .relative input.pl-9:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]) {\n`
  cssRules += `      padding-left: 2.25rem !important;\n`
  cssRules += `    }\n`
  cssRules += `    body:not([data-space]) .relative input.pl-10:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="color"]) {\n`
  cssRules += `      padding-left: 2.5rem !important;\n`
  cssRules += `    }\n\n`

  // Always add platform sidebar CSS rules even if component styling doesn't have explicit colors
  // This ensures the sidebar always uses the main branding config colors
  if (!branding.componentStyling?.['platform-sidebar-primary'] || 
      !branding.componentStyling['platform-sidebar-primary'].backgroundColor) {
    cssRules += `    /* Platform sidebar primary - using main branding config colors */\n`
    cssRules += `    body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"],\n`
    cssRules += `    body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].h-full,\n`
    cssRules += `    body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].flex,\n`
    cssRules += `    body:not([data-space]) [data-sidebar="primary"][data-component="platform-sidebar"].flex-col {\n`
    if (branding.platformSidebarBackgroundColor) {
      cssRules += `      --brand-platform-sidebar-bg: ${branding.platformSidebarBackgroundColor} !important;\n`
      cssRules += `      background-color: ${branding.platformSidebarBackgroundColor} !important;\n`
    }
    if (branding.platformSidebarTextColor) {
      cssRules += `      --brand-platform-sidebar-text: ${branding.platformSidebarTextColor} !important;\n`
      cssRules += `      color: ${branding.platformSidebarTextColor} !important;\n`
    }
    cssRules += `    }\n\n`
  }
  
  if (!branding.componentStyling?.['platform-sidebar-secondary'] || 
      !branding.componentStyling['platform-sidebar-secondary'].backgroundColor) {
    cssRules += `    /* Platform sidebar secondary - using main branding config colors */\n`
    cssRules += `    body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"],\n`
    cssRules += `    body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].h-full,\n`
    cssRules += `    body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].flex,\n`
    cssRules += `    body:not([data-space]) [data-sidebar="secondary"][data-component="platform-sidebar"].flex-col {\n`
    if (branding.secondarySidebarBackgroundColor) {
      cssRules += `      --brand-secondary-sidebar-bg: ${branding.secondarySidebarBackgroundColor} !important;\n`
      cssRules += `      background-color: ${branding.secondarySidebarBackgroundColor} !important;\n`
    }
    if (branding.secondarySidebarTextColor) {
      cssRules += `      --brand-secondary-sidebar-text: ${branding.secondarySidebarTextColor} !important;\n`
      cssRules += `      color: ${branding.secondarySidebarTextColor} !important;\n`
    }
    cssRules += `    }\n\n`
  }

  // Exclude space modules
  cssRules += `    /* Exclude space studio and space-specific components */\n`
  cssRules += `    [data-space],\n`
  cssRules += `    [data-space] *,\n`
  cssRules += `    [class*="space-studio"],\n`
  cssRules += `    [class*="space-studio"] *,\n`
  cssRules += `    [id*="space-"],\n`
  cssRules += `    [id*="space-"] * {\n`
  cssRules += `      /* Reset to default - space modules use their own styling */\n`
  cssRules += `    }\n`

  // Log the CSS before applying it
  console.log('[Branding] Generated CSS length:', cssRules.length)
  if (cssRules.includes('text-input')) {
    const textInputMatches = cssRules.match(/text-input[\s\S]{0,500}/g)
    if (textInputMatches) {
      console.log('[Branding] Text input CSS found in generated CSS')
      textInputMatches.slice(0, 3).forEach((match, idx) => {
        console.log(`[Branding] Text input CSS sample ${idx + 1}:`, match.substring(0, 200))
      })
    }
    // Check if color is in the CSS
    if (cssRules.includes('color:') && cssRules.includes('text-input')) {
      const colorMatches = cssRules.match(/input\[type="text"\][\s\S]{0,1000}color:[\s\S]{0,100}/g)
      if (colorMatches) {
        console.log('[Branding] Text input color CSS found:', colorMatches[0].substring(0, 300))
      }
    }
  } else {
    console.warn('[Branding] Text input CSS NOT found in generated CSS!')
  }
  
  styleElement.textContent = cssRules
  
    // Also apply styles directly to existing input elements as a fallback
    // This ensures styles are applied even if CSS doesn't override properly
    const textInputStyleDirect = branding.componentStyling?.['text-input']
    if (textInputStyleDirect) {
      console.log('[Branding] Applying text-input styles directly to existing inputs (including number inputs)')
      
      // Function to convert color to HSL format (same as color inputs use)
      const colorToHsl = (color: string): string => {
        const trimmed = color.trim()
        if (trimmed.startsWith('#')) {
          return hexToHsl(trimmed)
        } else if (trimmed.startsWith('rgb') || trimmed.startsWith('rgba')) {
          const match = trimmed.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
          if (match) {
            const r = parseInt(match[1]) / 255
            const g = parseInt(match[2]) / 255
            const b = parseInt(match[3]) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0
            let s = 0
            const l = (max + min) / 2
            if (max !== min) {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
          }
        } else if (trimmed.includes('hsl')) {
          const match = trimmed.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
          if (match) {
            return `${match[1]} ${match[2]}% ${match[3]}%`
          }
        }
        return trimmed
      }
      
      // Function to apply styles to an input element (EXACT same logic as color inputs)
      const applyInputStyles = (input: HTMLInputElement) => {
        if (!input.closest('[data-space]')) {
          // Apply background color - same approach as ColorInput
          if (textInputStyleDirect.backgroundColor) {
            const bgColor = textInputStyleDirect.backgroundColor.trim()
            // Direct inline style override (same as ColorInput would if it had inline styles)
            input.style.setProperty('background-color', bgColor, 'important')
            input.style.setProperty('background', bgColor, 'important')
            input.style.setProperty('background-image', 'none', 'important')
            
            // Override CSS variables used by Tailwind classes (bg-border and bg-input)
            const bgHsl = colorToHsl(bgColor)
            input.style.setProperty('--border', bgHsl, 'important')
            input.style.setProperty('--input', bgHsl, 'important')
          }
          
          // Apply text color - same approach as ColorInput
          if (textInputStyleDirect.textColor) {
            const textColor = textInputStyleDirect.textColor.trim()
            // Direct inline style override (same as ColorInput)
            input.style.setProperty('color', textColor, 'important')
            
            // Override CSS variable used by Tailwind's text-foreground class
            const textHsl = colorToHsl(textColor)
            input.style.setProperty('--foreground', textHsl, 'important')
          }
          
          // Apply border styles
          if (textInputStyleDirect.borderColor) {
            input.style.setProperty('border-color', textInputStyleDirect.borderColor, 'important')
          }
          if (textInputStyleDirect.borderWidth) {
            input.style.setProperty('border-width', textInputStyleDirect.borderWidth, 'important')
          }
          if (textInputStyleDirect.borderRadius) {
            input.style.setProperty('border-radius', textInputStyleDirect.borderRadius, 'important')
          }
        }
      }
      
      // Apply to existing inputs immediately and after a delay
      const applyToExisting = () => {
        const inputs = document.querySelectorAll('body:not([data-space]) input:not([type]), body:not([data-space]) input[type="text"], body:not([data-space]) input[type="email"], body:not([data-space]) input[type="password"], body:not([data-space]) input[type="number"], body:not([data-space]) input[type="search"], body:not([data-space]) input[type="tel"], body:not([data-space]) input[type="url"]')
        inputs.forEach((input: Element) => {
          applyInputStyles(input as HTMLInputElement)
        })
        console.log(`[Branding] Applied styles directly to ${inputs.length} input elements (including number inputs)`)
      }
      
      // Apply immediately
      if (typeof window !== 'undefined') {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          applyToExisting()
          // Also apply after React has rendered
          setTimeout(applyToExisting, 0)
          setTimeout(applyToExisting, 50)
          setTimeout(applyToExisting, 100)
          setTimeout(applyToExisting, 300)
          setTimeout(applyToExisting, 500)
          setTimeout(applyToExisting, 1000)
        })
      }
      
      // Use MutationObserver to apply styles to dynamically created inputs
      if (typeof window !== 'undefined' && !(window as any).__textInputStyleObserver) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                const element = node as Element
                // Check if it's an input or contains inputs
                const inputs = element.matches && element.matches('input:not([type]), input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], input[type="tel"], input[type="url"]')
                  ? [element as HTMLInputElement]
                  : Array.from(element.querySelectorAll?.('input:not([type]), input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], input[type="tel"], input[type="url"]') || []) as HTMLInputElement[]
                
                inputs.forEach((input) => {
                  applyInputStyles(input)
                })
              }
            })
          })
        })
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        })
        
        ;(window as any).__textInputStyleObserver = observer
        console.log('[Branding] MutationObserver set up for text and number inputs')
      }
    }
  
  // Verify the CSS was actually set
  if (styleElement.textContent !== cssRules) {
    console.error('[Branding] ERROR: CSS was not set correctly!')
    console.error('[Branding] Expected length:', cssRules.length)
    console.error('[Branding] Actual length:', styleElement.textContent?.length || 0)
  } else {
    console.log('[Branding] CSS successfully set in style element. Length:', styleElement.textContent.length)
  }
  
  // Debug: Log if platform sidebar CSS was generated
  const hasPlatformSidebarCSS = cssRules.includes('platform-sidebar-primary') || cssRules.includes('platform-sidebar-secondary')
  if (hasPlatformSidebarCSS) {
    console.log('[Branding] Platform sidebar CSS generated. Length:', cssRules.length)
    const platformSidebarMatch = cssRules.match(/platform-sidebar-primary[\s\S]*?\{[\s\S]*?\}/)
    if (platformSidebarMatch) {
      console.log('[Branding] Platform sidebar primary CSS:', platformSidebarMatch[0].substring(0, 500))
    }
  } else {
    console.warn('[Branding] Platform sidebar CSS NOT found in generated CSS!')
    console.log('[Branding] Available component IDs:', Object.keys(branding.componentStyling || {}))
  }
  
  // Debug: Log if text-input CSS was generated
  const hasTextInputCSS = cssRules.includes('text-input') || cssRules.includes('input[type="text"]')
  if (hasTextInputCSS) {
    console.log('[Branding] Text input CSS generated. Length:', cssRules.length)
    const textInputMatch = cssRules.match(/input\[type="text"\][\s\S]*?\{[\s\S]*?\}/)
    if (textInputMatch) {
      console.log('[Branding] Text input CSS sample:', textInputMatch[0].substring(0, 500))
    }
    // Check if text color is in the CSS
    if (cssRules.includes('text-input') && branding.componentStyling?.['text-input']) {
      const textInputStyle = branding.componentStyling['text-input']
      console.log('[Branding] Text input config:', {
        backgroundColor: textInputStyle.backgroundColor,
        textColor: textInputStyle.textColor,
        borderColor: textInputStyle.borderColor
      })
    }
  } else {
    console.warn('[Branding] Text input CSS NOT found in generated CSS!')
    console.log('[Branding] Available component IDs:', Object.keys(branding.componentStyling || {}))
    if (branding.componentStyling?.['text-input']) {
      console.log('[Branding] Text input config exists:', branding.componentStyling['text-input'])
    }
  }


  styleElement.textContent = cssRules
}

/**
 * Apply drawer overlay settings
 */
