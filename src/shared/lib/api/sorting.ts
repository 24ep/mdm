/**
 * Sorting utilities for API routes
 */

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Parse sorting parameters from request
 */
export function parseSortParams(request: { url: string }): SortParams {
  const url = new URL(request.url)
  const sortBy = url.searchParams.get('sortBy') || undefined
  const sortOrder = (url.searchParams.get('sortOrder') || 'asc').toLowerCase() as 'asc' | 'desc'

  return {
    sortBy: sortBy || undefined,
    sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
  }
}

/**
 * Build SQL ORDER BY clause
 */
export function buildOrderByClause(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc',
  defaultSort: { field: string; order: 'asc' | 'desc' } = { field: 'created_at', order: 'desc' },
  tableAlias: string = ''
): string {
  const field = sortBy || defaultSort.field
  const order = sortOrder || defaultSort.order
  const prefix = tableAlias ? `${tableAlias}.` : ''

  // Validate field to prevent SQL injection
  const validFields = [
    'id',
    'name',
    'title',
    'created_at',
    'updated_at',
    'status',
    'priority',
    'type',
    'category',
    'order',
  ]

  // Allow quoted fields like "order"
  const cleanField = field.replace(/"/g, '')

  if (!validFields.includes(cleanField)) {
    return `ORDER BY ${prefix}${defaultSort.field} ${defaultSort.order.toUpperCase()}`
  }

  return `ORDER BY ${prefix}${field} ${order.toUpperCase()}`
}

/**
 * Validate sort field
 */
export function isValidSortField(field: string, allowedFields: string[]): boolean {
  return allowedFields.includes(field)
}

