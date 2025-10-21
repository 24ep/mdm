'use client'

import React, { useState } from 'react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollableList } from '@/components/ui/scrollable-list'
import { 
  Database, 
  Type, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  GripVertical,
  Calendar,
  User,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react'

interface Attribute {
  id: string
  data_model_id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
  order: number
  description?: string
  default_value?: string
  validation_rules?: any
  created_at: string
  updated_at: string
}

interface AttributeDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: Attribute | null
  onSave: (attribute: Attribute) => void
  onDelete: (attributeId: string) => void
  onReorder: (attributeId: string, newOrder: number) => void
  allAttributes: Attribute[]
}

export function AttributeDetailDrawer({
  open,
  onOpenChange,
  attribute,
  onSave,
  onDelete,
  onReorder,
  allAttributes
}: AttributeDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Attribute>>({})

  React.useEffect(() => {
    if (attribute) {
      setEditForm(attribute)
    }
  }, [attribute])

  const handleSave = () => {
    if (attribute && editForm) {
      onSave({ ...attribute, ...editForm })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    if (attribute) {
      setEditForm(attribute)
    }
    setIsEditing(false)
  }

  const moveAttribute = (direction: 'up' | 'down') => {
    if (!attribute) return
    
    const currentIndex = allAttributes.findIndex(attr => attr.id === attribute.id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= allAttributes.length) return

    const newOrder = allAttributes[newIndex].order
    onReorder(attribute.id, newOrder)
  }

  const canMoveUp = attribute && allAttributes.findIndex(attr => attr.id === attribute.id) > 0
  const canMoveDown = attribute && allAttributes.findIndex(attr => attr.id === attribute.id) < allAttributes.length - 1

  // Mock activity data - in real implementation, this would come from API
  const activityData = [
    {
      id: '1',
      action: 'Created',
      user: 'John Doe',
      timestamp: '2024-01-15 10:30:00',
      details: 'Attribute created with type "text"'
    },
    {
      id: '2',
      action: 'Modified',
      user: 'Jane Smith',
      timestamp: '2024-01-16 14:20:00',
      details: 'Changed display name from "Name" to "Full Name"'
    },
    {
      id: '3',
      action: 'Used in Record',
      user: 'System',
      timestamp: '2024-01-17 09:15:00',
      details: 'Attribute used in 5 new records'
    }
  ]

  if (!attribute) {
    console.log('AttributeDetailDrawer: No attribute provided')
    return null
  }
  
  console.log('AttributeDetailDrawer: Rendering with attribute:', attribute)

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
                    <Edit className="h-4 w-4 mr-1" />
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
              <TabsTrigger value="position" className="flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                Position
              </TabsTrigger>
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
                            <SelectItem value="user">User (Single)</SelectItem>
                            <SelectItem value="user_multi">User (Multi-Select)</SelectItem>
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

            <TabsContent value="position" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attribute Position</CardTitle>
                    <CardDescription>
                      Reorder attributes to change their display order in forms and tables
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{attribute.display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Current position: {attribute.order}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveAttribute('up')}
                            disabled={!canMoveUp}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveAttribute('down')}
                            disabled={!canMoveDown}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">All Attributes Order</h4>
                        <ScrollableList maxHeight="MEDIUM">
                          {allAttributes
                            .sort((a, b) => a.order - b.order)
                            .map((attr, index) => (
                              <div
                                key={attr.id}
                                className={`flex items-center gap-3 p-3 border rounded-lg ${
                                  attr.id === attribute.id ? 'bg-primary/10 border-primary' : 'bg-muted/50'
                                }`}
                              >
                                <div className="text-sm text-muted-foreground w-8">
                                  {index + 1}
                                </div>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium">{attr.display_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {attr.name} • {attr.type}
                                  </div>
                                </div>
                                {attr.id === attribute.id && (
                                  <Badge variant="default">Current</Badge>
                                )}
                              </div>
                            ))}
                        </ScrollableList>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

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
                        <ScrollableList maxHeight="MEDIUM">
                          {activityData.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{activity.action}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.user}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activity.details}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {activity.timestamp}
                                </div>
                              </div>
                            </div>
                          ))}
                        </ScrollableList>
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
