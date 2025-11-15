/**
 * Initialize Redis on application startup
 * This should be called early in the application lifecycle
 */

import { initRedis } from './redis-client'

let initialized = false

// Early build-time detection at module level (same logic as redis-client.ts)
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

/**
 * Initialize Redis connection
 * Safe to call multiple times - will only initialize once
 */
export async function initializeRedis(): Promise<void> {
  // CRITICAL: Skip during build time - use constant directly
  if (IS_BUILD_TIME) {
    return
  }
  
  if (initialized) return
  
  try {
    await initRedis()
    initialized = true
  } catch (error) {
    // Suppress errors during build time - use constant directly
    if (!IS_BUILD_TIME) {
      console.warn('[Redis Init] Failed to initialize Redis:', error)
    }
    // Continue without Redis - fallback to in-memory will be used
  }
}

// Auto-initialize on import in server-side contexts (skip during build)
// Use constant directly for maximum performance
// CRITICAL: Only auto-initialize if we're definitely NOT in build mode
// Add additional safety checks to prevent any initialization during build
if (typeof window === 'undefined' && !IS_BUILD_TIME) {
  // Double-check we're not in build mode before initializing
  // This prevents race conditions where build detection might not be accurate
  const doubleCheckBuild = (() => {
    if (typeof process === 'undefined') return false
    // If we're in production and don't have clear runtime indicators, don't initialize
    if (process.env?.NODE_ENV === 'production') {
      const hasClearRuntime = process.env?.PORT || 
                              process.env?.VERCEL || 
                              process.env?.NETLIFY ||
                              process.env?.NEXT_RUNTIME
      if (!hasClearRuntime) {
        // In production without runtime indicators, likely a build - don't initialize
        return true
      }
    }
    return false
  })()
  
  if (!doubleCheckBuild) {
    initializeRedis().catch(() => {
      // Silently fail - Redis is optional
    })
  }
}
