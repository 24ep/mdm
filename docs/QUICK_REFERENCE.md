# Quick Reference Guide

## New Shared Utilities

### Formatters (`src/lib/formatters.ts`)

```typescript
import { formatFileSize, formatTimeAgo, formatDuration } from '@/lib/formatters'

// Format file size
formatFileSize(1024) // "1 KB"
formatFileSize(1048576) // "1 MB"

// Format time ago
formatTimeAgo(new Date(Date.now() - 3600000)) // "1 hours ago"

// Format duration
formatDuration(5000) // "5.00s"
formatDuration(125000) // "2m 5s"
```

### File Utilities (`src/lib/file-utils.ts`)

```typescript
import { getFileIcon, isImageFile, isVideoFile, isPreviewable } from '@/lib/file-utils'

// Get file icon
getFileIcon('image/png') // "image"
getFileIcon('application/pdf') // "pdf"

// Check file types
isImageFile('image/jpeg') // true
isVideoFile('video/mp4') // true
isPreviewable('image/png') // true
```

### API Middleware (`src/lib/api-middleware.ts`)

#### Basic Usage

```typescript
import { withAuth, handleApiError, parseJsonBody } from '@/lib/api-middleware'

// With authentication
export const POST = withAuth(async (request, { session }) => {
  // session is available here
  const userId = session.user.id
  // ... your logic
  return NextResponse.json({ success: true })
})

// With error handling
export const GET = withErrorHandling(async (request) => {
  // ... your logic
  return NextResponse.json({ data: [] })
}, 'MyAPI')

// Combined
export const PUT = withAuthAndErrorHandling(async (request, { session }) => {
  // ... your logic
  return NextResponse.json({ success: true })
}, 'MyAPI')

// Parse JSON body safely
const body = await parseJsonBody<MyType>(request)
```

#### Manual Usage

```typescript
import { requireAuth, handleApiError } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  
  try {
    // ... your logic
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'MyAPI')
  }
}
```

### Permissions (`src/lib/permissions/index.ts`)

```typescript
import { 
  requireAuth, 
  requireRole, 
  requirePermission,
  checkPermission 
} from '@/lib/permissions'

// In API routes
export const GET = async (request: NextRequest) => {
  const authError = await requireAuth(request)
  if (authError) return authError
  
  const roleError = await requireRole(request, 'ADMIN')
  if (roleError) return roleError
  
  // ... your logic
}
```

## Migration Guide

### Updating Imports

**Before:**
```typescript
import { formatFileSize } from '@/app/admin/features/storage/utils'
```

**After:**
```typescript
import { formatFileSize } from '@/lib/formatters'
// OR (backward compatible)
import { formatFileSize } from '@/lib/utils'
```

### Updating API Routes

**Before:**
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // ... logic
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**After:**
```typescript
import { withAuthAndErrorHandling } from '@/lib/api-middleware'

export const POST = withAuthAndErrorHandling(async (request, { session }) => {
  // session is available
  // ... logic
  return NextResponse.json({ success: true })
}, 'MyAPI')
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

```typescript
// src/lib/__tests__/formatters.test.ts
import { formatFileSize, formatTimeAgo } from '../formatters'

describe('formatters', () => {
  it('formats file size correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
  })
  
  it('formats time ago correctly', () => {
    const oneHourAgo = new Date(Date.now() - 3600000)
    expect(formatTimeAgo(oneHourAgo)).toContain('hour')
  })
})
```

## Best Practices

1. **Always use shared utilities** - Don't create new implementations
2. **Use API middleware** - Standardize authentication and error handling
3. **Import from centralized locations** - Use `@/lib/formatters`, `@/lib/file-utils`, etc.
4. **Write tests** - Test utilities and API routes
5. **Follow patterns** - Use existing patterns for consistency

---

**Last Updated:** 2025-01-XX

