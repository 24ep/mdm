# Code Structure Alignment Plan

## Current State Analysis

### ✅ Correctly Aligned
- `tools/knowledge-base/page.tsx` → Uses `@/features/knowledge` ✅
- `marketplace/page.tsx` → Uses `@/features/marketplace` ✅
- `infrastructure/page.tsx` → Uses `@/features/infrastructure` ✅
- `[space]/knowledge/page.tsx` → Uses `@/features/knowledge` ✅
- `[space]/marketplace/page.tsx` → Uses `@/features/marketplace` ✅
- `[space]/infrastructure/page.tsx` → Uses `@/features/infrastructure` ✅

### ❌ Needs Alignment

**Tools routes using admin features instead of feature modules:**
1. `tools/projects/page.tsx` → Uses `@/app/admin/features/content`
   - Should use: `@/features/tickets` (Projects = Tickets)

**Missing tools routes for existing features:**
2. No `/tools/tickets` route (but `features/tickets` exists)
3. No `/tools/reports` route (but `features/reports` exists) 
4. No `/tools/dashboards` route (but `features/dashboards` exists)
5. No `/tools/workflows` route (but `features/workflows` exists)

**Tools without feature modules (OK to use admin features):**
- `tools/bigquery` → No feature module, uses admin ✅
- `tools/notebook` → No feature module, uses admin ✅
- `tools/ai-analyst` → No feature module, uses admin ✅
- `tools/ai-chat-ui` → No feature module, uses admin ✅
- `tools/bi` → No feature module, uses admin ✅
- `tools/storage` → No feature module, uses admin ✅
- `tools/data-governance` → No feature module, uses admin ✅

## Alignment Strategy

### Pattern to Follow:
```
If feature module exists → Use feature module
If no feature module → Use admin feature (OK)
```

### Actions Needed:

1. **Update `tools/projects` to use feature module:**
   - Change from `@/app/admin/features/content` 
   - To `@/features/tickets` (since Projects = Tickets)

2. **Optional: Add tools routes for features:**
   - `/tools/tickets` → Use `@/features/tickets`
   - `/tools/reports` → Use `@/features/reports`
   - `/tools/dashboards` → Use `@/features/dashboards`
   - `/tools/workflows` → Use `@/features/workflows`

## Decision

**Question:** Should "Projects" use TicketsList from features?

**Answer:** Yes - Projects management is essentially ticket management, so it should use `@/features/tickets`.

