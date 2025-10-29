'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Clock,
  Eye,
  Copy,
  Scissors,
  FileText,
  Tag,
  MessageSquare,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { NotebookCell, CellType } from './types'
import { CellOutput } from './CellOutput'
import { SQLCell } from './SQLCell'

interface CellRendererProps {
  cell: NotebookCell
  index: number
  isActive: boolean
  isSelected: boolean
  onExecute: (cellId: string) => void
  onDelete: (cellId: string) => void
  onMove: (cellId: string, direction: 'up' | 'down') => void
  onContentChange: (cellId: string, content: string) => void
  onTypeChange: (cellId: string, type: CellType) => void
  onFocus: (cellId: string) => void
  onSelect: (cellId: string, selected: boolean) => void
  onVariableNameChange?: (cellId: string, variableName: string) => void
  onConnectionChange?: (cellId: string, connection: string) => void
  onCopy?: (cellId: string) => void
  onPaste?: (cellId: string) => void
  onCut?: (cellId: string) => void
  onMerge?: (cellId: string, direction: 'above' | 'below') => void
  onSplit?: (cellId: string) => void
  onAddComment?: (cellId: string) => void
  onAddTag?: (cellId: string) => void
  onSearch?: (cellId: string) => void
  onTitleChange?: (cellId: string, title: string) => void
}

export function CellRenderer({
  cell,
  index,
  isActive,
  isSelected,
  onExecute,
  onDelete,
  onMove,
  onContentChange,
  onTypeChange,
  onFocus,
  onSelect,
  onVariableNameChange,
  onConnectionChange,
  onCopy,
  onPaste,
  onCut,
  onMerge,
  onSplit,
  onAddComment,
  onAddTag,
  onSearch
  ,
  onTitleChange
}: CellRendererProps) {
  const [showOutput, setShowOutput] = useState(true)

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

  const renderCodeCell = () => {
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    const lightEditorTheme = EditorView.theme({
      '&': { backgroundColor: 'transparent' },
      '.cm-scroller': { backgroundColor: 'transparent' },
      '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
      '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'transparent' },
      '.cm-content': { fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.9rem' }
    }, { dark: false })

    return (
      <div className="space-y-0">
        <div className="border-0">
          <CodeMirror
            value={cell.content}
            height="200px"
            theme={isDark ? oneDark : undefined}
            extensions={isDark ? [oneDark] : [lightEditorTheme]}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
              bracketMatching: true
            }}
            onChange={(val) => onContentChange(cell.id, val)}
            className="bg-transparent"
            style={{ border: 'none', outline: 'none' }}
          />
        </div>

        {cell.output && showOutput && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <CellOutput 
              output={cell.output}
              executionCount={cell.executionCount || index + 1}
              className="bg-gray-50 dark:bg-gray-800"
            />
          </div>
        )}
      </div>
    )
  }

  const renderMarkdownCell = () => (
    <div className="space-y-0">
      <textarea
        value={cell.content}
        onChange={(e) => onContentChange(cell.id, e.target.value)}
        className="w-full min-h-[80px] p-4 border-0 bg-transparent resize-none focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500"
        placeholder="Write your markdown here..."
        onFocus={() => onFocus(cell.id)}
        style={{ 
          lineHeight: '1.6'
        }}
      />
      
      {cell.content.trim() && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="prose max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ 
              __html: cell.content
                .replace(/\n/g, '<br>')
                .replace(/# (.*)/g, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                .replace(/## (.*)/g, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
                .replace(/### (.*)/g, '<h3 class="text-lg font-medium mb-2">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
            }} />
          </div>
        </div>
      )}
    </div>
  )

  const renderRawCell = () => (
    <textarea
      value={cell.content}
      onChange={(e) => onContentChange(cell.id, e.target.value)}
      className="w-full min-h-[80px] p-4 border-0 bg-transparent resize-none focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500"
      placeholder="Raw text content..."
      onFocus={() => onFocus(cell.id)}
      style={{ 
        lineHeight: '1.6'
      }}
    />
  )

  const renderSQLCell = () => {
    if (!onVariableNameChange || !onConnectionChange) {
      return <div className="text-red-500">SQL cell handlers not available</div>
    }
    
    return (
      <SQLCell
        cell={cell}
        isActive={isActive}
        isSelected={isSelected}
        onExecute={onExecute}
        onContentChange={onContentChange}
        onVariableNameChange={onVariableNameChange}
        onConnectionChange={onConnectionChange}
        onFocus={onFocus}
        onSelect={onSelect}
      />
    )
  }

  return (
    <div
      className={cn(
        "group relative transition-all duration-200 border-2 rounded-md",
        // Default background for all cells (like hover state)
        "bg-gray-50 dark:bg-gray-800/50",
        // Enhanced hover state
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        // Blue border for active/selected cells
        isActive || isSelected ? "border-blue-500 dark:border-blue-400" : "border-transparent",
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
      {/* DeepNote-style Cell Container */}
      <div className="flex">
        {/* Left Gutter - Cell Number and Controls */}
        <div className="flex flex-col items-center w-12 py-2 space-y-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {index + 1}
            </span>
          </div>
          <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onExecute(cell.id)
              }}
              disabled={cell.type !== 'code' || cell.status === 'running'}
              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <Play className="h-3 w-3" />
            </Button>
            {onCopy && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onCopy(cell.id)
                }}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
            {onCut && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onCut(cell.id)
                }}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Scissors className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onMove(cell.id, 'up')
              }}
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onMove(cell.id, 'down')
              }}
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            {onSplit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onSplit(cell.id)
                }}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <FileText className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(cell.id)
              }}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Cell Content Area */}
        <div className="flex-1 min-w-0">
          {/* Cell Type Indicator */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {cell.type}
                </span>
                {cell.type === 'code' && cell.executionCount && (
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    [{cell.executionCount}]
                  </span>
                )}
                {cell.status !== 'idle' && getStatusIcon(cell.status)}
                {cell.executionTime && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {cell.executionTime}ms
                  </span>
                )}
              </div>

              {/* Editable Title */}
              <input
                value={cell.title || ''}
                placeholder="Untitled"
                onChange={(e) => onTitleChange && onTitleChange(cell.id, e.target.value)}
                className="text-sm bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              {cell.tags && cell.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  {cell.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {onSearch && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSearch(cell.id)
                  }}
                  className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <Search className="h-3 w-3" />
                </Button>
              )}
              {onAddComment && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddComment(cell.id)
                  }}
                  className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <MessageSquare className="h-3 w-3" />
                </Button>
              )}
              {onAddTag && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddTag(cell.id)
                  }}
                  className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <Tag className="h-3 w-3" />
                </Button>
              )}
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
                  <Eye className="h-3 w-3 mr-1" />
                  {showOutput ? 'Hide' : 'Show'} Output
                </Button>
              )}
            </div>
          </div>

          {/* Cell Content */}
          <div className={cell.type === 'code' ? '' : 'p-4'}>
            {cell.type === 'code' ? renderCodeCell() : 
             cell.type === 'markdown' ? renderMarkdownCell() : 
             cell.type === 'sql' ? renderSQLCell() :
             renderRawCell()}
          </div>
        </div>
      </div>
    </div>
  )
}
