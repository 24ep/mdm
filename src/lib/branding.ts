/**
 * Branding utility functions
 * Applies branding colors throughout the platform (except space module)
 * 
 * NOTE: This file now re-exports from the split modules in src/lib/branding/
 * All functions have been moved to separate files for better organization.
 * 
 * @deprecated Import directly from '@/lib/branding' instead of '@/lib/branding.ts'
 */

// Re-export all branding functions from the split modules
export * from './branding/index'
