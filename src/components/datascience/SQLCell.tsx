'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Eye,
  EyeOff
} from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { NotebookCell } from './types'
import { useSpaces } from '@/hooks/useSpaces'
import { useDataModels } from '@/hooks/useDataModels'

interface SQLCellProps {
  cell: NotebookCell
  isActive: boolean
  isSelected: boolean
  onExecute?: (cellId: string) => void
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
  const [languageExtensions, setLanguageExtensions] = useState<any[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('')
  const [selectedDataModelId, setSelectedDataModelId] = useState<string>('')
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  
  // Fetch spaces and data models
  const { spaces, loading: spacesLoading } = useSpaces()
  const { dataModels, loading: modelsLoading } = useDataModels(selectedSpaceId)
  
  // Initialize space from cell metadata or use first space
  useEffect(() => {
    if (cell.metadata?.spaceId) {
      setSelectedSpaceId(cell.metadata.spaceId)
    } else if (spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id)
    }
  }, [spaces, cell.metadata?.spaceId])
  
  // Initialize data model from cell connection
  useEffect(() => {
    if (cell.sqlConnection && !cell.sqlConnection.match(/^(default|bigquery|postgres|mysql|sqlite)$/)) {
      // Assume it's a data model ID
      setSelectedDataModelId(cell.sqlConnection)
    }
  }, [cell.sqlConnection])
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

  // Handle space and data model changes
  const handleSpaceChange = (spaceId: string) => {
    setSelectedSpaceId(spaceId)
    setSelectedDataModelId('') // Reset data model when space changes
    // Update cell metadata
    if (onConnectionChange) {
      onConnectionChange(cell.id, spaceId)
    }
  }

  const handleDataModelChange = (dataModelId: string) => {
    setSelectedDataModelId(dataModelId)
    // Store data model ID in connection field (or create a new metadata field)
    if (onConnectionChange) {
      onConnectionChange(cell.id, dataModelId)
    }
  }

  // SQLCell now only renders the content area (similar to renderCodeCell)
  // The variable name and datasource are now in the CellRenderer toolbar
  return (
    <div className="space-y-2">
      <div className="px-4 py-3">
        <CodeMirror
          value={cell.sqlQuery || cell.content || ''}
          height="auto"
          theme={undefined}
          extensions={[
            ...languageExtensions, // Language extension first for syntax highlighting
            EditorView.lineWrapping,
            EditorView.theme({ 
              '&': { 
                height: 'auto', 
                minHeight: '120px', 
                fontSize: '14px',
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                backgroundColor: 'transparent'
              },
              '.cm-scroller': { overflow: 'auto', maxHeight: '400px', backgroundColor: 'transparent' },
              '.cm-content': { padding: '12px 16px', backgroundColor: 'transparent' },
              '.cm-gutters': { 
                backgroundColor: 'transparent',
                border: 'none',
                paddingLeft: '12px'
              },
              '.cm-editor.cm-focused': { outline: 'none' }
            }),
            ...(isDark ? [oneDark] : [lightEditorTheme, syntaxHighlighting(HighlightStyle.define([
              { tag: tags.keyword, color: '#0077aa' },
              { tag: tags.string, color: '#669900' },
              { tag: tags.comment, color: '#999988', fontStyle: 'italic' },
              { tag: tags.number, color: '#990055' },
              { tag: tags.definition(tags.variableName), color: '#0077aa' },
              { tag: tags.variableName, color: '#1a1a1a' },
              { tag: tags.operator, color: '#a67f59' },
              { tag: tags.typeName, color: '#0077aa' },
              { tag: tags.propertyName, color: '#0077aa' },
              { tag: tags.function(tags.variableName), color: '#6f42c1' },
              { tag: tags.className, color: '#0077aa' },
            ]))])
          ]}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            bracketMatching: true
          }}
          onChange={(val) => onContentChange(cell.id, val)}
          editable={canEdit}
          className="w-full border-0 bg-transparent"
          style={{ minHeight: 100 }}
          placeholder="SELECT * FROM table_name WHERE condition;"
          onFocus={() => onFocus(cell.id)}
        />
      </div>

      {/* Info message */}
      {cell.sqlVariableName && cell.sqlQuery && (
        <div className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400 italic">
          Result will be saved as DataFrame: <code className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{cell.sqlVariableName}</code>
        </div>
      )}

      {/* Query Result Output */}
      {cell.output && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {showOutput ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Result
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Rows: {cell.output.rowCount || 'N/A'}</span>
                    <span>•</span>
                    <span>Cols: {cell.output.columnCount || 'N/A'}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowOutput(false)
                    }}
                    className="h-6 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide Result
                  </Button>
                </div>
              </div>

            {cell.output.error ? (
              <div className="text-red-600 dark:text-red-400 text-sm font-mono bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {cell.output.error}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Executed successfully
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
          ) : (
            <div className="py-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowOutput(true)
                }}
                className="h-6 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <Eye className="h-3 w-3 mr-1" />
                Show Result
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
