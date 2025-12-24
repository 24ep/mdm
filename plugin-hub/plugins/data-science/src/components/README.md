# Data Science Components - Refactored Structure

This directory contains the refactored Data Science notebook components, split from a single large file into multiple smaller, more manageable files for better organization and maintainability.

## File Structure

### Core Components
- **`DeepNoteLayout.tsx`** - Original monolithic component (kept for reference)
- **`DeepNoteLayoutRefactored.tsx`** - New refactored main component
- **`CellRenderer.tsx`** - Individual cell rendering component
- **`JupyterCell.tsx`** - Legacy cell component (kept for compatibility)
- **`NotebookToolbar.tsx`** - Top toolbar component
- **`NotebookSidebar.tsx`** - Left sidebar component
- **`NotebookTemplates.tsx`** - Template selection modal
- **`CellOutput.tsx`** - Cell output rendering component

### Supporting Files
- **`types.ts`** - TypeScript interfaces and type definitions
- **`utils.ts`** - Utility functions and helpers
- **`hooks.ts`** - Custom React hooks for state management
- **`handlers.ts`** - Event handlers and business logic
- **`index.ts`** - Export declarations

## Architecture Benefits

### 1. **Separation of Concerns**
- **Types**: All interfaces and types in one place
- **Utils**: Pure functions and helpers
- **Hooks**: State management and side effects
- **Handlers**: Business logic and event handling
- **Components**: UI rendering only

### 2. **Improved Maintainability**
- Smaller files are easier to understand and modify
- Clear boundaries between different concerns
- Easier to locate specific functionality
- Reduced cognitive load when working on specific features

### 3. **Better Reusability**
- Hooks can be reused across different components
- Utils can be imported where needed
- Handlers can be shared between components
- Types provide consistent interfaces

### 4. **Enhanced Testing**
- Individual files can be unit tested in isolation
- Hooks can be tested independently
- Utils can be tested with pure function tests
- Components can be tested with mocked dependencies

## Usage

### Using the Refactored Component
```tsx
import { DeepNoteLayoutRefactored } from '@/components/datascience'

function MyPage() {
  return (
    <DeepNoteLayoutRefactored
      initialNotebook={myNotebook}
      onSave={handleSave}
      dataSource={myDataSource}
    />
  )
}
```

### Using Individual Components
```tsx
import { 
  CellRenderer, 
  NotebookToolbar, 
  NotebookSidebar,
  useNotebookState,
  createNotebookHandlers 
} from '@/components/datascience'
```

### Using Hooks
```tsx
import { useNotebookState, useKernelInitialization } from '@/components/datascience'

function MyComponent() {
  const [state, actions] = useNotebookState()
  const { kernels, currentKernel } = useKernelInitialization()
  // ...
}
```

## Migration Guide

### From DeepNoteLayout to DeepNoteLayoutRefactored

1. **Import Change**:
   ```tsx
   // Before
   import { DeepNoteLayout } from '@/components/datascience'
   
   // After
   import { DeepNoteLayoutRefactored as DeepNoteLayout } from '@/components/datascience'
   ```

2. **Props Remain the Same**:
   ```tsx
   <DeepNoteLayout
     initialNotebook={notebook}
     onSave={handleSave}
     dataSource={dataSource}
     enableCollaboration={true}
     enableFileManager={true}
     enableExport={true}
     enableVersionControl={true}
   />
   ```

### Customizing Behavior

1. **Custom Handlers**:
   ```tsx
   import { createNotebookHandlers } from '@/components/datascience'
   
   const customHandlers = createNotebookHandlers(state, actions, dataSource, onSave)
   // Modify handlers as needed
   ```

2. **Custom Hooks**:
   ```tsx
   import { useNotebookState } from '@/components/datascience'
   
   const [state, actions] = useNotebookState(initialNotebook)
   // Use state and actions as needed
   ```

## File Descriptions

### `types.ts`
Contains all TypeScript interfaces and type definitions:
- `Notebook` - Main notebook interface
- `NotebookCell` - Individual cell interface
- `CellType` - Cell type union
- `DeepNoteLayoutProps` - Component props
- `NotebookState` - State interface
- `NotebookActions` - Actions interface

### `utils.ts`
Contains utility functions:
- `getDefaultContent()` - Get default content for cell types
- `createNewCell()` - Create new cell instance
- `getStatusIcon()` - Get status icon configuration
- `formatExecutionTime()` - Format execution time
- `exportNotebook()` - Export notebook to file
- `importNotebook()` - Import notebook from file
- `copyToClipboard()` - Copy text to clipboard
- `debounce()` - Debounce function
- `throttle()` - Throttle function

### `hooks.ts`
Contains custom React hooks:
- `useNotebookState()` - Main state management hook
- `useKernelInitialization()` - Kernel setup hook
- `useNotebookRefs()` - Ref management hook
- `useAutoSave()` - Auto-save functionality
- `useKeyboardNavigation()` - Keyboard navigation

### `handlers.ts`
Contains event handlers and business logic:
- `createNotebookHandlers()` - Factory for all handlers
- Cell operations (create, delete, update, move, execute)
- File operations (save, export, import, open, delete)
- Kernel operations (interrupt, restart, shutdown)
- UI operations (toggle, find, replace, undo, redo)

### `CellRenderer.tsx`
Renders individual notebook cells:
- Code cell rendering with syntax highlighting
- Markdown cell rendering with preview
- Raw cell rendering
- Cell toolbar with actions
- Output display with toggle

## Best Practices

1. **Import Only What You Need**:
   ```tsx
   import { useNotebookState } from '@/components/datascience'
   // Instead of importing everything
   ```

2. **Use TypeScript**:
   ```tsx
   import { Notebook, NotebookCell } from '@/components/datascience'
   ```

3. **Leverage Hooks**:
   ```tsx
   const [state, actions] = useNotebookState()
   const handlers = createNotebookHandlers(state, actions, dataSource, onSave)
   ```

4. **Customize When Needed**:
   ```tsx
   const customHandlers = {
     ...createNotebookHandlers(state, actions, dataSource, onSave),
     executeCell: myCustomExecuteCell
   }
   ```

## Future Enhancements

The refactored structure makes it easy to add new features:

1. **New Cell Types**: Add to `types.ts` and `CellRenderer.tsx`
2. **New Handlers**: Add to `handlers.ts`
3. **New Hooks**: Add to `hooks.ts`
4. **New Utils**: Add to `utils.ts`
5. **New Components**: Create new files and export from `index.ts`

This modular structure provides a solid foundation for future development and maintenance.