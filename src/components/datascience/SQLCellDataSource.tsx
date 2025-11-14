'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSpaces } from '@/hooks/useSpaces'
import { useDataModels } from '@/hooks/useDataModels'
import { NotebookCell } from './types'
import { Loader2 } from 'lucide-react'

interface SQLCellDataSourceProps {
  cell: NotebookCell
  onConnectionChange: (cellId: string, value: string) => void
  canEdit?: boolean
}

export function SQLCellDataSource({ cell, onConnectionChange, canEdit = true }: SQLCellDataSourceProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('')
  const [selectedDataModelId, setSelectedDataModelId] = useState<string>('')
  
  const { spaces, loading: spacesLoading } = useSpaces()
  const { dataModels, loading: modelsLoading } = useDataModels(selectedSpaceId)
  
  // Initialize from cell metadata
  useEffect(() => {
    if (cell.metadata?.spaceId) {
      setSelectedSpaceId(cell.metadata.spaceId)
    } else if (spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id)
    }
  }, [spaces, cell.metadata?.spaceId])
  
  // Initialize data model from connection
  useEffect(() => {
    if (cell.sqlConnection && !cell.sqlConnection.match(/^(default|bigquery|postgres|mysql|sqlite)$/)) {
      setSelectedDataModelId(cell.sqlConnection)
    }
  }, [cell.sqlConnection])

  const handleSpaceChange = (spaceId: string) => {
    setSelectedSpaceId(spaceId)
    setSelectedDataModelId('')
    if (onConnectionChange) {
      onConnectionChange(cell.id, spaceId)
    }
  }

  const handleDataModelChange = (dataModelId: string) => {
    setSelectedDataModelId(dataModelId)
    if (onConnectionChange) {
      onConnectionChange(cell.id, dataModelId)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Space Selection */}
      <Select
        value={selectedSpaceId}
        onValueChange={handleSpaceChange}
      >
        <SelectTrigger className="h-7 w-40 text-xs" disabled={!canEdit || spacesLoading}>
          <SelectValue placeholder={spacesLoading ? "Loading..." : "Select space"} />
        </SelectTrigger>
        <SelectContent>
          {spaces.map((space) => (
            <SelectItem key={space.id} value={space.id}>
              {space.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Data Model Selection */}
      {selectedSpaceId && (
        <Select
          value={selectedDataModelId}
          onValueChange={handleDataModelChange}
        >
          <SelectTrigger className="h-7 w-48 text-xs" disabled={!canEdit || modelsLoading}>
            <SelectValue placeholder={modelsLoading ? "Loading..." : "Select data model"} />
          </SelectTrigger>
          <SelectContent>
            {modelsLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : dataModels.length === 0 ? (
              <div className="p-2 text-xs text-gray-500">No data models</div>
            ) : (
              dataModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

