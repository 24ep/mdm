'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Database,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw, 
  Clock,
  Eye,
  EyeOff,
  Save,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { NotebookCell } from './types'

interface SQLCellProps {
  cell: NotebookCell
  isActive: boolean
  isSelected: boolean
  onExecute: (cellId: string) => void
  onContentChange: (cellId: string, content: string) => void
  onVariableNameChange: (cellId: string, variableName: string) => void
  onConnectionChange: (cellId: string, connection: string) => void
  onFocus: (cellId: string) => void
  onSelect: (cellId: string, selected: boolean) => void
  onTitleChange?: (cellId: string, title: string) => void
  canEdit?: boolean
  canExecute?: boolean
}

export function SQLCell({
  cell,
  isActive,
  isSelected,
  onExecute,
  onContentChange,
  onVariableNameChange,
  onConnectionChange,
  onFocus,
  onSelect,
  onTitleChange,
  canEdit = true,
  canExecute = true
}: SQLCellProps) {
  const [showOutput, setShowOutput] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [languageExtensions, setLanguageExtensions] = useState<any[]>([])
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  const lightEditorTheme = EditorView.theme({
    '&': { backgroundColor: 'transparent' },
    '.cm-scroller': { backgroundColor: 'transparent' },
    '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'transparent' },
    '.cm-content': { fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.9rem' }
  }, { dark: false })

  useEffect(() => {
    let isMounted = true
    const dynamicImport = (specifier: string) => (new Function('s', 'return import(s)'))(specifier)
    const spec = '@codemirror/lang-' + 'sql'
    dynamicImport(spec)
      .then((mod: any) => {
        if (isMounted && mod?.sql) setLanguageExtensions([mod.sql()])
      })
      .catch(() => { if (isMounted) setLanguageExtensions([]) })
    return () => { isMounted = false }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': 
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': 
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': 
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: 
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const handleExecute = () => {
    if (cell.sqlQuery && cell.sqlVariableName) {
      onExecute(cell.id)
    }
  }

  const handleSaveAsDataFrame = () => {
    if (cell.sqlQuery && cell.sqlVariableName) {
      // This will be handled by the parent component
      onExecute(cell.id)
    }
  }

  return (
    <div
      className={cn(
        "group relative transition-all duration-200 rounded-md",
        // Default background for all cells (like hover state)
        "bg-gray-50 dark:bg-gray-800/50",
        // Enhanced hover state
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        // Blue border for active/selected cells
        "",
        // Active state background
        isActive ? "bg-blue-50/50 dark:bg-blue-900/20" : "",
        // Selected state background
        isSelected ? "bg-blue-100/40 dark:bg-blue-900/30" : "",
        // Status-based backgrounds override default
        cell.status === 'running' ? "bg-yellow-50/70 dark:bg-yellow-900/30" : "",
        cell.status === 'error' ? "bg-red-50/70 dark:bg-red-900/30" : ""
      )}
      onClick={() => onFocus(cell.id)}
    >
      {/* SQL Cell Container */}
      <div className="flex">
        {/* Left Gutter - Cell Number and Controls */}
        <div className="flex flex-col items-center w-12 py-2 space-y-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Database className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                handleExecute()
              }}
              disabled={!canExecute || cell.status === 'running' || !cell.sqlQuery || !cell.sqlVariableName}
              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <Play className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* SQL Cell Content Area */}
        <div className="flex-1 min-w-0">
          {/* SQL Cell Header - match code cell style */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  SQL
                </span>
                </div>
              {/* Inline title, variable name, and space selector */}
              <div className="flex items-center space-x-3">
                <input
                  value={cell.title || ''}
                  placeholder="Untitled"
                  onChange={(e) => onTitleChange && onTitleChange(cell.id, e.target.value)}
                  className="text-sm bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  disabled={!canEdit}
                />
                <div className="flex items-center space-x-2">
                  <Input
                    id={`sql-var-${cell.id}`}
                    value={cell.sqlVariableName || ''}
                    onChange={(e) => onVariableNameChange(cell.id, e.target.value)}
                    placeholder="Variable name (e.g., df)"
                    className="h-8 max-w-48 font-mono text-xs"
                    onFocus={() => onFocus(cell.id)}
                    disabled={!canEdit}
                  />
                  <Select
                    value={cell.sqlConnection || 'default'}
                    onValueChange={(value) => onConnectionChange(cell.id, value)}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue placeholder="Space" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="bigquery">BigQuery</SelectItem>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {cell.status !== 'idle' && getStatusIcon(cell.status)}
              {cell.executionTime && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {cell.executionTime}ms
                </span>
              )}
                </div>
            <div className="flex items-center space-x-2">
              {cell.output && (
                            <Button
                              size="sm"
                              variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowOutput(!showOutput)
                  }}
                  className="h-6 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {showOutput ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showOutput ? 'Hide' : 'Show'} Result
                            </Button>
              )}
                      </div>
                    </div>

          {/* SQL Cell Content - match code cell spacing */}
          <div className="space-y-2 px-0 py-0">
            {/* SQL Query Editor */}
              <CodeMirror
                value={cell.sqlQuery || cell.content || ''}
                height="auto"
                theme={isDark ? oneDark : undefined}
                extensions={[EditorView.lineWrapping, EditorView.theme({ '&': { height: 'auto', minHeight: '160px' }, '.cm-scroller': { overflow: 'visible' } }), ...(isDark ? [] : [lightEditorTheme]), ...languageExtensions]}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightActiveLine: true,
                  foldGutter: true,
                  bracketMatching: true
                }}
                onChange={(val) => onContentChange(cell.id, val)}
                className="bg-transparent"
                style={{ border: 'none', outline: 'none', minHeight: 160 }}
                placeholder="SELECT * FROM table_name WHERE condition;"
                onFocus={() => onFocus(cell.id)}
                readOnly={!canEdit}
              />
                  </div>

            {/* Execute Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                          <Button
                  onClick={handleExecute}
                  disabled={!canExecute || cell.status === 'running' || !cell.sqlQuery || !cell.sqlVariableName}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute Query
                          </Button>
                      <Button
                        variant="outline"
                  onClick={handleSaveAsDataFrame}
                  disabled={!canExecute || cell.status === 'running' || !cell.sqlQuery || !cell.sqlVariableName}
                  className="border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                  <Save className="h-4 w-4 mr-2" />
                  Save as DataFrame
                      </Button>
                    </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {cell.sqlVariableName && cell.sqlQuery ? 
                  `Will save result as: ${cell.sqlVariableName}` : 
                  'Enter variable name and query to execute'
                }
                  </div>
                </div>

            {/* Query Result Output */}
            {cell.output && showOutput && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Query Result
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Rows: {cell.output.rowCount || 'N/A'}</span>
                      <span>•</span>
                      <span>Cols: {cell.output.columnCount || 'N/A'}</span>
                </div>
              </div>

                  {cell.output.error ? (
                    <div className="text-red-600 dark:text-red-400 text-sm font-mono bg-red-50 dark:bg-red-900/20 p-3 rounded">
                      {cell.output.error}
                  </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✓ Query executed successfully
                  </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Result saved as DataFrame: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">{cell.sqlVariableName}</code>
                </div>
                      {cell.output.preview && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Preview:</div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                  {cell.output.preview.columns?.map((col: string, idx: number) => (
                                    <th key={idx} className="text-left py-1 px-2 font-medium text-gray-700 dark:text-gray-300">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {cell.output.preview.data?.slice(0, 5).map((row: any[], rowIdx: number) => (
                                  <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-700">
                                    {row.map((cell: any, cellIdx: number) => (
                                      <td key={cellIdx} className="py-1 px-2 text-gray-600 dark:text-gray-400">
                                        {String(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
              </div>
            </div>
                      )}
              </div>
                  )}
              </div>
            </div>
          )}
          {/* Close content area and outer flex container */}
          </div>
        </div>
      </div>
  )
}
