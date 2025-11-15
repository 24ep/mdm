# Duplicate Files Cleanup Plan

## 🔍 Found Duplicates

### 1. Duplicate Knowledge Base Routes
- ❌ `src/app/admin/knowledge-base/page.tsx` - Duplicate of `/tools/knowledge-base`
- ❌ `src/app/tools/knowledge-base/page.tsx` - Uses old localStorage system
- ✅ `src/app/knowledge/page.tsx` - NEW system (keep)
- ✅ `src/app/[space]/knowledge/page.tsx` - NEW system (keep)

### 2. Old Knowledge Base Components (localStorage-based)
- ⚠️ `src/app/admin/features/content/components/KnowledgeBase.tsx` - Old admin component
- ⚠️ `src/components/knowledge-base/KnowledgePage.tsx` - Old component (1191 lines)

### 3. Shared Utilities (KEEP)
- ✅ `src/components/knowledge-base/MarkdownRenderer.tsx` - Used by new system
- ✅ `src/components/knowledge-base/RichMarkdownEditor.tsx` - Used by new system

## 📋 Cleanup Actions

1. **Update old routes** to use new OutlineKnowledgeBase
2. **Deprecate old components** (keep for now, mark as deprecated)
3. **Update sidebar** to point to new route
4. **Remove duplicate route** (`/admin/knowledge-base`)

