'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Trash2, Bookmark, User, Calendar, Timer, HardDrive } from 'lucide-react'

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

interface QueryHistoryProps {
  queryHistory: QueryResult[]
  onLoadQuery: (query: string) => void
  onToggleBookmark: (queryId: string) => void
  isBookmarked: (queryId: string) => boolean
  getStatusIcon: (status: string) => React.ReactNode
  formatDuration: (ms: number) => string
  formatBytes: (bytes: number) => string
}

export function QueryHistory({
  queryHistory,
  onLoadQuery,
  onToggleBookmark,
  isBookmarked,
  getStatusIcon,
  formatDuration,
  formatBytes
}: QueryHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'running'>('all')
  const [filterUser, setFilterUser] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Filter and search query history
  const getFilteredQueryHistory = () => {
    let filtered = queryHistory

    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.query.toLowerCase().includes(searchLower) ||
        (item.userName && item.userName.toLowerCase().includes(searchLower)) ||
        (item.spaceName && item.spaceName.toLowerCase().includes(searchLower))
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus)
    }

    // User filter
    if (filterUser !== 'all') {
      filtered = filtered.filter(item => item.userName === filterUser)
    }

    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(item => {
        if (!item.timestamp) return false
        const itemDate = new Date(item.timestamp)
        
        switch (filterDateRange) {
          case 'today':
            return itemDate >= today
          case 'week':
            return itemDate >= weekAgo
          case 'month':
            return itemDate >= monthAgo
          default:
            return true
        }
      })
    }

    return filtered
  }

  const getUniqueUsers = () => {
    const users = Array.from(new Set(queryHistory.map(item => item.userName).filter(Boolean)))
    return users
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Query History</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
              <Trash2 className="h-3 w-3 mr-1" />
              Clear History
            </Button>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search queries, users, or spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {getUniqueUsers().map(user => (
                  <SelectItem key={user} value={user!}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterDateRange} onValueChange={(value: any) => setFilterDateRange(value)}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-xs text-gray-500">
              {getFilteredQueryHistory().length} of {queryHistory.length} queries
            </div>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="space-y-2">
            {getFilteredQueryHistory().map((historyItem) => (
              <div
                key={historyItem.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onLoadQuery(historyItem.query)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(historyItem.status)}
                    <span className="text-sm font-medium text-gray-900">
                      {historyItem.query.substring(0, 50)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleBookmark(historyItem.id)
                      }}
                    >
                      <Bookmark className={`h-3 w-3 ${isBookmarked(historyItem.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    </Button>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {historyItem.userName || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {historyItem.timestamp ? new Date(historyItem.timestamp).toLocaleString() : 'Unknown time'}
                      </div>
                      {historyItem.executionTime && (
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatDuration(historyItem.executionTime)}
                        </div>
                      )}
                      {historyItem.size && (
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatBytes(historyItem.size)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Space: {historyItem.spaceName || 'All Spaces'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
