# Quick Reference Guide

**Version:** 1.0  
**Last Updated:** 2025-01-XX

---

## 🚀 Quick Start

### Creating a New Feature Module

```bash
# 1. Create structure
mkdir -p src/features/[feature]/{components,hooks,lib}
touch src/features/[feature]/types.ts

# 2. Create main component
# src/features/[feature]/components/[Feature]List.tsx

# 3. Create hook
# src/features/[feature]/hooks/use[Feature].ts

# 4. Create page routes
# src/app/[space]/[feature]/page.tsx
# src/app/admin/features/[feature]/[Feature]Management.tsx
```

### Single Source Pattern Template

```typescript
// Component (Single Source)
export function [Feature]List({ 
  spaceId = null, 
  showSpaceSelector = false 
}: [Feature]ListProps) {
  const { items, loading } = use[Feature]({ spaceId })
  return <div>{/* UI */}</div>
}

// Space View
export default function Space[Feature]Page() {
  return <[Feature]List spaceId={null} showSpaceSelector={false} />
}

// Admin View
export function [Feature]Management() {
  return <[Feature]List spaceId={null} showSpaceSelector={true} />
}
```

---

## 📁 Directory Structure

```
src/
├── features/              # Feature modules (single source)
│   ├── tickets/
│   ├── reports/
│   ├── dashboards/
│   ├── workflows/
│   ├── marketplace/
│   └── infrastructure/
│
├── shared/                # Shared utilities
│   ├── lib/
│   ├── hooks/
│   ├── components/
│   └── types/
│
└── app/                   # Next.js routes
    ├── [space]/           # Space views
    ├── admin/             # Admin views
    └── api/               # API routes
```

---

## 🔑 Key Concepts

### Space-Aware Pattern

```typescript
// Hook automatically handles space filtering
const { items } = use[Feature]({ 
  spaceId: null  // null = current space, undefined = all spaces
})
```

### Plugin Pattern

```typescript
// Plugin definition
{
  id: 'plugin-name',
  category: 'service-management',
  ui: {
    managementComponent: '@/features/marketplace/plugins/...'
  }
}
```

---

## 📋 Common Tasks

### Add New Feature
1. Create feature module structure
2. Create main component (single source)
3. Create hook (space-aware)
4. Create page routes
5. Test

### Add Management Plugin
1. Create plugin structure
2. Create management UI component
3. Register plugin
4. Test plugin

### Migrate Existing Feature
1. Extract components to feature module
2. Create hooks
3. Update views to use shared components
4. Remove duplicate code
5. Test

---

## 🔗 Important Files

- **Architecture Guide:** `docs/COMPLETE_ARCHITECTURE_GUIDE.md`
- **Refactoring Plan:** `docs/REFACTORING_PLAN.md`
- **API Routes Plan:** `docs/API_ROUTES_REORGANIZATION_PLAN.md`

---

**Quick Reference Version:** 1.0
