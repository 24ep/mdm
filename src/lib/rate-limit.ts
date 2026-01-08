import { LRUCache } from 'lru-cache'

/**
 * Simple rate limiting utility using LRU cache
 */

interface RateLimitOptions {
    max: number
    ttl: number
}

const cache = new LRUCache<string, number>({
    max: 1000,
    ttl: 60 * 1000, // 1 minute default
})

/**
 * Check if the current request exceeds the rate limit
 * @param key The unique key for the rate limit (e.g. IP address or user ID)
 * @param limit The maximum number of requests allowed within the TTL
 * @returns Object indicating if the request is allowed and the current count
 */
export function rateLimit(key: string, limit: number = 60) {
    const currentCount = cache.get(key) || 0

    if (currentCount >= limit) {
        return {
            allowed: false,
            currentCount,
            limit,
        }
    }

    cache.set(key, currentCount + 1)

    return {
        allowed: true,
        currentCount: currentCount + 1,
        limit,
    }
}
