/**
 * Initialize Redis on application startup
 * This should be called early in the application lifecycle
 */

import { initRedis } from './redis-client'

let initialized = false

/**
 * Initialize Redis connection
 * Safe to call multiple times - will only initialize once
 */
export async function initializeRedis(): Promise<void> {
  if (initialized) return
  
  try {
    await initRedis()
    initialized = true
  } catch (error) {
    console.warn('[Redis Init] Failed to initialize Redis:', error)
    // Continue without Redis - fallback to in-memory will be used
  }
}

// Auto-initialize on import in server-side contexts
if (typeof window === 'undefined') {
  initializeRedis().catch(() => {
    // Silently fail - Redis is optional
  })
}

