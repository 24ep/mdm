# Best Practices: Loading/Error/Data Pattern

## Overview

This document outlines best practices for handling loading, error, and data states in React components.

## Current State

**Pattern Found:** 251 matches across 172 files of:
```typescript
const [data, setData] = useState<T | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)
```

## Recommended Approach

### ✅ Use `useUnifiedDataFetch` Hook (Preferred)

For data fetching scenarios, use the shared `useUnifiedDataFetch` hook:

```typescript
import { useUnifiedDataFetch } from '@/hooks/data/useUnifiedDataFetch'

function MyComponent() {
  const { data, loading, error, refetch, reset } = useUnifiedDataFetch({
    fetchFn: async () => {
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    immediate: true,
    retryCount: 3,
    onSuccess: (data) => {
      console.log('Data loaded:', data)
    },
    onError: (error) => {
      console.error('Error:', error)
    }
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return <div>No data</div>

  return <div>{/* Render data */}</div>
}
```

### Benefits

- ✅ Automatic request cancellation on unmount
- ✅ Built-in retry logic
- ✅ Consistent error handling
- ✅ Loading state management
- ✅ Reset functionality
- ✅ Abort controller support

### When to Use

- ✅ Fetching data from API
- ✅ Loading resources
- ✅ Any async data operation
- ✅ When you need retry logic
- ✅ When you need request cancellation

### When NOT to Use

- ❌ Form state (use `useFormState` instead)
- ❌ Local component state
- ❌ Non-async operations
- ❌ Simple boolean flags

---

## Alternative: Manual Pattern (If Needed)

If `useUnifiedDataFetch` doesn't fit your use case, follow this pattern:

```typescript
const [data, setData] = useState<T | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)

const fetchData = useCallback(async () => {
  setLoading(true)
  setError(null)
  
  try {
    const result = await fetchFn()
    setData(result)
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error')
    setError(error)
  } finally {
    setLoading(false)
  }
}, [fetchFn])

useEffect(() => {
  fetchData()
}, [fetchData])
```

### Best Practices for Manual Pattern

1. **Always reset error state** when starting a new request
2. **Use finally block** to ensure loading is set to false
3. **Handle error types** properly (check `instanceof Error`)
4. **Cancel requests** on unmount (use AbortController)
5. **Use useCallback** to memoize fetch functions

---

## Migration Guide

### Before:
```typescript
const [data, setData] = useState<Data | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<Error | null>(null)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown'))
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

### After:
```typescript
const { data, loading, error, refetch } = useUnifiedDataFetch({
  fetchFn: async () => {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error('Failed to fetch')
    return response.json()
  },
  immediate: true
})
```

---

## Common Patterns

### Pattern 1: Simple Data Fetch
```typescript
const { data, loading, error } = useUnifiedDataFetch({
  fetchFn: () => fetch('/api/users').then(r => r.json()),
  immediate: true
})
```

### Pattern 2: Conditional Fetch
```typescript
const { data, loading, error } = useUnifiedDataFetch({
  fetchFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  enabled: !!userId,
  immediate: true
})
```

### Pattern 3: With Retry
```typescript
const { data, loading, error, refetch } = useUnifiedDataFetch({
  fetchFn: () => fetch('/api/data').then(r => r.json()),
  retryCount: 3,
  retryDelay: 1000,
  immediate: true
})
```

### Pattern 4: With Dependencies
```typescript
const { data, loading, error } = useUnifiedDataFetch({
  fetchFn: () => fetch(`/api/data?filter=${filter}`).then(r => r.json()),
  dependencies: [filter],
  immediate: true
})
```

---

## Error Handling Best Practices

### 1. Use Toast Notifications
```typescript
import { showError } from '@/lib/toast-utils'

const { data, loading, error } = useUnifiedDataFetch({
  fetchFn: () => fetch('/api/data').then(r => r.json()),
  onError: (error) => {
    showError(`Failed to load data: ${error.message}`)
  }
})
```

### 2. Log Errors for Debugging
```typescript
onError: (error) => {
  console.error('[Component] Failed to fetch data:', error)
  showError('Failed to load data')
}
```

### 3. Handle Specific Error Types
```typescript
onError: (error) => {
  if (error.message.includes('Network')) {
    showError('Network error. Please check your connection.')
  } else if (error.message.includes('401')) {
    showError('Unauthorized. Please log in.')
  } else {
    showError('An unexpected error occurred.')
  }
}
```

---

## Loading State Best Practices

### 1. Show Loading Indicator
```typescript
if (loading) {
  return <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
}
```

### 2. Skeleton Loading (Better UX)
```typescript
if (loading) {
  return <SkeletonLoader />
}
```

### 3. Optimistic Updates
```typescript
// Update UI immediately, then sync with server
const handleUpdate = async (newData: Data) => {
  setData(newData) // Optimistic update
  try {
    await updateData(newData)
  } catch (error) {
    setData(previousData) // Rollback on error
    showError('Failed to update')
  }
}
```

---

## Summary

### ✅ DO:
- Use `useUnifiedDataFetch` for data fetching
- Handle errors gracefully
- Show loading states
- Cancel requests on unmount
- Use retry logic for transient errors

### ❌ DON'T:
- Manually manage loading/error state if `useUnifiedDataFetch` fits
- Ignore errors
- Leave loading state stuck
- Forget to cancel requests
- Create duplicate patterns

---

## Migration Priority

1. **High Priority:** Components with complex error handling
2. **Medium Priority:** Components with retry logic needs
3. **Low Priority:** Simple components (can migrate gradually)

## Status

✅ **DOCUMENTATION COMPLETE** - Best practices documented for future development

