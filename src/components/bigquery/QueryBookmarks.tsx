'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bookmark, Play, Timer, HardDrive } from 'lucide-react'

interface QueryResult {
  id: string
  query: string
  results: any[]
  columns: string[]
  status: 'success' | 'error' | 'running'
  executionTime?: number
  timestamp: Date
  spaceName?: string
  userId?: string
  userName?: string
  size?: number
}

interface QueryBookmarksProps {
  isOpen: boolean
  onClose: () => void
  bookmarkedQueries: QueryResult[]
  onRemoveBookmark: (queryId: string) => void
  onRunQuery: (query: string) => void
  getStatusIcon: (status: string) => React.ReactNode
  formatDuration: (ms: number) => string
  formatBytes: (bytes: number) => string
}

export function QueryBookmarks({
  isOpen,
  onClose,
  bookmarkedQueries,
  onRemoveBookmark,
  onRunQuery,
  getStatusIcon,
  formatDuration,
  formatBytes
}: QueryBookmarksProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bookmarked Queries</DialogTitle>
          <DialogDescription>
            Your saved and favorite queries for quick access
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {bookmarkedQueries.length > 0 ? (
              bookmarkedQueries.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bookmark.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {bookmark.query.substring(0, 60)}...
                        </h4>
                        <p className="text-sm text-gray-600">
                          Space: {bookmark.spaceName || 'All Spaces'} • 
                          User: {bookmark.userName || 'Unknown'} • 
                          {bookmark.timestamp ? new Date(bookmark.timestamp).toLocaleString() : 'Unknown time'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2 text-xs"
                        onClick={() => onRemoveBookmark(bookmark.id)}
                      >
                        <Bookmark className="h-3 w-3 text-yellow-500 fill-current" />
                        Remove
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          onRunQuery(bookmark.query)
                          onClose()
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-700 max-h-32 overflow-hidden">
                    {bookmark.query}
                  </div>
                  
                  {bookmark.executionTime && (
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {formatDuration(bookmark.executionTime)}
                      </div>
                      {bookmark.size && (
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatBytes(bookmark.size)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2 text-gray-700">No Bookmarks Yet</h3>
                <p className="text-sm text-gray-500">Bookmark queries from your history to see them here</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
