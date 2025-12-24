# BigQuery Interface Components

This directory contains the refactored BigQuery Interface components, split from the original monolithic component for better maintainability and reusability.

## Component Structure

### Core Components

#### `QueryTemplates.tsx`
- **Purpose**: Provides a library of common SQL query templates
- **Features**: 
  - Categorized templates (Basic, Joins, Analytics, DDL, DML, Advanced)
  - One-click template insertion
  - Searchable template library
- **Props**: `isOpen`, `onClose`, `onInsertTemplate`

#### `QueryBookmarks.tsx`
- **Purpose**: Manages bookmarked/favorite queries
- **Features**:
  - Bookmark any query from history
  - Quick access to run bookmarked queries
  - Remove bookmarks
- **Props**: `isOpen`, `onClose`, `bookmarkedQueries`, `onRemoveBookmark`, `onRunQuery`, `getStatusIcon`, `formatDuration`, `formatBytes`

#### `KeyboardShortcuts.tsx`
- **Purpose**: Displays keyboard shortcuts help dialog
- **Features**:
  - Comprehensive shortcuts reference
  - Organized by category (Query Operations, Navigation, General)
- **Props**: `isOpen`, `onClose`

#### `QueryValidation.tsx`
- **Purpose**: Real-time query validation and error display
- **Features**:
  - Syntax validation (parentheses, quotes, SQL structure)
  - Warning system for best practices
  - Visual indicators in toolbar
  - Detailed error/warning panel
- **Props**: `query`, `validation`
- **Hook**: `useQueryValidation()` - provides validation logic

#### `ExportDropdown.tsx`
- **Purpose**: Export query results in multiple formats
- **Features**:
  - CSV, JSON, Excel, PDF export options
  - Dropdown menu interface
  - Metadata inclusion in exports
- **Props**: `currentResult`

#### `QueryHistory.tsx`
- **Purpose**: Advanced query history management
- **Features**:
  - Search across queries, users, and spaces
  - Multi-filter system (Status, User, Date Range)
  - Bookmark functionality
  - Result counter
- **Props**: `queryHistory`, `onLoadQuery`, `onToggleBookmark`, `isBookmarked`, `getStatusIcon`, `formatDuration`, `formatBytes`

#### `TableContextMenu.tsx`
- **Purpose**: Right-click context menu for tables
- **Features**:
  - Common BigQuery actions (Select, Preview, Count, Describe, Schema)
  - Copy operations (table name, path)
  - Dangerous operations (Drop table)
- **Props**: `visible`, `x`, `y`, `tableName`, `projectName`, `onAction`, `onClose`

#### `DataExplorer.tsx`
- **Purpose**: Left sidebar for browsing data sources
- **Features**:
  - Space selection
  - Table browsing
  - Expandable schema navigation
  - Right-click context menu integration
- **Props**: `spaces`, `selectedSpace`, `onSpaceChange`, `onTableRightClick`

#### `ResultsPanel.tsx`
- **Purpose**: Bottom panel for displaying query results
- **Features**:
  - Resizable height with drag handle
  - Multiple tabs (Results, History, Visualization)
  - Data visualization with ChartRenderer
  - Export functionality
- **Props**: Multiple props for state management and callbacks

### Hooks

#### `useKeyboardShortcuts.ts`
- **Purpose**: Manages keyboard shortcuts for the entire interface
- **Features**:
  - Global keyboard event handling
  - Configurable shortcut actions
  - Prevents default browser behavior
- **Parameters**: Object with callback functions for each shortcut action

## Usage

### Import Components
```typescript
import {
  QueryTemplates,
  QueryBookmarks,
  KeyboardShortcuts,
  QueryValidation,
  useQueryValidation,
  ExportDropdown,
  TableContextMenu,
  DataExplorer,
  ResultsPanel
} from '@/components/bigquery'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
```

### Example Integration
```typescript
function MyBigQueryInterface() {
  const [showTemplates, setShowTemplates] = useState(false)
  const { validateQuery } = useQueryValidation()
  
  useKeyboardShortcuts({
    onRunQuery: executeQuery,
    onShowTemplates: () => setShowTemplates(true),
    // ... other callbacks
  })

  return (
    <div>
      <QueryTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onInsertTemplate={insertTemplate}
      />
      {/* Other components */}
    </div>
  )
}
```

## Benefits of Refactoring

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be used in other parts of the application
3. **Testability**: Individual components can be tested in isolation
4. **Performance**: Smaller components enable better React optimization
5. **Developer Experience**: Easier to understand and modify specific features
6. **Code Organization**: Clear separation of concerns

## File Structure
```
src/components/bigquery/
├── README.md
├── index.ts                 # Export all components
├── QueryTemplates.tsx
├── QueryBookmarks.tsx
├── KeyboardShortcuts.tsx
├── QueryValidation.tsx
├── ExportDropdown.tsx
├── QueryHistory.tsx
├── TableContextMenu.tsx
├── DataExplorer.tsx
└── ResultsPanel.tsx

src/hooks/
└── useKeyboardShortcuts.ts
```

## Migration from Original Component

The original `BigQueryInterface.tsx` (2507 lines) has been split into:
- **9 focused components** (average ~200 lines each)
- **1 custom hook** for keyboard shortcuts
- **1 refactored main component** (~500 lines)

This reduces complexity and makes the codebase much more manageable while maintaining all original functionality.
