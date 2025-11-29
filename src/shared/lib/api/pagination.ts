/**
 * Pagination utilities for API routes
 */

import { DEFAULT_PAGINATION } from '@/lib/constants/defaults'

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(request: { url: string }): PaginationParams {
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || String(DEFAULT_PAGINATION.page), 10))
  const limit = Math.min(
    DEFAULT_PAGINATION.maxLimit,
    Math.max(1, parseInt(url.searchParams.get('limit') || String(DEFAULT_PAGINATION.limit), 10))
  )
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Create pagination response
 */
export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  return {
    data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }
}

/**
 * Build SQL pagination clause
 */
export function buildPaginationClause(offset: number, limit: number): string {
  return `LIMIT ${limit} OFFSET ${offset}`
}

