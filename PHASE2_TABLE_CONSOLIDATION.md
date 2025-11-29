# Phase 2.1: Table Component Consolidation Analysis

## Current State

### 1. **DataTable** (`src/shared/components/DataTable.tsx`)
- **Type:** Generic reusable table component
- **Features:** Search, sorting, pagination, column-based configuration
- **Usage:** Generic table needs across the app
- **Status:** ✅ **KEEP** - This is the base generic table component

### 2. **DataTableView** (`src/app/data/entities/components/DataTableView.tsx`)
- **Type:** Domain-specific table for data entities
- **Features:** 
  - Entity-specific attribute rendering (`renderCellValue`)
  - Density settings (compact/normal/spacious)
  - Column ordering and hiding
  - Action buttons (view/edit/delete)
  - Uses shadcn Table components
- **Usage:** Used in `src/app/data/entities/page.tsx`
- **Status:** ✅ **KEEP** - Domain-specific, not easily replaceable with generic DataTable
- **Note:** Could potentially be refactored to use DataTable internally, but the entity-specific logic makes it a separate concern

### 3. **ResultsTable** (`src/components/bigquery/ResultsTable.tsx`)
- **Type:** Simple query results table
- **Features:** Basic table display, execution time/size display
- **Usage:** ❌ **NOT USED** - Only exported, but `EnhancedResultsTable` is used instead
- **Status:** 🟡 **CAN BE REMOVED** - Replaced by EnhancedResultsTable

### 4. **EnhancedResultsTable** (`src/components/bigquery/EnhancedResultsTable.tsx`)
- **Type:** Enhanced query results table
- **Features:** 
  - Search, sort, filter
  - Pagination
  - Column filters
  - Highlight search matches
- **Usage:** ✅ **ACTIVELY USED** in `ResultsPanel.tsx`
- **Status:** ✅ **KEEP** - This is the active component for query results

## Recommendations

### Immediate Action: Remove Unused ResultsTable

**File:** `src/components/bigquery/ResultsTable.tsx`

**Reason:** 
- Not used anywhere in the codebase
- `EnhancedResultsTable` is the active component
- Both exported from index, but only Enhanced is used

**Action:**
1. Remove `ResultsTable.tsx`
2. Remove export from `src/components/bigquery/index.ts`
3. Update any documentation that references it

**Impact:** 
- Removes ~87 lines of unused code
- Reduces confusion about which component to use
- Cleaner API surface

### Future Consideration: Extract Common Table Logic

While `DataTableView` and `EnhancedResultsTable` serve different purposes, they share common patterns:
- Sorting logic
- Column header rendering
- Row rendering

**Potential Refactoring:**
- Extract common sorting logic to a hook: `useTableSort`
- Extract common column header component: `SortableTableHeader`
- Keep domain-specific rendering separate

**Priority:** Low - Current separation is acceptable

## Implementation Plan

### Step 1: Remove ResultsTable ✅
- [x] Verify ResultsTable is not used
- [ ] Remove `src/components/bigquery/ResultsTable.tsx`
- [ ] Remove export from `src/components/bigquery/index.ts`
- [ ] Check for any type imports that reference it

### Step 2: Document Table Component Usage
- [ ] Add comments to each table component explaining its purpose
- [ ] Update README or documentation with table component guidelines

### Step 3: Future Optimization (Optional)
- [ ] Consider extracting common table utilities
- [ ] Evaluate if DataTableView could use DataTable internally

## Files to Modify

1. `src/components/bigquery/ResultsTable.tsx` - **DELETE**
2. `src/components/bigquery/index.ts` - Remove export
3. Documentation files (if any reference ResultsTable)

## Estimated Impact

- **Code Reduction:** ~87 lines
- **Files Removed:** 1
- **Maintainability:** Improved (clearer which component to use)
- **Risk:** Low (component not used)

