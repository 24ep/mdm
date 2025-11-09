/**
 * Theme utility functions for consistent theme handling
 */

/**
 * Get theme-aware color value
 * @param lightColor - Color for light theme
 * @param darkColor - Color for dark theme
 * @param isDark - Whether dark theme is active
 */
export function getThemeColor(
  lightColor: string,
  darkColor: string,
  isDark: boolean
): string {
  return isDark ? darkColor : lightColor
}

/**
 * Get CSS variable value for theme-aware styling
 * @param variableName - CSS variable name (without -- prefix)
 */
export function getThemeVar(variableName: string): string {
  return `hsl(var(--${variableName}))`
}

/**
 * Common theme-aware color mappings
 */
export const themeColors = {
  background: {
    light: 'hsl(var(--background))',
    dark: 'hsl(var(--background))',
  },
  foreground: {
    light: 'hsl(var(--foreground))',
    dark: 'hsl(var(--foreground))',
  },
  card: {
    light: 'hsl(var(--card))',
    dark: 'hsl(var(--card))',
  },
  border: {
    light: 'hsl(var(--border))',
    dark: 'hsl(var(--border))',
  },
  muted: {
    light: 'hsl(var(--muted))',
    dark: 'hsl(var(--muted))',
  },
} as const

/**
 * Get theme-aware inline style object
 */
export function getThemeStyles(isDark: boolean) {
  return {
    backgroundColor: isDark 
      ? 'hsl(var(--background))' 
      : 'hsl(var(--background))',
    color: isDark 
      ? 'hsl(var(--foreground))' 
      : 'hsl(var(--foreground))',
  }
}

/**
 * Chart grid colors that adapt to theme
 */
export function getChartGridColor(isDark: boolean): string {
  return isDark ? '#374151' : '#f0f0f0'
}

/**
 * Chart text colors that adapt to theme
 */
export function getChartTextColor(isDark: boolean): string {
  return isDark ? '#e5e7eb' : '#111827'
}

