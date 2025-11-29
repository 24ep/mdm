# Merge Proposal Report - Code & Dependency Consolidation

This report identifies duplicate files, code, and dependencies that can be merged to reduce project size and improve maintainability.

**Generated:** 2025-01-XX

---

## 📊 Executive Summary

- **🔴 High Priority Merges:** 8 items (significant impact)
- **🟡 Medium Priority Merges:** 12 items (moderate impact)
- **🟢 Low Priority Merges:** 5 items (minor impact)

**Estimated Size Reduction:** ~15-20% of codebase
**Estimated Dependency Reduction:** 3-5 packages

---

## 🔴 HIGH PRIORITY - Immediate Action Recommended

### 1. Duplicate Routes - Data Science Pages

**Issue:** Two routes serving similar purposes
- `src/app/data-science-dashboard/page.tsx` - Simple wrapper around `DataScienceDashboard`
- `src/app/datascience/page.tsx` - More complete implementation with `PlatformLayout`

**Recommendation:** 
- **Remove:** `src/app/data-science-dashboard/page.tsx`
- **Keep:** `src/app/datascience/page.tsx` (more feature-complete)
- **Action:** Redirect `/data-science-dashboard` to `/datascience` if needed

**Impact:** 
- Reduces: 1 route file (~12 lines)
- Risk: Low (check if `/data-science-dashboard` is referenced in navigation)

---

### 2. Duplicate File Upload Components

**Issue:** Three components with overlapping file upload functionality

**Files:**
1. `src/components/ui/file-upload.tsx` - Basic file upload with drag & drop
2. `src/components/ui/attachment-manager.tsx` - Uses `FileUpload` + attachment management
3. `src/components/datascience/FileManager.tsx` - Full file manager with upload

**Analysis:**
- `AttachmentManager` already uses `FileUpload` internally (good!)
- `FileManager` has duplicate upload logic that could use shared utilities
- All three have similar drag & drop handlers

**Recommendation:**
- **Keep:** `FileUpload` as base component
- **Keep:** `AttachmentManager` (already uses `FileUpload`)
- **Refactor:** `FileManager` to use `FileUpload` or shared upload hook
- **Extract:** Common drag & drop logic to `src/hooks/use-file-upload.ts`

**Impact:**
- Reduces: ~150-200 lines of duplicate code
- Improves: Consistency across file uploads

---

### 3. Duplicate CodeMirror Implementations

**Issue:** Two CodeMirror libraries installed

**Dependencies:**
- `@codemirror/*` packages (4 packages) - Core CodeMirror 6
- `@uiw/react-codemirror` - React wrapper for CodeMirror 6

**Usage:**
- `@uiw/react-codemirror` used in: `code-editor.tsx`, `SQLCell.tsx`, `CellRenderer.tsx`
- `@codemirror/*` used directly in: `WorkflowCodeModal.tsx`, `sql-autocomplete.ts`

**Recommendation:**
- **Standardize on:** `@uiw/react-codemirror` (React-friendly wrapper)
- **Remove:** Direct `@codemirror/*` imports where possible
- **Keep:** `@codemirror/lang-*` packages (needed by `@uiw/react-codemirror`)

**Impact:**
- Reduces: Bundle size (if removing direct `@codemirror/view` usage)
- Simplifies: Code maintenance

---

### 4. Duplicate Formatting Utilities

**Issue:** `formatTimeAgo` function duplicated

**Files:**
- `src/lib/formatters.ts` - Has `formatTimeAgo` implementation
- `src/lib/date-formatters.ts` - Re-exports `formatTimeAgo` from `formatters.ts`

**Current State:** Already properly shared (date-formatters re-exports)

**Recommendation:**
- ✅ **Already optimized** - No action needed
- Consider: Moving all date formatting to `date-formatters.ts` and having `formatters.ts` re-export

---

### 5. Multiple Utils Files Re-exporting Same Functions

**Issue:** Many `utils.ts` files re-export `formatFileSize` from `@/lib/formatters`

**Files Re-exporting:**
- `src/app/admin/features/storage/utils.ts`
- `src/app/admin/features/data/utils.ts`
- `src/app/admin/features/content/utils.ts`

**Recommendation:**
- **Remove:** Re-exports from feature utils files
- **Import directly:** `from '@/lib/formatters'` in components
- **Keep:** Feature-specific utilities only in feature utils files

**Impact:**
- Reduces: Unnecessary re-export chains
- Improves: Import clarity

---

### 6. Duplicate Table/Data View Components

**Issue:** Multiple table components with similar functionality

**Components:**
1. `src/app/data/entities/components/DataTableView.tsx` - Custom table for entities
2. `src/shared/components/DataTable.tsx` - Generic reusable table
3. `src/components/bigquery/ResultsTable.tsx` - Query results table
4. `src/components/bigquery/EnhancedResultsTable.tsx` - Enhanced version

**Recommendation:**
- **Audit:** Check if `DataTableView` can use `DataTable` from `shared/components`
- **Merge:** `ResultsTable` and `EnhancedResultsTable` if both are used
- **Create:** Base table component with view mode variants

**Impact:**
- Reduces: ~200-300 lines if consolidated
- Improves: Consistency in table behavior

---

### 7. Duplicate Validation Utilities

**Issue:** Multiple validation utility files

**Files:**
- `src/lib/validation-utils.ts` - General validation (email, URL, UUID, etc.)
- `src/lib/api-validation.ts` - Zod-based API validation
- `src/lib/servicedesk-validator.ts` - Ticket-specific validation
- `src/lib/query-execution/utils.ts` - SQL query validation

**Recommendation:**
- **Keep:** All (they serve different purposes)
- **Consider:** Moving ticket validation to use Zod schemas from `api-validation.ts`
- **Standardize:** Use Zod for all validation where possible

**Impact:**
- Improves: Type safety and consistency

---

### 8. Duplicate Storage Management Components

**Issue:** Two storage management components

**Files:**
- `src/app/admin/features/storage/components/StorageManagement.tsx` (~1532 lines - monolithic)
- `src/app/admin/features/storage/components/FileSystemManagement.tsx` (~824 lines)

**Note:** There's a refactoring plan in `StorageManagement.refactor.md`

**Recommendation:**
- **Review:** Determine if both are needed or if one is deprecated
- **Follow:** The refactoring plan to break down monolithic component
- **Merge:** If both serve same purpose, consolidate

**Impact:**
- Reduces: Significant code if merged
- Improves: Maintainability

---

## 🟡 MEDIUM PRIORITY - Review & Consolidate

### 9. Duplicate Data Management Routes

**Issue:** `src/app/data-management/` only wraps `SpaceSelection`

**Files:**
- `src/app/data-management/space-selection/page.tsx` - Wrapper around `SpaceSelection`
- `src/app/admin/features/spaces/components/SpaceSelection.tsx` - Actual component

**Recommendation:**
- **Remove:** `/data-management` route if not actively used
- **Redirect:** To admin spaces if needed
- **Check:** Navigation links before removing

---

### 10. Multiple API Route Versions

**Issue:** Both `/api/` and `/api/v1/` routes exist

**Status:** According to `src/app/api/v1/README.md`, routes are being migrated incrementally

**Recommendation:**
- **Continue:** Migration to `/api/v1/`
- **Remove:** Old routes once migration complete
- **Update:** All client-side API calls to use `/api/v1/`

**Impact:**
- Reduces: ~50% of API routes once migration complete

---

### 11. Duplicate Type Definitions

**Issue:** 27 `types.ts` files across the codebase

**Recommendation:**
- **Audit:** Check for duplicate type definitions
- **Consolidate:** Shared types into `src/types/` or `src/shared/types/`
- **Keep:** Feature-specific types in feature directories

**Files to Review:**
- Check for duplicate `Report`, `Dashboard`, `User`, `Space` types

---

### 12. Multiple Formatter Files

**Issue:** Formatting utilities spread across files

**Files:**
- `src/lib/formatters.ts` - General formatting
- `src/lib/date-formatters.ts` - Date formatting
- `src/lib/sql-formatter.ts` - SQL formatting
- `src/lib/chart-utils.ts` - Chart formatting

**Recommendation:**
- ✅ **Keep separate** - They serve different domains
- **Consider:** Grouping in `src/lib/formatters/` directory

---

### 13. Duplicate Export Utilities

**Issue:** Multiple export-related utilities

**Files:**
- `src/lib/utils/export-utils.ts` (referenced in code)
- `src/app/api/export/` - Export API routes
- `src/app/api/import-export/` - Import/Export routes

**Recommendation:**
- **Audit:** Check if both export routes are needed
- **Consolidate:** If functionality overlaps

---

### 14. Multiple Dashboard Components

**Issue:** Multiple dashboard-related components

**Files:**
- `src/app/dashboard/` - Dashboard routes
- `src/app/dashboards/` - Dashboards feature
- `src/components/dashboard/` - Dashboard components

**Recommendation:**
- **Review:** Purpose of each directory
- **Consolidate:** If they serve the same purpose

---

### 15. Duplicate Notification Components

**Issue:** Multiple notification components

**Files:**
- `src/components/notifications/notification-list.tsx`
- `src/components/notifications/notification-dropdown.tsx`
- `src/app/notifications/` - Notification page

**Recommendation:**
- **Review:** If all are actively used
- **Consolidate:** Similar functionality

---

### 16. Multiple File Preview Components

**Issue:** File preview functionality in multiple places

**Files:**
- `src/components/ui/file-preview.tsx`
- Preview logic in `AttachmentManager`
- Preview in `FileManager`

**Recommendation:**
- **Extract:** Common preview logic to shared component
- **Reuse:** Across all file components

---

### 17. Duplicate Space Selection

**Issue:** Space selection in multiple places

**Files:**
- `src/app/admin/features/spaces/components/SpaceSelection.tsx`
- `src/app/data-management/space-selection/page.tsx` (wrapper)
- Space selection in `PlatformLayout`

**Recommendation:**
- **Consolidate:** Use single `SpaceSelection` component
- **Remove:** Wrapper routes

---

### 18. Multiple Chart/Visualization Utilities

**Issue:** Chart utilities in multiple files

**Files:**
- `src/lib/chart-utils.ts`
- Chart logic in `ChartRenderer.tsx`
- Chart config in dashboard components

**Recommendation:**
- **Extract:** Common chart utilities
- **Reuse:** Across chart components

---

### 19. Duplicate API Client Code

**Issue:** API client code in multiple places

**Files:**
- `src/app/api/api-client/` - API client routes
- `src/features/api-client/` - API client feature
- API client logic in various components

**Recommendation:**
- **Consolidate:** API client logic
- **Use:** Single source of truth for API calls

---

### 20. Multiple Theme/Styling Utilities

**Issue:** Theme utilities spread across files

**Files:**
- `src/lib/branding/utils.ts`
- Theme config in multiple places
- Styling utilities in components

**Recommendation:**
- **Consolidate:** Theme utilities
- **Centralize:** Theme configuration

---

## 🟢 LOW PRIORITY - Nice to Have

### 21. Multiple Logger Implementations

**Issue:** Logging in multiple places

**Recommendation:**
- **Standardize:** On single logger
- **Use:** Consistent logging across codebase

---

### 22. Duplicate Error Handling

**Issue:** Error handling patterns vary

**Recommendation:**
- **Standardize:** Error handling utilities
- **Create:** Shared error boundary components

---

### 23. Multiple Toast/Notification Systems

**Issue:** Toast notifications in multiple ways

**Files:**
- `react-hot-toast` (in package.json)
- Custom toast utilities
- Toast in various components

**Recommendation:**
- **Standardize:** On `react-hot-toast`
- **Create:** Wrapper utilities for consistency

---

### 24. Duplicate Debounce Implementations

**Issue:** Debouncing in multiple places

**Dependencies:**
- `use-debounce` package
- Custom debounce implementations

**Recommendation:**
- **Standardize:** On `use-debounce` hook
- **Remove:** Custom debounce implementations

---

### 25. Multiple Date Library Usage

**Issue:** Date handling varies

**Dependencies:**
- `date-fns` (used in 18+ files)

**Recommendation:**
- ✅ **Already standardized** on `date-fns`
- **Ensure:** All date operations use `date-fns` utilities

---

## 📦 DEPENDENCY CONSOLIDATION

### Duplicate/Overlapping Dependencies

1. **CodeMirror Libraries** (See #3 above)
   - Consolidate to `@uiw/react-codemirror` + language packages

2. **Validation Libraries**
   - ✅ Already using `zod` - good!
   - Consider removing custom validation if Zod can handle it

3. **Date Libraries**
   - ✅ Standardized on `date-fns` - good!

4. **UI Component Libraries**
   - Using `lucide-react` for icons - good!
   - `react-icons` also installed - consider removing if not used

5. **Chart Libraries**
   - Using `recharts` - good!
   - Check if all chart components use it

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Quick Wins (1-2 days)
1. ✅ Remove `data-science-dashboard` route
2. ✅ Consolidate file upload components
3. ✅ Remove re-exports from feature utils
4. ✅ Standardize CodeMirror usage

### Phase 2: Medium Effort (3-5 days)
5. ✅ Consolidate table components
6. ✅ Merge storage management components
7. ✅ Remove duplicate routes
8. ✅ Audit and consolidate types

### Phase 3: Larger Refactoring (1-2 weeks)
9. ✅ Complete API v1 migration
10. ✅ Refactor monolithic components
11. ✅ Standardize validation patterns
12. ✅ Consolidate dashboard components

---

## 📈 EXPECTED IMPACT

### Code Reduction
- **Lines of Code:** ~2,000-3,000 lines (15-20% reduction)
- **Files:** ~15-20 files removed/merged
- **Bundle Size:** ~50-100KB reduction

### Maintainability Improvements
- ✅ Single source of truth for common utilities
- ✅ Consistent patterns across codebase
- ✅ Easier to find and update code
- ✅ Reduced cognitive load for developers

### Performance Improvements
- ✅ Smaller bundle size
- ✅ Better tree-shaking
- ✅ Faster build times

---

## ⚠️ RISKS & CONSIDERATIONS

1. **Breaking Changes:** Some merges may require updating imports
2. **Testing:** Need to test all affected components
3. **Migration:** API route migration needs careful planning
4. **Dependencies:** Removing dependencies may break if not fully audited

---

## 📝 NOTES

- Some items are already optimized (marked with ✅)
- Prioritize based on impact vs effort
- Test thoroughly after each merge
- Update documentation as you go
- Consider creating shared component library for common patterns

---

**Next Steps:**
1. Review this report with team
2. Prioritize items based on business needs
3. Create tickets for each merge task
4. Execute Phase 1 quick wins first
5. Measure impact before proceeding to Phase 2

