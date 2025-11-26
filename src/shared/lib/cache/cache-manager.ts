import { get, set, del, delPattern } from '@/lib/redis-client'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  namespace?: string
}

export class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    return getCache<T>(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return setCache(key, value, { ttl })
  }

  async delete(key: string): Promise<void> {
    return deleteCache(key)
  }

  async clearNamespace(namespace: string): Promise<void> {
    try {
      await delPattern(`${namespace}:*`)
    } catch (error) {
      console.error('Cache clear namespace error:', error)
    }
  }
}

/**
 * Get value from cache
 */
export async function getCache<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  try {
    const fullKey = options?.namespace 
      ? `${options.namespace}:${key}` 
      : key
    
    const value = await get(fullKey)
    
    if (!value || typeof value !== 'string') {
      return null
    }
    
    return JSON.parse(value) as T
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set value in cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void> {
  try {
    const fullKey = options?.namespace 
      ? `${options.namespace}:${key}` 
      : key
    
    const serialized = JSON.stringify(value)
    const ttl = options?.ttl || 3600 // Default 1 hour
    
    await set(fullKey, serialized, ttl)
  } catch (error) {
    console.error('Cache set error:', error)
    // Don't throw - caching should not break the application
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(
  key: string,
  options?: CacheOptions
): Promise<void> {
  try {
    const fullKey = options?.namespace 
      ? `${options.namespace}:${key}` 
      : key
    
    await del(fullKey)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

/**
 * Clear all cache in namespace
 */
export async function clearNamespace(namespace: string): Promise<void> {
  try {
    await delPattern(`${namespace}:*`)
  } catch (error) {
    console.error('Cache clear namespace error:', error)
  }
}

