'use client'

import { useState, useEffect } from 'react'

interface Breakpoint {
  name: string
  minWidth: number
  maxWidth?: number
}

interface ResponsiveConfig {
  breakpoints: Breakpoint[]
  defaultBreakpoint: string
}

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { name: 'mobile', minWidth: 0, maxWidth: 767 },
  { name: 'tablet', minWidth: 768, maxWidth: 1023 },
  { name: 'desktop', minWidth: 1024, maxWidth: 1439 },
  { name: 'large', minWidth: 1440 }
]

export function useResponsiveDesign(config?: ResponsiveConfig) {
  const breakpoints = config?.breakpoints || DEFAULT_BREAKPOINTS
  const defaultBreakpoint = config?.defaultBreakpoint || 'desktop'

  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>(defaultBreakpoint)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setWindowSize({ width, height })

      // Find current breakpoint
      const breakpoint = breakpoints.find(bp => {
        if (bp.maxWidth) {
          return width >= bp.minWidth && width <= bp.maxWidth
        }
        return width >= bp.minWidth
      })

      if (breakpoint) {
        setCurrentBreakpoint(breakpoint.name)
      }
    }

    // Initial size
    updateSize()

    // Add event listener
    window.addEventListener('resize', updateSize)

    // Cleanup
    return () => window.removeEventListener('resize', updateSize)
  }, [breakpoints])

  const isMobile = currentBreakpoint === 'mobile'
  const isTablet = currentBreakpoint === 'tablet'
  const isDesktop = currentBreakpoint === 'desktop'
  const isLarge = currentBreakpoint === 'large'

  const isMobileOrTablet = isMobile || isTablet
  const isDesktopOrLarger = isDesktop || isLarge

  return {
    currentBreakpoint,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    isMobileOrTablet,
    isDesktopOrLarger,
    breakpoints
  }
}
