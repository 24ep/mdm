# Architecture Decisions

**Date:** 2025-01-XX  
**Purpose:** Document key architectural decisions and patterns used in the codebase

---

## 📋 Table of Contents

1. [Feature Modules vs Admin Features](#feature-modules-vs-admin-features)
2. [Custom Implementations](#custom-implementations)
3. [Import Patterns](#import-patterns)
4. [Route Structure](#route-structure)
5. [Component Organization](#component-organization)

---

## 🎯 Feature Modules vs Admin Features

### When to Use Feature Modules (`src/features/`)

**Use feature modules when:**
- The feature is reusable across multiple contexts (space-scoped, global, admin)
- The feature needs to be space-aware
- The feature should follow the single-source pattern
- The feature has clear domain boundaries

**Examples:**
- ✅ `tickets` - Used in `/tools/projects`, `/[space]/projects`
- ✅ `knowledge` - Used in `/knowledge`, `/[space]/knowledge`, `/tools/knowledge-base`
- ✅ `marketplace` - Used in `/marketplace`, `/[space]/marketplace`
- ✅ `infrastructure` - Used in `/infrastructure`, `/[space]/infrastructure`

### When to Use Admin Features (`src/app/admin/features/`)

**Use admin features when:**
- The feature is admin/system-specific
- The feature doesn't need space awareness
- The feature is not reusable across contexts
- The feature is tightly coupled to admin workflows

**Examples:**
- ✅ `business-intelligence` - Admin-specific BI tools
- ✅ `storage` - Admin storage management
- ✅ `data-governance` - Admin data governance tools
- ✅ `analytics` - System-wide analytics

### Decision Matrix

| Criteria | Feature Module | Admin Feature |
|----------|---------------|---------------|
| Reusable across contexts | ✅ Yes | ❌ No |
| Space-aware | ✅ Yes | ⚠️ Optional |
| Single-source needed | ✅ Yes | ❌ No |
| Admin-specific | ❌ No | ✅ Yes |
| Domain boundaries clear | ✅ Yes | ⚠️ Varies |

---

## 🔧 Custom Implementations

### When Custom Implementations Are Acceptable

**Custom implementations are acceptable when:**
1. The feature module component doesn't have all required functionality
2. The custom implementation has advanced features not in the feature module
3. The custom implementation serves a specific use case
4. Migration would result in loss of functionality

### Documented Custom Implementations

#### 1. Reports Page (`src/app/reports/page.tsx`)

**Why Custom:**
- Has advanced features not in `ReportsList`:
  - Tree view with categories/folders
  - Source type grouping (Power BI, Grafana, Looker Studio)
  - Advanced filters (date range, favorites, status)
  - Bulk operations (delete, activate)
  - Export functionality (Excel, CSV, JSON)
  - Templates dialog
  - Integrations management
  - Favorites system
  - Multi-select with bulk actions

**Feature Module Component:**
- `ReportsList` - Simple list view with basic filtering

**Decision:** Keep custom implementation - it has significantly more features

#### 2. Dashboards Page (`src/app/dashboards/page.tsx`)

**Why Custom:**
- Has advanced features not in `DashboardsList`:
  - Grid/List view toggle
  - Create dashboard dialog with extensive configuration:
    - Background color, font family, font size
    - Refresh rate, real-time updates
    - Visibility settings (Private, Shared, Public)
    - Dashboard type (Custom, Template, System)
  - Duplicate functionality
  - Delete functionality
  - Visibility indicators
  - Space badges
  - Element/datasource counts
  - Default dashboard indicator

**Feature Module Component:**
- `DashboardsList` - Simple list view with basic search

**Decision:** Keep custom implementation - it has significantly more features

#### 3. Workflows Page (`src/app/workflows/page.tsx`)

**Why Custom:**
- Has advanced workflow builder features:
  - Workflow creation/editing dialog
  - Condition builder
  - Action builder
  - Schedule configuration
  - Data model integration
  - Sync schedule integration
  - Execution tracking
  - Status management

**Feature Module Component:**
- `WorkflowsList` - Simple list view

**Decision:** Keep custom implementation - it has advanced workflow builder features

---

## 📦 Import Patterns

### Standard Import Pattern

**All feature modules should use index imports:**

```typescript
// ✅ Correct
import { TicketsList } from '@/features/tickets'
import { ReportsList } from '@/features/reports'
import { OutlineKnowledgeBase } from '@/features/knowledge'
```

**Not:**
```typescript
// ❌ Avoid
import { TicketsList } from '@/features/tickets/components/TicketsList'
```

### Admin Feature Imports

**Admin features can use direct imports or index imports:**

```typescript
// ✅ Both acceptable
import { BigQueryInterface } from '@/app/admin/features/business-intelligence/components/BigQueryInterface'
import { StorageManagement } from '@/app/admin/features/storage'
```

---

## 🗺️ Route Structure

### Route Patterns

1. **Global Routes** (`/feature`)
   - Accessible from anywhere
   - May or may not be space-aware
   - Examples: `/knowledge`, `/marketplace`, `/infrastructure`

2. **Space-Scoped Routes** (`/[space]/feature`)
   - Always space-aware
   - Space ID extracted from URL params
   - Examples: `/[space]/knowledge`, `/[space]/marketplace`

3. **Tool Routes** (`/tools/feature`)
   - Tool-specific features
   - May use feature modules or admin features
   - Examples: `/tools/projects`, `/tools/bigquery`

4. **Admin Routes** (`/admin/feature` or `/system/feature`)
   - Admin/system-specific
   - Usually use admin features
   - Examples: `/admin/knowledge-base`, `/system/users`

### Route to Component Mapping

| Route Pattern | Component Source | Example |
|---------------|------------------|---------|
| Global feature | `@/features/*` | `/knowledge` → `OutlineKnowledgeBase` |
| Space-scoped | `@/features/*` | `/[space]/knowledge` → `OutlineKnowledgeBase` |
| Tool with feature module | `@/features/*` | `/tools/projects` → `TicketsList` |
| Tool with admin feature | `@/app/admin/features/*` | `/tools/bigquery` → `BigQueryInterface` |
| Custom implementation | Custom component | `/reports` → Custom `ReportsPage` |

---

## 🏗️ Component Organization

### Feature Module Structure

```
src/features/
├── feature-name/
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and helpers
│   ├── types.ts           # TypeScript types
│   └── index.ts           # Public exports
```

### Admin Feature Structure

```
src/app/admin/features/
├── feature-name/
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and helpers
│   ├── types.ts           # TypeScript types
│   └── index.ts           # Public exports (optional)
```

### Shared Components

```
src/shared/
├── components/            # Reusable components
├── hooks/                  # Reusable hooks
├── lib/                   # Shared utilities
└── types/                 # Shared types
```

---

## ✅ Best Practices

### 1. Single-Source Pattern

- Feature modules should be the single source of truth for their domain
- Avoid duplicating feature module logic in custom implementations
- Use feature modules when possible, custom implementations only when necessary

### 2. Space Awareness

- Feature modules should support space-aware and global contexts
- Use `spaceId` prop to control space filtering
- Use `showSpaceSelector` prop to control space selector visibility

### 3. Index Exports

- All feature modules must have `index.ts` files
- Export types, hooks, and components from index
- Use index imports in route pages

### 4. Documentation

- Document why custom implementations exist
- Document advanced features not in feature modules
- Keep this document updated when making architectural decisions

---

## 📝 Migration Guidelines

### When to Migrate Custom Implementation to Feature Module

**Migrate when:**
- The feature module component can be enhanced to include all custom features
- The custom implementation can be refactored without losing functionality
- The migration improves code maintainability

**Don't migrate when:**
- Migration would result in loss of functionality
- The custom implementation serves a specific use case
- The feature module component is intentionally simple

### Migration Process

1. Identify features in custom implementation
2. Enhance feature module component to include all features
3. Update route page to use feature module component
4. Test thoroughly
5. Remove custom implementation
6. Update documentation

---

## 🔄 Future Considerations

### Potential Enhancements

1. **Reports Feature Module:**
   - Add tree view support
   - Add bulk operations
   - Add export functionality
   - Add templates support

2. **Dashboards Feature Module:**
   - Add grid/list view toggle
   - Add create dialog
   - Add duplicate functionality
   - Add advanced configuration

3. **Workflows Feature Module:**
   - Add workflow builder
   - Add condition/action builders
   - Add schedule configuration

**Note:** These enhancements should be evaluated based on:
- User needs
- Code maintainability
- Feature complexity
- Development effort

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Development Team

