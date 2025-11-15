import { PrismaClient } from '@prisma/client'
import { get, set, del, incr, expire, isRedisAvailable } from './redis-client'

// Conditionally import redis-init only if not in build mode
// This prevents Redis from initializing during build
// Only import if we're in development OR have clear runtime indicators
if (typeof process !== 'undefined') {
  const isDevelopment = process.env?.NODE_ENV !== 'production'
  const hasRuntime = process.env?.PORT || 
                     process.env?.VERCEL || 
                     process.env?.NETLIFY ||
                     process.env?.NEXT_RUNTIME ||
                     process.env?.HOSTNAME
  
  // Only import if development mode OR we have runtime indicators
  if (isDevelopment || hasRuntime) {
    import('./redis-init').catch(() => {
      // Silently fail - Redis is optional
    })
  }
}

const prisma = new PrismaClient()

// In-memory rate limit store (fallback when Redis is not available)
const rateLimitStore = new Map<string, {
  count: number
  resetTime: number
  blockedUntil?: number
}>()

// Helper to get/set rate limit state
async function getRateLimitState(key: string): Promise<{ count: number; resetTime: number; blockedUntil?: number } | null> {
  if (isRedisAvailable()) {
    try {
      const data = await get(`ratelimit:${key}`)
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.warn('[RateLimiter] Redis get failed, using memory:', error)
    }
  }
  
  return rateLimitStore.get(key) || null
}

async function setRateLimitState(key: string, state: { count: number; resetTime: number; blockedUntil?: number }, ttlSeconds?: number): Promise<void> {
  if (isRedisAvailable()) {
    try {
      await set(`ratelimit:${key}`, JSON.stringify(state), ttlSeconds)
      return
    } catch (error) {
      console.warn('[RateLimiter] Redis set failed, using memory:', error)
    }
  }
  
  rateLimitStore.set(key, state)
}

async function incrementCounter(key: string, ttlSeconds?: number): Promise<number> {
  const redisKey = `ratelimit:${key}`
  
  if (isRedisAvailable()) {
    try {
      const count = await incr(redisKey)
      if (count === 1 && ttlSeconds) {
        // Set TTL on first increment
        await expire(redisKey, ttlSeconds)
      }
      return count
    } catch (error) {
      console.warn('[RateLimiter] Redis incr failed, using memory:', error)
    }
  }
  
  const state = rateLimitStore.get(key) || { count: 0, resetTime: Date.now() + (ttlSeconds || 60) * 1000 }
  state.count++
  rateLimitStore.set(key, state)
  return state.count
}

interface RateLimitConfig {
  enabled: boolean
  maxRequestsPerMinute?: number | null
  maxRequestsPerHour?: number | null
  maxRequestsPerDay?: number | null
  maxRequestsPerMonth?: number | null
  burstLimit?: number | null
  windowSize?: number | null
  blockDuration?: number | null
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  blockedUntil?: number
  reason?: string
}

export async function checkRateLimit(
  chatbotId: string,
  userId: string,
  config?: RateLimitConfig | null
): Promise<RateLimitResult> {
  // If no config or disabled, allow all requests
  if (!config || !config.enabled) {
    return {
      allowed: true,
      remaining: Infinity,
      resetTime: Date.now() + 60000,
    }
  }

  const now = Date.now()
  const key = `${chatbotId}:${userId}`

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

  // Check month limit
  if (config.maxRequestsPerMonth) {
    const monthKey = `${key}:month:${Math.floor(now / 2592000000)}` // ~30 days
    const count = await incrementCounter(monthKey, 2592000)
    
    if (count > config.maxRequestsPerMonth) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + 2592000000,
        reason: 'Monthly rate limit exceeded',
      }
    }
    
    const remaining = config.maxRequestsPerMonth - count
    minRemaining = Math.min(minRemaining, remaining)
    earliestReset = Math.min(earliestReset, now + 2592000000)
  }

  return {
    allowed: true,
    remaining: Math.max(0, minRemaining),
    resetTime: earliestReset,
  }
}

export async function getRateLimitConfig(chatbotId: string): Promise<RateLimitConfig | null> {
  const config = await prisma.chatbotRateLimit.findUnique({
    where: { chatbotId },
  })

  if (!config) return null

  return {
    enabled: config.enabled,
    maxRequestsPerMinute: config.maxRequestsPerMinute,
    maxRequestsPerHour: config.maxRequestsPerHour,
    maxRequestsPerDay: config.maxRequestsPerDay,
    maxRequestsPerMonth: config.maxRequestsPerMonth,
    burstLimit: config.burstLimit,
    windowSize: config.windowSize,
    blockDuration: config.blockDuration,
  }
}

