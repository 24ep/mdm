/**
 * Theme-aware wrapper components
 * Use these to ensure proper theme handling
 */

'use client'

import { useThemeSafe } from '@/hooks/use-theme-safe'
import { ReactNode } from 'react'

interface ThemeAwareProps {
  children: (props: { isDark: boolean; mounted: boolean }) => ReactNode
  fallback?: ReactNode
}

/**
 * Theme-aware component that provides theme state to children
 * Handles hydration automatically
 * 
 * @example
 * ```tsx
 * <ThemeAware>
 *   {({ isDark, mounted }) => {
 *     if (!mounted) return <Loading />
 *     return <div className={isDark ? 'dark' : 'light'}>Content</div>
 *   }}
 * </ThemeAware>
 * ```
 */
export function ThemeAware({ children, fallback = null }: ThemeAwareProps) {
  const { isDark, mounted } = useThemeSafe()
  
  if (!mounted) {
    return <>{fallback}</>
  }
  
  return <>{children({ isDark, mounted })}</>
}

/**
 * Conditional render based on theme
 */
interface ThemeConditionalProps {
  light?: ReactNode
  dark?: ReactNode
  children?: ReactNode
}

export function ThemeConditional({ light, dark, children }: ThemeConditionalProps) {
  const { isDark, mounted } = useThemeSafe()
  
  if (!mounted) {
    return <>{light || children}</>
  }
  
  if (isDark && dark) {
    return <>{dark}</>
  }
  
  if (!isDark && light) {
    return <>{light}</>
  }
  
  return <>{children}</>
}

