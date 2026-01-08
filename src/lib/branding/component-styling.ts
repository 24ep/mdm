/**
 * Component styling functions
 * Applies component-specific styling to UI components
 * Excludes space modules
 */

import { BrandingConfig } from '@/app/admin/features/system/types'
import { hexToHsl, rgbaToHsl, hasAlphaChannel } from './utils'
import { componentSelectors } from './component-selectors'
import { generateBorderOverrideCSS } from './component-styling-border-override'

export function applyComponentStyling(branding: BrandingConfig) {
  const styleId = 'branding-component-styling'

  // Always ensure platform sidebar CSS variables are set from main branding config
  // This is critical because the inline styles in PlatformSidebar use these variables
  const root = document.documentElement
  root.style.setProperty('--brand-platform-sidebar-bg', branding.platformSidebarBackgroundColor)
  root.style.setProperty('--brand-platform-sidebar-text', branding.platformSidebarTextColor)
  root.style.setProperty('--brand-secondary-sidebar-bg', branding.secondarySidebarBackgroundColor)
  root.style.setProperty('--brand-secondary-sidebar-text', branding.secondarySidebarTextColor)

  // Set CSS variables for text-input padding and fontSize so textarea can use them
  const textInputStyle = branding.componentStyling?.['text-input']
  if (textInputStyle?.padding) {
    root.style.setProperty('--text-input-padding', textInputStyle.padding)
  }
  if (textInputStyle?.fontSize) {
    root.style.setProperty('--text-input-font-size', textInputStyle.fontSize)
  }

  // Set CSS variables for textarea (will use text-input values if not set)
  const textareaStyle = branding.componentStyling?.['textarea']
  const textareaPadding = textareaStyle?.padding || textInputStyle?.padding
  const textareaFontSize = textareaStyle?.fontSize || textInputStyle?.fontSize
  if (textareaPadding) {
    root.style.setProperty('--textarea-padding', textareaPadding)
  }
  if (textareaFontSize) {
    root.style.setProperty('--textarea-font-size', textareaFontSize)
  }

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
    // Only move the element if it's not already at the end to avoid unnecessary DOM mutations
    // Check if it's the last child - if not, move it to the end
    const lastChild = document.head.lastElementChild
    if (lastChild !== styleElement) {
      document.head.appendChild(styleElement)
    }
  }

  // Always initialize CSS rules (even if empty, to clear previous styles)
  let cssRules = '/* Component-specific styling - excludes space modules */\n'

  // Generate border override CSS for rgba colors
  cssRules += generateBorderOverrideCSS(branding)

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

  // Use component selectors from extracted module
  // componentSelectors is imported from './component-selectors'

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

    // Debug logging for platform sidebar, text-input, form, badge, and accordion
    if (componentId === 'platform-sidebar-primary' || componentId === 'platform-sidebar-secondary' || componentId === 'text-input' || componentId === 'form' || componentId === 'badge' || componentId.startsWith('accordion-trigger')) {
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
      isNonEmpty(componentStyle.minHeight) ||
      isNonEmpty(componentStyle.maxWidth) ||
      isNonEmpty(componentStyle.maxHeight) ||
      isNonEmpty(componentStyle.fontSize) ||
      isNonEmpty(componentStyle.fontWeight) ||
      isNonEmpty(componentStyle.fontFamily) ||
      isNonEmpty(componentStyle.lineHeight) ||
      isNonEmpty(componentStyle.letterSpacing) ||
      isNonEmpty(componentStyle.textAlign) ||
      isNonEmpty(componentStyle.textTransform) ||
      isNonEmpty(componentStyle.textDecoration) ||
      isNonEmpty(componentStyle.opacity) ||
      isNonEmpty(componentStyle.zIndex) ||
      isNonEmpty(componentStyle.position) ||
      isNonEmpty(componentStyle.top) ||
      isNonEmpty(componentStyle.right) ||
      isNonEmpty(componentStyle.bottom) ||
      isNonEmpty(componentStyle.left) ||
      isNonEmpty(componentStyle.display) ||
      isNonEmpty(componentStyle.flexDirection) ||
      isNonEmpty(componentStyle.flexWrap) ||
      isNonEmpty(componentStyle.justifyContent) ||
      isNonEmpty(componentStyle.alignItems) ||
      isNonEmpty(componentStyle.alignContent) ||
      isNonEmpty(componentStyle.gap) ||
      isNonEmpty(componentStyle.gridTemplateColumns) ||
      isNonEmpty(componentStyle.gridTemplateRows) ||
      isNonEmpty(componentStyle.gridColumn) ||
      isNonEmpty(componentStyle.gridRow) ||
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
      // Always generate CSS for accordion-trigger even if hasStyles is false (to ensure transparent background)
      if (!componentId.startsWith('accordion-trigger')) {
        return
      }
      // For accordion, ensure we have at least transparent background and 0px border radius
      if (!componentStyle.backgroundColor) {
        componentStyle.backgroundColor = 'transparent'
      }
      if (!componentStyle.borderRadius) {
        componentStyle.borderRadius = '0px'
      }
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
        // Override Tailwind's --border CSS variable (used by bg-border class)
        // IMPORTANT: If the background color has an alpha channel, use it directly
        // because HSL conversion loses the alpha, making transparent colors appear opaque/black
        if (hasAlphaChannel(bgColor)) {
          componentCSS += `      --border: ${bgColor} !important;\n`
        } else {
          const borderHsl = rgbaToHsl(bgColor)
          componentCSS += `      --border: ${borderHsl} !important;\n`
        }
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
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const hsl = rgbaToHsl(bgColor)
        componentCSS += `      --muted: ${hsl} !important;\n`
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
      }
      // For vertical-tab-menu-active, also set CSS variable to override inline styles
      // The inline style uses hsl(var(--muted)), so --muted must be in HSL format
      if (componentId === 'vertical-tab-menu-active') {
        const bgColor = componentStyle.backgroundColor.trim()
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const mutedHsl = rgbaToHsl(bgColor)
        componentCSS += `      --muted: ${mutedHsl} !important;\n`
      }
      // For card, ensure white background by default if not set
      // This prevents issues where cards might inherit colors or show up blue in some contexts
      if (componentId === 'card') {
        const bgColor = componentStyle.backgroundColor && componentStyle.backgroundColor.trim()
          ? componentStyle.backgroundColor.trim()
          : '#ffffff'

        componentCSS += `      background: ${bgColor} !important;\n`
        componentCSS += `      background-color: ${bgColor} !important;\n`
        componentCSS += `      background-image: none !important;\n`
        componentCSS += `      --card: ${bgColor} !important;\n`
        componentCSS += `      --popover: ${bgColor} !important;\n`
      }
      // For iconButton, aggressively override Tailwind's background classes
      // This ensures transparent backgrounds properly override hover states and other Tailwind utilities
      if (componentId === 'iconButton') {
        const bgColor = componentStyle.backgroundColor && componentStyle.backgroundColor.trim()
          ? componentStyle.backgroundColor.trim()
          : 'transparent'

        componentCSS += `      background: ${bgColor} !important;\n`
        componentCSS += `      background-color: ${bgColor} !important;\n`
        componentCSS += `      background-image: none !important;\n`
        // Override Tailwind's opacity utilities that might affect background
        componentCSS += `      --tw-bg-opacity: 1 !important;\n`
      }
      // For accordion-trigger components, aggressively override Tailwind's bg-white/dark:bg-black and hover:bg-accent classes
      if (componentId.startsWith('accordion-trigger')) {
        const bgColor = componentStyle.backgroundColor ? componentStyle.backgroundColor.trim() : 'transparent'
        console.log(`[Branding] Generating accordion CSS for ${componentId} with backgroundColor: ${bgColor}`)
        componentCSS += `      background: ${bgColor} !important;\n`
        componentCSS += `      background-color: ${bgColor} !important;\n`
        componentCSS += `      background-image: none !important;\n`
        componentCSS += `      background-size: auto !important;\n`
        componentCSS += `      background-position: initial !important;\n`
        componentCSS += `      background-repeat: initial !important;\n`
        // Override Tailwind's dark mode background
        componentCSS += `      --tw-bg-opacity: 1 !important;\n`
        // Override any rounded classes from Tailwind
        if (componentStyle.borderRadius) {
          const borderRadius = componentStyle.borderRadius.trim()
          componentCSS += `      border-radius: ${borderRadius} !important;\n`
          componentCSS += `      border-top-left-radius: ${borderRadius} !important;\n`
          componentCSS += `      border-top-right-radius: ${borderRadius} !important;\n`
          componentCSS += `      border-bottom-left-radius: ${borderRadius} !important;\n`
          componentCSS += `      border-bottom-right-radius: ${borderRadius} !important;\n`
        }
        // Override hover states
        if (componentId === 'accordion-trigger-hover') {
          componentCSS += `      background: ${bgColor} !important;\n`
          componentCSS += `      background-color: ${bgColor} !important;\n`
          componentCSS += `      background-image: none !important;\n`
        }
      }
    }

    if (componentStyle.textColor && componentStyle.textColor.trim()) {
      componentCSS += `      color: ${componentStyle.textColor.trim()} !important;\n`
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
        // Override Tailwind's --border CSS variable (used by bg-border class)
        // IMPORTANT: If the background color has an alpha channel, use it directly
        // because HSL conversion loses the alpha, making transparent colors appear opaque/black
        if (hasAlphaChannel(bgColor)) {
          componentCSS += `      --border: ${bgColor} !important;\n`
        } else {
          const borderHsl = rgbaToHsl(bgColor)
          componentCSS += `      --border: ${borderHsl} !important;\n`
        }
      }

      // For textarea, override Tailwind's bg-border class and globals.css rules
      if (componentId === 'textarea') {
        const bgColor = componentStyle.backgroundColor.trim()
        componentCSS += `      background: ${bgColor} !important;\n`
        componentCSS += `      background-color: ${bgColor} !important;\n`
        componentCSS += `      background-image: none !important;\n`
        // Override Tailwind's --border CSS variable if needed, similar to input
        if (hasAlphaChannel(bgColor)) {
          componentCSS += `      --border: ${bgColor} !important;\n`
        } else {
          const borderHsl = rgbaToHsl(bgColor)
          componentCSS += `      --border: ${borderHsl} !important;\n`
        }
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
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const hsl = rgbaToHsl(bgColor)
        componentCSS += `      --muted: ${hsl} !important;\n`
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
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const destructiveHsl = rgbaToHsl(bgColor)
        // Override Tailwind's --destructive CSS variable (used by bg-destructive class)
        componentCSS += `      --destructive: ${destructiveHsl} !important;\n`
      }

      // For vertical-tab-menu-active, also set CSS variable to override inline styles
      // The inline style uses hsl(var(--muted)), so --muted must be in HSL format
      if (componentId === 'vertical-tab-menu-active') {
        const bgColor = componentStyle.backgroundColor.trim()
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const mutedHsl = rgbaToHsl(bgColor)
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
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const destructiveForegroundHsl = rgbaToHsl(textColor)
        // Override Tailwind's --destructive-foreground CSS variable (used by text-destructive-foreground class)
        componentCSS += `      --destructive-foreground: ${destructiveForegroundHsl} !important;\n`
      }
      // For text-input, override Tailwind's text-foreground class
      if (componentId === 'text-input') {
        const textColor = componentStyle.textColor.trim()
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const foregroundHsl = rgbaToHsl(textColor)
        // Override Tailwind's text-foreground class by setting CSS variable
        componentCSS += `      --foreground: ${foregroundHsl} !important;\n`
        // Also directly set color to ensure it overrides
        componentCSS += `      color: ${textColor} !important;\n`
      }
      // For vertical-tab-menu-active, also set CSS variable to override inline styles
      // The inline style may use CSS variables, so --foreground must be in HSL format
      if (componentId === 'vertical-tab-menu-active') {
        const textColor = componentStyle.textColor.trim()
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const foregroundHsl = rgbaToHsl(textColor)
        componentCSS += `      --foreground: ${foregroundHsl} !important;\n`
        componentCSS += `      --brand-vertical-tab-active-text: ${componentStyle.textColor.trim()} !important;\n`
        // Also directly override inline styles with !important
        componentCSS += `      color: ${componentStyle.textColor.trim()} !important;\n`
      }
    }
    // Specific logic for iconButton text color default
    if (componentId === 'iconButton') {
      const textColor = componentStyle.textColor && componentStyle.textColor.trim()
        ? componentStyle.textColor.trim()
        : '#000000'

      componentCSS += `      color: ${textColor} !important;\n`
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
      const borderColorValue = componentStyle.borderColor.trim()
      componentCSS += `      border-color: ${borderColorValue} !important;\n`
      // Also set --border CSS variable for Tailwind classes
      // IMPORTANT: If the border color has an alpha channel, use it directly
      // because HSL conversion loses the alpha, making transparent colors appear opaque/black
      if (hasAlphaChannel(borderColorValue)) {
        componentCSS += `      --border: ${borderColorValue} !important;\n`
        componentCSS += `      --input: ${borderColorValue} !important;\n`
      } else {
        const borderHsl = rgbaToHsl(borderColorValue)
        componentCSS += `      --border: ${borderHsl} !important;\n`
        componentCSS += `      --input: ${borderHsl} !important;\n`
      }
      if (componentId === 'text-input') {
        console.log('[Branding] Setting text-input border-color:', borderColorValue, 'borderWidth:', componentStyle.borderWidth)
      }
      // Ensure width is set if borderColor is set but borderWidth is not explicitly set
      // Only set width if borderWidth is not explicitly "0px" or "0"
      const borderWidthValue = componentStyle.borderWidth ? componentStyle.borderWidth.trim() : ''
      const isExplicitlyZero = borderWidthValue === '0px' || borderWidthValue === '0'

      if (!isExplicitlyZero && (!componentStyle.borderWidth || !borderWidthValue)) {
        // Check if any individual side widths are set
        const hasIndividualWidths = (componentStyle.borderTopWidth && componentStyle.borderTopWidth.trim()) ||
          (componentStyle.borderRightWidth && componentStyle.borderRightWidth.trim()) ||
          (componentStyle.borderBottomWidth && componentStyle.borderBottomWidth.trim()) ||
          (componentStyle.borderLeftWidth && componentStyle.borderLeftWidth.trim())
        if (!hasIndividualWidths) {
          // Default to 1px if color is set but no width (and width is not explicitly 0)
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
      // For badge, aggressively override Tailwind rounded-full class
      if (componentId === 'badge') {
        const borderRadius = componentStyle.borderRadius.trim()
        componentCSS += `      border-radius: ${borderRadius} !important;\n`
        componentCSS += `      border-top-left-radius: ${borderRadius} !important;\n`
        componentCSS += `      border-top-right-radius: ${borderRadius} !important;\n`
        componentCSS += `      border-bottom-left-radius: ${borderRadius} !important;\n`
        componentCSS += `      border-bottom-right-radius: ${borderRadius} !important;\n`
      }
      // For accordion-trigger, aggressively override any rounded classes
      if (componentId.startsWith('accordion-trigger')) {
        const borderRadius = componentStyle.borderRadius.trim()
        componentCSS += `      border-radius: ${borderRadius} !important;\n`
        componentCSS += `      border-top-left-radius: ${borderRadius} !important;\n`
        componentCSS += `      border-top-right-radius: ${borderRadius} !important;\n`
        componentCSS += `      border-bottom-left-radius: ${borderRadius} !important;\n`
        componentCSS += `      border-bottom-right-radius: ${borderRadius} !important;\n`
        // Also ensure background is transparent if not already set in backgroundColor block
        if (!componentStyle.backgroundColor || !componentStyle.backgroundColor.trim()) {
          componentCSS += `      background: transparent !important;\n`
          componentCSS += `      background-color: transparent !important;\n`
        }
      }
    }
    // Individual border radius corners
    if (componentStyle.borderTopLeftRadius && componentStyle.borderTopLeftRadius.trim()) {
      componentCSS += `      border-top-left-radius: ${componentStyle.borderTopLeftRadius.trim()} !important;\n`
    }
    if (componentStyle.borderTopRightRadius && componentStyle.borderTopRightRadius.trim()) {
      componentCSS += `      border-top-right-radius: ${componentStyle.borderTopRightRadius.trim()} !important;\n`
    }
    if (componentStyle.borderBottomRightRadius && componentStyle.borderBottomRightRadius.trim()) {
      componentCSS += `      border-bottom-right-radius: ${componentStyle.borderBottomRightRadius.trim()} !important;\n`
    }
    if (componentStyle.borderBottomLeftRadius && componentStyle.borderBottomLeftRadius.trim()) {
      componentCSS += `      border-bottom-left-radius: ${componentStyle.borderBottomLeftRadius.trim()} !important;\n`
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
        // For badge, also override Tailwind border classes
        if (componentId === 'badge') {
          componentCSS += `      --tw-border-opacity: 0 !important;\n`
        }
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
      // For badge, aggressively override Tailwind padding classes (px-*, py-*)
      if (componentId === 'badge') {
        const padding = componentStyle.padding.trim()
        // Parse shorthand padding (e.g., "0.125rem 0.375rem" = vertical horizontal)
        const paddingParts = padding.split(/\s+/)
        if (paddingParts.length === 2) {
          // Two values: vertical horizontal
          const vertical = paddingParts[0]
          const horizontal = paddingParts[1]
          componentCSS += `      padding-top: ${vertical} !important;\n`
          componentCSS += `      padding-bottom: ${vertical} !important;\n`
          componentCSS += `      padding-left: ${horizontal} !important;\n`
          componentCSS += `      padding-right: ${horizontal} !important;\n`
        } else {
          // Single value or other format, use as-is
          componentCSS += `      padding: ${padding} !important;\n`
        }
        // Override Tailwind's padding utilities
        componentCSS += `      --tw-padding-x: 0 !important;\n`
        componentCSS += `      --tw-padding-y: 0 !important;\n`
      }
    }
    // Individual padding sides
    if (componentStyle.paddingTop && componentStyle.paddingTop.trim()) {
      componentCSS += `      padding-top: ${componentStyle.paddingTop.trim()} !important;\n`
    }
    if (componentStyle.paddingRight && componentStyle.paddingRight.trim()) {
      componentCSS += `      padding-right: ${componentStyle.paddingRight.trim()} !important;\n`
    }
    if (componentStyle.paddingBottom && componentStyle.paddingBottom.trim()) {
      componentCSS += `      padding-bottom: ${componentStyle.paddingBottom.trim()} !important;\n`
    }
    if (componentStyle.paddingLeft && componentStyle.paddingLeft.trim()) {
      componentCSS += `      padding-left: ${componentStyle.paddingLeft.trim()} !important;\n`
    }

    if (componentStyle.margin && componentStyle.margin.trim()) {
      componentCSS += `      margin: ${componentStyle.margin.trim()} !important;\n`
    }
    // Individual margin sides
    if ((componentStyle as any).marginTop && (componentStyle as any).marginTop.trim()) {
      componentCSS += `      margin-top: ${(componentStyle as any).marginTop.trim()} !important;\n`
    }
    if ((componentStyle as any).marginRight && (componentStyle as any).marginRight.trim()) {
      componentCSS += `      margin-right: ${(componentStyle as any).marginRight.trim()} !important;\n`
    }
    if ((componentStyle as any).marginBottom && (componentStyle as any).marginBottom.trim()) {
      componentCSS += `      margin-bottom: ${(componentStyle as any).marginBottom.trim()} !important;\n`
    }
    if ((componentStyle as any).marginLeft && (componentStyle as any).marginLeft.trim()) {
      componentCSS += `      margin-left: ${(componentStyle as any).marginLeft.trim()} !important;\n`
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
      // Set CSS variable for platform sidebar border color (used by separator lines)
      // If borderColor is set and not transparent, use it; otherwise fall back to global border color
      const globalBorderColor = branding.globalStyling?.borderColor?.trim() || branding.uiBorderColor?.trim() || 'rgba(0, 0, 0, 0.06)'
      const sidebarBorderColor = (componentStyle.borderColor && componentStyle.borderColor.trim() && componentStyle.borderColor.trim() !== 'transparent')
        ? componentStyle.borderColor.trim()
        : globalBorderColor

      // Apply border color to separator lines within this sidebar
      if (hasAlphaChannel(sidebarBorderColor)) {
        cssRules += `    /* Platform sidebar primary separator lines - use rgba directly */\n`
        cssRules += `    body:not([data-space]) [data-sidebar="primary"] .border-t.border-border,\n`
        cssRules += `    body:not([data-space]) [data-sidebar="primary"] .border-b.border-border,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="primary"] .border-t.border-border,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="primary"] .border-b.border-border {\n`
        cssRules += `      border-color: ${sidebarBorderColor} !important;\n`
        cssRules += `      border-top-color: ${sidebarBorderColor} !important;\n`
        cssRules += `      border-bottom-color: ${sidebarBorderColor} !important;\n`
        cssRules += `    }\n\n`
        root.style.setProperty('--platform-sidebar-primary-border', sidebarBorderColor)
      } else {
        const sidebarBorderHsl = rgbaToHsl(sidebarBorderColor)
        root.style.setProperty('--platform-sidebar-primary-border', sidebarBorderHsl)
        cssRules += `    /* Platform sidebar primary separator lines - use HSL */\n`
        cssRules += `    body:not([data-space]) [data-sidebar="primary"] .border-t.border-border,\n`
        cssRules += `    body:not([data-space]) [data-sidebar="primary"] .border-b.border-border,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="primary"] .border-t.border-border,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="primary"] .border-b.border-border {\n`
        cssRules += `      border-color: ${sidebarBorderHsl} !important;\n`
        cssRules += `      border-top-color: ${sidebarBorderHsl} !important;\n`
        cssRules += `      border-bottom-color: ${sidebarBorderHsl} !important;\n`
        cssRules += `    }\n\n`
      }
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
      // Set CSS variable for platform sidebar border color (used by separator lines)
      // If borderColor is set and not transparent, use it; otherwise fall back to global border color
      const globalBorderColor = branding.globalStyling?.borderColor?.trim() || branding.uiBorderColor?.trim() || 'rgba(0, 0, 0, 0.06)'
      const sidebarBorderColor = (componentStyle.borderColor && componentStyle.borderColor.trim() && componentStyle.borderColor.trim() !== 'transparent')
        ? componentStyle.borderColor.trim()
        : globalBorderColor

      // Apply border color to separator lines within this sidebar
      if (hasAlphaChannel(sidebarBorderColor)) {
        cssRules += `    /* Platform sidebar secondary separator lines - use rgba directly */\n`
        cssRules += `    body:not([data-space]) [data-sidebar="secondary"] .border-t.border-border,\n`
        cssRules += `    body:not([data-space]) [data-sidebar="secondary"] .border-b.border-border,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .border-t.border-border,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .border-b.border-border {\n`
        cssRules += `      border-color: ${sidebarBorderColor} !important;\n`
        cssRules += `      border-top-color: ${sidebarBorderColor} !important;\n`
        cssRules += `      border-bottom-color: ${sidebarBorderColor} !important;\n`
        cssRules += `    }\n\n`
        root.style.setProperty('--platform-sidebar-secondary-border', sidebarBorderColor)
      } else {
        const sidebarBorderHsl = rgbaToHsl(sidebarBorderColor)
        root.style.setProperty('--platform-sidebar-secondary-border', sidebarBorderHsl)
        cssRules += `    /* Platform sidebar secondary separator lines - use HSL */\n`
        cssRules += `    body:not([data-space]) [data-sidebar="secondary"] .border-t.border-border,\n`
        cssRules += `    body:not([data-space]) [data-sidebar="secondary"] .border-b.border-border,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .border-t.border-border,\n`
        cssRules += `    body:not([data-space]) [data-component="platform-sidebar"][data-sidebar="secondary"] .border-b.border-border {\n`
        cssRules += `      border-color: ${sidebarBorderHsl} !important;\n`
        cssRules += `      border-top-color: ${sidebarBorderHsl} !important;\n`
        cssRules += `      border-bottom-color: ${sidebarBorderHsl} !important;\n`
        cssRules += `    }\n\n`
      }
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
          // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
          const mutedHsl = rgbaToHsl(bgColor)
          cssRules += `      --muted: ${mutedHsl} !important;\n`
        }
        if (componentStyle.textColor) {
          const textColor = componentStyle.textColor.trim()
          cssRules += `      color: ${textColor} !important;\n`
          // Override Tailwind's text-foreground class by converting color to HSL format
          // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
          const foregroundHsl = rgbaToHsl(textColor)
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
        // Override Tailwind's --border and --input CSS variables
        // IMPORTANT: If the background color has an alpha channel, use it directly
        // because HSL conversion loses the alpha, making transparent colors appear opaque/black
        if (hasAlphaChannel(bgColor)) {
          cssRules += `      --border: ${bgColor} !important;\n`
          cssRules += `      --input: ${bgColor} !important;\n`
        } else {
          const borderHsl = rgbaToHsl(bgColor)
          cssRules += `      --border: ${borderHsl} !important;\n`
          cssRules += `      --input: ${borderHsl} !important;\n`
        }
      }
      if (componentStyle.textColor) {
        const textColor = componentStyle.textColor.trim()
        cssRules += `      color: ${textColor} !important;\n`
        // Override Tailwind's text-foreground class by setting CSS variable
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const foregroundHsl = rgbaToHsl(textColor)
        cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      }
      if (componentStyle.borderColor && componentStyle.borderColor.trim()) {
        const borderColorValue = componentStyle.borderColor.trim()
        cssRules += `      border-color: ${borderColorValue} !important;\n`
        // Also set --border CSS variable for Tailwind classes
        // IMPORTANT: If the border color has an alpha channel, use it directly
        // because HSL conversion loses the alpha, making transparent colors appear opaque/black
        if (hasAlphaChannel(borderColorValue)) {
          cssRules += `      --border: ${borderColorValue} !important;\n`
          cssRules += `      --input: ${borderColorValue} !important;\n`
        } else {
          const borderHsl = rgbaToHsl(borderColorValue)
          cssRules += `      --border: ${borderHsl} !important;\n`
          cssRules += `      --input: ${borderHsl} !important;\n`
        }
        // Ensure width is set if borderColor is set but borderWidth is not explicitly set
        if (!componentStyle.borderWidth || !componentStyle.borderWidth.trim() || componentStyle.borderWidth.trim() === '0px' || componentStyle.borderWidth.trim() === '0') {
          // Check if any individual side widths are set
          const hasIndividualWidths = (componentStyle.borderTopWidth && componentStyle.borderTopWidth.trim()) ||
            (componentStyle.borderRightWidth && componentStyle.borderRightWidth.trim()) ||
            (componentStyle.borderBottomWidth && componentStyle.borderBottomWidth.trim()) ||
            (componentStyle.borderLeftWidth && componentStyle.borderLeftWidth.trim())
          if (!hasIndividualWidths) {
            // Default to 1px if color is set but no width
            cssRules += `      border-width: 1px !important;\n`
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
            cssRules += `      border-style: solid !important;\n`
          }
        }
      }
      if (componentStyle.borderWidth && componentStyle.borderWidth.trim()) {
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
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const foregroundHsl = rgbaToHsl(textColor)
        cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      }
      cssRules += `    }\n\n`
    }

    // Special handling for textarea to override Tailwind classes and globals.css
    // This must come AFTER the main component CSS to ensure it overrides globals.css
    if (componentId === 'textarea') {
      cssRules += `    /* Aggressive override for textarea to override Tailwind classes and globals.css */\n`
      cssRules += `    /* This rule has higher specificity and comes after globals.css */\n`
      cssRules += `    /* Target all textarea elements */\n`
      cssRules += `    body:not([data-space]) textarea,\n`
      cssRules += `    body:not([data-space]) [data-component="textarea"],\n`
      cssRules += `    body:not([data-space]) [data-component="textarea"] textarea,\n`
      cssRules += `    body:not([data-space]) [class*="Textarea"],\n`
      cssRules += `    body:not([data-space]) [class*="Textarea"] textarea,\n`
      cssRules += `    body:not([data-space]) textarea[class*="textarea"],\n`
      cssRules += `    body:not([data-space]) textarea[class*="Textarea"],\n`
      cssRules += `    body:not([data-space]) textarea.text-foreground,\n`
      cssRules += `    body:not([data-space]) textarea.bg-border,\n`
      cssRules += `    body:not([data-space]) textarea.bg-input,\n`
      cssRules += `    body:not([data-space]) textarea[class*="bg-border"],\n`
      cssRules += `    body:not([data-space]) textarea[class*="text-foreground"],\n`
      cssRules += `    body:not([data-space]) textarea[class*="bg-input"] {\n`
      if (componentStyle.backgroundColor) {
        const bgColor = componentStyle.backgroundColor.trim()
        cssRules += `      background: ${bgColor} !important;\n`
        cssRules += `      background-color: ${bgColor} !important;\n`
        cssRules += `      background-image: none !important;\n`
        // Override Tailwind's --border and --input CSS variables
        // IMPORTANT: If the background color has an alpha channel, use it directly
        // because HSL conversion loses the alpha, making transparent colors appear opaque/black
        if (hasAlphaChannel(bgColor)) {
          cssRules += `      --border: ${bgColor} !important;\n`
          cssRules += `      --input: ${bgColor} !important;\n`
        } else {
          const borderHsl = rgbaToHsl(bgColor)
          cssRules += `      --border: ${borderHsl} !important;\n`
          cssRules += `      --input: ${borderHsl} !important;\n`
        }
      }
      if (componentStyle.textColor) {
        const textColor = componentStyle.textColor.trim()
        cssRules += `      color: ${textColor} !important;\n`
        // Override Tailwind's text-foreground class by setting CSS variable
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const foregroundHsl = rgbaToHsl(textColor)
        cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      }
      if (componentStyle.borderColor && componentStyle.borderColor.trim()) {
        const borderColorValue = componentStyle.borderColor.trim()
        cssRules += `      border-color: ${borderColorValue} !important;\n`
        // Also set --border CSS variable for Tailwind classes
        // IMPORTANT: If the border color has an alpha channel, use it directly
        // because HSL conversion loses the alpha, making transparent colors appear opaque/black
        if (hasAlphaChannel(borderColorValue)) {
          cssRules += `      --border: ${borderColorValue} !important;\n`
          cssRules += `      --input: ${borderColorValue} !important;\n`
        } else {
          const borderHsl = rgbaToHsl(borderColorValue)
          cssRules += `      --border: ${borderHsl} !important;\n`
          cssRules += `      --input: ${borderHsl} !important;\n`
        }
        // Ensure width is set if borderColor is set but borderWidth is not explicitly set
        if (!componentStyle.borderWidth || !componentStyle.borderWidth.trim() || componentStyle.borderWidth.trim() === '0px' || componentStyle.borderWidth.trim() === '0') {
          // Check if any individual side widths are set
          const hasIndividualWidths = (componentStyle.borderTopWidth && componentStyle.borderTopWidth.trim()) ||
            (componentStyle.borderRightWidth && componentStyle.borderRightWidth.trim()) ||
            (componentStyle.borderBottomWidth && componentStyle.borderBottomWidth.trim()) ||
            (componentStyle.borderLeftWidth && componentStyle.borderLeftWidth.trim())
          if (!hasIndividualWidths) {
            // Default to 1px if color is set but no width
            cssRules += `      border-width: 1px !important;\n`
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
            cssRules += `      border-style: solid !important;\n`
          }
        }
      }
      if (componentStyle.borderWidth && componentStyle.borderWidth.trim()) {
        cssRules += `      border-width: ${componentStyle.borderWidth.trim()} !important;\n`
        if (componentStyle.borderWidth.trim() === '0px' || componentStyle.borderWidth.trim() === '0') {
          cssRules += `      border: none !important;\n`
        }
      }
      if (componentStyle.borderRadius) {
        cssRules += `      border-radius: ${componentStyle.borderRadius.trim()} !important;\n`
      }
      // For textarea, use text-input's padding and fontSize to match text-input styling exactly
      const textInputStyleForTextarea = componentId === 'textarea' ? branding.componentStyling?.['text-input'] : null
      const padding = componentStyle.padding || textInputStyleForTextarea?.padding
      const fontSize = componentStyle.fontSize || textInputStyleForTextarea?.fontSize
      if (padding) {
        cssRules += `      padding: ${padding.trim()} !important;\n`
      }
      if (fontSize) {
        cssRules += `      font-size: ${fontSize.trim()} !important;\n`
      }
      if (componentStyle.lineHeight) {
        cssRules += `      line-height: ${componentStyle.lineHeight.trim()} !important;\n`
      }
      cssRules += `    }\n\n`

      // Additional override specifically for Textarea component with Tailwind classes
      cssRules += `    /* Override Textarea component with Tailwind classes */\n`
      cssRules += `    body:not([data-space]) textarea.text-foreground,\n`
      cssRules += `    body:not([data-space]) textarea.bg-border,\n`
      cssRules += `    body:not([data-space]) textarea.bg-input,\n`
      cssRules += `    body:not([data-space]) textarea[class*="text-foreground"],\n`
      cssRules += `    body:not([data-space]) textarea[class*="bg-border"],\n`
      cssRules += `    body:not([data-space]) textarea[class*="bg-input"] {\n`
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
        // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
        const foregroundHsl = rgbaToHsl(textColor)
        cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      }
      // Use text-input's padding and fontSize to match text-input styling exactly
      const textInputStyleForTextareaOverride = componentId === 'textarea' ? branding.componentStyling?.['text-input'] : null
      const paddingOverride = componentStyle.padding || textInputStyleForTextareaOverride?.padding
      const fontSizeOverride = componentStyle.fontSize || textInputStyleForTextareaOverride?.fontSize
      if (paddingOverride) {
        cssRules += `      padding: ${paddingOverride.trim()} !important;\n`
      }
      if (fontSizeOverride) {
        cssRules += `      font-size: ${fontSizeOverride.trim()} !important;\n`
      }
      cssRules += `    }\n\n`
    }
  })

  // Final aggressive override for text-input - must come after all component CSS to override globals.css
  // This uses maximum specificity to override globals.css rule: input:not([type="checkbox"])... { background-color: hsl(var(--border)) !important; }
  // Reuse the textInputStyle variable declared earlier in the function
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
      // IMPORTANT: If the background color has an alpha channel, use it directly
      // because HSL conversion loses the alpha, making transparent colors appear opaque/black
      if (hasAlphaChannel(bgColor)) {
        cssRules += `      --border: ${bgColor} !important;\n`
        cssRules += `      --input: ${bgColor} !important;\n`
        console.log('[Branding] Setting text-input background:', bgColor, '(using rgba directly)')
      } else {
        const borderHsl = rgbaToHsl(bgColor)
        cssRules += `      --border: ${borderHsl} !important;\n`
        cssRules += `      --input: ${borderHsl} !important;\n`
        console.log('[Branding] Setting text-input background:', bgColor, 'HSL:', borderHsl)
      }
    }
    if (textInputStyle.textColor) {
      const textColor = textInputStyle.textColor.trim()
      cssRules += `      color: ${textColor} !important;\n`
      // Also override CSS variable
      // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
      const foregroundHsl = rgbaToHsl(textColor)
      cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      console.log('[Branding] Setting text-input text color:', textColor, 'HSL:', foregroundHsl)
    }
    if (textInputStyle.borderColor && textInputStyle.borderColor.trim()) {
      const borderColorValue = textInputStyle.borderColor.trim()
      cssRules += `      border-color: ${borderColorValue} !important;\n`
      console.log('[Branding] Setting text-input border-color:', borderColorValue, 'borderWidth:', textInputStyle.borderWidth)
      // Also set --border CSS variable for Tailwind classes
      // IMPORTANT: If the border color has an alpha channel, use it directly
      // because HSL conversion loses the alpha, making transparent colors appear opaque/black
      if (hasAlphaChannel(borderColorValue)) {
        cssRules += `      --border: ${borderColorValue} !important;\n`
        cssRules += `      --input: ${borderColorValue} !important;\n`
        console.log('[Branding] Using rgba border color directly (has alpha channel):', borderColorValue)
      } else {
        const borderHsl = rgbaToHsl(borderColorValue)
        cssRules += `      --border: ${borderHsl} !important;\n`
        cssRules += `      --input: ${borderHsl} !important;\n`
        console.log('[Branding] Converted border color to HSL:', borderHsl)
      }
      // Ensure width is set if borderColor is set but borderWidth is not explicitly set
      if (!textInputStyle.borderWidth || !textInputStyle.borderWidth.trim() || textInputStyle.borderWidth.trim() === '0px' || textInputStyle.borderWidth.trim() === '0') {
        // Default to 1px if color is set but no width
        cssRules += `      border-width: 1px !important;\n`
        console.log('[Branding] text-input borderWidth was missing/0, defaulting to 1px')
      }
      // Ensure style is set if borderColor is set but borderStyle is not explicitly set
      if (!textInputStyle.borderStyle || !textInputStyle.borderStyle.trim()) {
        cssRules += `      border-style: solid !important;\n`
        console.log('[Branding] text-input borderStyle was missing, defaulting to solid')
      }
    } else {
      console.warn('[Branding] text-input borderColor is missing or empty!', {
        hasBorderColor: !!textInputStyle.borderColor,
        borderColor: textInputStyle.borderColor
      })
    }
    if (textInputStyle.borderWidth && textInputStyle.borderWidth.trim()) {
      cssRules += `      border-width: ${textInputStyle.borderWidth.trim()} !important;\n`
      if (textInputStyle.borderWidth.trim() === '0px' || textInputStyle.borderWidth.trim() === '0') {
        cssRules += `      border: none !important;\n`
      }
    }
    if (textInputStyle.borderRadius) {
      cssRules += `      border-radius: ${textInputStyle.borderRadius.trim()} !important;\n`
    }
    if (textInputStyle.padding) {
      cssRules += `      padding: ${textInputStyle.padding.trim()} !important;\n`
    }
    if (textInputStyle.fontSize) {
      cssRules += `      font-size: ${textInputStyle.fontSize.trim()} !important;\n`
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
      // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
      const foregroundHsl = rgbaToHsl(textColor)
      cssRules += `      --foreground: ${foregroundHsl} !important;\n`
    }
    // Also set border properties in ULTIMATE OVERRIDE for maximum specificity
    if (textInputStyle.borderColor && textInputStyle.borderColor.trim()) {
      const borderColorValue = textInputStyle.borderColor.trim()
      cssRules += `      border-color: ${borderColorValue} !important;\n`
      // Also set --border CSS variable for Tailwind classes
      // IMPORTANT: If the border color has an alpha channel, use it directly
      // because HSL conversion loses the alpha, making transparent colors appear opaque/black
      if (hasAlphaChannel(borderColorValue)) {
        cssRules += `      --border: ${borderColorValue} !important;\n`
        cssRules += `      --input: ${borderColorValue} !important;\n`
      } else {
        const borderHsl = rgbaToHsl(borderColorValue)
        cssRules += `      --border: ${borderHsl} !important;\n`
        cssRules += `      --input: ${borderHsl} !important;\n`
      }
      // Ensure width is set if borderColor is set but borderWidth is not explicitly set
      if (!textInputStyle.borderWidth || !textInputStyle.borderWidth.trim() || textInputStyle.borderWidth.trim() === '0px' || textInputStyle.borderWidth.trim() === '0') {
        cssRules += `      border-width: 1px !important;\n`
      } else {
        cssRules += `      border-width: ${textInputStyle.borderWidth.trim()} !important;\n`
      }
      // Ensure style is set
      if (!textInputStyle.borderStyle || !textInputStyle.borderStyle.trim()) {
        cssRules += `      border-style: solid !important;\n`
      } else {
        cssRules += `      border-style: ${textInputStyle.borderStyle.trim()} !important;\n`
      }
    }
    if (textInputStyle.borderWidth && textInputStyle.borderWidth.trim() &&
      textInputStyle.borderWidth.trim() !== '0px' && textInputStyle.borderWidth.trim() !== '0') {
      cssRules += `      border-width: ${textInputStyle.borderWidth.trim()} !important;\n`
    }
    if (textInputStyle.borderRadius) {
      cssRules += `      border-radius: ${textInputStyle.borderRadius.trim()} !important;\n`
    }
    if (textInputStyle.padding) {
      cssRules += `      padding: ${textInputStyle.padding.trim()} !important;\n`
    }
    if (textInputStyle.fontSize) {
      cssRules += `      font-size: ${textInputStyle.fontSize.trim()} !important;\n`
    }
    cssRules += `    }\n\n`
  } else {
    console.warn('[Branding] text-input style not found in componentStyling!')
    console.log('[Branding] Available component IDs:', Object.keys(branding.componentStyling || {}))
  }

  // Final aggressive override for textarea - must come after all component CSS to override globals.css
  // This uses maximum specificity to override globals.css rule: textarea { background-color: hsl(var(--border)) !important; }
  // Textarea should match text-input styling exactly, using text-input's padding and fontSize if textarea doesn't have its own
  // Note: textInputStyle and textareaStyle are already defined above where we set CSS variables, so we reuse them here
  if (textareaStyle) {
    console.log('[Branding] Final override for textarea:', textareaStyle)
    cssRules += `    /* Final override for textarea - MAXIMUM specificity to override globals.css */\n`
    cssRules += `    /* This must override: textarea { background-color: hsl(var(--border)) !important; } */\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) textarea,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) [data-component="textarea"] textarea,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) [class*="Textarea"] textarea,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) textarea.text-foreground,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) textarea.bg-border,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) textarea.bg-input,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) [data-component="textarea"] textarea,\n`
    cssRules += `    body:not([data-space]) body:not([data-space]) textarea[class*="Textarea"] {\n`
    if (textareaStyle.backgroundColor) {
      const bgColor = textareaStyle.backgroundColor.trim()
      cssRules += `      background: ${bgColor} !important;\n`
      cssRules += `      background-color: ${bgColor} !important;\n`
      cssRules += `      background-image: none !important;\n`
      // Override both --border and --input CSS variables (used by bg-border and bg-input classes)
      // IMPORTANT: If the background color has an alpha channel, use it directly
      // because HSL conversion loses the alpha, making transparent colors appear opaque/black
      if (hasAlphaChannel(bgColor)) {
        cssRules += `      --border: ${bgColor} !important;\n`
        cssRules += `      --input: ${bgColor} !important;\n`
        console.log('[Branding] Setting textarea background:', bgColor, '(using rgba directly)')
      } else {
        const borderHsl = rgbaToHsl(bgColor)
        cssRules += `      --border: ${borderHsl} !important;\n`
        cssRules += `      --input: ${borderHsl} !important;\n`
        console.log('[Branding] Setting textarea background:', bgColor, 'HSL:', borderHsl)
      }
    }
    if (textareaStyle.textColor) {
      const textColor = textareaStyle.textColor.trim()
      cssRules += `      color: ${textColor} !important;\n`
      // Also override CSS variable
      // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
      const foregroundHsl = rgbaToHsl(textColor)
      cssRules += `      --foreground: ${foregroundHsl} !important;\n`
      console.log('[Branding] Setting textarea text color:', textColor, 'HSL:', foregroundHsl)
    }
    if (textareaStyle.borderColor && textareaStyle.borderColor.trim()) {
      const borderColorValue = textareaStyle.borderColor.trim()
      cssRules += `      border-color: ${borderColorValue} !important;\n`
      console.log('[Branding] Setting textarea border-color:', borderColorValue, 'borderWidth:', textareaStyle.borderWidth)
      // Also set --border CSS variable for Tailwind classes
      // IMPORTANT: If the border color has an alpha channel, use it directly
      // because HSL conversion loses the alpha, making transparent colors appear opaque/black
      if (hasAlphaChannel(borderColorValue)) {
        cssRules += `      --border: ${borderColorValue} !important;\n`
        cssRules += `      --input: ${borderColorValue} !important;\n`
        console.log('[Branding] Using rgba border color directly (has alpha channel):', borderColorValue)
      } else {
        const borderHsl = rgbaToHsl(borderColorValue)
        cssRules += `      --border: ${borderHsl} !important;\n`
        cssRules += `      --input: ${borderHsl} !important;\n`
        console.log('[Branding] Converted border color to HSL:', borderHsl)
      }
      // Ensure width is set if borderColor is set but borderWidth is not explicitly set
      if (!textareaStyle.borderWidth || !textareaStyle.borderWidth.trim() || textareaStyle.borderWidth.trim() === '0px' || textareaStyle.borderWidth.trim() === '0') {
        // Default to 1px if color is set but no width
        cssRules += `      border-width: 1px !important;\n`
        console.log('[Branding] textarea borderWidth was missing/0, defaulting to 1px')
      }
      // Ensure style is set if borderColor is set but borderStyle is not explicitly set
      if (!textareaStyle.borderStyle || !textareaStyle.borderStyle.trim()) {
        cssRules += `      border-style: solid !important;\n`
        console.log('[Branding] textarea borderStyle was missing, defaulting to solid')
      }
    } else {
      console.warn('[Branding] textarea borderColor is missing or empty!', {
        hasBorderColor: !!textareaStyle.borderColor,
        borderColor: textareaStyle.borderColor
      })
    }
    if (textareaStyle.borderWidth && textareaStyle.borderWidth.trim()) {
      cssRules += `      border-width: ${textareaStyle.borderWidth.trim()} !important;\n`
      if (textareaStyle.borderWidth.trim() === '0px' || textareaStyle.borderWidth.trim() === '0') {
        cssRules += `      border: none !important;\n`
      }
    }
    if (textareaStyle.borderRadius) {
      cssRules += `      border-radius: ${textareaStyle.borderRadius.trim()} !important;\n`
    }
    // Use text-input's padding and fontSize to match text-input styling exactly
    const textareaPadding = textareaStyle.padding || textInputStyle?.padding
    const textareaFontSize = textareaStyle.fontSize || textInputStyle?.fontSize
    console.log('[Branding] textarea padding/fontSize:', {
      textareaPadding: textareaStyle.padding,
      textInputPadding: textInputStyle?.padding,
      finalPadding: textareaPadding,
      textareaFontSize: textareaStyle.fontSize,
      textInputFontSize: textInputStyle?.fontSize,
      finalFontSize: textareaFontSize
    })
    if (textareaPadding) {
      cssRules += `      padding: ${textareaPadding.trim()} !important;\n`
    }
    if (textareaFontSize) {
      cssRules += `      font-size: ${textareaFontSize.trim()} !important;\n`
    }
    if (textareaStyle.lineHeight) {
      cssRules += `      line-height: ${textareaStyle.lineHeight.trim()} !important;\n`
    }
    cssRules += `    }\n\n`

    // ULTIMATE OVERRIDE - Target ALL textareas with maximum specificity
    cssRules += `    /* ULTIMATE OVERRIDE - Maximum specificity for textareas */\n`
    cssRules += `    body:not([data-space]) textarea,\n`
    cssRules += `    body:not([data-space]) textarea.bg-border,\n`
    cssRules += `    body:not([data-space]) textarea.text-foreground,\n`
    cssRules += `    body:not([data-space]) textarea[class*="bg-border"],\n`
    cssRules += `    body:not([data-space]) textarea[class*="text-foreground"] {\n`
    if (textareaStyle.backgroundColor) {
      const bgColor = textareaStyle.backgroundColor.trim()
      cssRules += `      background: ${bgColor} !important;\n`
      cssRules += `      background-color: ${bgColor} !important;\n`
      cssRules += `      background-image: none !important;\n`
    }
    if (textareaStyle.textColor) {
      const textColor = textareaStyle.textColor.trim()
      cssRules += `      color: ${textColor} !important;\n`
      // Convert to HSL for --foreground
      // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
      const foregroundHsl = rgbaToHsl(textColor)
      cssRules += `      --foreground: ${foregroundHsl} !important;\n`
    }
    // Also set border properties in ULTIMATE OVERRIDE for maximum specificity
    if (textareaStyle.borderColor && textareaStyle.borderColor.trim()) {
      const borderColorValue = textareaStyle.borderColor.trim()
      cssRules += `      border-color: ${borderColorValue} !important;\n`
      // Also set --border CSS variable for Tailwind classes
      // IMPORTANT: If the border color has an alpha channel, use it directly
      // because HSL conversion loses the alpha, making transparent colors appear opaque/black
      if (hasAlphaChannel(borderColorValue)) {
        cssRules += `      --border: ${borderColorValue} !important;\n`
        cssRules += `      --input: ${borderColorValue} !important;\n`
      } else {
        const borderHsl = rgbaToHsl(borderColorValue)
        cssRules += `      --border: ${borderHsl} !important;\n`
        cssRules += `      --input: ${borderHsl} !important;\n`
      }
      // Ensure width is set if borderColor is set but borderWidth is not explicitly set
      if (!textareaStyle.borderWidth || !textareaStyle.borderWidth.trim() || textareaStyle.borderWidth.trim() === '0px' || textareaStyle.borderWidth.trim() === '0') {
        cssRules += `      border-width: 1px !important;\n`
      } else {
        cssRules += `      border-width: ${textareaStyle.borderWidth.trim()} !important;\n`
      }
      // Ensure style is set
      if (!textareaStyle.borderStyle || !textareaStyle.borderStyle.trim()) {
        cssRules += `      border-style: solid !important;\n`
      } else {
        cssRules += `      border-style: ${textareaStyle.borderStyle.trim()} !important;\n`
      }
    }
    if (textareaStyle.borderWidth && textareaStyle.borderWidth.trim() &&
      textareaStyle.borderWidth.trim() !== '0px' && textareaStyle.borderWidth.trim() !== '0') {
      cssRules += `      border-width: ${textareaStyle.borderWidth.trim()} !important;\n`
    }
    if (textareaStyle.borderRadius) {
      cssRules += `      border-radius: ${textareaStyle.borderRadius.trim()} !important;\n`
    }
    // Use text-input's padding and fontSize to match text-input styling exactly
    const textareaPaddingUltimate = textareaStyle.padding || textInputStyle?.padding
    const textareaFontSizeUltimate = textareaStyle.fontSize || textInputStyle?.fontSize
    if (textareaPaddingUltimate) {
      cssRules += `      padding: ${textareaPaddingUltimate.trim()} !important;\n`
    }
    if (textareaFontSizeUltimate) {
      cssRules += `      font-size: ${textareaFontSizeUltimate.trim()} !important;\n`
    }
    if (textareaStyle.lineHeight) {
      cssRules += `      line-height: ${textareaStyle.lineHeight.trim()} !important;\n`
    }
    cssRules += `    }\n\n`
  } else {
    console.warn('[Branding] textarea style not found in componentStyling!')
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

  // Also apply styles directly to existing input elements as a fallback
  // This ensures styles are applied even if CSS doesn't override properly
  const textInputStyleDirect = branding.componentStyling?.['text-input']
  if (textInputStyleDirect) {
    console.log('[Branding] Applying text-input styles directly to existing inputs (including number inputs)')

    // Use the shared rgbaToHsl function which handles hex, rgba/rgb, and hsl formats
    const colorToHsl = rgbaToHsl

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
          // IMPORTANT: If the background color has an alpha channel, use it directly
          // because HSL conversion loses the alpha, making transparent colors appear opaque/black
          if (hasAlphaChannel(bgColor)) {
            input.style.setProperty('--border', bgColor, 'important')
            input.style.setProperty('--input', bgColor, 'important')
          } else {
            const bgHsl = colorToHsl(bgColor)
            input.style.setProperty('--border', bgHsl, 'important')
            input.style.setProperty('--input', bgHsl, 'important')
          }
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
        if (textInputStyleDirect.borderColor && textInputStyleDirect.borderColor.trim()) {
          const borderColorValue = textInputStyleDirect.borderColor.trim()
          input.style.setProperty('border-color', borderColorValue, 'important')
          // Also set --border CSS variable for Tailwind classes
          // IMPORTANT: If the border color has an alpha channel, use it directly
          // because HSL conversion loses the alpha, making transparent colors appear opaque/black
          if (hasAlphaChannel(borderColorValue)) {
            input.style.setProperty('--border', borderColorValue, 'important')
            input.style.setProperty('--input', borderColorValue, 'important')
          } else {
            const borderHsl = colorToHsl(borderColorValue)
            input.style.setProperty('--border', borderHsl, 'important')
            input.style.setProperty('--input', borderHsl, 'important')
          }
          // Ensure width is set if borderColor is set but borderWidth is not explicitly set
          if (!textInputStyleDirect.borderWidth || !textInputStyleDirect.borderWidth.trim() ||
            textInputStyleDirect.borderWidth.trim() === '0px' || textInputStyleDirect.borderWidth.trim() === '0') {
            input.style.setProperty('border-width', '1px', 'important')
          }
          // Ensure style is set if borderColor is set but borderStyle is not explicitly set
          if (!textInputStyleDirect.borderStyle || !textInputStyleDirect.borderStyle.trim()) {
            input.style.setProperty('border-style', 'solid', 'important')
          }
        }
        if (textInputStyleDirect.borderWidth && textInputStyleDirect.borderWidth.trim() &&
          textInputStyleDirect.borderWidth.trim() !== '0px' && textInputStyleDirect.borderWidth.trim() !== '0') {
          input.style.setProperty('border-width', textInputStyleDirect.borderWidth.trim(), 'important')
        }
        if (textInputStyleDirect.borderStyle && textInputStyleDirect.borderStyle.trim()) {
          input.style.setProperty('border-style', textInputStyleDirect.borderStyle.trim(), 'important')
        }
        if (textInputStyleDirect.borderRadius) {
          input.style.setProperty('border-radius', textInputStyleDirect.borderRadius.trim(), 'important')
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

        ; (window as any).__textInputStyleObserver = observer
      console.log('[Branding] MutationObserver set up for text and number inputs')
    }
  }

  // Also apply form styles directly to existing form elements as a fallback
  const formStyleDirect = branding.componentStyling?.['form']
  if (formStyleDirect) {
    console.log('[Branding] Applying form styles directly to existing form elements')

    // Function to apply styles to a form element
    const applyFormStyles = (form: HTMLFormElement) => {
      if (!form.closest('[data-space]')) {
        // Apply background color
        if (formStyleDirect.backgroundColor) {
          const bgColor = formStyleDirect.backgroundColor.trim()
          form.style.setProperty('background-color', bgColor, 'important')
          form.style.setProperty('background', bgColor, 'important')
          form.style.setProperty('background-image', 'none', 'important')
        }

        // Apply border styles
        if (formStyleDirect.borderColor) {
          form.style.setProperty('border-color', formStyleDirect.borderColor.trim(), 'important')
          // Ensure width is set if color is set
          if (!formStyleDirect.borderWidth || !formStyleDirect.borderWidth.trim() ||
            formStyleDirect.borderWidth.trim() === '0px' || formStyleDirect.borderWidth.trim() === '0') {
            form.style.setProperty('border-width', '1px', 'important')
          }
        }
        if (formStyleDirect.borderWidth && formStyleDirect.borderWidth.trim() &&
          formStyleDirect.borderWidth.trim() !== '0px' && formStyleDirect.borderWidth.trim() !== '0') {
          form.style.setProperty('border-width', formStyleDirect.borderWidth.trim(), 'important')
        }
        if (formStyleDirect.borderStyle && formStyleDirect.borderStyle.trim()) {
          form.style.setProperty('border-style', formStyleDirect.borderStyle.trim(), 'important')
        } else if (formStyleDirect.borderColor || formStyleDirect.borderWidth) {
          form.style.setProperty('border-style', 'solid', 'important')
        }

        // Apply individual border sides
        if (formStyleDirect.borderTopColor) {
          form.style.setProperty('border-top-color', formStyleDirect.borderTopColor.trim(), 'important')
          if (!formStyleDirect.borderTopWidth || !formStyleDirect.borderTopWidth.trim()) {
            form.style.setProperty('border-top-width', formStyleDirect.borderWidth?.trim() || '1px', 'important')
          }
        }
        if (formStyleDirect.borderTopWidth && formStyleDirect.borderTopWidth.trim()) {
          form.style.setProperty('border-top-width', formStyleDirect.borderTopWidth.trim(), 'important')
        }
        if (formStyleDirect.borderTopStyle && formStyleDirect.borderTopStyle.trim()) {
          form.style.setProperty('border-top-style', formStyleDirect.borderTopStyle.trim(), 'important')
        }

        if (formStyleDirect.borderRightColor) {
          form.style.setProperty('border-right-color', formStyleDirect.borderRightColor.trim(), 'important')
          if (!formStyleDirect.borderRightWidth || !formStyleDirect.borderRightWidth.trim()) {
            form.style.setProperty('border-right-width', formStyleDirect.borderWidth?.trim() || '1px', 'important')
          }
        }
        if (formStyleDirect.borderRightWidth && formStyleDirect.borderRightWidth.trim()) {
          form.style.setProperty('border-right-width', formStyleDirect.borderRightWidth.trim(), 'important')
        }
        if (formStyleDirect.borderRightStyle && formStyleDirect.borderRightStyle.trim()) {
          form.style.setProperty('border-right-style', formStyleDirect.borderRightStyle.trim(), 'important')
        }

        if (formStyleDirect.borderBottomColor) {
          form.style.setProperty('border-bottom-color', formStyleDirect.borderBottomColor.trim(), 'important')
          if (!formStyleDirect.borderBottomWidth || !formStyleDirect.borderBottomWidth.trim()) {
            form.style.setProperty('border-bottom-width', formStyleDirect.borderWidth?.trim() || '1px', 'important')
          }
        }
        if (formStyleDirect.borderBottomWidth && formStyleDirect.borderBottomWidth.trim()) {
          form.style.setProperty('border-bottom-width', formStyleDirect.borderBottomWidth.trim(), 'important')
        }
        if (formStyleDirect.borderBottomStyle && formStyleDirect.borderBottomStyle.trim()) {
          form.style.setProperty('border-bottom-style', formStyleDirect.borderBottomStyle.trim(), 'important')
        }

        if (formStyleDirect.borderLeftColor) {
          form.style.setProperty('border-left-color', formStyleDirect.borderLeftColor.trim(), 'important')
          if (!formStyleDirect.borderLeftWidth || !formStyleDirect.borderLeftWidth.trim()) {
            form.style.setProperty('border-left-width', formStyleDirect.borderWidth?.trim() || '1px', 'important')
          }
        }
        if (formStyleDirect.borderLeftWidth && formStyleDirect.borderLeftWidth.trim()) {
          form.style.setProperty('border-left-width', formStyleDirect.borderLeftWidth.trim(), 'important')
        }
        if (formStyleDirect.borderLeftStyle && formStyleDirect.borderLeftStyle.trim()) {
          form.style.setProperty('border-left-style', formStyleDirect.borderLeftStyle.trim(), 'important')
        }

        // Apply other styles
        if (formStyleDirect.borderRadius) {
          form.style.setProperty('border-radius', formStyleDirect.borderRadius.trim(), 'important')
        }
        if (formStyleDirect.padding) {
          form.style.setProperty('padding', formStyleDirect.padding.trim(), 'important')
        }
        if (formStyleDirect.margin) {
          form.style.setProperty('margin', formStyleDirect.margin.trim(), 'important')
        }
      }
    }

    // Apply to existing forms immediately and after delays
    const applyToExistingForms = () => {
      const forms = document.querySelectorAll('body:not([data-space]) form')
      forms.forEach((form: Element) => {
        applyFormStyles(form as HTMLFormElement)
      })
      console.log(`[Branding] Applied styles directly to ${forms.length} form elements`)
    }

    // Apply immediately
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        applyToExistingForms()
        setTimeout(applyToExistingForms, 0)
        setTimeout(applyToExistingForms, 50)
        setTimeout(applyToExistingForms, 100)
        setTimeout(applyToExistingForms, 300)
        setTimeout(applyToExistingForms, 500)
        setTimeout(applyToExistingForms, 1000)
      })
    }

    // Use MutationObserver to apply styles to dynamically created forms
    if (typeof window !== 'undefined' && !(window as any).__formStyleObserver) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node as Element
              // Check if it's a form or contains forms
              const forms = element.matches && element.matches('form')
                ? [element as HTMLFormElement]
                : Array.from(element.querySelectorAll?.('form') || []) as HTMLFormElement[]

              forms.forEach((form) => {
                applyFormStyles(form)
              })
            }
          })
        })
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

        ; (window as any).__formStyleObserver = observer
      console.log('[Branding] MutationObserver set up for forms')
    }
  }

  // Set the CSS content
  styleElement.textContent = cssRules

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

  // Debug: Log if form CSS was generated
  const hasFormCSS = cssRules.includes('form') && (cssRules.includes('body:not([data-space]) form') || cssRules.includes('[data-component="form"]'))
  if (hasFormCSS) {
    console.log('[Branding] Form CSS generated. Length:', cssRules.length)
    const formMatch = cssRules.match(/body:not\(\[data-space\]\) form[\s\S]*?\{[\s\S]*?\}/)
    if (formMatch) {
      console.log('[Branding] Form CSS sample:', formMatch[0].substring(0, 500))
    }
    // Check if form styling config exists
    if (branding.componentStyling?.['form']) {
      const formStyle = branding.componentStyling['form']
      console.log('[Branding] Form config:', {
        backgroundColor: formStyle.backgroundColor,
        borderColor: formStyle.borderColor,
        borderWidth: formStyle.borderWidth,
        borderStyle: formStyle.borderStyle,
        borderRadius: formStyle.borderRadius,
        padding: formStyle.padding,
        margin: formStyle.margin
      })
      // Check if border properties are in the CSS
      if (formStyle.borderColor) {
        const borderColorInCSS = cssRules.includes(`border-color: ${formStyle.borderColor.trim()}`) ||
          cssRules.includes(`border-top-color: ${formStyle.borderColor.trim()}`) ||
          cssRules.includes(`border-bottom-color: ${formStyle.borderColor.trim()}`)
        console.log('[Branding] Form borderColor in CSS:', borderColorInCSS, 'Value:', formStyle.borderColor)
      }
      if (formStyle.borderWidth) {
        const borderWidthInCSS = cssRules.includes(`border-width: ${formStyle.borderWidth.trim()}`) ||
          cssRules.includes(`border-top-width: ${formStyle.borderWidth.trim()}`) ||
          cssRules.includes(`border-bottom-width: ${formStyle.borderWidth.trim()}`)
        console.log('[Branding] Form borderWidth in CSS:', borderWidthInCSS, 'Value:', formStyle.borderWidth)
      }
    }
  } else {
    console.warn('[Branding] Form CSS NOT found in generated CSS!')
    console.log('[Branding] Available component IDs:', Object.keys(branding.componentStyling || {}))
    if (branding.componentStyling?.['form']) {
      console.log('[Branding] Form config exists:', branding.componentStyling['form'])
      console.log('[Branding] Form hasStyles check:', {
        hasBorderColor: !!branding.componentStyling['form'].borderColor,
        hasBorderWidth: !!branding.componentStyling['form'].borderWidth,
        hasBorderStyle: !!branding.componentStyling['form'].borderStyle,
        hasBackgroundColor: !!branding.componentStyling['form'].backgroundColor,
        hasPadding: !!branding.componentStyling['form'].padding,
        hasMargin: !!branding.componentStyling['form'].margin
      })
    } else {
      // Form component styling is optional - this is expected if not defined in theme config
      // console.log('[Branding] Form component styling not found in branding.componentStyling (optional)')
    }
  }
}

/**
 * Apply drawer overlay settings
 */
