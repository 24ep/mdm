import { useEffect, useRef } from 'react'
import { performanceMonitor } from '../lib/performance/performance-monitor'

/**
 * Hook to measure component render performance
 */
export function usePerformance(componentName: string) {
  const renderStart = useRef<number>(performance.now())
  const renderCount = useRef<number>(0)

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current
    renderCount.current++

    if (renderCount.current > 1) {
      // Only measure re-renders, not initial render
      performanceMonitor.start(`render.${componentName}`)
      performanceMonitor.end(`render.${componentName}`)
    }

    renderStart.current = performance.now()
  })

  return {
    measure: (name: string, operation: () => void) => {
      performanceMonitor.measureSync(`operation.${componentName}.${name}`, operation)
    },
  }
}

