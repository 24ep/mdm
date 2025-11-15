import { get, set, incr } from '@/lib/redis-client'

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyPrefix?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Rate limiter using sliding window
 */
export class RateLimiter {
  /**
   * Check if request is allowed
   */
  async checkLimit(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const { windowMs, maxRequests, keyPrefix = 'rate_limit' } = options
    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - windowMs

    try {
      // Get current count
      const countStr = await get(key)
      const count = countStr ? parseInt(countStr) : 0

      if (count >= maxRequests) {
        // Rate limit exceeded
        const resetAt = new Date(now + windowMs)
        return {
          allowed: false,
          remaining: 0,
          resetAt,
        }
      }

      // Increment counter
      const newCount = await incr(key)
      
      // Set expiration if this is the first request in the window
      if (newCount === 1) {
        await set(key, '1', Math.ceil(windowMs / 1000))
      }

      const resetAt = new Date(now + windowMs)
      return {
        allowed: true,
        remaining: maxRequests - newCount,
        resetAt,
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(now + windowMs),
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

