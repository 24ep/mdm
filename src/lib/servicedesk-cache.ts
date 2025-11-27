import { get, set, del, isRedisAvailable } from './redis-client'

const CACHE_TTL = 300 // 5 minutes
const CACHE_PREFIX = 'servicedesk:'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// In-memory cache fallback
const memoryCache = new Map<string, CacheEntry<any>>()

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const cacheKey = `${CACHE_PREFIX}${key}`

  if (isRedisAvailable()) {
    try {
      const cached = await get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.warn('[ServiceDesk Cache] Redis get failed, using memory:', error)
    }
  }

  // Check memory cache
  const entry = memoryCache.get(cacheKey)
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data
  }

  if (entry) {
    memoryCache.delete(cacheKey)
  }

  return null
}

/**
 * Set cached data
 */
export async function setCached<T>(key: string, data: T, ttl: number = CACHE_TTL): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}${key}`
  const expiresAt = Date.now() + (ttl * 1000)

  if (isRedisAvailable()) {
    try {
      await set(cacheKey, JSON.stringify(data), ttl)
      return
    } catch (error) {
      console.warn('[ServiceDesk Cache] Redis set failed, using memory:', error)
    }
  }

  // Store in memory cache
  memoryCache.set(cacheKey, { data, expiresAt })

  // Clean up expired entries periodically
  if (memoryCache.size > 1000) {
    const now = Date.now()
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        memoryCache.delete(key)
      }
    }
  }
}

/**
 * Delete cached data
 */
export async function deleteCached(key: string): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}${key}`

  if (isRedisAvailable()) {
    try {
      await del(cacheKey)
    } catch (error) {
      console.warn('[ServiceDesk Cache] Redis delete failed:', error)
    }
  }

  memoryCache.delete(cacheKey)
}

/**
 * Clear all ServiceDesk cache for a space
 */
export async function clearSpaceCache(spaceId: string): Promise<void> {
  const pattern = `${CACHE_PREFIX}space:${spaceId}:*`
  
  // For Redis, we'd need to use SCAN, but for simplicity, we'll just clear memory cache
  // In production, implement proper pattern deletion for Redis
  const keysToDelete: string[] = []
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`${CACHE_PREFIX}space:${spaceId}:`)) {
      keysToDelete.push(key)
    }
  }

  for (const key of keysToDelete) {
    memoryCache.delete(key)
  }
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  ticket: (requestId: string) => `ticket:${requestId}`,
  comments: (requestId: string) => `comments:${requestId}`,
  attachments: (requestId: string) => `attachments:${requestId}`,
  timeLogs: (requestId: string) => `timelogs:${requestId}`,
  config: (spaceId: string) => `space:${spaceId}:config`,
  health: (spaceId: string) => `space:${spaceId}:health`
}

