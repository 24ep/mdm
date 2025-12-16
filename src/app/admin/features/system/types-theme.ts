// Theme Management Types
// 
// DEPRECATED: This file is kept for backward compatibility.
// New code should import from '@/lib/theme-types' instead.
// 
// This file re-exports types from the consolidated theme-types module.

export type {
    Theme,
    ThemeListItem,
    BrandingConfig,
    CreateThemeInput,
    UpdateThemeInput,
    ImportThemeInput,
    ExportThemeOutput,
} from '@/lib/theme-types'

// Re-export validation functions
export {
    validateBrandingConfig,
    validateTheme,
    validateThemeListItem,
    safeParseBrandingConfig,
    safeParseTheme,
    safeParseThemeListItem,
} from '@/lib/theme-types'
