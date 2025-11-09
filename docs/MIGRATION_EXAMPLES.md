# Migration Examples - Using New Utilities

**Date:** 2025-01-XX  
**Status:** ✅ Example Migrations Complete

---

## 📋 Summary

Example files have been migrated to demonstrate usage of the new shared utilities. These serve as templates for migrating the remaining files.

---

## ✅ Migrated Files

### 1. `src/components/reports/ReportsTreeView.tsx` ✅

**Changes:**
- ✅ Migrated from `toast` (sonner) to `toast-utils`
- ✅ Added validation using `validation-utils`
- ✅ Replaced modal state with `useModal` hook

**Before:**
```typescript
import { toast } from 'sonner'
const [showCategoryDialog, setShowCategoryDialog] = useState(false)

if (!categoryForm.name.trim()) {
  toast.error('Category name is required')
  return
}
toast.success('Category created successfully')
setShowCategoryDialog(false)
```

**After:**
```typescript
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { validateRequired } from '@/lib/validation-utils'
import { useModal } from '@/hooks/common'

const categoryDialog = useModal()

const nameError = validateRequired(categoryForm.name.trim(), 'Category name')
if (nameError) {
  showError(nameError)
  return
}
showSuccess(ToastMessages.CREATED)
categoryDialog.close()
```

**Benefits:**
- Consistent toast messages using `ToastMessages` constants
- Reusable validation logic
- Cleaner modal state management

---

### 2. `src/app/api/reports/categories/route.ts` ✅

**Changes:**
- ✅ Migrated to use standardized API response format

**Before:**
```typescript
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
return NextResponse.json({ categories: result.rows || [] })
```

**After:**
```typescript
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'

if (!session?.user) {
  return NextResponse.json(
    createErrorResponse('Unauthorized', 'UNAUTHORIZED'), 
    { status: 401 }
  )
}
return NextResponse.json(createSuccessResponse({ categories: result.rows || [] }))
```

**Benefits:**
- Consistent response structure across all APIs
- Standardized error codes
- Better error handling on frontend

---

## 📚 Migration Patterns

### Toast Notifications

**Pattern:**
```typescript
// Old
import toast from 'react-hot-toast' // or 'sonner'
toast.success('Saved successfully')
toast.error('Failed to save')

// New
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
showSuccess(ToastMessages.SAVED)
showError(ToastMessages.SAVE_ERROR)
```

**Common Messages:**
- `ToastMessages.SAVED` - "Saved successfully"
- `ToastMessages.CREATED` - "Created successfully"
- `ToastMessages.UPDATED` - "Updated successfully"
- `ToastMessages.DELETED` - "Deleted successfully"
- `ToastMessages.SAVE_ERROR` - "Failed to save"
- `ToastMessages.CREATE_ERROR` - "Failed to create"
- `ToastMessages.UPDATE_ERROR` - "Failed to update"
- `ToastMessages.DELETE_ERROR` - "Failed to delete"

---

### Validation

**Pattern:**
```typescript
// Old
if (!name || name.trim() === '') {
  showError('Name is required')
  return
}
if (name.length < 3) {
  showError('Name must be at least 3 characters')
  return
}

// New
import { validateRequired, validateLength } from '@/lib/validation-utils'

const nameError = validateRequired(name.trim(), 'Name')
if (nameError) {
  showError(nameError)
  return
}

const lengthError = validateLength(name, 3, 100, 'Name')
if (lengthError) {
  showError(lengthError)
  return
}

// Or use validateAll for multiple validations
const { isValid, errors } = validateAll([
  () => validateRequired(name, 'Name'),
  () => validateLength(name, 3, 100, 'Name'),
  () => validateEmail(email)
])
if (!isValid) {
  showError(errors[0])
  return
}
```

**Available Validators:**
- `validateEmail(email)` - Email format
- `validateUrl(url)` - URL format
- `validateUuid(uuid)` - UUID format
- `validateRequired(value, fieldName)` - Required field
- `validateFieldName(name)` - Field name format
- `validateRange(value, min, max, fieldName)` - Number range
- `validateLength(value, min, max, fieldName)` - String length
- `validatePattern(value, pattern, errorMessage)` - Regex pattern
- `validateFileType(fileName, allowedTypes)` - File type
- `validateFileSize(fileSize, maxSizeBytes)` - File size

---

### Modal State

**Pattern:**
```typescript
// Old
const [isOpen, setIsOpen] = useState(false)
const open = () => setIsOpen(true)
const close = () => setIsOpen(false)

// New
import { useModal } from '@/hooks/common'
const { isOpen, open, close, toggle } = useModal()
```

**Usage:**
```typescript
<Dialog open={isOpen} onOpenChange={(open) => open ? open() : close()}>
  <Button onClick={open}>Open</Button>
  <Button onClick={close}>Close</Button>
</Dialog>
```

---

### API Responses

**Pattern:**
```typescript
// Old
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
return NextResponse.json({ data: result })

// New
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'

if (!session?.user) {
  return NextResponse.json(
    createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
    { status: 401 }
  )
}
return NextResponse.json(createSuccessResponse({ data: result }))
```

**Response Structure:**
```typescript
// Success
{
  success: true,
  data: { ... },
  meta: {
    timestamp: "2025-01-XXT..."
  }
}

// Error
{
  success: false,
  error: {
    message: "Error message",
    code: "ERROR_CODE",
    details: { ... }
  },
  meta: {
    timestamp: "2025-01-XXT..."
  }
}
```

---

### Pagination

**Pattern:**
```typescript
// Old
const [page, setPage] = useState(1)
const [limit, setLimit] = useState(20)
const nextPage = () => setPage(prev => prev + 1)
const prevPage = () => setPage(prev => Math.max(1, prev - 1))

// New
import { usePagination } from '@/hooks/common'
const { page, limit, nextPage, prevPage, goToPage, setLimit } = usePagination({
  initialPage: 1,
  initialLimit: 20
})
```

---

### Form State

**Pattern:**
```typescript
// Old - Manual form state management
const [values, setValues] = useState({ name: '', email: '' })
const [errors, setErrors] = useState({})
const handleChange = (field) => (value) => {
  setValues(prev => ({ ...prev, [field]: value }))
}

// New
import { useFormState } from '@/hooks/common'
import { validateRequired, validateEmail } from '@/lib/validation-utils'

const { values, errors, handleChange, handleSubmit, isValid } = useFormState({
  initialValues: { name: '', email: '' },
  validate: (values) => ({
    name: validateRequired(values.name, 'Name'),
    email: validateEmail(values.email) ? null : 'Invalid email'
  }),
  onSubmit: async (values) => {
    await saveData(values)
  }
})
```

---

## 🔄 Remaining Migration Tasks

### Toast Migration (149 files)
- [ ] Replace `toast.success()` with `showSuccess()`
- [ ] Replace `toast.error()` with `showError()`
- [ ] Use `ToastMessages` constants where applicable

### Validation Migration (5+ files)
- [ ] Replace local validation with `validation-utils`
- [ ] Use `validateAll()` for multiple validations

### API Response Migration (50+ routes)
- [ ] Migrate API routes to use `createSuccessResponse()` / `createErrorResponse()`
- [ ] Update frontend to expect standardized format

### Hook Migration (37+ files)
- [ ] Replace modal state with `useModal`
- [ ] Replace pagination logic with `usePagination`
- [ ] Replace form state with `useFormState`

### Data Fetching Migration (5+ hooks)
- [ ] Migrate to `useUnifiedDataFetch` where applicable
- [ ] Align existing hooks with unified pattern

---

## 📊 Migration Progress

| Category | Total Files | Migrated | Remaining | Progress |
|----------|-------------|----------|-----------|----------|
| Toast | 149 | 1 | 148 | 1% |
| Validation | 5+ | 1 | 4+ | 20% |
| API Responses | 50+ | 1 | 49+ | 2% |
| Common Hooks | 37+ | 1 | 36+ | 3% |
| Data Fetching | 5+ | 0 | 5+ | 0% |

---

## 🎯 Next Steps

1. **Continue Toast Migration** - Start with high-traffic components
2. **Migrate More API Routes** - Focus on frequently used endpoints
3. **Adopt Common Hooks** - Replace modal/pagination patterns gradually
4. **Update Data Fetching** - Migrate hooks to unified pattern

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Examples Complete - Ready for Full Migration

