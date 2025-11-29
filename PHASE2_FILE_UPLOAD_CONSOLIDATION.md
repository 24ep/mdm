# Phase 2.3: File Upload Component Consolidation

## Current State

### Components Analyzed

1. **FileUpload** (`src/components/ui/file-upload.tsx`)
   - Basic file upload component
   - Has its own upload logic (direct API calls)
   - Manages uploaded files state internally
   - **Status:** ✅ **UPDATED** - Now uses shared drag & drop hook

2. **AttachmentManager** (`src/components/ui/attachment-manager.tsx`)
   - Uses `useAttachments` hook (good!)
   - Manages attachments with full CRUD
   - **Status:** ✅ **UPDATED** - Now uses shared drag & drop hook

3. **FileManager** (`src/components/datascience/FileManager.tsx`)
   - Full file manager (different purpose)
   - Has its own upload logic for notebook files
   - **Status:** ✅ **KEEP** - Different domain (notebook files vs attachments)

## Actions Taken

### ✅ Created Shared Drag & Drop Hook

**File:** `src/hooks/use-file-drag-drop.ts`

**Purpose:** Extract common drag & drop logic used across file upload components

**Features:**
- Drag over state management
- File input ref management
- Drag & drop event handlers
- File input change handler
- Open file dialog function

**Benefits:**
- Eliminates duplicate drag & drop code
- Consistent behavior across components
- Easier to maintain and test

### ✅ Updated Components

1. **AttachmentManager**
   - ✅ Now uses `useFileDragDrop` hook
   - ✅ Removed duplicate drag & drop handlers (~30 lines)
   - ✅ Added file input element (was missing)
   - ✅ Uses shared hook for consistency

2. **FileUpload**
   - ✅ Now uses `useFileDragDrop` hook
   - ✅ Removed duplicate drag & drop handlers (~30 lines)
   - ✅ Cleaner, more maintainable code

## Code Reduction

- **Lines Removed:** ~60 lines of duplicate drag & drop code
- **New Shared Code:** ~60 lines (reusable hook)
- **Net Reduction:** ~0 lines (but much better organization)
- **Maintainability:** Significantly improved

## Remaining Considerations

### FileUpload vs useAttachments

**Current State:**
- `FileUpload` does its own upload logic
- `AttachmentManager` uses `useAttachments` hook

**Analysis:**
- `FileUpload` might be intentionally lower-level (for different use cases)
- `AttachmentManager` is specifically for attachment management
- Both serve different purposes

**Recommendation:**
- ✅ **Keep both** - They serve different purposes
- `FileUpload` is a simpler, standalone component
- `AttachmentManager` is for attachment management with full CRUD

### FileManager

**Status:** ✅ **No changes needed**
- Different domain (notebook files)
- Different API endpoints
- Different use case

## Impact

### ✅ Benefits
- Consistent drag & drop behavior
- Easier to maintain (single source of truth)
- Reusable hook for future components
- Better code organization

### 📊 Metrics
- **Duplicate Code Removed:** ~60 lines
- **Shared Hook Created:** 1 new file
- **Components Updated:** 2
- **Maintainability:** Improved

## Future Enhancements

### Optional Improvements
1. Consider extracting file validation logic to shared utility
2. Consider creating a shared file upload hook that wraps `useAttachments`
3. Consider standardizing file upload UI components

### Priority: Low
Current consolidation is sufficient. Further refactoring can be done as needed.

