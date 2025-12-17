/**
 * Centralized constants for theme management
 * All theme-related constants should be defined here
 */

export const THEME_STORAGE_KEYS = {
  /**
   * Client-side theme variant ID (e.g., "light-default", "dark-blue")
   * Used by ThemeContext for color scheme variants
   */
  VARIANT_ID: 'theme-variant-id',
  /**
   * Database theme UUID - stores the active database theme ID
   * Used by BrandingInitializer for branding configuration
   */
  DATABASE_THEME_ID: 'theme-database-id',
  /**
   * Theme mode preference (light/dark/system)
   */
  MODE: 'theme-mode',
  /**
   * Timestamp of last theme application
   */
  LAST_APPLIED: 'theme-last-applied',
} as const

export const THEME_DEFAULTS = {
  MODE: 'light' as const,
  VARIANT: 'default' as const,
} as const

export const THEME_ERROR_MESSAGES = {
  INVALID_THEME: 'Invalid theme configuration',
  THEME_NOT_FOUND: 'Theme not found',
  FAILED_TO_LOAD: 'Failed to load theme',
  FAILED_TO_APPLY: 'Failed to apply theme',
} as const

export const THEME_VERSION = '1.0.0' as const

