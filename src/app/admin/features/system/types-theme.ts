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

// Legacy interface definitions (deprecated - use types from '@/lib/theme-types')
export interface Theme {
    id: string
    name: string
    description?: string
    themeMode: 'light' | 'dark' // Each theme is either light or dark
    tags: string[] // Array of tags for filtering (e.g., ["light", "macos", "premium"])
    isActive: boolean
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
    config: BrandingConfig
    previewColors?: {
        primary: string
        secondary: string
        background: string
        surface: string
    }
}

export interface ThemeListItem {
    id: string
    name: string
    description?: string
    themeMode: 'light' | 'dark'
    tags: string[] // Array of tags for filtering
    isActive: boolean
    isDefault: boolean
    updatedAt: Date
    previewColors: {
        primary: string
        secondary: string
        background: string
        surface: string
    }
}

export interface CreateThemeInput {
    name: string
    description?: string
    config?: Partial<BrandingConfig>
    cloneFromId?: string // If cloning from another theme
}

export interface UpdateThemeInput {
    name?: string
    description?: string
    tags?: string[] // Update tags
    config?: Partial<BrandingConfig>
}

export interface ImportThemeInput {
    name: string
    description?: string
    format: 'json' | 'yaml'
    content: string
}

export interface ExportThemeOutput {
    theme: {
        name: string
        description?: string
        version: string
        exportedAt: string
    }
    config: BrandingConfig
}

// BrandingConfig - flattened structure, no light/dark separation
// Each theme is either light or dark, determined by theme.themeMode
export interface BrandingConfig {
    applicationName: string
    applicationLogo: string
    applicationLogoType: 'image' | 'icon'
    applicationLogoIcon?: string
    applicationLogoIconColor?: string
    applicationLogoBackgroundColor?: string

    // Colors - single set per theme (theme determines if it's light or dark)
    primaryColor: string
    secondaryColor: string
    warningColor: string
    dangerColor: string
    uiBackgroundColor: string
    uiBorderColor: string
    bodyBackgroundColor: string
    topMenuBackgroundColor: string
    topMenuTextColor: string
    platformSidebarBackgroundColor: string
    platformSidebarTextColor: string
    secondarySidebarBackgroundColor: string
    secondarySidebarTextColor: string
    bodyTextColor?: string // Global text/foreground color for body content

    loginBackground: {
        type: 'color' | 'gradient' | 'image'
        color?: string
        gradient?: {
            from: string
            to: string
            angle: number
        }
        image?: string
    }

    googleFontsApiKey?: string

    globalStyling: {
        fontFamily: string
        fontFamilyMono?: string
        borderRadius: string
        borderColor: string
        borderWidth: string
        buttonBorderRadius: string
        buttonBorderWidth: string
        inputBorderRadius: string
        inputBorderWidth: string
        selectBorderRadius: string
        selectBorderWidth: string
        textareaBorderRadius?: string
        textareaBorderWidth?: string
        transitionDuration?: string
        transitionTiming?: string
        shadowSm?: string
        shadowMd?: string
        shadowLg?: string
        shadowXl?: string
    }

    drawerOverlay: {
        color: string
        opacity: number
        blur: number
    }

    drawerStyle: {
        type: 'normal' | 'modern' | 'floating'
        margin?: string // Margin for modern/floating styles (e.g., "16px", "24px")
        borderRadius?: string // Border radius for modern/floating styles (e.g., "12px")
        width?: string // Custom width override (e.g., "500px", "600px")
    }

    // Component styling - flattened, no light/dark separation
    componentStyling: {
        [key: string]: {
            backgroundColor?: string
            textColor?: string
            borderColor?: string
            borderRadius?: string
            borderWidth?: string
            borderStyle?: string
            // Individual border sides - separate color, width, and style for each side
            borderTopColor?: string
            borderRightColor?: string
            borderBottomColor?: string
            borderLeftColor?: string
            borderTopWidth?: string
            borderRightWidth?: string
            borderBottomWidth?: string
            borderLeftWidth?: string
            borderTopStyle?: string
            borderRightStyle?: string
            borderBottomStyle?: string
            borderLeftStyle?: string
      padding?: string
      margin?: string
      marginTop?: string // For separator component
      marginBottom?: string // For separator component
      width?: string
            height?: string
            minWidth?: string
            maxWidth?: string
            minHeight?: string
            maxHeight?: string
            fontSize?: string
            fontWeight?: string
            fontStyle?: string
            fontFamily?: string
            letterSpacing?: string
            lineHeight?: string
            textAlign?: string
            textTransform?: string
            textDecoration?: string
            // Text decoration line styling (for underline, overline, line-through)
            textDecorationColor?: string
            textDecorationThickness?: string // Line weight/thickness
            textDecorationStyle?: string // solid, double, dotted, dashed, wavy
            textUnderlineOffset?: string // Margin/offset for underline
            textUnderlinePosition?: string // auto, under, left, right
            opacity?: string
            backdropFilter?: string
            boxShadow?: string
            filter?: string
            transform?: string
            cursor?: string
            outline?: string
            outlineColor?: string
            outlineWidth?: string
            gap?: string
            zIndex?: string
            overflow?: string
            overflowX?: string
            overflowY?: string
            whiteSpace?: string
            wordBreak?: string
            textOverflow?: string
            visibility?: string
            pointerEvents?: string
            userSelect?: string
            transition?: string
        }
    }
}
