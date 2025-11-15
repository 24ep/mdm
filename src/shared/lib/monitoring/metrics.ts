import { logger } from './logger'

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

