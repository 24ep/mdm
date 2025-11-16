'use client'

import { useEffect } from 'react'

/**
 * Global error handler to suppress Chrome extension errors
 * 
 * This component suppresses harmless errors from browser extensions that
 * don't properly handle async message responses. These errors are common
 * with extensions like React DevTools, Redux DevTools, etc.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections (Chrome extension errors often appear here)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const errorMessage = typeof error === 'string' ? error : error?.message || ''
      
      // Suppress Chrome extension async response errors
      if (
        errorMessage.includes('A listener indicated an asynchronous response by returning true') ||
        errorMessage.includes('message channel closed before a response was received') ||
        errorMessage.includes('runtime.lastError')
      ) {
        event.preventDefault()
        // Optionally log in development mode only
        if (process.env.NODE_ENV === 'development') {
          console.debug('Suppressed Chrome extension error:', errorMessage)
        }
        return
      }
    }

    // Handle general errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || ''
      
      // Suppress Chrome extension async response errors
      if (
        errorMessage.includes('A listener indicated an asynchronous response by returning true') ||
        errorMessage.includes('message channel closed before a response was received') ||
        errorMessage.includes('runtime.lastError')
      ) {
        event.preventDefault()
        // Optionally log in development mode only
        if (process.env.NODE_ENV === 'development') {
          console.debug('Suppressed Chrome extension error:', errorMessage)
        }
        return
      }
    }

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}

