/**
 * Redis client with fallback to in-memory store
 * Supports both Redis and in-memory storage for development/production flexibility
 */

// Early build-time detection at module level
// This is evaluated immediately when the module loads
// Uses conservative logic: only return false (not build) if we have CLEAR runtime indicators
const IS_BUILD_TIME = (() => {
  if (typeof process === 'undefined') return false
  
  // Check for Next.js build phases (most reliable indicator)
  const nextPhase = process.env?.NEXT_PHASE
  if (nextPhase === 'phase-production-build' || 
      nextPhase === 'phase-production-compile' ||
      nextPhase === 'phase-export' ||
      nextPhase?.includes('build') ||
      nextPhase?.includes('compile')) {
    return true
  }
  
  // Check if we're running a build command
  const args = process.argv || []
  const hasBuildCommand = args.some(arg => {
    if (typeof arg !== 'string') return false
    const lowerArg = arg.toLowerCase()
    return lowerArg.includes('build') || 
           lowerArg.includes('next-build') ||
           lowerArg.includes('next build')
  })
  
  if (hasBuildCommand) {
    return true
  }
  
  // INVERTED LOGIC: Only return false (not build) if we have CLEAR runtime indicators
  // If we can't definitively say we're in runtime, assume we're in build (return true)
  const hasClearRuntime = process.env?.NEXT_RUNTIME || 
                         process.env?.VERCEL || 
                         process.env?.NETLIFY ||
                         process.env?.PORT ||
                         process.env?.HOSTNAME ||
                         (process.env?.NODE_ENV === 'development' && process.env?.PORT)
  
  // If we have clear runtime indicators, we're NOT in build
  if (hasClearRuntime) {
    return false
  }
  
  // If we're in production without clear runtime indicators, assume build
  if (process.env?.NODE_ENV === 'production') {
    return true
  }
  
  // If we can't determine, be conservative and assume build (suppress logs)
  // This prevents errors during build when detection is uncertain
  return true
})()

let redisClient: any = null
let redisAvailable = false

// In-memory fallback store
const memoryStore = new Map<string, { value: any; expiresAt?: number }>()

// Helper function to check if we're in build time at execution time (for use in callbacks)
// Uses inverted logic: only return false (not build) if we have CLEAR runtime indicators
// This is more conservative and prevents false negatives during build
function checkBuildTimeAtRuntime(): boolean {
  if (typeof process === 'undefined') return false
  
  // Check for Next.js build phases (most reliable indicator)
  const nextPhase = process.env?.NEXT_PHASE
  if (nextPhase === 'phase-production-build' || 
      nextPhase === 'phase-production-compile' ||
      nextPhase === 'phase-export' ||
      nextPhase?.includes('build') ||
      nextPhase?.includes('compile')) {
    return true
  }
  
  // Check if we're running a build command
  const args = process.argv || []
  const hasBuildCommand = args.some(arg => {
    if (typeof arg !== 'string') return false
    const lowerArg = arg.toLowerCase()
    return lowerArg.includes('build') || 
           lowerArg.includes('next-build') ||
           lowerArg.includes('next build')
  })
  
  if (hasBuildCommand) {
    return true
  }
  
  // INVERTED LOGIC: Only return false (not build) if we have CLEAR runtime indicators
  // If we can't definitively say we're in runtime, assume we're in build (return true)
  const hasClearRuntime = process.env?.NEXT_RUNTIME || 
                         process.env?.VERCEL || 
                         process.env?.NETLIFY ||
                         process.env?.PORT ||
                         process.env?.HOSTNAME ||
                         (process.env?.NODE_ENV === 'development' && process.env?.PORT)
  
  // If we have clear runtime indicators, we're NOT in build
  if (hasClearRuntime) {
    return false
  }
  
  // If we're in production without clear runtime indicators, assume build
  if (process.env?.NODE_ENV === 'production') {
    return true
  }
  
  // If we can't determine, be conservative and assume build (suppress logs)
  // This prevents errors during build when detection is uncertain
  return true
}

/**
 * Initialize Redis client if available
 */
export async function initRedis(): Promise<void> {
  // CRITICAL: Skip Redis initialization during build time
  // Check at the very beginning and return immediately
  if (IS_BUILD_TIME) {
    redisAvailable = false
    redisClient = null
    return
  }
  
  try {
    // Double-check before any async operations
    if (IS_BUILD_TIME) {
      redisAvailable = false
      redisClient = null
      return
    }
    
    // Only try to use Redis if REDIS_URL is configured
    if (process.env.REDIS_URL) {
      // Triple-check before importing ioredis (which might trigger connections)
      if (IS_BUILD_TIME) {
        redisAvailable = false
        redisClient = null
        return
      }
      
      const redis = await import('ioredis')
      
      // Final check before creating client instance
      if (IS_BUILD_TIME) {
        redisAvailable = false
        redisClient = null
        return
      }
      
      // Create client with all error suppression enabled
      redisClient = new redis.default(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            // Check build time at execution time using shared helper function
            const isBuildNow = checkBuildTimeAtRuntime()
            
            // Only log if definitely not in build - completely silent during build
            if (!isBuildNow) {
              console.warn('[Redis] Max retries reached, falling back to in-memory store')
            }
            redisAvailable = false
            return null
          }
          return Math.min(times * 50, 2000)
        },
        // Disable automatic reconnection during build
        enableReadyCheck: !IS_BUILD_TIME,
        lazyConnect: true, // Don't connect immediately
        // Additional options to prevent connection attempts
        connectTimeout: IS_BUILD_TIME ? 0 : 10000,
        enableOfflineQueue: !IS_BUILD_TIME,
      })

      // ALWAYS set up a silent error handler during build, or conditional during runtime
      // Use a function that checks build time at execution time, not definition time
      redisClient.on('error', (err: Error) => {
        // Check build time at error time using shared helper function
        const isBuildNow = checkBuildTimeAtRuntime()
        
        // Only log if definitely not in build - completely silent during build
        if (!isBuildNow) {
          console.warn('[Redis] Error:', err.message || err.toString())
        }
        redisAvailable = false
      })

      // Only set up connect handler if not in build time
      if (!IS_BUILD_TIME) {
        redisClient.on('connect', () => {
          console.log('[Redis] Connected successfully')
          redisAvailable = true
        })
      }

      // Only test connection if not in build time
      if (!IS_BUILD_TIME) {
        try {
          await redisClient.connect()
          await redisClient.ping()
          redisAvailable = true
        } catch (connectError) {
          // Suppress connection errors during build
          if (!IS_BUILD_TIME) {
            console.warn('[Redis] Connection test failed:', connectError)
          }
          redisAvailable = false
        }
      } else {
        // During build, don't attempt connection at all
        redisAvailable = false
        // Close any connection attempts immediately
        if (redisClient && typeof redisClient.disconnect === 'function') {
          try {
            redisClient.disconnect()
          } catch {
            // Ignore disconnect errors
          }
        }
      }
    } else {
      // Suppress message during build time
      if (!IS_BUILD_TIME) {
        console.log('[Redis] REDIS_URL not configured, using in-memory store')
      }
      redisAvailable = false
    }
  } catch (error) {
    // Check build time at error time using shared helper function
    const isBuildNow = checkBuildTimeAtRuntime()
    
    // Only log if definitely not in build - completely silent during build
    if (!isBuildNow) {
      console.warn('[Redis] Failed to initialize, using in-memory store:', error)
    }
    redisAvailable = false
    // Ensure client is null during build
    if (isBuildNow) {
      redisClient = null
    }
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
      const isBuildNow = checkBuildTimeAtRuntime()
      if (!isBuildNow) {
        console.warn('[Redis] Get failed, falling back to memory:', error)
      }
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
      const isBuildNow = checkBuildTimeAtRuntime()
      if (!isBuildNow) {
        console.warn('[Redis] Set failed, falling back to memory:', error)
      }
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
      const isBuildNow = checkBuildTimeAtRuntime()
      if (!isBuildNow) {
        console.warn('[Redis] Del failed, falling back to memory:', error)
      }
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
      const isBuildNow = checkBuildTimeAtRuntime()
      if (!isBuildNow) {
        console.warn('[Redis] DelPattern failed, falling back to memory:', error)
      }
      redisAvailable = false
    }
  }

  // Memory fallback - simple prefix matching
  const prefix = pattern.replace('*', '')
  for (const [key] of Array.from(memoryStore.entries())) {
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
      const isBuildNow = checkBuildTimeAtRuntime()
      if (!isBuildNow) {
        console.warn('[Redis] Incr failed, falling back to memory:', error)
      }
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
      const isBuildNow = checkBuildTimeAtRuntime()
      if (!isBuildNow) {
        console.warn('[Redis] Expire failed:', error)
      }
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
