'use client'

import { useEffect, useState } from 'react'
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
  Search,
  FileCode,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { NotebookCell, CellType } from './types'
import { CellOutput } from './CellOutput'
import { SQLCell } from './SQLCell'
import { SQLCellDataSource } from './SQLCellDataSource'
import { Input } from '@/components/ui/input'

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
  onAddComment?: (cellId: string, content?: string) => void
  onAddTag?: (cellId: string) => void
  onSearch?: (cellId: string) => void
  onTitleChange?: (cellId: string, title: string) => void
  canEdit?: boolean
  canExecute?: boolean
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
  onTitleChange,
  canEdit = true,
  canExecute = true
}: CellRendererProps) {
  const [showOutput, setShowOutput] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [commentsLimit, setCommentsLimit] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [codeLanguageExtensions, setCodeLanguageExtensions] = useState<any[]>([])

  // Detect language from cell metadata or content
  const detectLanguage = (cell: NotebookCell): string => {
    // Check metadata first
    if (cell.metadata?.language) {
      return cell.metadata.language.toLowerCase()
    }
    
    // Detect from content patterns
    const content = cell.content.trim()
    if (!content) return 'python' // default
    
    // Python patterns
    if (content.includes('import ') || content.includes('def ') || content.includes('print(') || 
        content.includes('pd.') || content.includes('np.') || content.includes('plt.')) {
      return 'python'
    }
    
    // JavaScript/TypeScript patterns
    if (content.includes('const ') || content.includes('let ') || content.includes('function ') ||
        content.includes('console.log') || content.includes('interface ') || content.includes('type ')) {
      // Try to distinguish TypeScript from JavaScript
      if (content.includes('interface ') || content.includes(': string') || content.includes(': number') ||
          content.includes('type ') && content.includes('=')) {
        return 'typescript'
      }
      return 'javascript'
    }
    
    // R patterns
    if (content.includes('<-') || content.includes('library(') || content.includes('ggplot(') ||
        content.includes('function(') && content.includes('{')) {
      return 'r'
    }
    
    // Default to Python
    return 'python'
  }

  // Load Python extension by default for code cells
  useEffect(() => {
    let isMounted = true
    
    // Only load language extensions for code cells
    if (cell.type !== 'code') {
      setCodeLanguageExtensions([])
      return
    }
    
    const loadLanguageExtension = async () => {
      try {
        const dynamicImport = (specifier: string) => (new Function('s', 'return import(s)'))(specifier)
        const language = detectLanguage(cell)
        
        // Map language names to CodeMirror package names
        const languageMap: Record<string, string> = {
          'python': 'python',
          'javascript': 'javascript',
          'typescript': 'typescript',
          'r': 'r',
          'sql': 'sql'
        }
        
        const langPackage = languageMap[language] || 'python'
        const spec = '@codemirror/lang-' + langPackage
        
        // Try to load the language-specific extension
        const mod = await dynamicImport(spec)
        
        if (!isMounted) return
        
        let extension: any = null
        
        // Different languages export differently
        if (langPackage === 'python' && mod?.python) {
          extension = mod.python()
        } else if (langPackage === 'javascript' && mod?.javascript) {
          extension = mod.javascript()
        } else if (langPackage === 'typescript' && mod?.typescript) {
          extension = mod.typescript()
        } else if (langPackage === 'r' && mod?.r) {
          extension = mod.r()
        } else if (langPackage === 'sql' && mod?.sql) {
          extension = mod.sql()
        }
        
        if (extension && isMounted) {
          setCodeLanguageExtensions([extension])
        } else if (isMounted) {
          // Fallback to Python if language extension not found
          try {
            const pythonMod = await dynamicImport('@codemirror/lang-python')
            if (isMounted && pythonMod?.python) {
              setCodeLanguageExtensions([pythonMod.python()])
            }
          } catch {
            if (isMounted) setCodeLanguageExtensions([])
          }
        }
      } catch (error) {
        // If package doesn't exist, fallback to Python
        if (isMounted) {
          try {
            const dynamicImport = (specifier: string) => (new Function('s', 'return import(s)'))(specifier)
            const pythonMod = await dynamicImport('@codemirror/lang-python')
            if (isMounted && pythonMod?.python) {
              setCodeLanguageExtensions([pythonMod.python()])
            }
          } catch {
            if (isMounted) setCodeLanguageExtensions([])
          }
        }
      }
    }
    
    loadLanguageExtension()
    
    return () => { isMounted = false }
  }, [cell.content, cell.metadata, cell.type])

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
    
    // Light theme highlight style
    const lightHighlightStyle = HighlightStyle.define([
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
      { tag: tags.moduleKeyword, color: '#0077aa' },
    ])
    
    // Light theme that preserves syntax highlighting colors
    const lightEditorTheme = EditorView.theme({
      '&': { backgroundColor: '#f3f4f6' }, // light grey background
      '.cm-scroller': { backgroundColor: '#f3f4f6' },
      '.cm-gutters': { backgroundColor: '#f3f4f6', border: 'none' },
      '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
      '.cm-content': { fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.9rem' },
    }, { dark: false })
    
    // Dark theme for code editor
    const darkEditorTheme = EditorView.theme({
      '&': { backgroundColor: '#1f2937' }, // dark grey background
      '.cm-scroller': { backgroundColor: '#1f2937' },
      '.cm-gutters': { backgroundColor: '#1f2937', border: 'none' },
      '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
      '.cm-content': { fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.9rem' },
    }, { dark: true })

    return (
      <div className="relative">
        <CodeMirror
          value={cell.content}
          height="auto"
          theme={undefined}
          extensions={[
            ...codeLanguageExtensions, // Language extensions must come first for proper highlighting
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
                outline: 'none'
              },
              '.cm-scroller': { 
                overflow: 'auto', 
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                border: 'none'
              },
              '.cm-content': { 
                padding: '12px 16px', 
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                cursor: canEdit ? 'text' : 'default'
              },
              '.cm-gutters': { 
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                border: 'none',
                paddingLeft: '12px'
              },
              '.cm-line': { paddingLeft: '0' },
              '.cm-editor.cm-focused': { outline: 'none', border: 'none' },
              '.cm-editor': { border: 'none', outline: 'none' }
            }),
            ...(isDark ? [darkEditorTheme, syntaxHighlighting(lightHighlightStyle)] : [lightEditorTheme, syntaxHighlighting(lightHighlightStyle)])
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
            tabSize: 4
          }}
          onChange={(val) => {
            if (canEdit) {
              onContentChange(cell.id, val)
            }
          }}
          editable={canEdit}
          className={isDark ? "bg-gray-800" : "bg-gray-100"}
          style={{ border: 'none', outline: 'none', minHeight: '150px', pointerEvents: canEdit ? 'auto' : 'none' }}
        />

        {cell.output && showOutput && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-[5px]">
            <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              Out[{cell.executionCount || index + 1}]:
            </div>
            <CellOutput 
              output={cell.output}
              executionCount={cell.executionCount || index + 1}
              className="px-4 py-3"
            />
          </div>
        )}
      </div>
    )
  }

  const renderMarkdownCell = () => {
    // Best practice: Enhanced markdown rendering with proper escaping
    const renderMarkdown = (content: string) => {
      if (!content) return ''
      
      // Escape HTML to prevent XSS
      const escapeHtml = (text: string) => {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
      }
      
      let html = escapeHtml(content)
      
      // Best practice: Support common markdown patterns
      // Headers
      html = html.replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold mb-4 mt-4">$1</h1>')
      html = html.replace(/^## (.*)$/gm, '<h2 class="text-xl font-semibold mb-3 mt-3">$1</h2>')
      html = html.replace(/^### (.*)$/gm, '<h3 class="text-lg font-medium mb-2 mt-2">$1</h3>')
      html = html.replace(/^#### (.*)$/gm, '<h4 class="text-base font-medium mb-2 mt-2">$1</h4>')
      
      // Bold and italic (order matters - do bold first)
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      
      // Inline code
      html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400">$1</code>')
      
      // Code blocks (triple backticks)
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto my-2"><code>$2</code></pre>')
      
      // Links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Lists (basic support)
      html = html.replace(/^\- (.*)$/gm, '<li class="ml-4">$1</li>')
      html = html.replace(/^(\d+)\. (.*)$/gm, '<li class="ml-4">$2</li>')
      
      // Line breaks
      html = html.replace(/\n\n/g, '</p><p class="mb-2">')
      html = html.replace(/\n/g, '<br>')
      
      return `<div class="markdown-content"><p class="mb-2">${html}</p></div>`
    }
    
    const rendered = (
      <div className="px-4 py-3 prose prose-sm max-w-none dark:prose-invert">
        <div
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(cell.content || '')
          }}
        />
      </div>
    )

    if (isActive || isSelected) {
      return (
        <div className="px-4 py-3">
          <textarea
            value={cell.content}
            onChange={(e) => onContentChange(cell.id, e.target.value)}
            onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }}
            className="w-full border-0 bg-transparent resize-none focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-relaxed"
            placeholder="Write your markdown here... (supports # headings, **bold**, *italic*, `code`)"
            onFocus={() => onFocus(cell.id)}
            style={{
              lineHeight: '1.7',
              minHeight: '100px',
              fontSize: '14px'
            }}
          />
        </div>
      )
    }

    // Not selected: show rendered output only (empty placeholder if no content)
    return cell.content.trim() ? rendered : (
      <div className="px-4 py-8 text-sm text-gray-400 dark:text-gray-500 text-center" onClick={() => onFocus(cell.id)}>
        Click to add markdown…
      </div>
    )
  }

  const renderRawCell = () => (
    <div className="px-4 py-3">
      <textarea
        value={cell.content}
        onChange={(e) => onContentChange(cell.id, e.target.value)}
        onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }}
        className="w-full border-0 bg-transparent resize-none focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
        placeholder="Raw text content..."
        onFocus={() => onFocus(cell.id)}
        style={{ 
          lineHeight: '1.6',
          minHeight: '100px',
          fontSize: '14px'
        }}
      />
    </div>
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
        onTitleChange={onTitleChange}
        onExecute={onExecute}
        canEdit={canEdit}
        canExecute={canExecute}
      />
    )
  }

  return (
    <div
      className={cn(
        "group relative transition-all duration-200",
        "mx-2 my-2",
        "rounded-[5px]",
        // Markdown cells: transparent with border
        cell.type === 'markdown' || cell.type === 'raw' 
          ? "bg-transparent border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600" 
          : // Other cells: light grey background, no border
            "bg-gray-100 dark:bg-gray-800 border-0",
        // No left color indicators
        "",
        // Selected state
        isSelected ? "ring-2 ring-blue-200 dark:ring-blue-800" : "",
        // Remove status-based left borders
        ""
      )}
      onClick={() => onFocus(cell.id)}
    >
      {/* Cell Controls - Always visible on the right side */}
      {canEdit && (
        <div className="absolute right-2 top-2 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          {/* Move Up Button */}
          {onMove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onMove(cell.id, 'up')
              }}
              className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Move up (Ctrl+↑)"
            >
              <ArrowUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          )}
          {/* Move Down Button */}
          {onMove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onMove(cell.id, 'down')
              }}
              className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Move down (Ctrl+↓)"
            >
              <ArrowDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          )}
          {/* Delete Button */}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(cell.id)
              }}
              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
              title="Delete cell (Del)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* DeepNote Design: No left gutter, controls in toolbar */}
      <div className="flex">

        {/* Cell Content Area - DeepNote design */}
        <div className="flex-1 min-w-0">
          {/* Cell Toolbar - DeepNote style: visible, modern */}
          {cell.type === 'code' && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-[5px]">
            <div className="flex items-center space-x-3">
              {/* Execution count - inline in toolbar */}
              <div className={cn(
                "text-xs font-mono font-medium px-2 py-1 rounded",
                cell.executionCount 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" 
                  : "text-gray-400 dark:text-gray-500"
              )}>
                {cell.executionCount ? `[${cell.executionCount}]` : 'In [' + (index + 1) + ']'}
              </div>
              <div className="flex items-center space-x-2">
                <FileCode className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  {cell.type}
                </span>
                {cell.status !== 'idle' && (
                  <div className="flex items-center gap-2">
                    {getStatusIcon(cell.status)}
                    {cell.executionTime && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {cell.executionTime}ms
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Cell Title */}
              {cell.title && (
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {cell.title}
                </span>
              )}
              {canEdit && onTitleChange && (
                <input
                  value={cell.title || ''}
                  placeholder="Cell title..."
                  onChange={(e) => onTitleChange(cell.id, e.target.value)}
                  className="text-sm bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 w-32"
                  disabled={!canEdit}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
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
              {/* Run Button - in toolbar */}
              {(cell.type === 'code' || cell.type === 'sql') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onExecute(cell.id)
                  }}
                  disabled={!canExecute || cell.status === 'running'}
                  className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"
                  title="Run cell (Ctrl+Enter)"
                >
                  <Play className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="currentColor" />
                </Button>
              )}
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
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowComments(true)
                    }}
                    className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 relative"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                  {(cell.comments && cell.comments.length > 0) && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] leading-none px-1.5 py-0.5 rounded-full">
                      {cell.comments.length}
                    </span>
                  )}
                </div>
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
          )}

          {/* SQL Cell - DeepNote style toolbar */}
          {cell.type === 'sql' && (
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-[5px]">
              <div className="flex items-center gap-3 flex-wrap justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Execution count - inline in toolbar */}
                  <div className={cn(
                    "text-xs font-mono font-medium px-2 py-1 rounded",
                    cell.executionCount 
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" 
                      : "text-gray-400 dark:text-gray-500"
                  )}>
                    {cell.executionCount ? `[${cell.executionCount}]` : 'In [' + (index + 1) + ']'}
                  </div>
                {/* Cell Type Icon and Title */}
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    sql
                  </span>
                  {cell.status !== 'idle' && getStatusIcon(cell.status)}
                </div>
                
                {/* Title Input */}
                {canEdit && onTitleChange ? (
                  <input
                    value={cell.title || ''}
                    placeholder="Cell title..."
                    onChange={(e) => onTitleChange(cell.id, e.target.value)}
                    className="text-sm bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 w-32"
                    disabled={!canEdit}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : cell.title ? (
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {cell.title}
                  </span>
                ) : null}

                {/* Variable Name and Data Source - Same Row */}
                {onVariableNameChange && onConnectionChange && (
                  <>
                    <Input
                      value={cell.sqlVariableName || ''}
                      onChange={(e) => onVariableNameChange(cell.id, e.target.value)}
                      placeholder="Variable name"
                      className="h-7 max-w-32 font-mono text-xs"
                      disabled={!canEdit}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div onClick={(e) => e.stopPropagation()}>
                      <SQLCellDataSource 
                        cell={cell}
                        onConnectionChange={onConnectionChange}
                        canEdit={canEdit}
                      />
                    </div>
                  </>
                )}
                </div>
                {/* Controls on the right */}
                <div className="flex items-center space-x-1">
                  {/* Run Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onExecute && onExecute(cell.id)
                    }}
                    disabled={!canExecute || cell.status === 'running'}
                    className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"
                    title="Run cell (Ctrl+Enter)"
                  >
                    <Play className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="currentColor" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Cell Content */}
          <div className={cell.type === 'code' ? '' : ''}>
            {cell.type === 'code' ? renderCodeCell() : 
             cell.type === 'markdown' ? renderMarkdownCell() : 
             cell.type === 'sql' ? renderSQLCell() :
             /* Treat RAW like Markdown */
             renderMarkdownCell()}
          </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="fixed inset-0 z-50" onClick={() => setShowComments(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-sm">Comments</div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {(cell.comments || []).slice(0, commentsLimit).map((c) => (
                <div key={c.id} className="p-2 rounded border border-gray-200 dark:border-gray-700 text-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{c.author} • {new Date(c.timestamp).toLocaleString()}</div>
                  <div className="text-gray-800 dark:text-gray-200">{c.content}</div>
                </div>
              ))}
              {((cell.comments?.length || 0) > commentsLimit) && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => setCommentsLimit(commentsLimit + 5)}>Load more</Button>
              )}
              {((cell.comments?.length || 0) === 0) && (
                <div className="text-xs text-gray-500">No comments yet.</div>
              )}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 h-9 px-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm focus:outline-none"
                />
                <Button size="sm" className="h-9" onClick={() => { if (newComment.trim()) { onAddComment?.(cell.id, newComment.trim()); setNewComment(''); setCommentsLimit((cell.comments?.length || 0) + 1) } }}>Send</Button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
