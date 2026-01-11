
/**
 * Simple rate limiting utility using a custom Map-based LRU cache
 * Implementing our own cache avoids issues with external libraries in Edge Runtime
 */

interface CacheItem<T> {
    value: T
    expires: number
}

class SimpleLRUCache<K, V> {
    private cache: Map<K, CacheItem<V>>
    private readonly max: number
    private readonly ttl: number

    constructor(options: { max: number; ttl: number }) {
        this.cache = new Map()
        this.max = options.max
        this.ttl = options.ttl
    }

    get(key: K): V | undefined {
        const item = this.cache.get(key)

        if (!item) return undefined

        // Check expiry
        if (Date.now() > item.expires) {
            this.cache.delete(key)
            return undefined
        }

        // Refresh LRU order by deleting and re-adding
        this.cache.delete(key)
        this.cache.set(key, item)

        return item.value
    }

    set(key: K, value: V): void {
        // Evict oldest if we are at limit and adding a new item
        if (this.cache.size >= this.max && !this.cache.has(key)) {
            // Map iterator yields keys in insertion order (oldest first)
            const firstKey = this.cache.keys().next().value
            if (firstKey !== undefined) {
                this.cache.delete(firstKey)
            }
        }

        const expires = Date.now() + this.ttl

        // If updating existing, remove first to update order
        if (this.cache.has(key)) {
            this.cache.delete(key)
        }

        this.cache.set(key, { value, expires })
    }
}

// Global cache instance (module-scoped, persists in Edge Runtime/Serverless container reuse)
const cache = new SimpleLRUCache<string, number>({
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
