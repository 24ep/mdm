/**
 * Consolidated theme types
 * Single source of truth for all theme-related TypeScript types
 * 
 * This file re-exports types from the schema file to maintain consistency
 */

// Re-export all types from schemas
export type {
  BrandingConfig,
  Theme,
  ThemeListItem,
  CreateThemeInput,
  UpdateThemeInput,
  ImportThemeInput,
  ExportThemeOutput,
} from './theme-schemas'

// Re-export validation functions
export {
  validateBrandingConfig,
  validateTheme,
  validateThemeListItem,
  safeParseBrandingConfig,
  safeParseTheme,
  safeParseThemeListItem,
  BrandingConfigSchema,
  ThemeSchema,
  ThemeListItemSchema,
  CreateThemeInputSchema,
  UpdateThemeInputSchema,
  ImportThemeInputSchema,
  ExportThemeOutputSchema,
} from './theme-schemas'

// Client-side theme config (for theme variants)
export type { ThemeConfig, ThemeVariant } from './themes'
export { lightThemes, darkThemes, allThemes, getThemeById, getThemesByMode, getThemeByVariant } from './themes'

