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
import { sql } from '@codemirror/lang-sql'
import { autocompletion } from '@codemirror/autocomplete'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { createSQLAutocomplete, fetchDatabaseSchema } from '@/lib/sql-autocomplete'
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
  const [sqlAutocomplete, setSqlAutocomplete] = useState<any>(null)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('')
  const [selectedDataModelId, setSelectedDataModelId] = useState<string>('')
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  
  // Fetch spaces and data models
  const { spaces, loading: spacesLoading } = useSpaces()
  const { dataModels, loading: modelsLoading } = useDataModels(selectedSpaceId)

  // Load SQL autocomplete with database schema
  useEffect(() => {
    fetchDatabaseSchema(selectedSpaceId || undefined).then(schema => {
      const autocomplete = createSQLAutocomplete(schema, 'postgresql')
      setSqlAutocomplete(autocomplete)
    }).catch(err => {
      console.error('Failed to load database schema for autocomplete:', err)
    })
  }, [selectedSpaceId])
  
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
    '&': { backgroundColor: '#f3f4f6' }, // light grey background
    '.cm-scroller': { backgroundColor: '#f3f4f6' },
    '.cm-gutters': { backgroundColor: '#f3f4f6', border: 'none' },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
    '.cm-content': { fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.9rem' }
  }, { dark: false })
  
  const darkEditorTheme = EditorView.theme({
    '&': { backgroundColor: '#1f2937' }, // dark grey background
    '.cm-scroller': { backgroundColor: '#1f2937' },
    '.cm-gutters': { backgroundColor: '#1f2937', border: 'none' },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
    '.cm-content': { fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.9rem' }
  }, { dark: true })

  useEffect(() => {
    // Use SQL language extension with autocomplete
    setLanguageExtensions([
      sql({ dialect: 'postgresql', upperCaseKeywords: true }),
      ...(sqlAutocomplete ? [autocompletion({ override: [sqlAutocomplete] })] : [])
    ])
  }, [sqlAutocomplete])

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
      <div style={{ padding: '4px' }}>
        <CodeMirror
          value={cell.sqlQuery || cell.content || ''}
          height="auto"
          theme={undefined}
          extensions={[
            ...languageExtensions, // Language extension first for syntax highlighting
            EditorView.lineWrapping,
            EditorView.editable.of(canEdit),
            EditorView.theme({ 
              '&': { 
                height: 'auto',
                minHeight: '150px', // Minimum 5 rows: 5 * 21px (line height) + padding
                fontSize: '14px',
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6', // light grey background
                border: 'none',
                outline: 'none',
                borderRadius: '0px' // Match table widget: 0px border radius
              },
              '.cm-scroller': { 
                overflow: 'auto', 
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                border: 'none',
                borderRadius: '0px'
              },
              '.cm-content': { 
                padding: '4px', // Match table widget: 4px padding
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                cursor: canEdit ? 'text' : 'default'
              },
              '.cm-gutters': { 
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                border: 'none',
                paddingLeft: '4px', // Match table widget: 4px padding
                borderRadius: '0px'
              },
              '.cm-editor.cm-focused': { outline: 'none', border: 'none' },
              '.cm-editor': { border: 'none', outline: 'none', borderRadius: '0px' }
            }),
            ...(isDark ? [darkEditorTheme, syntaxHighlighting(HighlightStyle.define([
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
            ]))] : [lightEditorTheme, syntaxHighlighting(HighlightStyle.define([
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
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            searchKeymap: true,
            history: true,
            indentOnInput: true,
            defaultKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            allowMultipleSelections: true,
            rectangularSelection: true,
            tabSize: 2
          }}
          onChange={(val) => {
            if (canEdit) {
              onContentChange(cell.id, val)
            }
          }}
          editable={canEdit}
          className={isDark ? "w-full border-0 bg-gray-800" : "w-full border-0 bg-gray-100"}
          style={{ minHeight: '150px', border: 'none', outline: 'none', pointerEvents: canEdit ? 'auto' : 'none', borderRadius: '0px' }}
          placeholder="SELECT * FROM table_name WHERE condition;"
          onFocus={() => onFocus(cell.id)}
        />
      </div>

      {/* Info message */}
      {cell.sqlVariableName && cell.sqlQuery && (
        <div className="text-xs text-gray-500 dark:text-gray-400 italic" style={{ padding: '4px' }}>
          Result will be saved as DataFrame: <code className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{cell.sqlVariableName}</code>
        </div>
      )}

      {/* Query Result Output */}
      {cell.output && (
        <div className="border-t border-[#e5e7eb] dark:border-gray-700" style={{ borderWidth: '1px', borderStyle: 'solid' }}>
          {showOutput ? (
            <div className="bg-gray-50 dark:bg-gray-800" style={{ padding: '4px', borderRadius: '0px' }}>
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
                    className="h-6 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-[10%]"
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
                className="h-6 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-[10%]"
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
