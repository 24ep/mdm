'use client'

import { NotebookCell, TableOfContentsItem } from './types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { List, X, FileCode, Database, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableOfContentsProps {
  cells: NotebookCell[]
  onNavigateToCell: (cellId: string) => void
  onClose: () => void
}

export function TableOfContents({
  cells,
  onNavigateToCell,
  onClose
}: TableOfContentsProps) {
  // Generate table of contents from cell titles
  const tocItems: TableOfContentsItem[] = cells
    .map((cell, index) => {
      // Extract title from cell title or first line of markdown
      let title = cell.title || ''
      let level = 1

      if (!title && cell.type === 'markdown') {
        // Try to extract from markdown headers
        const lines = cell.content.split('\n')
        for (const line of lines) {
          if (line.startsWith('#')) {
            const match = line.match(/^(#+)\s+(.+)$/)
            if (match) {
              level = match[1].length
              title = match[2].trim()
              break
            }
          }
        }
      }

      // If still no title, use a default
      if (!title) {
        title = `Cell ${index + 1}`
      }

      return {
        cellId: cell.id,
        title,
        level: Math.min(level, 6), // Max level 6
        index
      }
    })
    .filter(item => item.title) // Only include cells with titles

  const getCellIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <FileCode className="h-3 w-3" />
      case 'sql':
        return <Database className="h-3 w-3" />
      case 'markdown':
        return <FileText className="h-3 w-3" />
      default:
        return <FileCode className="h-3 w-3" />
    }
  }

  if (tocItems.length === 0) {
    return (
      <div className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5" />
            <h3 className="font-semibold">Table of Contents</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No table of contents</p>
            <p className="text-xs mt-2">Add titles to cells to generate a table of contents</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5" />
          <h3 className="font-semibold">Table of Contents</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {tocItems.length}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {tocItems.map((item) => {
            const cell = cells.find(c => c.id === item.cellId)
            return (
              <div
                key={item.cellId}
                className={cn(
                  "p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
                  "border-l-2",
                  item.level === 1 ? "border-blue-500 pl-3" :
                  item.level === 2 ? "border-blue-400 pl-5" :
                  item.level === 3 ? "border-blue-300 pl-7" :
                  "border-gray-300 dark:border-gray-600 pl-9"
                )}
                onClick={() => onNavigateToCell(item.cellId)}
              >
                <div className="flex items-center gap-2">
                  {cell && (
                    <div className="text-gray-400 dark:text-gray-500">
                      {getCellIcon(cell.type)}
                    </div>
                  )}
                  <span
                    className={cn(
                      "text-sm truncate",
                      item.level === 1 ? "font-semibold text-gray-900 dark:text-gray-100" :
                      item.level === 2 ? "font-medium text-gray-800 dark:text-gray-200" :
                      "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {item.title}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

