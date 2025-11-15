import { useState, useCallback } from 'react'

export interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
  onPageChange?: (page: number, limit: number) => void
}

export interface UsePaginationReturn {
  page: number
  limit: number
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  nextPage: () => void
  previousPage: () => void
  reset: () => void
}

/**
 * Hook for managing pagination state
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, initialLimit = 20, onPageChange } = options
  const [page, setPageState] = useState(initialPage)
  const [limit, setLimitState] = useState(initialLimit)

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage)
      if (onPageChange) {
        onPageChange(newPage, limit)
      }
    },
    [limit, onPageChange]
  )

  const setLimit = useCallback(
    (newLimit: number) => {
      setLimitState(newLimit)
      setPageState(1) // Reset to first page when limit changes
      if (onPageChange) {
        onPageChange(1, newLimit)
      }
    },
    [onPageChange]
  )

  const nextPage = useCallback(() => {
    setPage(page + 1)
  }, [page, setPage])

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page, setPage])

  const reset = useCallback(() => {
    setPageState(initialPage)
    setLimitState(initialLimit)
  }, [initialPage, initialLimit])

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    previousPage,
    reset,
  }
}

