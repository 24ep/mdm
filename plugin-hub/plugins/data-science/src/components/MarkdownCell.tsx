'use client'

import { useState, useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Edit,
  Eye,
  EyeOff,
  Copy,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  Undo,
  Redo,
  Bold,
  Italic,
  Link,
  List,
  Code,
  Quote,
  Image,
  Table,
  Heading1,
  Heading2,
  Heading3,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MarkdownCellProps {
  id: string
  content: string
  output?: any
  status: 'idle' | 'running' | 'success' | 'error'
  executionTime?: number
  timestamp: Date
  isActive: boolean
  onContentChange: (content: string) => void
  onExecute: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onFocus: () => void
}

export function MarkdownCell({
  id,
  content,
  output,
  status,
  executionTime,
  timestamp,
  isActive,
  onContentChange,
  onExecute,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onFocus
}: MarkdownCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [history, setHistory] = useState<string[]>([content])
  const [historyIndex, setHistoryIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <PlayCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const handleContentChange = (newContent: string) => {
    onContentChange(newContent)

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      onContentChange(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      onContentChange(history[newIndex])
    }
  }

  const insertMarkdown = (markdown: string, placeholder?: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const replacement = placeholder ? markdown.replace('PLACEHOLDER', selectedText || placeholder) : markdown

    const newContent = content.substring(0, start) + replacement + content.substring(end)
    handleContentChange(newContent)

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + replacement.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const markdownShortcuts = [
    { icon: <Heading1 className="h-4 w-4" />, label: 'H1', markdown: '# PLACEHOLDER\n' },
    { icon: <Heading2 className="h-4 w-4" />, label: 'H2', markdown: '## PLACEHOLDER\n' },
    { icon: <Heading3 className="h-4 w-4" />, label: 'H3', markdown: '### PLACEHOLDER\n' },
    { icon: <Bold className="h-4 w-4" />, label: 'Bold', markdown: '**PLACEHOLDER**' },
    { icon: <Italic className="h-4 w-4" />, label: 'Italic', markdown: '*PLACEHOLDER*' },
    { icon: <Code className="h-4 w-4" />, label: 'Code', markdown: '`PLACEHOLDER`' },
    { icon: <Quote className="h-4 w-4" />, label: 'Quote', markdown: '> PLACEHOLDER\n' },
    { icon: <List className="h-4 w-4" />, label: 'List', markdown: '- PLACEHOLDER\n' },
    { icon: <Link className="h-4 w-4" />, label: 'Link', markdown: '[PLACEHOLDER](url)' },
    { icon: <Image className="h-4 w-4" />, label: 'Image', markdown: '![alt text](image-url)' },
    { icon: <Table className="h-4 w-4" />, label: 'Table', markdown: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n' }
  ]

  const renderMarkdown = (markdown: string) => {
    // Simple markdown renderer - in production, use a proper markdown library
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      // Lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Line breaks
      .replace(/\n/gim, '<br />')

    return html
  }

  const copyToClipboard = async () => {
    const { copyToClipboard: copy } = await import('@/lib/clipboard')
    const success = await copy(content)
    if (success) {
      toast.success('Markdown copied to clipboard')
    } else {
      toast.error('Failed to copy')
    }
  }

  const exportMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `markdown_${Date.now()}.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown exported')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onExecute()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault()
      undo()
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault()
      redo()
    } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      redo()
    }
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isActive ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Markdown</span>
            <Badge variant="outline" className="text-xs">
              {timestamp.toLocaleTimeString()}
            </Badge>
            {getStatusIcon(status)}
            {executionTime && (
              <Badge variant="secondary" className="text-xs">
                {executionTime}ms
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToClipboard}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exportMarkdown}
              className="h-6 w-6 p-0"
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveUp}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3 rotate-[-90deg]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveDown}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3 rotate-90" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              {/* Markdown Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={undo}
                    disabled={historyIndex === 0}
                    className="h-7 w-7 p-0"
                  >
                    <Undo className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={redo}
                    disabled={historyIndex === history.length - 1}
                    className="h-7 w-7 p-0"
                  >
                    <Redo className="h-3 w-3" />
                  </Button>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-2" />

                <div className="flex items-center gap-1">
                  {markdownShortcuts.map((shortcut, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="ghost"
                      onClick={() => insertMarkdown(shortcut.markdown, shortcut.label)}
                      className="h-7 w-7 p-0"
                      title={shortcut.label}
                    >
                      {shortcut.icon}
                    </Button>
                  ))}
                </div>

                <div className="flex-1" />

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 px-2"
                >
                  {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>

              {/* Editor and Preview */}
              <div className={cn("grid gap-4", showPreview ? "grid-cols-2" : "grid-cols-1")}>
                {/* Markdown Editor */}
                <div>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={onFocus}
                    className="w-full min-h-[200px] p-3 border border-gray-200 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="# Markdown Cell

Write your documentation here using **Markdown** syntax.

## Features
- **Bold text**
- *Italic text*
- `Code snippets`
- [Links](https://example.com)
- Lists
- Tables
- And more!

### Quick Tips
- Use Ctrl+Enter to execute
- Use the toolbar buttons for quick formatting
- Preview your changes in real-time"
                    style={{
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  />
                </div>

                {/* Live Preview */}
                {showPreview && (
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <div className="text-xs text-gray-500 mb-2 font-medium">Live Preview</div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: typeof window !== 'undefined'
                          ? DOMPurify.sanitize(renderMarkdown(content))
                          : renderMarkdown(content)
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Editor Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Characters: {content.length} | Lines: {content.split('\n').length}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Ctrl+Enter to execute
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-7 px-3 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview Mode
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Rendered Markdown */}
              <div className="prose prose-sm max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: typeof window !== 'undefined'
                      ? DOMPurify.sanitize(renderMarkdown(content))
                      : renderMarkdown(content)
                  }}
                />
              </div>

              {/* Cell Actions */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {content.length} characters • {content.split('\n').length} lines
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Markdown
                </Button>
              </div>
            </div>
          )}

          {/* Output */}
          {output && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Output</h4>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const { copyToClipboard } = await import('@/lib/clipboard')
                      await copyToClipboard(JSON.stringify(output, null, 2))
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {JSON.stringify(output, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}