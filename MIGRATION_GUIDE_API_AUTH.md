# API Authentication Migration Guide

## Quick Reference

### Before → After

#### Pattern 1: Basic Auth (session?.user)
```typescript
// Before
const session = await getServerSession(authOptions)
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// After
import { requireAuth } from '@/lib/api-middleware'

const authResult = await requireAuth()
if (!authResult.success) return authResult.response
const { session } = authResult
```

#### Pattern 2: Auth with User ID (session?.user?.id) - MOST COMMON
```typescript
// Before
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// After
import { requireAuthWithId } from '@/lib/api-middleware'

const authResult = await requireAuthWithId()
if (!authResult.success) return authResult.response
const { session } = authResult
// session.user.id is guaranteed to exist
```

#### Pattern 3: Admin Check
```typescript
// Before
const session = await getServerSession(authOptions)
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// After
import { requireAdmin } from '@/lib/api-middleware'

const authResult = await requireAdmin()
if (!authResult.success) return authResult.response
const { session } = authResult
// session.user.id and session.user.role are guaranteed
```

#### Pattern 4: With Security Headers
```typescript
// Before
const session = await getServerSession(authOptions)
if (!session?.user) {
  return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
}

// After
// Security headers are automatically added by requireAuth() functions
import { requireAuth } from '@/lib/api-middleware'

const authResult = await requireAuth()
if (!authResult.success) return authResult.response
```

## Benefits

1. **Automatic Security Headers**: All auth functions automatically add security headers
2. **Type Safety**: TypeScript ensures correct usage
3. **Consistency**: All routes use same pattern
4. **Less Code**: 3-4 lines → 2-3 lines
5. **Single Point of Fix**: Update auth logic in one place

## Examples Updated

- ✅ `src/app/api/intake-forms/route.ts`
- ✅ `src/app/api/modules/route.ts`
- ✅ `src/app/api/marketplace/plugins/external/register/route.ts`

## Migration Checklist

For each API route file:

1. [ ] Remove `import { getServerSession } from 'next-auth'`
2. [ ] Remove `import { authOptions } from '@/lib/auth'` (if only used for auth)
3. [ ] Add `import { requireAuthWithId } from '@/lib/api-middleware'` (or appropriate function)
4. [ ] Replace auth check with new pattern
5. [ ] Remove `addSecurityHeaders()` wrapper if only used for auth errors
6. [ ] Test the route

## Which Function to Use?

- **`requireAuth()`**: When you only need to check if user is logged in (rare)
- **`requireAuthWithId()`**: When you need user ID (most common - use this 90% of the time)
- **`requireAdmin()`**: When endpoint requires admin role

## Notes

- All functions automatically add security headers to error responses
- All functions return type-safe results
- `session.user.id` is guaranteed to exist after `requireAuthWithId()` or `requireAdmin()`
- No breaking changes - old code still works, but new code should use these functions

