/**
 * Zod schemas for theme validation
 * Provides runtime type safety for theme configuration
 */

import { z } from 'zod'

// Component styling schema - flexible object with optional CSS properties
const ComponentStylingSchema = z.record(
  z.string(),
  z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    borderColor: z.string().optional(),
    borderRadius: z.string().optional(),
    borderWidth: z.string().optional(),
    borderStyle: z.string().optional(),
    borderTopColor: z.string().optional(),
    borderRightColor: z.string().optional(),
    borderBottomColor: z.string().optional(),
    borderLeftColor: z.string().optional(),
    borderTopWidth: z.string().optional(),
    borderRightWidth: z.string().optional(),
    borderBottomWidth: z.string().optional(),
    borderLeftWidth: z.string().optional(),
    borderTopStyle: z.string().optional(),
    borderRightStyle: z.string().optional(),
    borderBottomStyle: z.string().optional(),
    borderLeftStyle: z.string().optional(),
    padding: z.string().optional(),
    margin: z.string().optional(),
    marginTop: z.string().optional(),
    marginBottom: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    minWidth: z.string().optional(),
    maxWidth: z.string().optional(),
    minHeight: z.string().optional(),
    maxHeight: z.string().optional(),
    fontSize: z.string().optional(),
    fontWeight: z.string().optional(),
    fontStyle: z.string().optional(),
    fontFamily: z.string().optional(),
    letterSpacing: z.string().optional(),
    lineHeight: z.string().optional(),
    textAlign: z.string().optional(),
    textTransform: z.string().optional(),
    textDecoration: z.string().optional(),
    textDecorationColor: z.string().optional(),
    textDecorationThickness: z.string().optional(),
    textDecorationStyle: z.string().optional(),
    textUnderlineOffset: z.string().optional(),
    textUnderlinePosition: z.string().optional(),
    opacity: z.string().optional(),
    backdropFilter: z.string().optional(),
    boxShadow: z.string().optional(),
    filter: z.string().optional(),
    transform: z.string().optional(),
    cursor: z.string().optional(),
    outline: z.string().optional(),
    outlineColor: z.string().optional(),
    outlineWidth: z.string().optional(),
    gap: z.string().optional(),
    zIndex: z.string().optional(),
    overflow: z.string().optional(),
    overflowX: z.string().optional(),
    overflowY: z.string().optional(),
    whiteSpace: z.string().optional(),
    wordBreak: z.string().optional(),
    textOverflow: z.string().optional(),
    visibility: z.string().optional(),
    pointerEvents: z.string().optional(),
    userSelect: z.string().optional(),
    transition: z.string().optional(),
    position: z.string().optional(),
    top: z.string().optional(),
    right: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
    display: z.string().optional(),
    flexDirection: z.string().optional(),
    flexWrap: z.string().optional(),
    justifyContent: z.string().optional(),
    alignItems: z.string().optional(),
    alignContent: z.string().optional(),
    gridTemplateColumns: z.string().optional(),
    gridTemplateRows: z.string().optional(),
    gridColumn: z.string().optional(),
    gridRow: z.string().optional(),
  })
)

// BrandingConfig schema - flattened structure, no light/dark separation
export const BrandingConfigSchema = z.object({
  applicationName: z.string().min(1),
  applicationLogo: z.string(),
  applicationLogoType: z.enum(['image', 'icon']),
  applicationLogoIcon: z.string().optional(),
  applicationLogoIconColor: z.string().optional(),
  applicationLogoBackgroundColor: z.string().optional(),

  // Colors - single set per theme
  primaryColor: z.string(),
  secondaryColor: z.string(),
  warningColor: z.string(),
  dangerColor: z.string(),
  uiBackgroundColor: z.string(),
  uiBorderColor: z.string(),
  bodyBackgroundColor: z.string(),
  topMenuBackgroundColor: z.string(),
  topMenuTextColor: z.string(),
  platformSidebarBackgroundColor: z.string(),
  platformSidebarTextColor: z.string(),
  secondarySidebarBackgroundColor: z.string(),
  secondarySidebarTextColor: z.string(),
  bodyTextColor: z.string().optional(),

  // Login background
  loginBackground: z.object({
    type: z.enum(['color', 'gradient', 'image']),
    color: z.string().optional(),
    gradient: z
      .object({
        from: z.string(),
        to: z.string(),
        angle: z.number(),
      })
      .optional(),
    image: z.string().optional(),
  }),

  googleFontsApiKey: z.string().optional(),

  // Global styling
  globalStyling: z.object({
    fontFamily: z.string(),
    fontFamilyMono: z.string().optional(),
    borderRadius: z.string(),
    borderColor: z.string(),
    borderWidth: z.string(),
    buttonBorderRadius: z.string(),
    buttonBorderWidth: z.string(),
    inputBorderRadius: z.string(),
    inputBorderWidth: z.string(),
    selectBorderRadius: z.string(),
    selectBorderWidth: z.string(),
    textareaBorderRadius: z.string().optional(),
    textareaBorderWidth: z.string().optional(),
    transitionDuration: z.string().optional(),
    transitionTiming: z.string().optional(),
    shadowSm: z.string().optional(),
    shadowMd: z.string().optional(),
    shadowLg: z.string().optional(),
    shadowXl: z.string().optional(),
  }),

  // Drawer overlay
  drawerOverlay: z
    .object({
      color: z.string(),
      opacity: z.number().min(0).max(100),
      blur: z.number().min(0),
    })
    .optional(),

  // Drawer style
  drawerStyle: z
    .object({
      type: z.enum(['normal', 'modern', 'floating']),
      margin: z.string().optional(),
      borderRadius: z.string().optional(),
      width: z.string().optional(),
      backgroundBlur: z.number().optional(),
      backgroundOpacity: z.number().min(0).max(100).optional(),
    })
    .optional(),

  // Component styling
  componentStyling: ComponentStylingSchema,
})

// Preview colors schema
const PreviewColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  background: z.string(),
  surface: z.string(),
})

// Theme schema - main theme type
export const ThemeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  themeMode: z.enum(['light', 'dark']),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  config: BrandingConfigSchema,
  previewColors: PreviewColorsSchema.optional(),
})

// Theme list item schema (lighter version for lists)
export const ThemeListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  themeMode: z.enum(['light', 'dark']),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  updatedAt: z.coerce.date(),
  previewColors: PreviewColorsSchema,
})

// Input schemas
export const CreateThemeInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: BrandingConfigSchema.partial().optional(),
  cloneFromId: z.string().uuid().optional(),
})

export const UpdateThemeInputSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  config: BrandingConfigSchema.partial().optional(),
})

export const ImportThemeInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  format: z.enum(['json', 'yaml']),
  content: z.string(),
})

export const ExportThemeOutputSchema = z.object({
  theme: z.object({
    name: z.string(),
    description: z.string().optional(),
    version: z.string(),
    exportedAt: z.string(),
  }),
  config: BrandingConfigSchema,
})

// Type exports from schemas
export type BrandingConfig = z.infer<typeof BrandingConfigSchema>
export type Theme = z.infer<typeof ThemeSchema>
export type ThemeListItem = z.infer<typeof ThemeListItemSchema>
export type CreateThemeInput = z.infer<typeof CreateThemeInputSchema>
export type UpdateThemeInput = z.infer<typeof UpdateThemeInputSchema>
export type ImportThemeInput = z.infer<typeof ImportThemeInputSchema>
export type ExportThemeOutput = z.infer<typeof ExportThemeOutputSchema>

// Validation helpers
export function validateBrandingConfig(data: unknown): BrandingConfig {
  return BrandingConfigSchema.parse(data)
}

export function validateTheme(data: unknown): Theme {
  return ThemeSchema.parse(data)
}

export function validateThemeListItem(data: unknown): ThemeListItem {
  return ThemeListItemSchema.parse(data)
}

export function safeParseBrandingConfig(data: unknown) {
  return BrandingConfigSchema.safeParse(data)
}

export function safeParseTheme(data: unknown) {
  return ThemeSchema.safeParse(data)
}

export function safeParseThemeListItem(data: unknown) {
  return ThemeListItemSchema.safeParse(data)
}

