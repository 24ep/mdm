# API Routes Migration Guide

## Overview

The API routes are being reorganized into a clearer structure with versioning support. This guide explains the new structure and migration process.

## New Structure

### `/api/v1/` - Versioned Public API
Stable, versioned API endpoints for external use.

**Examples:**
- `/api/v1/data-models`
- `/api/v1/spaces`
- `/api/v1/users`
- `/api/v1/notifications`

### `/api/admin/` - Admin APIs
Admin-only endpoints (already exists, no changes needed).

**Examples:**
- `/api/admin/users`
- `/api/admin/storage`
- `/api/admin/analytics`

### `/api/public/` - Public APIs
Public endpoints that don't require authentication.

**Examples:**
- `/api/public/spaces`

### `/api/internal/` - Internal APIs
Internal endpoints for system operations.

**Examples:**
- `/api/internal/automation/scheduler`
- `/api/internal/sse`
- `/api/internal/webhooks`

### `/api/auth/` - Authentication
Authentication endpoints (no changes).

**Examples:**
- `/api/auth/signin`
- `/api/auth/signup`

## Migration Status

### ✅ Phase 1: Structure Created
- Created `v1/` directory structure
- Created redirect wrappers for backward compatibility
- Created `internal/` directory structure

### ⏳ Phase 2: Gradual Migration
Routes are being migrated incrementally. Old routes still work via redirects.

### 📋 Phase 3: Cleanup (Future)
After all routes are migrated, old routes will be removed.

## Backward Compatibility

**All existing routes continue to work!**

The new structure uses redirects/wrappers to maintain backward compatibility:

```typescript
// Old route (still works)
fetch('/api/data-models')

// New route (recommended)
fetch('/api/v1/data-models')
```

Both routes point to the same implementation.

## Migration Checklist

### For Frontend Developers

1. **Update API calls gradually:**
   ```typescript
   // Old
   fetch('/api/data-models')
   
   // New (recommended)
   fetch('/api/v1/data-models')
   ```

2. **Update API client code:**
   - Update base URLs
   - Update route paths
   - Test thoroughly

3. **Update documentation:**
   - API documentation
   - Integration guides
   - Client SDKs

### For Backend Developers

1. **Migrate route implementations:**
   - Move route files to new structure
   - Update imports
   - Test endpoints

2. **Update route handlers:**
   - Use new API middleware
   - Standardize error handling
   - Add version headers

3. **Update tests:**
   - Update test paths
   - Test both old and new routes
   - Verify backward compatibility

## Route Mapping

### Data Models
- Old: `/api/data-models`
- New: `/api/v1/data-models`
- Status: ✅ Redirect created

### Spaces
- Old: `/api/spaces`
- New: `/api/v1/spaces`
- Status: ✅ Redirect created

### Users
- Old: `/api/users`
- New: `/api/v1/users`
- Status: ✅ Redirect created

### Notifications
- Old: `/api/notifications`
- New: `/api/v1/notifications`
- Status: ✅ Redirect created

### Health
- Old: `/api/health`
- New: `/api/v1/health`
- Status: ✅ Redirect created

## Benefits

1. **Clear Organization** - Routes grouped by domain
2. **Versioning Support** - Easy to add v2, v3, etc.
3. **Better Navigation** - Easier to find routes
4. **Separation of Concerns** - Admin, public, internal clearly separated
5. **Backward Compatible** - No breaking changes

## Next Steps

1. Continue migrating routes incrementally
2. Update frontend to use new routes
3. Update API documentation
4. Remove old routes after migration complete

---

**Last Updated:** 2025-01-XX  
**Status:** Phase 1 Complete - Structure Created

