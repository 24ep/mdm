'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { addRecentItem } from '@/lib/recent-items'
import { getRouteMetadataWithFallback } from '@/lib/route-metadata'

/**
 * Hook to automatically track page navigation and add to recent items
 * Should be used in the root layout or main app component
 */
export function usePageTracking() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    // Skip tracking for certain paths
    const skipPaths = [
      '/api/',
      '/_next/',
      '/auth/',
      '/login',
      '/logout',
      '/error',
    ]

    if (skipPaths.some(skip => pathname.startsWith(skip))) {
      return
    }

    // Get metadata for the current route
    const metadata = getRouteMetadataWithFallback(pathname)

    // Add to recent items
    addRecentItem({
      id: pathname,
      type: 'page',
      name: metadata.name,
      url: pathname,
      icon: metadata.icon,
      color: metadata.color,
      category: metadata.category,
      description: metadata.description,
    })
  }, [pathname])
}
