# Database Migration Guide

## Legacy `database.js` Migration

The legacy `database.js` file uses direct PostgreSQL connections via `pg` Pool. The codebase has migrated to Prisma ORM, which is the recommended approach.

### Current Status

- ✅ **Prisma is the primary database client** (`src/lib/db.ts`)
- ⚠️ **Legacy `database.js` exists but is not actively used**
- ✅ **All new code should use Prisma**

### Migration Path

#### Option 1: Use Prisma ORM (Recommended)

```typescript
// Before (database.js)
import { query } from '@/lib/database.js'
const result = await query('SELECT * FROM users WHERE id = $1', [userId])

// After (Prisma)
import { db } from '@/lib/db'
const user = await db.user.findUnique({ where: { id: userId } })
```

#### Option 2: Use Enhanced Query Helpers

```typescript
// For complex queries that need raw SQL
import { executeQuery } from '@/lib/db-helpers'

const result = await executeQuery<User>(
  'SELECT * FROM users WHERE id::text = $1',
  [userId]
)
```

### Enhanced Query Helpers

The new `src/lib/db-helpers.ts` provides:

- `executeQuery()` - Enhanced query with logging and error handling
- `executeTransaction()` - Transaction support
- `recordExists()` - Check if record exists
- `getRecordCount()` - Get count of records
- `paginateQuery()` - Pagination helper
- `batchInsert()` - Batch insert helper

### When to Use What

1. **Use Prisma ORM** - For standard CRUD operations
2. **Use `executeQuery()`** - For complex SQL queries
3. **Use `db-helpers`** - For advanced operations (pagination, transactions, etc.)

### Removing `database.js`

**Before removing:**
1. Audit all imports of `database.js`
2. Migrate any remaining usages to Prisma or `db-helpers`
3. Test thoroughly
4. Remove the file

**Current status:** No active usages found - safe to remove after verification.

---

**Last Updated:** 2025-01-XX

