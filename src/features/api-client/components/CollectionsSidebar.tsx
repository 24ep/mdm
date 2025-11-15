'use client'

import { useState } from 'react'
import { ApiCollection, ApiRequest } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImportExportDialog } from './ImportExportDialog'
import { Plus, Folder, File, ChevronRight, ChevronDown, MoreVertical, Trash2, Edit } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CollectionsSidebarProps {
  collections: ApiCollection[]
  onSelectRequest: (request: ApiRequest) => void
  onRequestChange: (request: ApiRequest) => void
  workspaceId?: string
  onCollectionsChange: (collections: ApiCollection[]) => void
}

export function CollectionsSidebar({
  collections,
  onSelectRequest,
  onRequestChange,
  workspaceId,
  onCollectionsChange,
}: CollectionsSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedFolders(newExpanded)
  }

  const handleCreateCollection = async () => {
    if (!workspaceId) return

    const name = prompt('Collection name:')
    if (!name) return

    try {
      const res = await fetch('/api/api-client/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        onCollectionsChange([...collections, data.collection])
      }
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }

  const handleCreateRequest = async (collectionId: string) => {
    const name = prompt('Request name:')
    if (!name) return

    try {
      const res = await fetch('/api/api-client/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId,
          name,
          method: 'GET',
          url: '',
          headers: [],
          params: [],
          authType: 'none',
          requestType: 'REST',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newRequest: ApiRequest = data.request
        onSelectRequest(newRequest)
      }
    } catch (error) {
      console.error('Failed to create request:', error)
    }
  }

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Delete this collection?')) return

    try {
      const res = await fetch(`/api/api-client/collections/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onCollectionsChange(collections.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete collection:', error)
    }
  }

  const renderCollection = (collection: ApiCollection, level = 0) => {
    const isExpanded = expandedFolders.has(collection.id || '')
    const hasChildren = collection.children && collection.children.length > 0
    const hasRequests = collection.requests && collection.requests.length > 0

    return (
      <div key={collection.id}>
        <div
          className="flex items-center gap-1 px-2 py-1 hover:bg-accent cursor-pointer group"
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          {hasChildren || hasRequests ? (
            <button
              onClick={() => collection.id && toggleFolder(collection.id)}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{collection.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCreateRequest(collection.id!)}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteCollection(collection.id!)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && (
          <>
            {collection.children?.map((child) => renderCollection(child, level + 1))}
            {collection.requests?.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-1 px-2 py-1 hover:bg-accent cursor-pointer"
                style={{ paddingLeft: `${24 + level * 16}px` }}
                onClick={() => onSelectRequest(request)}
              >
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{request.name}</span>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  const filteredCollections = collections.filter((collection) => {
    if (!searchQuery) return true
    const matchesName = collection.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRequests =
      collection.requests?.some((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) || false
    return matchesName || matchesRequests
  })

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="h-8"
          />
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateCollection}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
          {collections.length > 0 && (
            <ImportExportDialog
              collection={collections[0]}
              onImport={(imported) => {
                // Handle import
                console.log('Import collection:', imported)
              }}
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredCollections.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No results found' : 'No collections yet'}
          </div>
        ) : (
          filteredCollections.map((collection) => renderCollection(collection))
        )}
      </div>
    </div>
  )
}

