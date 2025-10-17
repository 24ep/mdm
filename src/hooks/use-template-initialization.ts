import { useEffect, useState } from 'react'
import { TemplateInitializer } from '@/lib/template-initializer'

interface UseTemplateInitializationReturn {
  isInitializing: boolean
  isInitialized: boolean
  error: string | null
  initializeTemplates: () => Promise<void>
  resetInitialization: () => void
}

export function useTemplateInitialization(): UseTemplateInitializationReturn {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check initialization status on mount
  useEffect(() => {
    const checkInitialization = () => {
      try {
        const initialized = TemplateInitializer.isInitialized()
        setIsInitialized(initialized)
      } catch (err) {
        console.error('Error checking template initialization:', err)
        setError('Failed to check template initialization status')
      }
    }

    checkInitialization()
  }, [])

  const initializeTemplates = async () => {
    if (isInitializing || isInitialized) return

    setIsInitializing(true)
    setError(null)

    try {
      await TemplateInitializer.initializePrebuiltTemplates()
      setIsInitialized(true)
      console.log('Templates initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize templates'
      setError(errorMessage)
      console.error('Template initialization failed:', err)
    } finally {
      setIsInitializing(false)
    }
  }

  const resetInitialization = () => {
    TemplateInitializer.resetInitialization()
    setIsInitialized(false)
    setError(null)
  }

  return {
    isInitializing,
    isInitialized,
    error,
    initializeTemplates,
    resetInitialization
  }
}
