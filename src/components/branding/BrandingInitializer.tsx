'use client'

import { useEffect } from 'react'
import { initializeBranding } from '@/lib/branding'

/**
 * BrandingInitializer component
 * Initializes branding colors on app load
 * Should be placed in the root layout or providers
 */
export function BrandingInitializer() {
  useEffect(() => {
    let cleanup: (() => void) | null = null
    
    initializeBranding().then((cleanupFn) => {
      cleanup = cleanupFn
    })

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [])

  return null
}

