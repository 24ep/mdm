import { query } from './db'
import { get, set, incr, expire, isRedisAvailable } from '../../lib/redis-client'

// In-memory rate limit store (fallback when Redis is not available)
const rateLimitStore = new Map<string, {
  count: number
  resetTime: number
  blockedUntil?: number
}>()

interface ServiceDeskRateLimitConfig {
  enabled: boolean
  maxRequestsPerMinute?: number
  maxRequestsPerHour?: number
  maxRequestsPerDay?: number
  blockDuration?: number // seconds
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  blockedUntil?: number
  reason?: string
}

async function getRateLimitState(key: string): Promise<{ count: number; resetTime: number; blockedUntil?: number } | null> {
  if (isRedisAvailable()) {
    try {
      const data = await get(`servicedesk:ratelimit:${key}`)
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.warn('[ServiceDesk RateLimiter] Redis get failed, using memory:', error)
    }
  }
  
  return rateLimitStore.get(key) || null
}

async function setRateLimitState(key: string, state: { count: number; resetTime: number; blockedUntil?: number }, ttlSeconds?: number): Promise<void> {
  if (isRedisAvailable()) {
    try {
      await set(`servicedesk:ratelimit:${key}`, JSON.stringify(state), ttlSeconds)
      return
    } catch (error) {
      console.warn('[ServiceDesk RateLimiter] Redis set failed, using memory:', error)
    }
  }
  
  rateLimitStore.set(key, state)
}

async function incrementCounter(key: string, ttlSeconds?: number): Promise<number> {
  const redisKey = `servicedesk:ratelimit:${key}`
  
  if (isRedisAvailable()) {
    try {
      const count = await incr(redisKey)
      if (count === 1 && ttlSeconds) {
        await expire(redisKey, ttlSeconds)
      }
      return count
    } catch (error) {
      console.warn('[ServiceDesk RateLimiter] Redis incr failed, using memory:', error)
    }
  }
  
  const state = rateLimitStore.get(key) || { count: 0, resetTime: Date.now() + (ttlSeconds || 60) * 1000 }
  state.count++
  rateLimitStore.set(key, state)
  return state.count
}

/**
 * Get rate limit configuration for a space
 */
export async function getServiceDeskRateLimitConfig(spaceId: string): Promise<ServiceDeskRateLimitConfig> {
  try {
    const { rows } = await query(
      `SELECT rate_limit_enabled, max_requests_per_minute, max_requests_per_hour, 
              max_requests_per_day, rate_limit_block_duration
       FROM servicedesk_rate_limits
       WHERE space_id = $1::uuid AND deleted_at IS NULL
       LIMIT 1`,
      [spaceId]
    )

    if (rows.length > 0) {
      return {
        enabled: rows[0].rate_limit_enabled ?? true,
        maxRequestsPerMinute: rows[0].max_requests_per_minute ?? 60,
        maxRequestsPerHour: rows[0].max_requests_per_hour ?? 1000,
        maxRequestsPerDay: rows[0].max_requests_per_day ?? 10000,
        blockDuration: rows[0].rate_limit_block_duration ?? 300
      }
    }
  } catch (error) {
    // Table might not exist yet
    console.warn('[ServiceDesk RateLimiter] Failed to get config:', error)
  }

  // Default configuration
  return {
    enabled: true,
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    maxRequestsPerDay: 10000,
    blockDuration: 300
  }
}

/**
 * Check rate limit for ServiceDesk API calls
 */
export async function checkServiceDeskRateLimit(
  spaceId: string,
  userId: string,
  config?: ServiceDeskRateLimitConfig | null
): Promise<RateLimitResult> {
  if (!config || !config.enabled) {
    return {
      allowed: true,
      remaining: Infinity,
      resetTime: Date.now() + 60000,
    }
  }

  const now = Date.now()
  const key = `${spaceId}:${userId}`

  // Check if user is blocked
  const userState = await getRateLimitState(key)
  if (userState?.blockedUntil && now < userState.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: userState.blockedUntil,
      blockedUntil: userState.blockedUntil,
      reason: `Rate limit exceeded. Blocked until ${new Date(userState.blockedUntil).toISOString()}`,
    }
  }

  let minRemaining = Infinity
  let earliestReset = now + 60000

  // Check minute limit
  if (config.maxRequestsPerMinute) {
    const minuteKey = `${key}:minute:${Math.floor(now / 60000)}`
    const count = await incrementCounter(minuteKey, 60)
    
    if (count > config.maxRequestsPerMinute) {
      const blockDuration = config.blockDuration || 300
      const blockedUntil = now + (blockDuration * 1000)
      
      await setRateLimitState(key, {
        count: 0,
        resetTime: blockedUntil,
        blockedUntil,
      }, blockDuration)
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        blockedUntil,
        reason: 'Minute rate limit exceeded',
      }
    }
    
    const remaining = config.maxRequestsPerMinute - count
    minRemaining = Math.min(minRemaining, remaining)
    earliestReset = Math.min(earliestReset, now + 60000)
  }

  // Check hour limit
  if (config.maxRequestsPerHour) {
    const hourKey = `${key}:hour:${Math.floor(now / 3600000)}`
    const count = await incrementCounter(hourKey, 3600)
    
    if (count > config.maxRequestsPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + 3600000,
        reason: 'Hour rate limit exceeded',
      }
    }
    
    const remaining = config.maxRequestsPerHour - count
    minRemaining = Math.min(minRemaining, remaining)
    earliestReset = Math.min(earliestReset, now + 3600000)
  }

  // Check day limit
  if (config.maxRequestsPerDay) {
    const dayKey = `${key}:day:${Math.floor(now / 86400000)}`
    const count = await incrementCounter(dayKey, 86400)
    
    if (count > config.maxRequestsPerDay) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + 86400000,
        reason: 'Daily rate limit exceeded',
      }
    }
    
    const remaining = config.maxRequestsPerDay - count
    minRemaining = Math.min(minRemaining, remaining)
    earliestReset = Math.min(earliestReset, now + 86400000)
  }

  return {
    allowed: true,
    remaining: Math.max(0, minRemaining),
    resetTime: earliestReset,
  }
}

