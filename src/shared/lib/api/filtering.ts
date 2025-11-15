/**
 * Filtering utilities for API routes
 */

export interface FilterParams {
  [key: string]: string | string[] | undefined
}

/**
 * Parse filter parameters from request
 */
export function parseFilterParams(
  request: { url: string },
  allowedFilters: string[]
): FilterParams {
  const url = new URL(request.url)
  const filters: FilterParams = {}

  for (const filter of allowedFilters) {
    const value = url.searchParams.get(filter)
    if (value !== null) {
      // Handle array values (e.g., ?status=TODO&status=IN_PROGRESS)
      const allValues = url.searchParams.getAll(filter)
      filters[filter] = allValues.length === 1 ? allValues[0] : allValues
    }
  }

  return filters
}

/**
 * Build SQL WHERE clause for filters
 */
export function buildFilterClause(
  filters: FilterParams,
  tableAlias: string = ''
): { clause: string; params: any[]; paramIndex: number } {
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1
  const prefix = tableAlias ? `${tableAlias}.` : ''

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    if (Array.isArray(value)) {
      // IN clause for array values
      const placeholders = value.map(() => `$${paramIndex++}`).join(', ')
      conditions.push(`${prefix}${key} IN (${placeholders})`)
      params.push(...value)
    } else {
      // Equality for single values
      conditions.push(`${prefix}${key} = $${paramIndex++}`)
      params.push(value)
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return { clause, params, paramIndex }
}

/**
 * Build SQL WHERE clause with LIKE for text search
 */
export function buildSearchClause(
  searchQuery: string | null,
  searchFields: string[],
  tableAlias: string = ''
): { clause: string; params: any[]; paramIndex: number } {
  if (!searchQuery || searchFields.length === 0) {
    return { clause: '', params: [], paramIndex: 1 }
  }

  const prefix = tableAlias ? `${tableAlias}.` : ''
  const conditions = searchFields.map(
    (field, index) => `${prefix}${field} ILIKE $${index + 1}`
  )
  const searchPattern = `%${searchQuery}%`

  return {
    clause: `WHERE (${conditions.join(' OR ')})`,
    params: searchFields.map(() => searchPattern),
    paramIndex: searchFields.length + 1,
  }
}

