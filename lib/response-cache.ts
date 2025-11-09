import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { get, set, del, delPattern, isRedisAvailable } from './redis-client'
import './redis-init' // Ensure Redis is initialized

const prisma = new PrismaClient()

// In-memory cache store (fallback when Redis is not available)
const cacheStore = new Map<string, {
  value: any
  expiresAt: number
}>()

interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: 'exact' | 'semantic' | 'fuzzy'
  includeContext: boolean
  cacheKeyPrefix?: string | null
}

interface CacheEntry {
  response: any
  timestamp: number
}

export function generateCacheKey(
  chatbotId: string,
  message: string,
  config: CacheConfig,
  context?: string[]
): string {
  let key = config.cacheKeyPrefix ? `${config.cacheKeyPrefix}:` : ''
  key += `${chatbotId}:`

  if (config.strategy === 'exact') {
    // Exact match - use message content as-is
    key += crypto.createHash('sha256').update(message).digest('hex')
  } else if (config.strategy === 'semantic') {
    // Semantic match - normalize message (lowercase, remove punctuation)
    const normalized = message.toLowerCase().replace(/[^\w\s]/g, '').trim()
    key += crypto.createHash('sha256').update(normalized).digest('hex')
  } else {
    // Fuzzy match - use first N words
    const words = message.split(/\s+/).slice(0, 10).join(' ')
    key += crypto.createHash('sha256').update(words).digest('hex')
  }

  if (config.includeContext && context && context.length > 0) {
    const contextHash = crypto.createHash('sha256')
      .update(context.join('|'))
      .digest('hex')
    key += `:ctx:${contextHash}`
  }

  return key
}

export async function getCachedResponse(
  chatbotId: string,
  message: string,
  config: CacheConfig,
  context?: string[]
): Promise<CacheEntry | null> {
  if (!config.enabled) return null

  const key = generateCacheKey(chatbotId, message, config, context)
  const cacheKey = `cache:${key}`

  if (isRedisAvailable()) {
    try {
      const data = await get(cacheKey)
      if (data) {
        const entry = JSON.parse(data)
        return entry
      }
      return null
    } catch (error) {
      console.warn('[Cache] Redis get failed, using memory:', error)
    }
  }

  const cached = cacheStore.get(key)
  if (!cached) return null

  // Check if expired
  if (Date.now() > cached.expiresAt) {
    cacheStore.delete(key)
    return null
  }

  return cached.value
}

export async function setCachedResponse(
  chatbotId: string,
  message: string,
  response: any,
  config: CacheConfig,
  context?: string[]
): Promise<void> {
  if (!config.enabled) return

  const key = generateCacheKey(chatbotId, message, config, context)
  const cacheKey = `cache:${key}`
  const entry = {
    response,
    timestamp: Date.now(),
  }

  if (isRedisAvailable()) {
    try {
      // Redis handles TTL automatically, no need for manual eviction
      await set(cacheKey, JSON.stringify(entry), config.ttl)
      return
    } catch (error) {
      console.warn('[Cache] Redis set failed, using memory:', error)
    }
  }

  // Memory fallback: Check cache size and evict if needed
  if (cacheStore.size >= config.maxSize) {
    // Evict oldest entries (simple FIFO)
    const entries = Array.from(cacheStore.entries())
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt)
    const toEvict = Math.floor(config.maxSize * 0.1) // Evict 10%
    for (let i = 0; i < toEvict; i++) {
      cacheStore.delete(entries[i][0])
    }
  }

  const expiresAt = Date.now() + (config.ttl * 1000)
  cacheStore.set(key, {
    value: entry,
    expiresAt,
  })
}

export async function clearCache(chatbotId: string, config: CacheConfig): Promise<void> {
  const prefix = config.cacheKeyPrefix ? `${config.cacheKeyPrefix}:` : ''
  const chatbotPrefix = `cache:${prefix}${chatbotId}:`

  if (isRedisAvailable()) {
    try {
      // Delete all keys matching the prefix
      await delPattern(`${chatbotPrefix}*`)
      return
    } catch (error) {
      console.warn('[Cache] Redis delPattern failed, using memory:', error)
    }
  }

  // Memory fallback
  for (const [key] of cacheStore.entries()) {
    if (key.startsWith(chatbotPrefix.replace('cache:', ''))) {
      cacheStore.delete(key)
    }
  }
}

export async function getCacheConfig(chatbotId: string): Promise<CacheConfig | null> {
  const config = await prisma.chatbotCacheConfig.findUnique({
    where: { chatbotId },
  })

  if (!config) return null

  return {
    enabled: config.enabled,
    ttl: config.ttl,
    maxSize: config.maxSize,
    strategy: config.strategy as 'exact' | 'semantic' | 'fuzzy',
    includeContext: config.includeContext,
    cacheKeyPrefix: config.cacheKeyPrefix,
  }
}

