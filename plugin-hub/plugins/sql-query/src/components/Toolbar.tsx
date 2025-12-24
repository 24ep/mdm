'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Save, 
  FileText, 
  Bookmark, 
  Zap, 
  Eye, 
  EyeOff 
} from 'lucide-react'
import { QueryValidation } from './QueryValidation'
import { ExportDropdown } from './ExportDropdown'

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

interface ToolbarProps {
  query: string
  isExecuting: boolean
  currentResult: QueryResult | null
  queryValidation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
  bookmarkedQueries: Set<string>
  showFooter: boolean
  onExecuteQuery: () => void
  onSaveQuery: () => void
  onShowTemplates: () => void
  onShowBookmarks: () => void
  onShowShortcuts: () => void
  onToggleFooter: () => void
}

export function Toolbar({
  query,
  isExecuting,
  currentResult,
  queryValidation,
  bookmarkedQueries,
  showFooter,
  onExecuteQuery,
  onSaveQuery,
  onShowTemplates,
  onShowBookmarks,
  onShowShortcuts,
  onToggleFooter
}: ToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={onExecuteQuery} 
            disabled={isExecuting || !query.trim()}
            className="h-8 px-3"
          >
            <Play className="h-4 w-4 mr-1" />
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
          
          <Button size="sm" variant="outline" onClick={onSaveQuery} className="h-8 px-3">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button size="sm" variant="outline" onClick={onShowTemplates} className="h-8 px-3">
            <FileText className="h-4 w-4 mr-1" />
            Templates
          </Button>
          
          <Button size="sm" variant="outline" onClick={onShowBookmarks} className="h-8 px-3">
            <Bookmark className="h-4 w-4 mr-1" />
            Bookmarks
            {bookmarkedQueries.size > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {bookmarkedQueries.size}
              </Badge>
            )}
          </Button>
          
          <Button size="sm" variant="outline" onClick={onShowShortcuts} className="h-8 px-3">
            <Zap className="h-4 w-4 mr-1" />
            Shortcuts
          </Button>
          
          {/* Query Validation Status */}
          <QueryValidation query={query} validation={queryValidation} />
        </div>
        
        <div className="flex items-center gap-2">
          <ExportDropdown currentResult={currentResult} />
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onToggleFooter} 
            className="h-8 px-3"
          >
            {showFooter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showFooter ? 'Hide' : 'Show'} Results
          </Button>
        </div>
      </div>
    </div>
  )
}
