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
 * Metrics collector
 */
export class MetricsCollector {
  private metrics: Metric[] = []

  /**
   * Record a metric
   */
  record(metric: Metric): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    })

    // In production, send to metrics service (e.g., Prometheus, DataDog)
    logger.info('Metric recorded', { metric })

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
    this.record({
      name,
      value,
      tags,
    })

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
    this.record({
      name,
      value,
      tags,
    })

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
    this.record({
      name,
      value,
      tags,
    })

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
}

// Singleton instance
export const metricsCollector = new MetricsCollector()

