'use client'

import { NotebookCell } from './types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bookmark, X, FileCode, Database, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookmarksPanelProps {
  cells: NotebookCell[]
  onNavigateToCell: (cellId: string) => void
  onToggleBookmark: (cellId: string) => void
  onClose: () => void
}

export function BookmarksPanel({
  cells,
  onNavigateToCell,
  onToggleBookmark,
  onClose
}: BookmarksPanelProps) {
  const bookmarkedCells = cells.filter(cell => cell.isBookmarked)

  const getCellIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <FileCode className="h-4 w-4" />
      case 'sql':
        return <Database className="h-4 w-4" />
      case 'markdown':
        return <FileText className="h-4 w-4" />
      default:
        return <FileCode className="h-4 w-4" />
    }
  }

  if (bookmarkedCells.length === 0) {
    return (
      <div className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Bookmarks</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No bookmarked cells</p>
            <p className="text-xs mt-2">Click the bookmark icon on any cell to bookmark it</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-yellow-500 fill-current" />
          <h3 className="font-semibold">Bookmarks</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            {bookmarkedCells.length}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {bookmarkedCells.map((cell, index) => (
            <div
              key={cell.id}
              className={cn(
                "p-3 rounded-lg border border-gray-200 dark:border-gray-700",
                "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
                "transition-colors"
              )}
              onClick={() => onNavigateToCell(cell.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="mt-0.5 text-gray-400 dark:text-gray-500">
                    {getCellIcon(cell.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded uppercase">
                        {cell.type}
                      </span>
                    </div>
                    {cell.title ? (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {cell.title}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {cell.content.substring(0, 50) || 'Empty cell'}...
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookmark(cell.id)
                  }}
                  className="h-6 w-6 p-0 text-yellow-500 hover:text-yellow-600"
                >
                  <Bookmark className="h-4 w-4 fill-current" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

