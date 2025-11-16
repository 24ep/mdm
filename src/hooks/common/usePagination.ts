/**
 * Pagination Hook
 * Common pagination logic for tables and lists
 */

import { useState, useCallback } from 'react'

export interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
  total?: number
}

export interface UsePaginationReturn {
  page: number
  limit: number
  total: number
  totalPages: number
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setTotal: (total: number) => void
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  reset: () => void
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialLimit = 20,
    total: initialTotal = 0
  } = options

  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(initialTotal)

  const totalPages = Math.ceil(total / limit)

  const nextPage = useCallback(() => {
    setPage(prev => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1))
  }, [])

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)))
  }, [totalPages])

  const reset = useCallback(() => {
    setPage(initialPage)
    setLimit(initialLimit)
    setTotal(initialTotal)
  }, [initialPage, initialLimit, initialTotal])

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    goToPage,
    reset
  }
}
