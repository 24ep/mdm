import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), Math.max(0, delayMs))
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}
