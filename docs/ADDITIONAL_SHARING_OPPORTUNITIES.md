# Additional Sharing & Consolidation Opportunities

**Date:** 2025-01-XX  
**Status:** 📋 Recommendations for Further Improvements

---

## 🔍 Analysis Summary

After comprehensive scanning, identified **6 major categories** of additional sharing opportunities beyond what's already been implemented.

---

## 1. 📅 Date/Time Formatting Functions 🔴 HIGH PRIORITY

### Issue
Found **18+ duplicate date formatting functions** across multiple files:

- `formatDate()` - Found in 12+ files
- `formatTimeAgo()` - Found in 3+ files (beyond the one we already consolidated)
- `formatTime()` - Found in 2+ files
- `formatTimestamp()` - Found in 1+ files

### Locations Found
```
src/app/chat/[id]/components/ThreadSelector.tsx - formatDate()
src/app/admin/features/storage/components/StorageManagement.tsx - formatDate()
src/components/files/FileNotifications.tsx - formatTimeAgo()
src/components/files/FileAnalytics.tsx - formatDate()
src/app/admin/features/integration/components/APIManagement.tsx - formatDate()
src/components/bigquery/QueryVersionHistory.tsx - formatTime()
src/components/bigquery/QueryComments.tsx - formatTimeAgo()
src/app/admin/components/FileSystemManagement.tsx - formatDate()
src/components/space-management/MemberAuditLog.tsx - formatTimestamp()
src/components/datascience/CollaborationPanel.tsx - formatTime()
src/components/bigquery/DataExplorer.tsx - formatDate()
src/app/dashboards/[id]/builder/components/VersioningDialog.tsx - formatDate()
src/components/dashboard/DashboardVersioning.tsx - formatDate()
src/components/ui/audit-log.tsx - formatDate()
src/components/ui/audit-logs-advanced.tsx - formatDate()
src/components/dashboard/DashboardScheduling.tsx - formatDate()
src/components/dashboard/DashboardCollaboration.tsx - formatTimeAgo()
src/app/data/events/page.tsx - formatDate()
```

### Recommendation
**Create:** `src/lib/date-formatters.ts`

```typescript
/**
 * Date and Time Formatting Utilities
 * Centralized date/time formatting functions
 */

import { format, formatDistanceToNow, formatDistance } from 'date-fns'

/**
 * Format date in various formats
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'MMM dd, yyyy'
): string {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'Invalid Date'
  return format(dateObj, formatStr)
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  formatStr: string = 'MMM dd, yyyy HH:mm'
): string {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'Invalid Date'
  return format(dateObj, formatStr)
}

/**
 * Format time only
 */
export function formatTime(
  date: Date | string | null | undefined,
  formatStr: string = 'HH:mm:ss'
): string {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'Invalid Date'
  return format(dateObj, formatStr)
}

/**
 * Format timestamp (ISO string to readable format)
 */
export function formatTimestamp(
  timestamp: string | null | undefined,
  formatStr: string = 'MMM dd, yyyy HH:mm:ss'
): string {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return 'Invalid Date'
  return format(date, formatStr)
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Uses formatTimeAgo from formatters.ts for consistency
 */
export { formatTimeAgo } from './formatters'
```

**Action:** 
1. Create `src/lib/date-formatters.ts`
2. Update all 18+ files to use shared functions
3. Add to `src/lib/formatters.ts` or keep separate (date-fns dependency)

**Impact:** Eliminate 18+ duplicate implementations, ~200+ lines of duplicate code

---

## 2. 🔔 Toast Notification Utilities 🟡 MEDIUM PRIORITY

### Issue
Found **1,292 toast notifications** across **149 files** using `toast.success()`, `toast.error()`, etc. with inconsistent patterns.

### Recommendation
**Create:** `src/lib/toast-utils.ts`

```typescript
/**
 * Toast Notification Utilities
 * Standardized toast notification helpers
 */

import toast from 'react-hot-toast'

export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  icon?: string | React.ReactNode
}

/**
 * Show success toast
 */
export function showSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, {
    duration: options?.duration || 3000,
    position: options?.position || 'top-right',
    ...options
  })
}

/**
 * Show error toast
 */
export function showError(message: string, options?: ToastOptions) {
  return toast.error(message, {
    duration: options?.duration || 4000,
    position: options?.position || 'top-right',
    ...options
  })
}

/**
 * Show info toast
 */
export function showInfo(message: string, options?: ToastOptions) {
  return toast(message, {
    duration: options?.duration || 3000,
    position: options?.position || 'top-right',
    icon: options?.icon || 'ℹ️',
    ...options
  })
}

/**
 * Show warning toast
 */
export function showWarning(message: string, options?: ToastOptions) {
  return toast(message, {
    duration: options?.duration || 3500,
    position: options?.position || 'top-right',
    icon: options?.icon || '⚠️',
    ...options
  })
}

/**
 * Show loading toast (returns dismiss function)
 */
export function showLoading(message: string, options?: ToastOptions) {
  return toast.loading(message, {
    position: options?.position || 'top-right',
    ...options
  })
}

/**
 * Common toast messages
 */
export const ToastMessages = {
  // Success messages
  SAVED: 'Saved successfully',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  COPIED: 'Copied to clipboard',
  
  // Error messages
  SAVE_ERROR: 'Failed to save',
  CREATE_ERROR: 'Failed to create',
  UPDATE_ERROR: 'Failed to update',
  DELETE_ERROR: 'Failed to delete',
  LOAD_ERROR: 'Failed to load data',
  NETWORK_ERROR: 'Network error. Please try again.',
  
  // Info messages
  LOADING: 'Loading...',
  PROCESSING: 'Processing...',
} as const
```

**Action:** 
1. Create `src/lib/toast-utils.ts`
2. Gradually migrate toast calls to use shared utilities
3. Standardize error messages

**Impact:** Standardize 1,292+ toast calls, improve UX consistency

---

## 3. ✅ Validation Utilities 🟡 MEDIUM PRIORITY

### Issue
Found multiple validation patterns across files:
- Attribute validation (`src/lib/attribute-management.ts`)
- Query validation (`src/components/bigquery/QueryValidation.tsx`)
- Record validation (`src/lib/data-sync-executor.ts`)
- Response validation (`src/lib/response-validator.ts`)
- EAV validation (`src/lib/eav-utils.ts`)

### Recommendation
**Create:** `src/lib/validation-utils.ts`

```typescript
/**
 * Validation Utilities
 * Centralized validation functions
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Validate field name (alphanumeric + underscore, starts with letter)
 */
export function validateFieldName(name: string): string | null {
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return 'Name must start with a letter and contain only letters, numbers, and underscores'
  }
  return null
}

/**
 * Validate number range
 */
export function validateRange(
  value: number,
  min?: number,
  max?: number,
  fieldName: string = 'Value'
): string | null {
  if (min !== undefined && value < min) {
    return `${fieldName} must be at least ${min}`
  }
  if (max !== undefined && value > max) {
    return `${fieldName} must be at most ${max}`
  }
  return null
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number,
  fieldName: string = 'Value'
): string | null {
  if (min !== undefined && value.length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  if (max !== undefined && value.length > max) {
    return `${fieldName} must be at most ${max} characters`
  }
  return null
}

/**
 * Validate regex pattern
 */
export function validatePattern(
  value: string,
  pattern: string | RegExp,
  errorMessage: string = 'Invalid format'
): string | null {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  if (!regex.test(value)) {
    return errorMessage
  }
  return null
}

/**
 * Run multiple validations
 */
export function validateAll(
  validations: Array<() => string | null>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const validation of validations) {
    const error = validation()
    if (error) {
      errors.push(error)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

**Action:**
1. Create `src/lib/validation-utils.ts`
2. Consolidate validation logic from multiple files
3. Update existing validation functions to use shared utilities

**Impact:** Standardize validation patterns, reduce duplication

---

## 4. 🎣 Common React Hook Patterns 🟢 LOW PRIORITY

### Issue
Found **481 matches** of `useState`, `useEffect`, `useCallback`, `useMemo` across **37 files** in admin features. Many follow similar patterns.

### Opportunities
1. **Data Fetching Hook** - Many components fetch data similarly
2. **Form State Hook** - Many forms manage state similarly
3. **Modal/Dialog Hook** - Many modals follow same open/close pattern
4. **Pagination Hook** - Many tables use similar pagination logic

### Recommendation
**Create:** `src/hooks/common/`

```typescript
// src/hooks/common/useDataFetching.ts
export function useDataFetching<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    
    fetchFn()
      .then(result => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })
    
    return () => { cancelled = true }
  }, dependencies)

  return { data, loading, error, refetch: () => fetchFn() }
}

// src/hooks/common/useModal.ts
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])
  
  return { isOpen, open, close, toggle }
}

// src/hooks/common/usePagination.ts
export function usePagination(initialPage: number = 1, initialLimit: number = 20) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  
  const nextPage = useCallback(() => setPage(prev => prev + 1), [])
  const prevPage = useCallback(() => setPage(prev => Math.max(1, prev - 1)), [])
  const goToPage = useCallback((newPage: number) => setPage(Math.max(1, newPage)), [])
  
  return { page, limit, setPage, setLimit, nextPage, prevPage, goToPage }
}
```

**Action:**
1. Create common hooks directory
2. Extract common patterns
3. Gradually migrate components

**Impact:** Reduce boilerplate, improve consistency

---

## 5. 📦 Constants & Default Configurations 🟡 MEDIUM PRIORITY

### Issue
Found multiple constant files and default configurations:
- `src/app/admin/components/chatbot/constants.ts` - Chatbot defaults
- `src/components/studio/layout-config/constants.ts` - Layout constants
- `src/components/studio/record-config.tsx` - Record config defaults
- Various default configs in component files

### Recommendation
**Create:** `src/lib/constants/`

```
src/lib/constants/
  ├── defaults.ts          # Default configurations
  ├── field-types.ts       # Field type constants
  ├── status-codes.ts      # Status code constants
  ├── permissions.ts        # Permission constants
  └── ui.ts                # UI-related constants
```

**Action:**
1. Create constants directory structure
2. Consolidate constants from multiple files
3. Export from index file

**Impact:** Centralize configuration, easier to maintain

---

## 6. 📡 API Response Standardization 🟡 MEDIUM PRIORITY

### Issue
API routes return responses in various formats. Could standardize response structure.

### Recommendation
**Create:** `src/lib/api-response.ts`

```typescript
/**
 * Standardized API Response Utilities
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId?: string
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  }
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  }
}
```

**Action:**
1. Create API response utilities
2. Gradually migrate API routes to use standardized format
3. Update frontend to expect standardized format

**Impact:** Consistent API responses, better error handling

---

## 📊 Summary

### Priority Breakdown

| Priority | Category | Files Affected | Impact |
|----------|----------|----------------|--------|
| 🔴 High | Date Formatting | 18+ files | ~200+ lines eliminated |
| 🟡 Medium | Toast Utilities | 149 files | 1,292+ calls standardized |
| 🟡 Medium | Validation Utils | 5+ files | Standardize patterns |
| 🟡 Medium | Constants | 10+ files | Centralize config |
| 🟡 Medium | API Responses | 50+ routes | Standardize format |
| 🟢 Low | Common Hooks | 37 files | Reduce boilerplate |

### Estimated Impact

- **Code Reduction:** ~500+ lines of duplicate code
- **Consistency:** Standardized patterns across 200+ files
- **Maintainability:** Single source of truth for common utilities
- **Developer Experience:** Easier to use, better documentation

---

## 🎯 Implementation Order

1. **Date Formatting** (High Priority) - Quick win, high impact
2. **Toast Utilities** (Medium Priority) - High usage, gradual migration
3. **Validation Utils** (Medium Priority) - Consolidate existing patterns
4. **Constants** (Medium Priority) - Organize existing constants
5. **API Responses** (Medium Priority) - Standardize gradually
6. **Common Hooks** (Low Priority) - Extract patterns as needed

---

**Last Updated:** 2025-01-XX  
**Status:** 📋 Recommendations Ready for Implementation

