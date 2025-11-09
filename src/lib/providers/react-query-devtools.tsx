'use client'

import { ComponentType } from 'react'

// Optional devtools component that only loads if the package is installed
let ReactQueryDevtools: ComponentType<any> | null = null

if (process.env.NODE_ENV === 'development') {
  try {
    // Try to load the actual devtools package
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const devtools = require('@tanstack/react-query-devtools')
    // Check if it's not the stub (stub exports null or the component is null)
    if (devtools && devtools.ReactQueryDevtools && typeof devtools.ReactQueryDevtools !== 'undefined') {
      ReactQueryDevtools = devtools.ReactQueryDevtools
    }
  } catch (e) {
    // Package not installed, that's okay - webpack will use the stub
    ReactQueryDevtools = null
  }
}

export function OptionalReactQueryDevtools(props: { initialIsOpen?: boolean }) {
  if (!ReactQueryDevtools) {
    return null
  }
  return <ReactQueryDevtools {...props} />
}

