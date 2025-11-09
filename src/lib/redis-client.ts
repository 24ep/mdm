/**
 * Redis client with fallback to in-memory store
 * Supports both Redis and in-memory storage for development/production flexibility
 */

let redisClient: any = null
let redisAvailable = false

// In-memory fallback store
const memoryStore = new Map<string, { value: any; expiresAt?: number }>()

/**
 * Initialize Redis client if available
 */
export async function initRedis(): Promise<void> {
  try {
    // Only try to use Redis if REDIS_URL is configured
    if (process.env.REDIS_URL) {
      const redis = await import('ioredis')
      redisClient = new redis.default(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn('[Redis] Max retries reached, falling back to in-memory store')
            redisAvailable = false
            return null
          }
          return Math.min(times * 50, 2000)
        },
      })

      redisClient.on('error', (err: Error) => {
        console.warn('[Redis] Error:', err.message)
        redisAvailable = false
      })

      redisClient.on('connect', () => {
        console.log('[Redis] Connected successfully')
        redisAvailable = true
      })

      // Test connection
      await redisClient.ping()
      redisAvailable = true
    } else {
      console.log('[Redis] REDIS_URL not configured, using in-memory store')
      redisAvailable = false
    }
  } catch (error) {
    console.warn('[Redis] Failed to initialize, using in-memory store:', error)
    redisAvailable = false
  }
}

/**
 * Get value from Redis or memory store
 */
export async function get(key: string): Promise<string | null> {
  if (redisAvailable && redisClient) {
    try {
      return await redisClient.get(key)
    } catch (error) {
      console.warn('[Redis] Get failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  const entry = memoryStore.get(key)
  if (!entry) return null

  // Check expiration
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryStore.delete(key)
    return null
  }

  return typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value)
}

/**
 * Set value in Redis or memory store
 */
export async function set(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, value)
      } else {
        await redisClient.set(key, value)
      }
      return
    } catch (error) {
      console.warn('[Redis] Set failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined
  memoryStore.set(key, { value, expiresAt })
}

/**
 * Delete key from Redis or memory store
 */
export async function del(key: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key)
      return
    } catch (error) {
      console.warn('[Redis] Del failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  memoryStore.delete(key)
}

/**
 * Delete keys matching pattern
 */
export async function delPattern(pattern: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      return new Promise((resolve, reject) => {
        const stream = redisClient.scanStream({ match: pattern })
        const pipeline = redisClient.pipeline()
        let keysCount = 0

        stream.on('data', (keys: string[]) => {
          keys.forEach((key) => {
            pipeline.del(key)
            keysCount++
          })
        })

        stream.on('end', async () => {
          if (keysCount > 0) {
            await pipeline.exec()
          }
          resolve()
        })

        stream.on('error', (err: Error) => {
          reject(err)
        })
      })
    } catch (error) {
      console.warn('[Redis] DelPattern failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  // Memory fallback - simple prefix matching
  const prefix = pattern.replace('*', '')
  for (const [key] of memoryStore.entries()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Increment value
 */
export async function incr(key: string): Promise<number> {
  if (redisAvailable && redisClient) {
    try {
      return await redisClient.incr(key)
    } catch (error) {
      console.warn('[Redis] Incr failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  const entry = memoryStore.get(key)
  const current = entry ? (typeof entry.value === 'number' ? entry.value : parseInt(entry.value) || 0) : 0
  const newValue = current + 1
  memoryStore.set(key, { value: newValue })
  return newValue
}

/**
 * Set expiration on a key (in seconds)
 */
export async function expire(key: string, seconds: number): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.expire(key, seconds)
      return
    } catch (error) {
      console.warn('[Redis] Expire failed:', error)
    }
  }
  // For memory store, expiration is handled by expiresAt field
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable
}

