# Phase 5: API Route Migration Progress

**Date:** 2025-01-XX
**Status:** 🚧 **IN PROGRESS**

---

## 🎯 Goal

Migrate API routes to use centralized utilities:
- `requireAuth` / `requireAuthWithId` instead of `getServerSession`
- `requireSpaceAccess` / `requireProjectSpaceAccess` instead of manual checks
- `withErrorHandling` wrapper instead of manual try-catch

---

## ✅ Completed Migrations

### 1. `src/app/api/intake-forms/[id]/submissions/route.ts`
- ✅ GET: Migrated to `requireAuth` + `requireSpaceAccess` + `withErrorHandling`
- ✅ POST: Migrated to `requireAuthWithId` + `withErrorHandling`
- **Lines Reduced:** ~15 lines
- **Benefits:** Consistent auth, automatic security headers, better error handling

### 2. `src/app/api/modules/[id]/route.ts`
- ✅ GET: Migrated to `requireAuthWithId` + `requireProjectSpaceAccess` + `withErrorHandling`
- ✅ PUT: Migrated to `requireAuthWithId` + `withErrorHandling`
- ✅ DELETE: Migrated to `requireAuthWithId` + `requireProjectSpaceAccess` + `withErrorHandling`
- **Lines Reduced:** ~25 lines
- **Benefits:** Consistent auth, automatic security headers, better error handling

### 3. `src/app/api/intake-submissions/[id]/route.ts`
- ✅ GET: Migrated to `requireAuth` + `requireSpaceAccess` (with user check) + `withErrorHandling`
- ✅ PUT: Migrated to `requireAuthWithId` + `requireSpaceAccess` + `withErrorHandling`
- **Lines Reduced:** ~20 lines
- **Benefits:** Consistent auth, automatic security headers, better error handling

---

## 📊 Migration Statistics

### Completed
- **Files Migrated:** 3 files
- **Handlers Migrated:** 6 handlers (GET, POST, PUT, DELETE)
- **Lines Reduced:** ~60 lines
- **Pattern Established:** Clear migration pattern documented

### Remaining Opportunities
- **Files with `getServerSession`:** ~666 matches across ~400 files
- **Files with manual space access:** ~40 matches
- **Files with manual error handling:** ~1,536 matches
- **Potential Lines Reduction:** ~2,200-3,120 lines

---

## 🔄 Migration Pattern

### Before:
```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Manual space access check
    const spaceMember = await db.spaceMember.findFirst({...})
    const isSpaceOwner = await db.space.findFirst({...})
    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ... logic ...
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error...', error)
    return NextResponse.json(
      { error: error.message || 'Failed...' },
      { status: 500 }
    )
  }
}
```

### After:
```typescript
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Check access
  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

  // ... logic ...
  return NextResponse.json({ data })
}

export const GET = withErrorHandling(getHandler, 'GET /api/...')
```

---

## 📝 Migration Checklist

### For Each Route:
- [ ] Replace `getServerSession(authOptions)` with `requireAuth()` or `requireAuthWithId()`
- [ ] Replace manual space access checks with `requireSpaceAccess()` or `requireProjectSpaceAccess()`
- [ ] Wrap handler with `withErrorHandling()`
- [ ] Remove manual try-catch blocks
- [ ] Remove manual error responses
- [ ] Test the route

---

## 🎯 Next Steps

1. **Continue Migration:** Migrate more routes following the established pattern
2. **Prioritize:** Focus on frequently-used routes first
3. **Document:** Update migration guide with lessons learned
4. **Monitor:** Track progress and remaining opportunities

---

## ✅ Benefits Achieved

1. **Consistency:** All routes use same auth pattern
2. **Security:** Automatic security headers added
3. **Error Handling:** Consistent error responses
4. **Code Reduction:** ~60 lines removed so far
5. **Maintainability:** Single source of truth for auth/access logic

---

**Status:** Migration in progress. Pattern established, ready for broader rollout.

