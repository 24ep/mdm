# Phase 4.2: Toast Utilities Migration Guide

## Migration Pattern

### Before (use-toast.ts):
```typescript
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

toast({
  title: 'Error',
  description: 'Failed to load',
  variant: 'destructive'
})

toast({
  title: 'Success',
  description: 'Saved successfully',
  variant: 'success'
})

toast({
  title: 'Info',
  description: 'Processing...',
  variant: 'default'
})
```

### After (toast-utils.ts):
```typescript
import { showError, showSuccess, showInfo } from '@/lib/toast-utils'

showError('Failed to load')
showSuccess('Saved successfully')
showInfo('Processing...')
```

## Mapping

- `variant: 'destructive'` → `showError(description || title)`
- `variant: 'success'` → `showSuccess(description || title)`
- `variant: 'default'` or no variant → `showInfo(description || title)`

## Files to Migrate

1. ✅ IntakeSubmissionList.tsx - DONE
2. ✅ ModuleDetail.tsx - DONE
3. ✅ ModuleList.tsx - DONE
4. ⏳ TimesheetView.tsx
5. ⏳ TicketRelationshipsPanel.tsx
6. ⏳ TicketDetailModalEnhanced.tsx
7. ⏳ IntakeFormViewer.tsx
8. ⏳ IntakeFormList.tsx
9. ⏳ IntakeFormBuilder.tsx
10. ⏳ JiraIntegration.tsx
11. ⏳ ITSMIntegration.tsx
12. ⏳ ESMPortalIntegration.tsx
13. ⏳ ServiceDeskIntegration.tsx

