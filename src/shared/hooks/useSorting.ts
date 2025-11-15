import { useState, useCallback } from 'react'

export interface UseSortingOptions {
  initialSortBy?: string
  initialSortOrder?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

export interface UseSortingReturn {
  sortBy: string | undefined
  sortOrder: 'asc' | 'desc'
  setSort: (field: string) => void
  setSortBy: (field: string | undefined) => void
  setSortOrder: (order: 'asc' | 'desc') => void
  reset: () => void
}

/**
 * Hook for managing sorting state
 */
export function useSorting(options: UseSortingOptions = {}): UseSortingReturn {
  const {
    initialSortBy,
    initialSortOrder = 'asc',
    onSortChange,
  } = options
  const [sortBy, setSortByState] = useState<string | undefined>(initialSortBy)
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(initialSortOrder)

  const setSort = useCallback(
    (field: string) => {
      const newOrder =
        sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
      setSortByState(field)
      setSortOrderState(newOrder)

      if (onSortChange) {
        onSortChange(field, newOrder)
      }
    },
    [sortBy, sortOrder, onSortChange]
  )

  const setSortBy = useCallback(
    (field: string | undefined) => {
      setSortByState(field)
      if (field && onSortChange) {
        onSortChange(field, sortOrder)
      }
    },
    [sortOrder, onSortChange]
  )

  const setSortOrder = useCallback(
    (order: 'asc' | 'desc') => {
      setSortOrderState(order)
      if (sortBy && onSortChange) {
        onSortChange(sortBy, order)
      }
    },
    [sortBy, onSortChange]
  )

  const reset = useCallback(() => {
    setSortByState(initialSortBy)
    setSortOrderState(initialSortOrder)
  }, [initialSortBy, initialSortOrder])

  return {
    sortBy,
    sortOrder,
    setSort,
    setSortBy,
    setSortOrder,
    reset,
  }
}

