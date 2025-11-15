'use client'

import { ComponentType, useEffect, useState } from 'react'

// Optional devtools component that only loads if the package is installed
export function OptionalReactQueryDevtools(props: { initialIsOpen?: boolean }) {
  const [Devtools, setDevtools] = useState<ComponentType<any> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || process.env.NODE_ENV !== 'development') {
      return
    }

    // Use a function to construct the import path at runtime to prevent static analysis
    const loadDevtools = async () => {
      try {
        // Construct module path dynamically to prevent Next.js from analyzing it
        const packageName = '@tanstack' + '/react-query-devtools'
        // @ts-ignore - optional dependency
        const module = await import(/* webpackIgnore: true */ packageName)
        if (module?.ReactQueryDevtools) {
          setDevtools(() => module.ReactQueryDevtools)
        }
      } catch (error) {
        // Package not installed, that's okay - fail silently
        setDevtools(null)
      }
    }

    loadDevtools()
  }, [mounted])

  if (!mounted || !Devtools) {
    return null
  }
  return <Devtools {...props} />
}

