import { metricsCollector } from '../monitoring/metrics'

export interface PerformanceMetric {
  name: string
  duration: number
  startTime: number
  endTime: number
}

/**
 * Performance monitor for measuring operation durations
 * Integrated with SigNoz for observability
 */
export class PerformanceMonitor {
  private measurements: Map<string, number> = new Map()

  /**
   * Start measuring a performance metric
   */
  start(name: string): void {
    this.measurements.set(name, performance.now())
  }

  /**
   * End measuring a performance metric
   */
  end(name: string): PerformanceMetric | null {
    const startTime = this.measurements.get(name)
    if (!startTime) {
      // Silently return null instead of warning - this can happen in edge cases
      // where metrics are called from different contexts or during cleanup
      return null
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    // Record metric in metrics collector (which sends to SigNoz)
    metricsCollector.histogram(`performance.${name}`, duration, {
      unit: 'ms',
    })

    // Also send directly to SigNoz for immediate visibility
    if (typeof window === 'undefined') {
      // Server-side only
      import('@/lib/signoz-client').then(({ sendMetricToSigNoz, isSigNozEnabled }) => {
        isSigNozEnabled().then(enabled => {
          if (enabled) {
            sendMetricToSigNoz({
              name: `performance.${name}`,
              value: duration,
              type: 'histogram',
              unit: 'ms',
              attributes: {
                'metric.type': 'performance',
                'metric.name': name
              }
            }).catch(() => {
              // Silently fail
            })
          }
        }).catch(() => {})
      }).catch(() => {})
    }

    this.measurements.delete(name)

    return {
      name,
      duration,
      startTime,
      endTime,
    }
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.start(name)
    try {
      const result = await operation()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(name: string, operation: () => T): T {
    this.start(name)
    try {
      const result = operation()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

