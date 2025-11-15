/**
 * Pagination utilities for API routes
 */

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
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
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

