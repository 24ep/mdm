'use client'

import { useState, useEffect } from 'react'
import { ApiRequestHistory } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Clock, Search, Trash2 } from 'lucide-react'

interface RequestHistoryProps {
  workspaceId?: string
  onSelectRequest: (historyItem: ApiRequestHistory) => void
}

export function RequestHistory({ workspaceId, onSelectRequest }: RequestHistoryProps) {
  const [history, setHistory] = useState<ApiRequestHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (workspaceId) {
      loadHistory()
    }
  }, [workspaceId])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/api-client/history?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/api-client/history/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setHistory(history.filter((h) => h.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete history:', error)
    }
  }

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'bg-gray-500'
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500'
    if (statusCode >= 300 && statusCode < 400) return 'bg-yellow-500'
    if (statusCode >= 400) return 'bg-red-500'
    return 'bg-gray-500'
  }

  const filteredHistory = history.filter((item) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.url.toLowerCase().includes(query) ||
      item.method.toLowerCase().includes(query) ||
      (item.statusText && item.statusText.toLowerCase().includes(query))
    )
  })

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">Loading history...</div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No results found' : 'No history yet'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-accent cursor-pointer group"
                onClick={() => onSelectRequest(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(item.statusCode)}`} />
                      <span className="text-sm font-medium">{item.method}</span>
                      <span className="text-sm text-muted-foreground truncate">{item.url}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.statusCode && (
                        <>
                          <span>{item.statusCode}</span>
                          {item.statusText && <span>•</span>}
                        </>
                      )}
                      {item.statusText && <span>{item.statusText}</span>}
                      {item.responseTime && (
                        <>
                          <span>•</span>
                          <span>{item.responseTime}ms</span>
                        </>
                      )}
                      {item.createdAt && (
                        <>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (item.id) handleDeleteHistory(item.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

