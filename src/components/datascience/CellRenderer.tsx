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
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotebookCell, CellType } from './types'
import { CellOutput } from './CellOutput'

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
  onSelect
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

  const renderCodeCell = () => (
    <div className="space-y-4">
      <textarea
        value={cell.content}
        onChange={(e) => onContentChange(cell.id, e.target.value)}
        className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Write your code here..."
        onFocus={() => onFocus(cell.id)}
      />
      
      {cell.output && showOutput && (
        <CellOutput 
          output={cell.output}
          executionCount={index + 1}
          className="bg-white dark:bg-gray-900"
        />
      )}
      
      {cell.output && !showOutput && (
        <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowOutput(true)}
            className="h-6 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <Eye className="h-3 w-3 mr-1" />
            Show Output
          </Button>
        </div>
      )}
    </div>
  )

  const renderMarkdownCell = () => (
    <div className="space-y-4">
      <textarea
        value={cell.content}
        onChange={(e) => onContentChange(cell.id, e.target.value)}
        className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Write your markdown here..."
        onFocus={() => onFocus(cell.id)}
      />
      
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ 
          __html: cell.content
            .replace(/\n/g, '<br>')
            .replace(/# (.*)/g, '<h1>$1</h1>')
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
        }} />
      </div>
    </div>
  )

  const renderRawCell = () => (
    <textarea
      value={cell.content}
      onChange={(e) => onContentChange(cell.id, e.target.value)}
      className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Raw text content..."
      onFocus={() => onFocus(cell.id)}
    />
  )

  return (
    <div
      className={cn(
        "group relative border-l-4 transition-all duration-200",
        isActive ? "border-blue-500 bg-blue-50/50" : "border-transparent hover:border-gray-300",
        isSelected ? "bg-blue-100/50" : "",
        cell.status === 'running' ? "bg-yellow-50" : "",
        cell.status === 'error' ? "bg-red-50" : ""
      )}
      onClick={() => onFocus(cell.id)}
    >
      {/* Cell Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">In [{index + 1}]:</span>
          {cell.status !== 'idle' && getStatusIcon(cell.status)}
          {cell.executionTime && (
            <span className="text-xs text-gray-500">
              {cell.executionTime}ms
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onExecute(cell.id)
            }}
            disabled={cell.type !== 'code' || cell.status === 'running'}
            className="h-6 w-6 p-0"
          >
            <Play className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onMove(cell.id, 'up')
            }}
            className="h-6 w-6 p-0"
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
            className="h-6 w-6 p-0"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(cell.id)
            }}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Cell Content */}
      <div className="p-4">
        {cell.type === 'code' ? renderCodeCell() : 
         cell.type === 'markdown' ? renderMarkdownCell() : 
         renderRawCell()}
      </div>
    </div>
  )
}
