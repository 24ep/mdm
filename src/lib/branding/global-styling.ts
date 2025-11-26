/**
 * Global styling functions
 * Applies global styling to buttons, inputs, selects, and textareas
 * Excludes space modules by checking for space-specific classes/attributes
 */

import { BrandingConfig } from '@/app/admin/features/system/types'

function loadGoogleFont(fontFamily: string) {
  if (!fontFamily) return;
  const linkId = 'branding-google-font';
  let linkElement = document.getElementById(linkId) as HTMLLinkElement;

  if (!linkElement) {
    linkElement = document.createElement('link');
    linkElement.id = linkId;
    linkElement.rel = 'stylesheet';
    document.head.appendChild(linkElement);
  }

  const formattedFont = fontFamily.replace(/\s+/g, '+');
  linkElement.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@300;400;500;600;700&display=swap`;
}

export function applyGlobalStyling(branding: BrandingConfig) {
  const root = document.documentElement
  const styling = branding.globalStyling

  // Set CSS variables for global styling
  root.style.setProperty('--brand-border-radius', styling.borderRadius)
  // Trim and validate borderColor to ensure rgba values work correctly
  // Handle both with and without spaces: rgba(0,0,0,0.1) or rgba(0, 0, 0, 0.1)
  // Also handle empty strings and undefined values
  const borderColor = (styling.borderColor && styling.borderColor.trim() && styling.borderColor.trim().length > 0)
    ? styling.borderColor.trim() 
    : (branding.uiBorderColor && branding.uiBorderColor.trim() && branding.uiBorderColor.trim().length > 0)
      ? branding.uiBorderColor.trim()
      : 'rgba(0, 0, 0, 0.1)'
  
  // Debug logging to help diagnose issues
  if (!styling.borderColor || !styling.borderColor.trim()) {
    console.warn('[Branding] Global styling borderColor is missing or empty, using fallback:', borderColor)
  }
  
  root.style.setProperty('--brand-border-color', borderColor)
  root.style.setProperty('--brand-border-width', styling.borderWidth)
  root.style.setProperty('--brand-button-border-radius', styling.buttonBorderRadius)
  root.style.setProperty('--brand-button-border-width', styling.buttonBorderWidth)
  root.style.setProperty('--brand-input-border-radius', styling.inputBorderRadius)
  root.style.setProperty('--brand-input-border-width', styling.inputBorderWidth)
  root.style.setProperty('--brand-select-border-radius', styling.selectBorderRadius)
  root.style.setProperty('--brand-select-border-width', styling.selectBorderWidth)
  root.style.setProperty('--brand-textarea-border-radius', styling.textareaBorderRadius || null)
  root.style.setProperty('--brand-textarea-border-width', styling.textareaBorderWidth || null)

  // Apply font families
  if (styling.fontFamily && styling.fontFamily.trim()) {
    const fontFamily = styling.fontFamily.trim();
    // Only load Google Font if it's not a system font stack
    if (!fontFamily.includes('-apple-system') && !fontFamily.includes('system')) {
      loadGoogleFont(fontFamily);
    }
    root.style.setProperty('--brand-font-family', fontFamily);
    document.body.style.fontFamily = fontFamily;
  } else {
    root.style.removeProperty('--brand-font-family');
    document.body.style.fontFamily = '';
  }

  // Apply monospaced font for prompts/parameters
  if (styling.fontFamilyMono && styling.fontFamilyMono.trim()) {
    root.style.setProperty('--brand-font-family-mono', styling.fontFamilyMono.trim());
  } else {
    root.style.setProperty('--brand-font-family-mono', '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace');
  }

  // Apply transition settings
  if (styling.transitionDuration) {
    root.style.setProperty('--brand-transition-duration', styling.transitionDuration);
  } else {
    root.style.setProperty('--brand-transition-duration', '200ms');
  }
  if (styling.transitionTiming) {
    root.style.setProperty('--brand-transition-timing', styling.transitionTiming);
  } else {
    root.style.setProperty('--brand-transition-timing', 'cubic-bezier(0.4, 0, 0.2, 1)');
  }

  // Apply shadow variables
  if (styling.shadowSm) root.style.setProperty('--brand-shadow-sm', styling.shadowSm);
  if (styling.shadowMd) root.style.setProperty('--brand-shadow-md', styling.shadowMd);
  if (styling.shadowLg) root.style.setProperty('--brand-shadow-lg', styling.shadowLg);
  if (styling.shadowXl) root.style.setProperty('--brand-shadow-xl', styling.shadowXl);

  // Inject CSS that applies to platform components but excludes space modules
  // Space modules typically have [data-space] attribute or are within [space] routes
  const styleId = 'branding-global-styling'
  let styleElement = document.getElementById(styleId) as HTMLStyleElement

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = styleId
    document.head.appendChild(styleElement)
  }

  // Inject animations and micro-interactions CSS
  const animationStyleId = 'branding-animations'
  let animationStyleElement = document.getElementById(animationStyleId) as HTMLStyleElement
  if (!animationStyleElement) {
    animationStyleElement = document.createElement('style')
    animationStyleElement.id = animationStyleId
    document.head.appendChild(animationStyleElement)
  }

  // CSS that excludes space modules (elements with [data-space] or within [space] routes)
  // Also excludes platform sidebar, top menu bar, and navigation elements
  styleElement.textContent = `
    /* Global styling - excludes space modules, platform sidebar, top menu bar, and navigation */
    /* Apply to buttons that are NOT inside platform sidebar, top menu bar, or navigation */
    body:not([data-space]) button:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"]):not([data-component="color-input-trigger"]):not([data-component="accordion-trigger"]):not(.color-input-trigger):not(.solid-color-swatch-button):not(.color-set-selector):not(.color-palette-swatch),
    body:not([data-space]) [role="button"]:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"]):not([data-component="color-input-trigger"]):not([data-component="accordion-trigger"]):not(.color-input-trigger):not(.solid-color-swatch-button):not(.color-set-selector):not(.color-palette-swatch),
    body:not([data-space]) .btn:not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([data-component="select-trigger"]):not([data-component="color-input-trigger"]):not([data-component="accordion-trigger"]):not(.color-input-trigger):not(.solid-color-swatch-button):not(.color-set-selector):not(.color-palette-swatch),
    body:not([data-space]) [class*="button"]:not([data-space]):not([data-space] *):not(.platform-sidebar-menu-button):not(.platform-sidebar-menu-button-active):not([role="tab"]):not([data-component="select-trigger"]):not([data-component="color-input-trigger"]):not([data-component="accordion-trigger"]):not(.color-input-trigger):not(.solid-color-swatch-button):not(.color-set-selector):not(.color-palette-swatch) {
      border-radius: var(--brand-button-border-radius, ${styling.buttonBorderRadius}) !important;
      border-width: var(--brand-button-border-width, ${styling.buttonBorderWidth}) !important;
      border-color: var(--brand-border-color, ${borderColor}) !important;
      border-style: solid !important;
    }
    
    /* Explicitly exclude buttons inside platform sidebar, top menu bar, and navigation elements */
    /* These rules come AFTER to override the general button styling above */
    /* Using higher specificity by including attribute selectors */
    body:not([data-space]) [data-sidebar] button,
    body:not([data-space]) [data-sidebar="primary"] button,
    body:not([data-space]) [data-sidebar="secondary"] button,
    body:not([data-space]) [data-sidebar] [role="button"],
    body:not([data-space]) [data-sidebar="primary"] [role="button"],
    body:not([data-space]) [data-sidebar="secondary"] [role="button"],
    body:not([data-space]) [data-sidebar] .btn,
    body:not([data-space]) [data-sidebar="primary"] .btn,
    body:not([data-space]) [data-sidebar="secondary"] .btn,
    body:not([data-space]) [data-sidebar] [class*="button"],
    body:not([data-space]) [data-sidebar="primary"] [class*="button"],
    body:not([data-space]) [data-sidebar="secondary"] [class*="button"],
    body:not([data-space]) [data-component="platform-sidebar"] button,
    body:not([data-space]) [data-component="platform-sidebar"] [role="button"],
    body:not([data-space]) [data-component="platform-sidebar"] .btn,
    body:not([data-space]) [data-component="platform-sidebar"] [class*="button"],
    body:not([data-space]) [data-component="top-menu-bar"] button,
    body:not([data-space]) [data-component="top-menu-bar"] [role="button"],
    body:not([data-space]) [data-component="top-menu-bar"] .btn,
    body:not([data-space]) [data-component="top-menu-bar"] [class*="button"],
    body:not([data-space]) .platform-sidebar-menu-button,
    body:not([data-space]) .platform-sidebar-menu-button-active,
    body:not([data-space]) .platform-sidebar-menu-button.platform-sidebar-menu-button-active,
    body:not([data-space]) [role="tablist"][aria-orientation="vertical"] [role="tab"],
    body:not([data-space]) [role="tablist"][aria-orientation="vertical"] button[role="tab"],
    body:not([data-space]) button[data-component="accordion-trigger"],
    body:not([data-space]) [data-component="accordion-trigger"] {
      /* Reset button styling - these use their own component-specific styling */
      border-radius: revert !important;
      border-width: revert !important;
      border-color: revert !important;
      border-style: revert !important;
    }
    
    body:not([data-space]) input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]),
    body:not([data-space]) input[type="text"],
    body:not([data-space]) input[type="email"],
    body:not([data-space]) input[type="password"],
    body:not([data-space]) input[type="number"],
    body:not([data-space]) input[type="search"],
    body:not([data-space]) input[type="tel"],
    body:not([data-space]) input[type="url"] {
      border-radius: var(--brand-input-border-radius, ${styling.inputBorderRadius}) !important;
      border-width: var(--brand-input-border-width, ${styling.inputBorderWidth}) !important;
      border-color: var(--brand-border-color, ${borderColor}) !important;
      border-style: solid !important;
    }
    
    body:not([data-space]) select,
    body:not([data-space]) [role="combobox"] {
      border-radius: var(--brand-select-border-radius, ${styling.selectBorderRadius}) !important;
      border-width: var(--brand-select-border-width, ${styling.selectBorderWidth}) !important;
      border-color: var(--brand-border-color, ${borderColor}) !important;
      border-style: solid !important;
    }
    
    body:not([data-space]) textarea {
      border-radius: var(--brand-textarea-border-radius, ${styling.textareaBorderRadius}) !important;
      border-width: var(--brand-textarea-border-width, ${styling.textareaBorderWidth}) !important;
      border-color: var(--brand-border-color, ${borderColor}) !important;
      border-style: solid !important;
    }
    
    /* Exclude space studio and space-specific components */
    [data-space],
    [data-space] *,
    [class*="space-studio"],
    [class*="space-studio"] *,
    [id*="space-"],
    [id*="space-"] * {
      /* Reset to default - space modules use their own styling */
    }

    /* Apply smooth transitions for micro-interactions */
    body:not([data-space]) button,
    body:not([data-space]) [role="button"],
    body:not([data-space]) input,
    body:not([data-space]) select,
    body:not([data-space]) textarea,
    body:not([data-space]) [class*="card"],
    body:not([data-space]) [role="switch"],
    body:not([data-space]) input[type="checkbox"],
    body:not([data-space]) input[type="radio"] {
      transition: all var(--brand-transition-duration, 200ms) var(--brand-transition-timing, cubic-bezier(0.4, 0, 0.2, 1)) !important;
    }

    /* Hover micro-interactions */
    body:not([data-space]) button:hover:not([class*="bg-secondary"]):not([class*="secondary"]):not([class*="ghost"]):not([class*="hover:bg-accent"]),
    body:not([data-space]) [role="button"]:hover:not([class*="bg-secondary"]):not([class*="secondary"]):not([class*="ghost"]):not([class*="hover:bg-accent"]) {
      transform: translateY(-1px);
      box-shadow: var(--brand-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
    }
    
    /* Secondary buttons - no shadow in all states */
    body:not([data-space]) button[class*="bg-secondary"],
    body:not([data-space]) button[class*="bg-secondary"]:hover,
    body:not([data-space]) button[class*="bg-secondary"]:active,
    body:not([data-space]) button[class*="bg-secondary"]:focus,
    body:not([data-space]) button[class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]),
    body:not([data-space]) button[class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):hover,
    body:not([data-space]) button[class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):active,
    body:not([data-space]) button[class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):focus,
    body:not([data-space]) [role="button"][class*="bg-secondary"],
    body:not([data-space]) [role="button"][class*="bg-secondary"]:hover,
    body:not([data-space]) [role="button"][class*="bg-secondary"]:active,
    body:not([data-space]) [role="button"][class*="bg-secondary"]:focus,
    body:not([data-space]) [role="button"][class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]),
    body:not([data-space]) [role="button"][class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):hover,
    body:not([data-space]) [role="button"][class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):active,
    body:not([data-space]) [role="button"][class*="secondary"]:not([class*="bg-primary"]):not([class*="bg-destructive"]):focus {
      box-shadow: none !important;
      transform: none !important;
    }

    body:not([data-space]) button:active:not([class*="bg-secondary"]):not([class*="secondary"]),
    body:not([data-space]) [role="button"]:active:not([class*="bg-secondary"]):not([class*="secondary"]) {
      transform: translateY(0);
    }

    /* Focus states with soft blue highlight */
    body:not([data-space]) input:focus,
    body:not([data-space]) select:focus,
    body:not([data-space]) textarea:focus {
      outline: 2px solid var(--brand-primary, #007AFF);
      outline-offset: 2px;
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }

    /* Override Tailwind border classes for platform sidebars - ensure borderless */
    body:not([data-space]) [data-sidebar="primary"],
    body:not([data-space]) [data-sidebar="secondary"] {
      border-right: none !important;
      border-left: none !important;
      border-top: none !important;
      border-bottom: none !important;
      border: none !important;
    }
  `

  // Apply tooltip animations (macOS Sonoma style)
  animationStyleElement.textContent = `
    /* Tooltip micro-animations - macOS Sonoma style */
    @keyframes tooltipFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes tooltipFadeOut {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(-4px) scale(0.95);
      }
    }

    body:not([data-space]) [role="tooltip"],
    body:not([data-space]) [data-radix-tooltip-content],
    body:not([data-space]) .tooltip-content {
      animation: tooltipFadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(20px) saturate(180%);
      box-shadow: var(--brand-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
    }

    /* Monospaced font for prompts and parameters */
    body:not([data-space]) code,
    body:not([data-space]) pre,
    body:not([data-space]) [class*="prompt"],
    body:not([data-space]) [class*="parameter"],
    body:not([data-space]) [data-type="code"],
    body:not([data-space]) [data-type="prompt"] {
      font-family: var(--brand-font-family-mono, "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace);
    }

    /* Global text color for body and main content areas (excluding space modules) */
    body:not([data-space]) {
      color: var(--brand-body-text, inherit);
    }
    
    /* Apply text color to common text elements (but allow component-specific overrides) */
    body:not([data-space]) p:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) span:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) div:not([data-component]):not([class*="sidebar"]):not([class*="menu"]):not([role="button"]):not([role="tab"]),
    body:not([data-space]) h1:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) h2:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) h3:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) h4:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) h5:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) h6:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) label:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) td:not([data-component]):not([class*="sidebar"]):not([class*="menu"]),
    body:not([data-space]) th:not([data-component]):not([class*="sidebar"]):not([class*="menu"]) {
      color: var(--brand-body-text, inherit);
    }
  `
}

