// Enhanced Cell Types
export type CellType = 'code' | 'markdown' | 'raw' | 'sql'

export interface NotebookCell {
  id: string
  type: CellType
  title?: string
  content: string
  output?: any
  status: 'idle' | 'running' | 'success' | 'error'
  executionTime?: number
  executionCount?: number
  timestamp: Date
  metadata: Record<string, any>
  // SQL-specific properties
  sqlVariableName?: string
  sqlConnection?: string
  sqlQuery?: string
  // Common cell features
  tags?: string[]
  comments?: Array<{
    id: string
    content: string
    author: string
    timestamp: Date
    lineNumber?: number
  }>
  isCollapsed?: boolean
  isSelected?: boolean
  isExecuting?: boolean
  isBookmarked?: boolean
  executionHistory?: Array<{
    timestamp: Date
    executionTime?: number
    status: 'success' | 'error'
  }>
}

export interface Notebook {
  id: string
  name: string
  description: string
  cells: NotebookCell[]
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isPublic: boolean
  author: string
  theme: 'light' | 'dark'
  settings: {
    autoSave: boolean
    executionMode: 'sequential' | 'parallel'
    showLineNumbers: boolean
    fontSize: number
    tabSize: number
    wordWrap: boolean
  }
}

export interface DeepNoteLayoutProps {
  initialNotebook?: Notebook
  onSave?: (notebook: Notebook) => void
  onLoad?: (notebookId: string) => void
  dataSource?: { data: any[]; metadata: any }
  enableCollaboration?: boolean
  enableFileManager?: boolean
  enableExport?: boolean
  enableVersionControl?: boolean
  canEdit?: boolean
  canExecute?: boolean
  onControlsReady?: (controls: {
    toggleSidebar: () => void
    save: () => void
    openSettings: () => void
    renameProject: (name: string) => void
  }) => void
}

export interface Variable {
  name: string
  type: string
  value: string
  size?: string
}

export interface FileItem {
  name: string
  type: 'file' | 'folder'
  size?: string
  modified: Date
}

export interface NotebookState {
  notebook: Notebook
  activeCellId: string | null
  selectedCellIds: Set<string>
  isExecuting: boolean
  showSidebar: boolean
  showFileManager: boolean
  showCollaboration: boolean
  selectedCellType: CellType
  notebookHistory: Notebook[]
  showHistory: boolean
  showSettings: boolean
  showExport: boolean
  showTemplates: boolean
  isFullscreen: boolean
  layout: 'single' | 'split' | 'grid'
  currentTheme: 'light' | 'dark' | 'auto'
  showVariables: boolean
  showOutput: boolean
  kernelStatus: 'idle' | 'busy' | 'error'
  executionCount: number
  currentKernel: any | null
  kernels: any[]
  variables: Variable[]
  files: FileItem[]
  showBookmarks: boolean
  showTableOfContents: boolean
  showSnippets: boolean
}

export interface NotebookActions {
  setNotebook: (notebook: Notebook | ((prev: Notebook) => Notebook)) => void
  setActiveCellId: (id: string | null) => void
  setSelectedCellIds: (ids: Set<string>) => void
  setIsExecuting: (executing: boolean) => void
  setShowSidebar: (show: boolean) => void
  setShowFileManager: (show: boolean) => void
  setShowCollaboration: (show: boolean) => void
  setSelectedCellType: (type: CellType) => void
  setShowHistory: (show: boolean) => void
  setShowSettings: (show: boolean) => void
  setShowExport: (show: boolean) => void
  setShowTemplates: (show: boolean) => void
  setIsFullscreen: (fullscreen: boolean) => void
  setLayout: (layout: 'single' | 'split' | 'grid') => void
  setCurrentTheme: (theme: 'light' | 'dark' | 'auto') => void
  setShowVariables: (show: boolean) => void
  setShowOutput: (show: boolean) => void
  setKernelStatus: (status: 'idle' | 'busy' | 'error') => void
  setExecutionCount: (count: number) => void
  setCurrentKernel: (kernel: any | null) => void
  setKernels: (kernels: any[]) => void
  setVariables: (variables: Variable[]) => void
  setFiles: (files: FileItem[]) => void
  setShowBookmarks: (show: boolean) => void
  setShowTableOfContents: (show: boolean) => void
  setShowSnippets: (show: boolean) => void
}

export interface CodeSnippet {
  id: string
  name: string
  description: string
  code: string
  language: string
  category: string
  tags: string[]
}

export interface TableOfContentsItem {
  cellId: string
  title: string
  level: number
  index: number
}
