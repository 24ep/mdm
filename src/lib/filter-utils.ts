/**
 * Filter and Sort Utilities
 * Shared utilities for filtering and sorting arrays across the application
 */

/**
 * Generic filter by search query
 * Searches across multiple string fields in an object
 * 
 * @param items - Array of items to filter
 * @param query - Search query string
 * @param fields - Array of field names to search in (supports nested paths like 'user.name')
 * @returns Filtered array
 */
export function filterBySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T | string)[]
): T[] {
  if (!query.trim()) return items

  const lowerQuery = query.toLowerCase()

  return items.filter(item => {
    return fields.some(field => {
      const fieldPath = String(field).split('.')
      let value: any = item

      // Navigate nested paths
      for (const pathSegment of fieldPath) {
        if (value == null) return false
        value = value[pathSegment]
      }

      // Handle arrays (e.g., tags)
      if (Array.isArray(value)) {
        return value.some((v: any) =>
          String(v).toLowerCase().includes(lowerQuery)
        )
      }

      // Handle strings
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerQuery)
      }

      // Handle other types
      return String(value).toLowerCase().includes(lowerQuery)
    })
  })
}

/**
 * Filter by exact value match
 * 
 * @param items - Array of items to filter
 * @param field - Field name to filter by
 * @param value - Value to match (or 'all' to return all items)
 * @returns Filtered array
 */
export function filterByValue<T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  value: T[keyof T] | 'all'
): T[] {
  if (value === 'all' || value == null) return items
  return items.filter(item => item[field] === value)
}

/**
 * Generic sort function
 * 
 * @param items - Array of items to sort
 * @param sortBy - Field name to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @param getValue - Optional function to extract sort value
 * @returns Sorted array (new array, doesn't mutate original)
 */
export function sortBy<T>(
  items: T[],
  sortBy: keyof T | ((item: T) => any),
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    let aValue: any
    let bValue: any

    if (typeof sortBy === 'function') {
      aValue = sortBy(a)
      bValue = sortBy(b)
    } else {
      aValue = a[sortBy]
      bValue = b[sortBy]
    }

    let comparison = 0

    // Handle different types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = (aValue || '').localeCompare(bValue || '')
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else {
      // Fallback to string comparison
      comparison = String(aValue || '').localeCompare(String(bValue || ''))
    }

    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Sort by name (string field)
 * 
 * @param items - Array of items to sort
 * @param nameField - Field name containing the name (default: 'name')
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortByName<T extends Record<string, any>>(
  items: T[],
  nameField: keyof T = 'name' as keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return sortBy(items, nameField, order)
}

/**
 * Sort by date/timestamp
 * 
 * @param items - Array of items to sort
 * @param dateField - Field name containing the date (default: 'createdAt' or 'updatedAt')
 * @param order - Sort order ('asc' or 'desc', default: 'desc' for newest first)
 * @returns Sorted array
 */
export function sortByDate<T extends Record<string, any>>(
  items: T[],
  dateField: keyof T | 'createdAt' | 'updatedAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return sortBy(items, item => {
    const dateValue = item[dateField]
    if (typeof dateValue === 'string') {
      return new Date(dateValue)
    }
    return dateValue
  }, order)
}

/**
 * Sort by number
 * 
 * @param items - Array of items to sort
 * @param numberField - Field name containing the number
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortByNumber<T extends Record<string, any>>(
  items: T[],
  numberField: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return sortBy(items, numberField, order)
}

/**
 * Sort by version string (handles semantic versioning)
 * 
 * @param items - Array of items to sort
 * @param versionField - Field name containing the version string
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortByVersion<T extends Record<string, any>>(
  items: T[],
  versionField: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const aVersion = String(a[versionField] || '')
    const bVersion = String(b[versionField] || '')
    const comparison = bVersion.localeCompare(aVersion)
    return order === 'desc' ? comparison : -comparison
  })
}

/**
 * Combine multiple filters
 * Applies all filters in sequence
 * 
 * @param items - Array of items to filter
 * @param filters - Array of filter functions
 * @returns Filtered array
 */
export function applyFilters<T>(
  items: T[],
  filters: ((item: T) => boolean)[]
): T[] {
  return filters.reduce((acc, filter) => acc.filter(filter), items)
}

/**
 * Common filter patterns
 */

/**
 * Filter by status (with 'all' option)
 */
export function filterByStatus<T extends { status: any }>(
  items: T[],
  status: T['status'] | 'all'
): T[] {
  return filterByValue(items, 'status', status as any)
}

/**
 * Filter by type (with 'all' option)
 */
export function filterByType<T extends { type: any }>(
  items: T[],
  type: T['type'] | 'all'
): T[] {
  return filterByValue(items, 'type', type as any)
}

