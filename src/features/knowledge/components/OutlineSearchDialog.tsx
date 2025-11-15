'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'

interface SearchResult {
  id: string
  title: string
  content: string
  collectionId: string
  collection: {
    name: string
    icon?: string
    color?: string
  }
  creator?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  rank: number
  createdAt: Date
  updatedAt: Date
}

interface OutlineSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDocument: (documentId: string, collectionId: string) => void
  spaceId?: string
  collectionId?: string
}

export function OutlineSearchDialog({
  open,
  onOpenChange,
  onSelectDocument,
  spaceId,
  collectionId,
}: OutlineSearchDialogProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debouncedQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (open) {
      // Load recent searches from localStorage
      const recent = localStorage.getItem('knowledge-recent-searches')
      if (recent) {
        try {
          setRecentSearches(JSON.parse(recent))
        } catch (e) {
          // ignore
        }
      }
    }
  }, [open])

  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery.length >= 2) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
    }
  }, [debouncedQuery])

  const performSearch = async (query: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('q', query)
      if (collectionId) params.set('collectionId', collectionId)
      if (spaceId) params.set('spaceId', spaceId)

      const response = await fetch(`/api/knowledge/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.documents || [])

        // Save to recent searches
        const recent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10)
        setRecentSearches(recent)
        localStorage.setItem('knowledge-recent-searches', JSON.stringify(recent))
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    onSelectDocument(result.id, result.collectionId)
    onOpenChange(false)
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Knowledge Base</DialogTitle>
          <DialogDescription>
            Search across all documents and collections
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : searchQuery.trim() && results.length === 0 ? (
              <EmptyState
                title="No results found"
                description="Try a different search term"
                icon={<Search className="h-12 w-12 text-gray-300 dark:text-gray-600" />}
              />
            ) : searchQuery.trim() ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </h4>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {result.collection.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {result.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {result.creator && (
                        <span>By {result.creator.name}</span>
                      )}
                      <span>{new Date(result.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchQuery(search)}
                          className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                        >
                          <Search className="h-4 w-4" />
                          {search}
                          <ArrowRight className="h-4 w-4 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  Start typing to search...
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

