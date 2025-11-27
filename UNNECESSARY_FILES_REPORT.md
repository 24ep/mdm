# Unnecessary Files Report

This report identifies potentially unnecessary files in the codebase that can be removed or archived.

## 🔴 High Priority - Safe to Remove

### 1. Build Artifacts
- **`tsconfig.tsbuildinfo`** - TypeScript build cache file (should be in .gitignore)
  - This file is regenerated on each build and should not be committed

### 2. One-Time Migration Scripts (Already Executed)
These scripts were likely run once and are no longer needed:

- **`prisma/migrate-drawer-style.ts`** - One-time migration to update drawer styles
- **`prisma/migrate-icon-button.ts`** - One-time migration to add iconButton config
- **`prisma/remove-default-light.ts`** - One-time script to remove "Default Light" theme

**Note:** These are referenced in package.json scripts but are likely one-time migrations. Consider archiving them if the migrations are complete.

### 3. Unused Example/Test Files
- **`src/examples/orm-usage.ts`** - Example file not imported anywhere in the codebase
- **`src/components/test/attachment-test.tsx`** - Test component not imported or used anywhere

## 🟡 Medium Priority - Review Needed

### 4. Potentially Duplicate Routes
- **`src/app/data-science-dashboard/page.tsx`** - Appears to be a duplicate of `src/app/datascience/page.tsx`
  - Both render similar data science components
  - Check if both routes are actually needed or if one can be removed

- **`src/app/data-management/`** - Contains only a space-selection page
  - The space-selection functionality appears to be duplicated in admin routes
  - `src/app/data-management/space-selection/page.tsx` just wraps `SpaceSelection` component
  - Consider consolidating if this route is not actively used

## 🟢 Low Priority - Keep for Reference

### 5. Migration Scripts (May Still Be Useful)
These scripts might be useful for reference or future migrations:

- **`scripts/migrate-plugins-to-hub.js`** - Plugin migration script (may be one-time)
- **`scripts/remove-built-in-plugins.js`** - Plugin cleanup script (may be one-time)
- **`scripts/add-audit-log-columns.js`** - Database migration script

**Recommendation:** Review if these migrations are complete. If yes, archive them in a `scripts/archive/` directory.

## 📋 Recommended Actions

1. **Add to .gitignore:**
   ```
   *.tsbuildinfo
   ```

2. **Remove immediately:**
   - `tsconfig.tsbuildinfo`
   - `src/examples/orm-usage.ts`
   - `src/components/test/attachment-test.tsx`

3. **Review and potentially remove:**
   - `src/app/data-science-dashboard/page.tsx` (if duplicate)
   - `src/app/data-management/` directory (if redundant)

4. **Archive one-time migrations:**
   - Move completed migration scripts to `scripts/archive/` or `prisma/archive/`
   - Update package.json to remove references if no longer needed

5. **Verify route usage:**
   - Check if `/data-science-dashboard` and `/data-management` routes are referenced in navigation or links
   - Remove if not actively used

## ⚠️ Before Removing

- Search the codebase for any references to these files
- Check if routes are linked in navigation menus
- Verify that migrations have been successfully applied to all environments
- Consider keeping a backup or moving to an archive directory instead of deleting

