# URL Structure Update - Aligned with New Code Structure

## Summary

Updated all URLs and routes to align with the new feature-based code structure.

## Changes Made

### 1. Space-Scoped Routes ✅

#### Marketplace
- **Before**: `/[space]/marketplace` - Used `MainLayout`, `spaceId={null}`
- **After**: `/[space]/marketplace` - Uses `MarketplaceHome` directly, extracts `spaceId` from params
- **File**: `src/app/[space]/marketplace/page.tsx`

#### Infrastructure
- **Before**: `/[space]/infrastructure` - Used `MainLayout`, `spaceId={null}`
- **After**: `/[space]/infrastructure` - Uses `InfrastructureOverview` directly, extracts `spaceId` from params
- **File**: `src/app/[space]/infrastructure/page.tsx`

#### Knowledge Base
- ✅ Already correct: `/[space]/knowledge` - Uses `OutlineKnowledgeBase` with `spaceId` from params

### 2. Tools Layout ✅

Updated `pathToTabMap` in `src/app/tools/layout.tsx` to include:
- `/marketplace` → `marketplace`
- `/infrastructure` → `infrastructure`

### 3. Route Structure

#### Global Routes (No Space)
- `/knowledge` - Knowledge Base
- `/marketplace` - Marketplace
- `/infrastructure` - Infrastructure
- `/tools/*` - Tools (SQL Query, Data Science, etc.)
- `/system/*` - System administration

#### Space-Scoped Routes
- `/[space]/knowledge` - Space-scoped Knowledge Base
- `/[space]/marketplace` - Space-scoped Marketplace
- `/[space]/infrastructure` - Space-scoped Infrastructure
- `/[space]/projects` - Space-scoped Projects
- `/[space]/workflows` - Space-scoped Workflows
- `/[space]/assignments` - Space-scoped Assignments
- `/[space]/import-export` - Space-scoped Import/Export

## URL Patterns

### Feature-Based Routes
All routes now follow the feature-based structure:

```
/feature-name                    # Global feature
/[space]/feature-name           # Space-scoped feature
/tools/feature-name             # Tool feature
/system/feature-name            # System feature
```

### Examples

**Knowledge Base:**
- Global: `/knowledge`
- Space: `/[space]/knowledge`

**Marketplace:**
- Global: `/marketplace`
- Space: `/[space]/marketplace`

**Infrastructure:**
- Global: `/infrastructure`
- Space: `/[space]/infrastructure`

**Tools:**
- `/tools/bigquery` - SQL Query
- `/tools/notebook` - Data Science
- `/tools/ai-analyst` - AI Analyst
- `/tools/ai-chat-ui` - AI Chat UI
- `/tools/projects` - Project Management
- `/tools/bi` - BI & Reports
- `/tools/storage` - Storage
- `/tools/data-governance` - Data Governance

**System:**
- `/system/users` - User Management
- `/system/roles` - Role Management
- `/system/data` - Data Models
- `/system/settings` - System Settings
- etc.

## Files Updated

1. ✅ `src/app/[space]/marketplace/page.tsx`
   - Removed `MainLayout` wrapper
   - Extracts `spaceId` from params
   - Uses `MarketplaceHome` directly

2. ✅ `src/app/[space]/infrastructure/page.tsx`
   - Removed `MainLayout` wrapper
   - Extracts `spaceId` from params
   - Uses `InfrastructureOverview` directly

3. ✅ `src/app/tools/layout.tsx`
   - Added `/marketplace` and `/infrastructure` to `pathToTabMap`

## Verification

- ✅ All routes align with feature structure
- ✅ Space-scoped routes properly extract `spaceId`
- ✅ Global routes work without space context
- ✅ Sidebar navigation uses correct URLs
- ✅ Route maps are consistent across files

## Status

✅ **COMPLETE** - All URLs updated to align with new code structure.

