# Phase 3.3: Space Access Checks Consolidation

## Overview

Consolidating duplicate space access validation code across API routes into shared utilities.

## Current State

### Patterns Found

**Pattern 1: Separate Member and Owner Checks (Most Common)**
```typescript
const spaceMember = await db.spaceMember.findFirst({
  where: { spaceId: form.spaceId, userId: session.user.id },
})
const isSpaceOwner = await db.space.findFirst({
  where: { id: form.spaceId, createdBy: session.user.id },
})

if (!spaceMember && !isSpaceOwner) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Pattern 2: Raw SQL Query**
```typescript
const { rows: access } = await query(
  'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
  [space_id, session.user.id]
)
if (access.length === 0) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Pattern 3: Include Members in Space Query**
```typescript
const space = await db.space.findUnique({
  where: { id: spaceId },
  include: {
    members: {
      where: { userId: session.user.id }
    }
  }
})

const hasAccess = space.createdBy === session.user.id || space.members.length > 0
```

**Pattern 4: Project Space Access**
```typescript
const project = await db.project.findUnique({
  where: { id: projectId },
  select: { spaceId: true }
})

const spaceMember = await db.spaceMember.findFirst({
  where: { spaceId: project.spaceId, userId: session.user.id }
})
const isSpaceOwner = await db.space.findFirst({
  where: { id: project.spaceId, createdBy: session.user.id }
})
```

## Solution

### Created `src/lib/space-access.ts`

**Functions:**

1. **`checkSpaceAccess(spaceId, userId)`** - Returns boolean
   - Checks if user is member or owner
   - Pure function, no side effects

2. **`requireSpaceAccess(spaceId, userId, errorMessage?)`** - Returns result or error response
   - Checks access and returns error response if denied
   - Automatically adds security headers
   - Type-safe return value

3. **`requireProjectSpaceAccess(projectId, userId)`** - For project-based access
   - Gets project's space first
   - Then checks access to that space
   - Returns spaceId on success

4. **`checkAnySpaceAccess(spaceIds[], userId)`** - For multi-space resources
   - Checks if user has access to any of the spaces
   - Useful for tickets that can belong to multiple spaces

5. **`requireAnySpaceAccess(spaceIds[], userId, errorMessage?)`** - Requires access to at least one space

## Updated Files

✅ **`src/app/api/modules/route.ts`** - Updated 3 access checks
✅ **`src/app/api/intake-forms/route.ts`** - Updated 1 access check
✅ **`src/app/api/intake-forms/[id]/route.ts`** - Updated 2 access checks

## Usage Examples

### Before:
```typescript
const spaceMember = await db.spaceMember.findFirst({
  where: { spaceId: form.spaceId, userId: session.user.id },
})
const isSpaceOwner = await db.space.findFirst({
  where: { id: form.spaceId, createdBy: session.user.id },
})

if (!spaceMember && !isSpaceOwner) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### After:
```typescript
import { requireSpaceAccess } from '@/lib/space-access'

const accessResult = await requireSpaceAccess(form.spaceId, session.user.id)
if (!accessResult.success) return accessResult.response
```

### Project Space Access:
```typescript
import { requireProjectSpaceAccess } from '@/lib/space-access'

const accessResult = await requireProjectSpaceAccess(projectId, session.user.id)
if (!accessResult.success) return accessResult.response
const { spaceId } = accessResult // spaceId available on success
```

## Benefits

1. **Code Reduction**: ~200-300 lines of duplicate code
2. **Consistency**: All access checks use same logic
3. **Security**: Single point to fix access control bugs
4. **Performance**: Optimized queries (can be improved further)
5. **Type Safety**: TypeScript ensures correct usage
6. **Automatic Security Headers**: All error responses include security headers

## Impact

- **Lines Removed**: ~200-300 lines (when all routes migrated)
- **Files Updated**: 3 example routes
- **New Shared Utility**: 1 file (`space-access.ts`)
- **Security**: Improved consistency

## Migration Status

✅ **Utilities Created** - Ready for use
✅ **Example Routes Updated** - 3 routes demonstrate pattern
🔄 **Remaining Routes** - Can be migrated gradually

## Remaining Routes to Migrate

Found ~20+ routes with space access checks:
- `intake-submissions/[id]/route.ts`
- `intake-forms/[id]/submissions/route.ts`
- `modules/[id]/route.ts`
- `tickets/[id]/route.ts`
- `releases/route.ts`
- `projects/route.ts`
- And more...

**Recommendation**: Migrate gradually as routes are touched, or batch migrate by feature area.

## Status

✅ **Complete** - Utilities created and example routes updated

