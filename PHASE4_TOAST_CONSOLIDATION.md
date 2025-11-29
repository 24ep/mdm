# Phase 4.2: Toast Utilities Consolidation

## Overview

Consolidating toast utilities by migrating from `use-toast.ts` hook to `toast-utils.ts` functions.

## Migration Status

### ✅ Completed Files (5/13)
1. ✅ IntakeSubmissionList.tsx
2. ✅ ModuleDetail.tsx
3. ✅ ModuleList.tsx
4. ✅ TimesheetView.tsx
5. ✅ JiraIntegration.tsx

### ⏳ Remaining Files (8/13)
6. ⏳ TicketRelationshipsPanel.tsx
7. ⏳ TicketDetailModalEnhanced.tsx
8. ⏳ IntakeFormViewer.tsx
9. ⏳ IntakeFormList.tsx
10. ⏳ IntakeFormBuilder.tsx
11. ⏳ ITSMIntegration.tsx
12. ⏳ ESMPortalIntegration.tsx
13. ⏳ ServiceDeskIntegration.tsx

## Migration Pattern

### Step 1: Update Import
```typescript
// Before
import { useToast } from '@/hooks/use-toast'

// After
import { showError, showSuccess, showInfo } from '@/lib/toast-utils'
```

### Step 2: Remove Hook Usage
```typescript
// Before
const { toast } = useToast()

// After
// (remove this line)
```

### Step 3: Replace Toast Calls
```typescript
// Before
toast({
  title: 'Error',
  description: 'Failed to load',
  variant: 'destructive'
})

// After
showError('Failed to load')
```

```typescript
// Before
toast({
  title: 'Success',
  description: 'Saved successfully',
  variant: 'success'
})

// After
showSuccess('Saved successfully')
```

```typescript
// Before
toast({
  title: 'Info',
  description: 'Processing...',
  variant: 'default'
})

// After
showInfo('Processing...')
```

## Mapping Rules

- `variant: 'destructive'` → `showError(description || title)`
- `variant: 'success'` → `showSuccess(description || title)`
- `variant: 'default'` or no variant → `showInfo(description || title)`
- If both `title` and `description` exist, prefer `description`, fallback to `title`

## Next Steps

Continue migrating remaining 8 files using the same pattern.

