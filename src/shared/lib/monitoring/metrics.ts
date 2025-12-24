import { logger } from './logger'

// Dynamic import for SigNoz (server-side only)
const getSigNozMetrics = async () => {
  if (typeof window === 'undefined') {
    try {
      const { sendMetricToSigNoz, isSigNozEnabled } = await import('@/lib/signoz-client')
      const enabled = await isSigNozEnabled()
      if (enabled) {
        return sendMetricToSigNoz
      }
      return null
    } catch (error) {
      return null
    }
  }
  return null
}

export interface Metric {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp?: Date
}

/**
 * Metrics collector with memory management
 */
export class MetricsCollector {
  private metrics: Metric[] = []
  private readonly MAX_METRICS = 1000 // Keep last 1000 metrics to prevent unbounded growth
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
    // Start periodic cleanup on server-side only
    if (typeof window === 'undefined') {
      this.cleanupTimer = setInterval(() => this.pruneMetrics(), 60000)
    }
  }

  /**
   * Prune old metrics to prevent memory leaks
   */
  private pruneMetrics(): void {
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Record a metric
   */
  record(metric: Metric): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    })

    // Prune if needed (immediate check for high-frequency metrics)
    if (this.metrics.length > this.MAX_METRICS * 1.2) {
      this.pruneMetrics()
    }

    // Send to SigNoz (fire and forget)
    getSigNozMetrics().then(sendMetric => {
      if (sendMetric) {
        sendMetric({
          name: metric.name,
          value: metric.value,
          type: 'gauge', // Default to gauge, can be overridden
          attributes: metric.tags,
          timestamp: metric.timestamp?.getTime()
        }).catch(() => {}) // Silently fail
      }
    })
  }

  /**
   * Record a counter increment
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    // Don't call record() to avoid duplicate SigNoz calls
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    })

    // Prune if needed
    if (this.metrics.length > this.MAX_METRICS * 1.2) {
      this.pruneMetrics()
    }

    // Send to SigNoz as counter
    getSigNozMetrics().then(sendMetric => {
      if (sendMetric) {
        sendMetric({
          name,
          value,
          type: 'counter',
          attributes: tags
        }).catch(() => {}) // Silently fail
      }
    })
  }

  /**
   * Record a gauge value
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    // Don't call record() to avoid duplicate SigNoz calls
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    })

    // Prune if needed
    if (this.metrics.length > this.MAX_METRICS * 1.2) {
      this.pruneMetrics()
    }

    // Send to SigNoz as gauge
    getSigNozMetrics().then(sendMetric => {
      if (sendMetric) {
        sendMetric({
          name,
          value,
          type: 'gauge',
          attributes: tags
        }).catch(() => {}) // Silently fail
      }
    })
  }

  /**
   * Record a histogram value
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    // Don't call record() to avoid duplicate SigNoz calls
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    })

    // Prune if needed
    if (this.metrics.length > this.MAX_METRICS * 1.2) {
      this.pruneMetrics()
    }

    // Send to SigNoz as histogram
    getSigNozMetrics().then(sendMetric => {
      if (sendMetric) {
        sendMetric({
          name,
          value,
          type: 'histogram',
          attributes: tags
        }).catch(() => {}) // Silently fail
      }
    })
  }

  /**
   * Get all metrics
   */
  getMetrics(): Metric[] {
    return [...this.metrics]
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Dispose of the collector (cleanup timer)
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector()

