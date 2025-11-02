'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataModelTreeView } from '@/components/data-model/DataModelTreeView'
import { Database, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface DataModel {
  id: string
  name: string
  display_name?: string
  description?: string
  folder_id?: string
  icon?: string
  primary_color?: string
  tags?: string[]
  shared_spaces?: any[]
  created_at?: string
  updated_at?: string
}

interface Folder {
  id: string
  name: string
  description?: string
  parent_id?: string
  children?: Folder[]
  models?: DataModel[]
  created_at?: string
  updated_at?: string
}

interface Space {
  id: string
  name: string
  slug?: string
}

export function DataModelManagement() {
  const [models, setModels] = useState<DataModel[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [spacesLoading, setSpacesLoading] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])

  // Load spaces for filter
  useEffect(() => {
    const loadSpaces = async () => {
      setSpacesLoading(true)
      try {
        const res = await fetch('/api/spaces?page=1&limit=200')
        const json = await res.json().catch(() => ({}))
        setSpaces(json.spaces || [])
      } catch (e) {
        toast.error('Failed to load spaces')
      } finally {
        setSpacesLoading(false)
      }
    }
    loadSpaces()
  }, [])

  // Load models based on space filter
  useEffect(() => {
    loadModels()
    loadFolders()
  }, [selectedSpaceId])

  const loadModels = async () => {
    setLoading(true)
    try {
      let url: string
      if (selectedSpaceId && selectedSpaceId !== 'all') {
        // Use regular data-models endpoint for specific space
        url = `/api/data-models?page=1&limit=500&space_id=${selectedSpaceId}`
      } else {
        // Use spaces endpoint with 'all' to get all models across all spaces
        url = '/api/spaces/all/data-models'
      }
      const res = await fetch(url)
      const json = await res.json().catch(() => ({}))
      setModels(json.dataModels || [])
    } catch (e) {
      toast.error('Failed to load data models')
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      let url = '/api/folders?type=data_model'
      if (selectedSpaceId && selectedSpaceId !== 'all') {
        url += `&space_id=${selectedSpaceId}`
      }
      const res = await fetch(url)
      if (res.status === 503) {
        setFolders([])
        return
      }
      const json = await res.json().catch(() => ({}))
      setFolders(json.folders || [])
    } catch (e) {
      setFolders([])
    }
  }

  const handleCreateModel = () => {
    toast.info('Create model functionality - redirect to space settings or implement here')
    // TODO: Either redirect to space settings or implement create dialog here
  }

  const handleEditModel = (model: DataModel) => {
    toast.info('Edit model functionality - redirect to space settings or implement here')
    // TODO: Either redirect to space settings or implement edit dialog here
  }

  const handleDeleteModel = async (model: DataModel) => {
    if (!confirm(`Are you sure you want to delete "${model.display_name || model.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/data-models/${model.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete model')
      toast.success('Data model deleted successfully')
      loadModels()
    } catch (e) {
      toast.error('Failed to delete data model')
    }
  }

  const handleShareModel = (model: DataModel) => {
    toast.info('Share model functionality - implement here or redirect to space settings')
    // TODO: Implement share functionality
  }

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      const spaceId = selectedSpaceId && selectedSpaceId !== 'all' ? selectedSpaceId : undefined
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          parent_id: parentId || null,
          type: 'data_model',
          space_id: spaceId
        })
      })
      if (!res.ok) throw new Error('Failed to create folder')
      toast.success('Folder created successfully')
      loadFolders()
    } catch (e) {
      toast.error('Failed to create folder')
    }
  }

  const handleEditFolder = (folder: Folder) => {
    toast.info('Edit folder functionality - implement here')
    // TODO: Implement edit folder functionality
  }

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete folder')
      toast.success('Folder deleted successfully')
      loadFolders()
      loadModels()
    } catch (e) {
      toast.error('Failed to delete folder')
    }
  }

  const handleMoveModel = async (modelId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/data-models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
      })
      if (!res.ok) throw new Error('Failed to move model')
      toast.success('Model moved successfully')
      loadModels()
    } catch (e) {
      toast.error('Failed to move model')
    }
  }

  const handleFolderExpand = (folderId: string) => {
    setExpandedFolders([...expandedFolders, folderId])
  }

  const handleFolderCollapse = (folderId: string) => {
    setExpandedFolders(expandedFolders.filter(id => id !== folderId))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Models</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage data models across all spaces
          </p>
        </div>
      </div>

      {/* Space Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Space:</span>
            </div>
            <Select
              value={selectedSpaceId}
              onValueChange={setSelectedSpaceId}
              disabled={spacesLoading}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a space" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Spaces</SelectItem>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSpaceId && selectedSpaceId !== 'all' && (
              <div className="text-sm text-gray-500">
                Showing models for: <strong>{spaces.find(s => s.id === selectedSpaceId)?.name}</strong>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Model Tree View */}
      <DataModelTreeView
        models={models}
        folders={folders}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onModelEdit={handleEditModel}
        onModelDelete={handleDeleteModel}
        onModelMove={handleMoveModel}
        onModelShare={handleShareModel}
        onCreateModel={handleCreateModel}
        onCreateFolder={handleCreateFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onFolderExpand={handleFolderExpand}
        onFolderCollapse={handleFolderCollapse}
        expandedFolders={expandedFolders}
      />
    </div>
  )
}

