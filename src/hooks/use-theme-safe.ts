/**
 * Safe theme hook that handles hydration properly
 * Use this instead of useTheme directly when you need to check theme state
 * 
 * @example
 * ```tsx
 * const { isDark, theme, systemTheme, setTheme } = useThemeSafe()
 * 
 * if (!mounted) {
 *   return <Loading />
 * }
 * 
 * return <div className={isDark ? 'dark' : 'light'}>Content</div>
 * ```
 */
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useThemeSafe() {
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Resolve the effective theme (handles 'system' mode)
  const resolvedTheme = mounted
    ? (theme === 'system' ? systemTheme : theme)
    : 'light'

  const isDark = resolvedTheme === 'dark'
  const isLight = resolvedTheme === 'light'

  return {
    theme,
    systemTheme,
    resolvedTheme,
    isDark,
    isLight,
    setTheme,
    mounted,
  }
}

