'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  GripVertical,
  Search,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { EnhancedAttributeDetailDrawer } from './EnhancedAttributeDetailDrawer'
import { AttributeManagementService, Attribute, AttributeFormData } from '@/lib/attribute-management'
import toast from 'react-hot-toast'

interface DraggableAttributeListProps {
  modelId: string
  onAttributesChange?: (attributes: Attribute[]) => void
}

export function DraggableAttributeList({ modelId, onAttributesChange }: DraggableAttributeListProps) {
  // State management
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])
  const [showAttributeDrawer, setShowAttributeDrawer] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState('')

  // Initialize service
  const attributeService = new AttributeManagementService({
    modelId,
    onSuccess: (message) => toast.success(message),
    onError: (error) => toast.error(error)
  })

  // Load attributes on mount
  useEffect(() => {
    loadAttributes()
  }, [modelId])

  // Notify parent of changes
  useEffect(() => {
    if (onAttributesChange) {
      onAttributesChange(attributes)
    }
  }, [attributes, onAttributesChange])

  const loadAttributes = async () => {
    setLoading(true)
    try {
      const data = await attributeService.loadAttributes()
      setAttributes(data)
    } catch (error) {
      console.error('Failed to load attributes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAttribute = () => {
    setSelectedAttribute(null)
    setShowAttributeDrawer(true)
  }

  const handleEditAttribute = (attribute: Attribute) => {
    setSelectedAttribute(attribute)
    setShowAttributeDrawer(true)
  }

  const handleSaveAttribute = async (attributeData: AttributeFormData) => {
    try {
      if (selectedAttribute) {
        // Update existing attribute
        const updated = await attributeService.updateAttribute(selectedAttribute.id, attributeData)
        if (updated) {
          setAttributes(prev => prev.map(attr => attr.id === selectedAttribute.id ? updated : attr))
        }
      } else {
        // Create new attribute
        const created = await attributeService.createAttribute(attributeData)
        if (created) {
          setAttributes(prev => [...prev, created])
        }
      }
      setShowAttributeDrawer(false)
      setSelectedAttribute(null)
    } catch (error) {
      console.error('Failed to save attribute:', error)
    }
  }

  const handleDeleteAttribute = async (attributeId: string) => {
    try {
      const success = await attributeService.deleteAttribute(attributeId)
      if (success) {
        setAttributes(prev => prev.filter(attr => attr.id !== attributeId))
      }
    } catch (error) {
      console.error('Failed to delete attribute:', error)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(attributes)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update local state immediately for better UX
    const reorderedAttributes = items.map((attr, index) => ({
      ...attr,
      order: index
    }))
    setAttributes(reorderedAttributes)

    // Update on server
    try {
      const attributeOrders = reorderedAttributes.map(attr => ({
        id: attr.id,
        order: attr.order
      }))
      
      const success = await attributeService.reorderAttributes(attributeOrders)
      if (!success) {
        // Revert on failure
        loadAttributes()
      }
    } catch (error) {
      console.error('Failed to reorder attributes:', error)
      // Revert on failure
      loadAttributes()
    }
  }

  const handleDuplicateAttribute = async (attribute: Attribute) => {
    try {
      const duplicated = await attributeService.duplicateAttribute(attribute.id)
      if (duplicated) {
        setAttributes(prev => [...prev, duplicated])
      }
    } catch (error) {
      console.error('Failed to duplicate attribute:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedAttributes.length === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedAttributes.length} attributes?`)) {
      try {
        const success = await attributeService.bulkDeleteAttributes(selectedAttributes)
        if (success) {
          setAttributes(prev => prev.filter(attr => !selectedAttributes.includes(attr.id)))
          setSelectedAttributes([])
          setShowBulkActions(false)
        }
      } catch (error) {
        console.error('Failed to bulk delete attributes:', error)
      }
    }
  }

  const handleExport = async () => {
    try {
      const jsonData = await attributeService.exportAttributes()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attributes-${modelId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export attributes:', error)
    }
  }

  const handleImport = async () => {
    try {
      const success = await attributeService.importAttributes(importData)
      if (success) {
        setShowImportDialog(false)
        setImportData('')
        loadAttributes() // Reload attributes
      }
    } catch (error) {
      console.error('Failed to import attributes:', error)
    }
  }

  const handleSelectAttribute = (attributeId: string, selected: boolean) => {
    if (selected) {
      setSelectedAttributes(prev => [...prev, attributeId])
    } else {
      setSelectedAttributes(prev => prev.filter(id => id !== attributeId))
    }
  }

  const handleSelectAll = () => {
    if (selectedAttributes.length === filteredAttributes.length) {
      setSelectedAttributes([])
    } else {
      setSelectedAttributes(filteredAttributes.map(attr => attr.id))
    }
  }

  // Filter attributes
  const filteredAttributes = attributes.filter(attr => {
    const matchesSearch = !searchTerm || 
      attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || attr.type === typeFilter
    
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Attributes</h3>
          <p className="text-sm text-muted-foreground">
            Manage attributes for this data model. Drag and drop to reorder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button size="sm" onClick={handleCreateAttribute}>
            <Plus className="h-4 w-4 mr-1" />
            Add Attribute
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search attributes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="select">Select</SelectItem>
            <SelectItem value="multiselect">Multi-Select</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedAttributes.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedAttributes.length} selected
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedAttributes([])}>
            <X className="h-4 w-4 mr-1" />
            Clear Selection
          </Button>
        </div>
      )}

      {/* Draggable Attributes List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading attributes...
        </div>
      ) : filteredAttributes.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="attributes">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`h-[500px] overflow-y-auto space-y-2 p-2 border border-gray-200 rounded-lg bg-white ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
              >
                {/* Select All */}
                <div className="flex items-center gap-2 p-2 border rounded-lg">
                  <Checkbox
                    checked={selectedAttributes.length === filteredAttributes.length && filteredAttributes.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select all</span>
                </div>

                {/* Attributes */}
                {filteredAttributes.map((attr, index) => (
                  <Draggable key={attr.id} draggableId={attr.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                          snapshot.isDragging 
                            ? 'bg-blue-100 shadow-lg border-blue-300' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedAttributes.includes(attr.id)}
                          onCheckedChange={(checked) => handleSelectAttribute(attr.id, checked as boolean)}
                        />
                        
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-move p-1 hover:bg-gray-200 rounded"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{attr.display_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {attr.name} • {attr.type}
                            {attr.is_required && ' • Required'}
                            {attr.is_unique && ' • Unique'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{attr.type}</Badge>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAttribute(attr)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('3-dot button clicked')
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 z-50" side="bottom" sideOffset={5}>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDuplicateAttribute(attr)
                                }}
                                className="text-green-700"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Attribute
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAttribute(attr.id)
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Attribute
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-lg font-medium">No attributes found</p>
          <p className="text-sm">Create your first attribute to get started</p>
        </div>
      )}

      {/* Enhanced Attribute Detail Drawer */}
      <EnhancedAttributeDetailDrawer
        open={showAttributeDrawer}
        onOpenChange={setShowAttributeDrawer}
        attribute={selectedAttribute}
        onSave={handleSaveAttribute}
        onDelete={handleDeleteAttribute}
        allAttributes={attributes}
      />

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Attributes</DialogTitle>
            <DialogDescription>
              Paste the JSON data containing attributes to import
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON data here..."
              className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importData.trim()}>
              Import Attributes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
