/**
 * Design Tokens
 * Centralized spacing, typography, and sizing values for the application
 * These values are optimized for a modern, compact tech application
 */

export const SPACING = {
  // Ultra compact spacing scale (reduced from default Tailwind)
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  base: '1rem',     // 16px
  lg: '1.25rem',    // 20px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  '3xl': '2.5rem',  // 40px
  '4xl': '3rem',    // 48px
} as const

export const FONT_SIZES = {
  // Optimized font size scale
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
} as const

export const LINE_HEIGHTS = {
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const

export const BORDER_RADIUS = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  full: '9999px',
} as const

export const CONTAINER_PADDING = {
  mobile: '1rem',   // 16px (reduced from 2rem)
  desktop: '1.5rem', // 24px (reduced from 2rem)
} as const

// Common component spacing
export const COMPONENT_SPACING = {
  // Input/Form elements
  inputPadding: SPACING.sm,      // 8px
  inputHeight: '2rem',           // 32px
  inputGap: SPACING.xs,         // 4px
  
  // Cards/Panels
  cardPadding: SPACING.base,    // 16px
  cardGap: SPACING.md,           // 12px
  
  // Buttons
  buttonPaddingX: SPACING.base, // 16px
  buttonPaddingY: SPACING.sm,   // 8px
  buttonGap: SPACING.xs,        // 4px
  
  // Sidebar/Navigation
  sidebarPadding: SPACING.md,   // 12px
  navItemPadding: SPACING.sm,   // 8px
  navItemGap: SPACING.xs,       // 4px
  
  // Content areas
  contentPadding: SPACING.base, // 16px
  sectionGap: SPACING.lg,        // 20px
  elementGap: SPACING.md,        // 12px
} as const

