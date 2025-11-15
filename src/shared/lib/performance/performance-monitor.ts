import { metricsCollector } from '../monitoring/metrics'

export interface PerformanceMetric {
  name: string
  duration: number
  startTime: number
  endTime: number
}

/**
 * Performance monitor for measuring operation durations
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
      console.warn(`Performance metric "${name}" was not started`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    // Record metric
    metricsCollector.histogram(`performance.${name}`, duration, {
      unit: 'ms',
    })

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

