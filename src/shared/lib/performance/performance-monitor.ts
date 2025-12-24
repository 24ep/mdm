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
  private readonly MEASUREMENT_TTL_MS = 60000 // 1 minute - measurements older than this are orphaned
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
    // Start periodic cleanup of orphaned measurements on server-side
    if (typeof window === 'undefined') {
      this.cleanupTimer = setInterval(() => this.cleanupOrphans(), 30000)
    }
  }

  /**
   * Clean up orphaned measurements that were never ended
   */
  private cleanupOrphans(): void {
    const now = performance.now()
    for (const [key, startTime] of this.measurements.entries()) {
      if (now - startTime > this.MEASUREMENT_TTL_MS) {
        this.measurements.delete(key)
      }
    }
  }

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

    // Record metric in metrics collector (which already sends to SigNoz)
    // No need for direct SigNoz call - avoids duplicate metrics
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

  /**
   * Dispose of the monitor (cleanup timer)
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

