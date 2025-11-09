import { retryWithBackoff, RetryConfig } from '@/lib/retry-handler'

/**
 * Default retry configuration for ServiceDesk API calls
 */
export const defaultServiceDeskRetryConfig: RetryConfig = {
  enabled: true,
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: ['429', '500', '502', '503', '504'], // Rate limit and server errors
  jitter: true
}

/**
 * Check if an error is retryable for ServiceDesk API
 */
export function isServiceDeskRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true
  }

  // HTTP status codes
  if (error.status) {
    const status = String(error.status)
    return defaultServiceDeskRetryConfig.retryableStatusCodes.includes(status)
  }

  // Response status
  if (error.response?.status) {
    const status = String(error.response.status)
    return defaultServiceDeskRetryConfig.retryableStatusCodes.includes(status)
  }

  // ServiceDesk API specific errors
  if (error.message?.includes('timeout') || error.message?.includes('network')) {
    return true
  }

  return false
}

/**
 * Execute a ServiceDesk API call with retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const retryConfig: RetryConfig = {
    ...defaultServiceDeskRetryConfig,
    ...config
  }

  return retryWithBackoff(fn, retryConfig, isServiceDeskRetryableError)
}

