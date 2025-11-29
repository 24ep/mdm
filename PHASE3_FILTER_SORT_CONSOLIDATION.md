# Phase 3.4: Filter/Sort Utilities Consolidation

## Overview

Consolidating duplicate filter and sort functions across feature utilities into shared utilities.

## Current State

### Patterns Found

**Pattern 1: Search Query Filter (Most Common)**
```typescript
export function filterFiles(files: StorageFile[], query: string): StorageFile[] {
  if (!query.trim()) return files
  
  const lowerQuery = query.toLowerCase()
  return files.filter(file =>
    file.name?.toLowerCase().includes(lowerQuery) ||
    file.mimeType?.toLowerCase().includes(lowerQuery)
  )
}
```

**Pattern 2: Status/Type Filter**
```typescript
export function filterByStatus(items: T[], status: T['status'] | 'all'): T[] {
  if (status === 'all') return items
  return items.filter(item => item.status === status)
}
```

**Pattern 3: Sort by Name/Date/Number**
```typescript
export function sortFiles(files: StorageFile[], sortBy: 'name' | 'size' | 'date', order: 'asc' | 'desc'): StorageFile[] {
  return [...files].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '')
        break
      // ...
    }
    return order === 'asc' ? comparison : -comparison
  })
}
```

**Pattern 4: Sort by Timestamp**
```typescript
export function sortByTimestamp(items: T[], order: 'asc' | 'desc'): T[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime()
    const bTime = new Date(b.timestamp).getTime()
    return order === 'desc' ? bTime - aTime : aTime - bTime
  })
}
```

## Solution

### Created `src/lib/filter-utils.ts`

**Core Functions:**

1. **`filterBySearch(items, query, fields)`** - Generic text search
   - Searches across multiple fields
   - Supports nested paths (e.g., 'user.name')
   - Handles arrays (e.g., tags)

2. **`filterByValue(items, field, value)`** - Exact match filter
   - Supports 'all' option
   - Type-safe

3. **`sortBy(items, sortBy, order)`** - Generic sort
   - Supports field names or functions
   - Handles strings, numbers, dates

4. **`sortByName(items, nameField, order)`** - Sort by name
5. **`sortByDate(items, dateField, order)`** - Sort by date
6. **`sortByNumber(items, numberField, order)`** - Sort by number
7. **`sortByVersion(items, versionField, order)`** - Sort by version string

**Convenience Functions:**
- `filterByStatus()` - Filter by status field
- `filterByType()` - Filter by type field
- `applyFilters()` - Combine multiple filters

## Updated Files

✅ **Storage Utils** - `filterFiles`, `filterFilesByType`, `sortFiles`
✅ **Data Utils** - `filterConnections`, `filterJobsByStatus`, `sortMigrationsByVersion`
✅ **Content Utils** - `filterAttachmentsBySearch`, `filterAttachmentsByType`, `filterChangeRequestsByStatus`, `filterTicketsByStatus`, `filterTicketsByPriority`
✅ **Security Utils** - `filterAuditLogs`, `filterBySeverity`, `filterByStatus`, `sortAuditLogs`
✅ **Analytics Utils** - `filterLogs`, `filterLogsByLevel`, `filterLogsByService`, `sortLogsByTimestamp`

## Usage Examples

### Before:
```typescript
export function filterFiles(files: StorageFile[], query: string): StorageFile[] {
  if (!query.trim()) return files
  const lowerQuery = query.toLowerCase()
  return files.filter(file =>
    file.name?.toLowerCase().includes(lowerQuery) ||
    file.mimeType?.toLowerCase().includes(lowerQuery)
  )
}
```

### After:
```typescript
import { filterBySearch } from '@/lib/filter-utils'

export function filterFiles(files: StorageFile[], query: string): StorageFile[] {
  return filterBySearch(files, query, ['name', 'mimeType'])
}
```

### Sort Example:
```typescript
// Before
export function sortFiles(files: StorageFile[], sortBy: 'name' | 'size' | 'date', order: 'asc' | 'desc'): StorageFile[] {
  return [...files].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '')
        break
      // ...
    }
    return order === 'asc' ? comparison : -comparison
  })
}

// After
import { sortBy } from '@/lib/filter-utils'

export function sortFiles(files: StorageFile[], sortByField: 'name' | 'size' | 'date', order: 'asc' | 'desc'): StorageFile[] {
  switch (sortByField) {
    case 'name':
      return sortBy(files, 'name', order)
    case 'size':
      return sortBy(files, 'size', order)
    case 'date':
      return sortBy(files, item => new Date(item.updatedAt), order)
    default:
      return files
  }
}
```

## Benefits

1. **Code Reduction**: ~150-200 lines of duplicate code removed
2. **Consistency**: All filters/sorts use same logic
3. **Maintainability**: Single place to fix bugs
4. **Type Safety**: TypeScript ensures correct usage
5. **Flexibility**: Generic functions work with any data type

## Impact

- **Lines Removed**: ~150-200 lines
- **Files Updated**: 5 feature utils files
- **New Shared Utility**: 1 file (`filter-utils.ts`)
- **Consistency**: Improved across all features

## Status

✅ **Complete** - All filter/sort functions consolidated

