# Code Structure Analysis: Tools vs Features

## Current Structure

### `src/app/tools/` (Next.js Routes)
These are **route pages** that map to URLs:
- `/tools/bigquery` → `tools/bigquery/page.tsx`
- `/tools/notebook` → `tools/notebook/page.tsx`
- `/tools/knowledge-base` → `tools/knowledge-base/page.tsx`
- `/tools/projects` → `tools/projects/page.tsx`
- etc.

### `src/features/` (Feature Modules)
These are **reusable feature modules** with:
- Components
- Hooks
- Types
- Lib utilities

**Features:**
- `tickets/` - TicketsList component, hooks, types
- `reports/` - ReportsList component, hooks, types
- `dashboards/` - DashboardsList component, hooks, types
- `workflows/` - WorkflowsList component, hooks, types
- `knowledge/` - OutlineKnowledgeBase component, hooks, types
- `marketplace/` - MarketplaceHome component, hooks, types
- `infrastructure/` - InfrastructureOverview component, hooks, types

## Issues Found

### ❌ Misalignment

1. **Tools routes using admin features instead of feature modules:**
   - `tools/projects/page.tsx` → Uses `@/app/admin/features/content` ❌
   - `tools/bi/page.tsx` → Uses `@/app/admin/features/business-intelligence` ❌
   - `tools/storage/page.tsx` → Uses `@/app/admin/features/storage` ❌
   - `tools/data-governance/page.tsx` → Uses `@/app/admin/features/data-governance` ❌
   - `tools/ai-analyst/page.tsx` → Uses `@/app/admin/features/business-intelligence` ❌
   - `tools/ai-chat-ui/page.tsx` → Uses `@/app/admin/features/business-intelligence` ❌
   - `tools/bigquery/page.tsx` → Uses `@/app/admin/features/business-intelligence` ❌

2. **Missing tools routes for features:**
   - No `/tools/tickets` route (but `features/tickets` exists)
   - No `/tools/reports` route (but `features/reports` exists)
   - No `/tools/dashboards` route (but `features/dashboards` exists)
   - No `/tools/workflows` route (but `features/workflows` exists)

3. **Only one correctly aligned:**
   - ✅ `tools/knowledge-base/page.tsx` → Uses `@/features/knowledge` ✅

## Design Pattern

### Correct Pattern:
```
src/app/tools/[feature]/page.tsx
  ↓ imports from
src/features/[feature]/components/[Component].tsx
```

### Current Pattern (Incorrect):
```
src/app/tools/[feature]/page.tsx
  ↓ imports from
src/app/admin/features/[feature]/[Component].tsx  ❌
```

## Recommendations

### Option 1: Keep Current Structure (Admin Features)
- Tools routes can use admin features
- Admin features are for admin/system views
- Tools are user-facing views
- **Issue:** Not following single-source pattern

### Option 2: Migrate to Feature Modules (Recommended)
- Create feature modules for all tools
- Tools routes use feature modules
- Admin routes also use feature modules (single-source)
- **Benefit:** True single-source pattern

### Option 3: Hybrid Approach
- Features that are user-facing → Use feature modules
- Features that are admin-only → Use admin features
- **Issue:** Inconsistent pattern

## Decision Needed

Which pattern should we follow?
1. All tools use feature modules (single-source)
2. Tools use admin features (current, but not single-source)
3. Hybrid (inconsistent)

