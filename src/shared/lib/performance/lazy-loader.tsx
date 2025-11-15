'use client'

import { lazy, Suspense, ComponentType } from 'react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

/**
 * Lazy load a component with a loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * Preload a component
 */
export function preloadComponent(importFn: () => Promise<any>) {
  importFn()
}

