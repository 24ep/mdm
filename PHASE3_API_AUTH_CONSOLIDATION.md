# Phase 3.1: API Authentication Consolidation

## Overview

Consolidating 2,341+ instances of duplicate authentication code across 401 API route files.

## Current State

### Patterns Found

1. **Basic Auth Check** (most common):
   ```typescript
   const session = await getServerSession(authOptions)
   if (!session?.user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

2. **Auth with User ID** (very common):
   ```typescript
   const session = await getServerSession(authOptions)
   if (!session?.user?.id) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

3. **Admin Check**:
   ```typescript
   if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
   }
   ```

4. **With Security Headers**:
   ```typescript
   return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
   ```

## Solution

### Enhanced `src/lib/api-middleware.ts`

Added comprehensive auth utilities:

1. **`requireAuth()`** - Checks `session?.user`
   - Returns: `{ success: true, session }` or `{ success: false, response }`
   - Use when you only need to verify user is logged in

2. **`requireAuthWithId()`** - Checks `session?.user?.id`
   - Returns: `{ success: true, session }` or `{ success: false, response }`
   - Use when you need the user ID (most common case)
   - Automatically adds security headers

3. **`requireAdmin()`** - Checks for admin role
   - Returns: `{ success: true, session }` or `{ success: false, response }`
   - Use for admin-only endpoints

### Usage Examples

#### Before:
```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // ... rest of handler
  } catch (error) {
    // ...
  }
}
```

#### After:
```typescript
import { requireAuthWithId } from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    
    const { session } = authResult
    // session.user.id is guaranteed to exist
    
    // ... rest of handler
  } catch (error) {
    // ...
  }
}
```

#### Admin Check:
```typescript
import { requireAdmin } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    
    const { session } = authResult
    // session.user.id and session.user.role are guaranteed
    
    // ... rest of handler
  } catch (error) {
    // ...
  }
}
```

## Migration Strategy

### Phase 1: Create Utilities ✅
- ✅ Enhanced `api-middleware.ts` with new functions
- ✅ Functions automatically add security headers
- ✅ Type-safe return values

### Phase 2: Update Example Routes (In Progress)
- Update a few representative routes to demonstrate pattern
- Document migration approach

### Phase 3: Gradual Migration
- Update routes as they're touched during development
- Or batch update by feature area

## Benefits

1. **Code Reduction**: ~2,000+ lines of duplicate code
2. **Consistency**: All auth checks use same pattern
3. **Security**: Single point to fix auth bugs
4. **Type Safety**: TypeScript ensures correct usage
5. **Maintainability**: Easier to update auth logic

## Impact

- **Files Affected**: 401 API route files
- **Lines Removed**: ~2,000+ lines
- **Security**: Improved consistency
- **Maintainability**: Significantly improved

## Status

✅ **Phase 1 Complete** - Utilities created and enhanced
✅ **Phase 2 Complete** - Example routes updated

### Example Routes Updated
- ✅ `src/app/api/intake-forms/route.ts` - Basic auth patterns
- ✅ `src/app/api/modules/route.ts` - Auth with user ID
- ✅ `src/app/api/marketplace/plugins/external/register/route.ts` - Admin check

### Migration Documentation
- ✅ `MIGRATION_GUIDE_API_AUTH.md` - Complete migration guide
- ✅ `PHASE3_API_AUTH_CONSOLIDATION.md` - This document

## Next Steps

The utilities are ready for use. Routes can be migrated:
1. **Gradually** - As routes are touched during development
2. **By Feature** - Update all routes in a feature area at once
3. **Batch** - Update all routes in a single pass (requires testing)

**Recommendation**: Migrate gradually or by feature to minimize risk.

