# Platform Sidebar - Best Practices ✅

## Core Principle

**ALL pages accessible from the Platform Sidebar menu MUST show the Platform Sidebar.**

This ensures:
- ✅ Consistent user experience
- ✅ Easy navigation between platform features
- ✅ Visual consistency across the application
- ✅ Users always know where they are in the platform

## Implementation Pattern

### ✅ Correct Pattern: Use Layout Files

For pages accessible from the platform sidebar, create a `layout.tsx` file that wraps the page with `PlatformLayout`:

```typescript
'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect } from 'react'

const pathToTabMap: Record<string, string> = {
  '/your-route': 'tab-id',
}

export default function YourLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('tab-id')

  useEffect(() => {
    const tab = pathToTabMap[pathname || ''] || 'tab-id'
    setActiveTab(tab)
  }, [pathname])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navigation is handled by the sidebar href
  }

  return (
    <PlatformLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {children}
    </PlatformLayout>
  )
}
```

### ❌ Anti-Pattern: Pages Without PlatformLayout

**DO NOT** create pages that are in the sidebar but don't show the sidebar:

```typescript
// ❌ BAD - Page in sidebar but no PlatformLayout
export default function BadPage() {
  return <div>Content without sidebar</div>
}
```

## Current Implementation Status

### ✅ All Platform Sidebar Pages Now Have Layouts

#### Overview Group
- ✅ `/` → Uses `PlatformLayout` in `page.tsx`
- ✅ `/overview/analytics` → Uses `/overview/layout.tsx`

#### Tools Group
- ✅ `/tools/bigquery` → Uses `/tools/layout.tsx`
- ✅ `/tools/notebook` → Uses `/tools/layout.tsx`
- ✅ `/tools/ai-analyst` → Uses `/tools/layout.tsx`
- ✅ `/tools/ai-chat-ui` → Uses `/tools/layout.tsx`
- ✅ `/knowledge` → Uses `/knowledge/layout.tsx` ✅ **FIXED**
- ✅ `/marketplace` → Uses `/marketplace/layout.tsx` ✅ **FIXED**
- ✅ `/infrastructure` → Uses `/infrastructure/layout.tsx` ✅ **FIXED**
- ✅ `/tools/projects` → Uses `/tools/layout.tsx`
- ✅ `/tools/bi` → Uses `/tools/layout.tsx`
- ✅ `/tools/storage` → Uses `/tools/layout.tsx`
- ✅ `/tools/data-governance` → Uses `/tools/layout.tsx`

#### System Group
- ✅ All `/system/*` routes → Use `/system/layout.tsx`

#### Data Management Group
- ✅ `/data-management/space-selection` → Uses `/data-management/layout.tsx`

## Layout Hierarchy in Next.js

Next.js layouts are **hierarchical** - a layout only applies to routes under its directory:

```
app/
├── layout.tsx              # Root layout (applies to ALL routes)
├── tools/
│   ├── layout.tsx         # Applies to /tools/* routes only
│   └── bigquery/
│       └── page.tsx        # Uses tools/layout.tsx
├── system/
│   ├── layout.tsx          # Applies to /system/* routes only
│   └── users/
│       └── page.tsx       # Uses system/layout.tsx
├── knowledge/
│   ├── layout.tsx          # Applies to /knowledge route
│   └── page.tsx           # Uses knowledge/layout.tsx
├── marketplace/
│   ├── layout.tsx          # Applies to /marketplace route
│   └── page.tsx           # Uses marketplace/layout.tsx
└── infrastructure/
    ├── layout.tsx          # Applies to /infrastructure route
    └── page.tsx           # Uses infrastructure/layout.tsx
```

## Why Individual Layouts for Root-Level Routes?

Root-level routes (like `/knowledge`, `/marketplace`, `/infrastructure`) need their own layouts because:

1. **Next.js Layout Hierarchy**: `/tools/layout.tsx` only applies to `/tools/*` routes
2. **Route Independence**: These routes are at the root level, not under `/tools/`
3. **Consistency**: Each route needs to map its path to the correct `activeTab` ID

## Verification Checklist

When adding a new page to the platform sidebar:

- [ ] Page route is listed in `PlatformSidebar.tsx` `groupedTabs`
- [ ] Page has a `layout.tsx` file that uses `PlatformLayout`
- [ ] Layout maps the route path to the correct `activeTab` ID
- [ ] Layout uses `usePathname()` to detect current route
- [ ] Layout sets `activeTab` based on current pathname
- [ ] Test: Clicking sidebar menu item shows the page WITH the sidebar

## Common Mistakes to Avoid

### ❌ Mistake 1: Adding routes to wrong layout's pathToTabMap

```typescript
// ❌ WRONG - /tools/layout.tsx cannot handle /marketplace
const pathToTabMap = {
  '/tools/bigquery': 'bigquery',
  '/marketplace': 'marketplace', // This won't work!
}
```

**Why it fails**: `/tools/layout.tsx` only applies to `/tools/*` routes. `/marketplace` is not a child of `/tools/`.

### ❌ Mistake 2: Forgetting to create layout for root-level routes

```typescript
// ❌ WRONG - Page in sidebar but no layout
// app/knowledge/page.tsx
export default function KnowledgePage() {
  return <OutlineKnowledgeBase /> // No sidebar!
}
```

**Fix**: Create `app/knowledge/layout.tsx` with `PlatformLayout`.

### ❌ Mistake 3: Using MainLayout for platform pages

```typescript
// ❌ WRONG - Platform page using wrong layout
import { MainLayout } from '@/components/layout/main-layout'

export default function PlatformPage() {
  return (
    <MainLayout> {/* Wrong! Should be PlatformLayout */}
      <Content />
    </MainLayout>
  )
}
```

**Fix**: Use `PlatformLayout` for all platform sidebar pages.

## Summary

✅ **Best Practice**: Every page in the platform sidebar MUST have a layout that wraps it with `PlatformLayout`.

✅ **Current Status**: All platform sidebar pages now have proper layouts and show the sidebar consistently.

✅ **Pattern**: 
- Grouped routes (like `/tools/*`) → Shared layout file
- Root-level routes → Individual layout file
- Both patterns use `PlatformLayout` for consistency

