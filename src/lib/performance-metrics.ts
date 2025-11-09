import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type MetricType = 
  | 'cache_hit' 
  | 'cache_miss' 
  | 'retry_attempt' 
  | 'retry_success' 
  | 'rate_limit_violation' 
  | 'response_time'

export interface RecordMetricOptions {
  chatbotId: string
  metricType: MetricType
  value: number
  metadata?: Record<string, any>
}

/**
 * Record a performance metric
 */
export async function recordMetric(options: RecordMetricOptions): Promise<void> {
  try {
    await prisma.chatbotPerformanceMetric.create({
      data: {
        chatbotId: options.chatbotId,
        metricType: options.metricType,
        value: options.value,
        metadata: options.metadata || {},
      },
    })
  } catch (error) {
    console.error('Error recording performance metric:', error)
    // Don't throw - metrics shouldn't break the main flow
  }
}

/**
 * Get performance metrics for a chatbot
 */
export async function getPerformanceMetrics(
  chatbotId: string,
  metricType?: MetricType,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    chatbotId,
  }

  if (metricType) {
    where.metricType = metricType
  }

  if (startDate || endDate) {
    where.recordedAt = {}
    if (startDate) where.recordedAt.gte = startDate
    if (endDate) where.recordedAt.lte = endDate
  }

  return prisma.chatbotPerformanceMetric.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: 1000, // Limit to prevent huge queries
  })
}

/**
 * Get aggregated performance stats
 */
export async function getPerformanceStats(
  chatbotId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    chatbotId,
  }

  if (startDate || endDate) {
    where.recordedAt = {}
    if (startDate) where.recordedAt.gte = startDate
    if (endDate) where.recordedAt.lte = endDate
  }

  const metrics = await prisma.chatbotPerformanceMetric.findMany({
    where,
  })

  const stats = {
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    retryAttempts: 0,
    retrySuccesses: 0,
    retrySuccessRate: 0,
    rateLimitViolations: 0,
    avgResponseTime: 0,
    totalMetrics: metrics.length,
  }

  let totalResponseTime = 0
  let responseTimeCount = 0

  for (const metric of metrics) {
    switch (metric.metricType) {
      case 'cache_hit':
        stats.cacheHits++
        break
      case 'cache_miss':
        stats.cacheMisses++
        break
      case 'retry_attempt':
        stats.retryAttempts++
        break
      case 'retry_success':
        stats.retrySuccesses++
        break
      case 'rate_limit_violation':
        stats.rateLimitViolations++
        break
      case 'response_time':
        totalResponseTime += Number(metric.value)
        responseTimeCount++
        break
    }
  }

  const totalCacheOps = stats.cacheHits + stats.cacheMisses
  stats.cacheHitRate = totalCacheOps > 0 ? stats.cacheHits / totalCacheOps : 0

  const totalRetries = stats.retryAttempts
  stats.retrySuccessRate = totalRetries > 0 ? stats.retrySuccesses / totalRetries : 0

  stats.avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0

  return stats
}
