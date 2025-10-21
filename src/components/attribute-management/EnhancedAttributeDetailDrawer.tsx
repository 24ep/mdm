'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  Database, 
  Type, 
  Activity, 
  Settings,
  GripVertical,
  Plus,
  Trash2,
  Save,
  X,
  Palette
} from 'lucide-react'
import { Attribute, AttributeFormData } from '@/lib/attribute-management'
import toast from 'react-hot-toast'

interface AttributeOption {
  value: string
  label: string
  color: string
  order: number
}

interface EnhancedAttributeDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: Attribute | null
  onSave: (attribute: Attribute) => void
  onDelete: (attributeId: string) => void
  allAttributes: Attribute[]
}

export function EnhancedAttributeDetailDrawer({
  open,
  onOpenChange,
  attribute,
  onSave,
  onDelete,
  allAttributes
}: EnhancedAttributeDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Attribute>>({})
  const [options, setOptions] = useState<AttributeOption[]>([])
  const [newOption, setNewOption] = useState({ value: '', label: '', color: '#3B82F6' })

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ]

  useEffect(() => {
    if (attribute) {
      setEditForm(attribute)
      setOptions(attribute.options || [])
    }
  }, [attribute])

  const isSelectType = attribute?.type === 'select' || attribute?.type === 'multiselect'

  const handleSave = () => {
    if (attribute && editForm) {
      const updatedAttribute = {
        ...attribute,
        ...editForm,
        options: options.length > 0 ? options : undefined
      }
      onSave(updatedAttribute)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    if (attribute) {
      setEditForm(attribute)
      setOptions(attribute.options || [])
    }
    setIsEditing(false)
  }

  const handleAddOption = () => {
    if (!newOption.value.trim() || !newOption.label.trim()) {
      toast.error('Please fill in both value and label')
      return
    }

    // Validate option value (no special characters)
    if (!/^[a-zA-Z0-9_]+$/.test(newOption.value)) {
      toast.error('Option value can only contain letters, numbers, and underscores')
      return
    }

    const option: AttributeOption = {
      ...newOption,
      order: options.length
    }
    
    setOptions(prev => [...prev, option])
    setNewOption({ value: '', label: '', color: '#3B82F6' })
  }

  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }

  const handleOptionDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(options)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order indices
    const reorderedOptions = items.map((item, index) => ({
      ...item,
      order: index
    }))
    
    setOptions(reorderedOptions)
  }

  const handleOptionChange = (index: number, field: keyof AttributeOption, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  if (!attribute) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-screen w-[600px] flex flex-col">
        <DrawerHeader className="border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              <DrawerTitle className="text-xl">
                {attribute.display_name}
              </DrawerTitle>
              <Badge variant="outline">{attribute.type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(attribute.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              <DrawerClose asChild>
                <Button variant="outline" size="sm">
                  Close
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Details
              </TabsTrigger>
              {isSelectType && (
                <TabsTrigger value="options" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Options
                </TabsTrigger>
              )}
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Configure the basic properties of this attribute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="attribute_name"
                          />
                        ) : (
                          <div className="p-2 bg-muted rounded-md font-mono text-sm">
                            {attribute.name}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        {isEditing ? (
                          <Input
                            id="display_name"
                            value={editForm.display_name || ''}
                            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                            placeholder="Display Name"
                          />
                        ) : (
                          <div className="p-2 bg-muted rounded-md">
                            {attribute.display_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      {isEditing ? (
                        <Select
                          value={editForm.type || ''}
                          onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="datetime">DateTime</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="multiselect">Multi-Select</SelectItem>
                            <SelectItem value="attachment">Attachment</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-muted rounded-md">
                          <Badge variant="secondary">{attribute.type}</Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      {isEditing ? (
                        <Textarea
                          id="description"
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Describe this attribute..."
                          rows={3}
                        />
                      ) : (
                        <div className="p-2 bg-muted rounded-md min-h-[60px]">
                          {attribute.description || 'No description provided'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Validation Rules</CardTitle>
                    <CardDescription>
                      Configure validation and constraints for this attribute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Required</Label>
                        <p className="text-sm text-muted-foreground">
                          This attribute must have a value
                        </p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={editForm.is_required || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_required: checked })}
                        />
                      ) : (
                        <Badge variant={attribute.is_required ? 'default' : 'secondary'}>
                          {attribute.is_required ? 'Required' : 'Optional'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Unique</Label>
                        <p className="text-sm text-muted-foreground">
                          Values must be unique across all records
                        </p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={editForm.is_unique || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_unique: checked })}
                        />
                      ) : (
                        <Badge variant={attribute.is_unique ? 'default' : 'secondary'}>
                          {attribute.is_unique ? 'Unique' : 'Not Unique'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Primary Key</Label>
                        <p className="text-sm text-muted-foreground">
                          This attribute serves as the primary identifier
                        </p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={editForm.is_primary_key || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_primary_key: checked })}
                        />
                      ) : (
                        <Badge variant={attribute.is_primary_key ? 'default' : 'secondary'}>
                          {attribute.is_primary_key ? 'Primary Key' : 'Not Primary Key'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Foreign Key</Label>
                        <p className="text-sm text-muted-foreground">
                          This attribute references another table
                        </p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={editForm.is_foreign_key || false}
                          onCheckedChange={(checked) => setEditForm({ ...editForm, is_foreign_key: checked })}
                        />
                      ) : (
                        <Badge variant={attribute.is_foreign_key ? 'default' : 'secondary'}>
                          {attribute.is_foreign_key ? 'Foreign Key' : 'Not Foreign Key'}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default_value">Default Value</Label>
                      {isEditing ? (
                        <Input
                          id="default_value"
                          value={editForm.default_value || ''}
                          onChange={(e) => setEditForm({ ...editForm, default_value: e.target.value })}
                          placeholder="Default value (optional)"
                        />
                      ) : (
                        <div className="p-2 bg-muted rounded-md">
                          {attribute.default_value || 'No default value'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {isSelectType && (
              <TabsContent value="options" className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Attribute Options
                      </CardTitle>
                      <CardDescription>
                        Manage the available options for this {attribute.type} field. Drag and drop to reorder.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Add New Option */}
                      <div className="p-4 border rounded-lg bg-muted/20">
                        <h4 className="font-medium mb-3">Add New Option</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <Label htmlFor="option-value">Value *</Label>
                            <Input
                              id="option-value"
                              value={newOption.value}
                              onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                              placeholder="option_value"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Only letters, numbers, and underscores allowed
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="option-label">Label *</Label>
                            <Input
                              id="option-label"
                              value={newOption.label}
                              onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                              placeholder="Option Label"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <Label>Color</Label>
                            <div className="flex gap-1 mt-1">
                              {colorOptions.map(color => (
                                <button
                                  key={color}
                                  className={`w-6 h-6 rounded-full border-2 ${
                                    newOption.color === color ? 'border-gray-800' : 'border-gray-300'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setNewOption({ ...newOption, color })}
                                />
                              ))}
                            </div>
                          </div>
                          <Button onClick={handleAddOption} disabled={!newOption.value.trim() || !newOption.label.trim()}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Option
                          </Button>
                        </div>
                      </div>

                      {/* Options List */}
                      {options.length > 0 ? (
                        <DragDropContext onDragEnd={handleOptionDragEnd}>
                          <Droppable droppableId="options">
                            {(provided, snapshot) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                              >
                                {options.map((option, index) => (
                                  <Draggable key={`${option.value}-${index}`} draggableId={`${option.value}-${index}`} index={index}>
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
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-move p-1 hover:bg-gray-200 rounded"
                                        >
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>

                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                          <div>
                                            <Label>Value</Label>
                                            <Input
                                              value={option.value}
                                              onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                                              placeholder="option_value"
                                            />
                                          </div>
                                          <div>
                                            <Label>Label</Label>
                                            <Input
                                              value={option.label}
                                              onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                                              placeholder="Option Label"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <div className="flex gap-1">
                                            {colorOptions.map(color => (
                                              <button
                                                key={color}
                                                className={`w-6 h-6 rounded-full border-2 ${
                                                  option.color === color ? 'border-gray-800' : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleOptionChange(index, 'color', color)}
                                              />
                                            ))}
                                          </div>
                                          
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveOption(index)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
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
                          <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-medium">No options yet</p>
                          <p className="text-sm">Add options for this {attribute.type} field</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            <TabsContent value="activity" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attribute Activity</CardTitle>
                    <CardDescription>
                      Track changes and usage of this attribute
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold">12</div>
                          <div className="text-sm text-muted-foreground">Total Records</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">8</div>
                          <div className="text-sm text-muted-foreground">Recent Changes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">95%</div>
                          <div className="text-sm text-muted-foreground">Completion Rate</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Recent Activity</h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Created</span>
                                <Badge variant="outline" className="text-xs">
                                  John Doe
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Attribute created with type "{attribute.type}"
                              </p>
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                2024-01-15 10:30:00
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
