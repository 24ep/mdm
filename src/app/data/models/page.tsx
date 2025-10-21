'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollableList } from '@/components/ui/scrollable-list'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Database, Type, Settings, GitBranch } from 'lucide-react'
import { AttributeDetailDrawer } from '@/components/data-models/AttributeDetailDrawer'

type DataModel = {
  id: string
  name: string
  display_name: string
  slug?: string
  description?: string | null
  created_at: string
  is_active: boolean
  data_model_attributes?: any
}

type Attribute = {
  id: string
  data_model_id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
  order: number
}

export default function DataModelsPage() {
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<DataModel[]>([])
  const [search, setSearch] = useState('')
  const [showModelDialog, setShowModelDialog] = useState(false)
  const [editingModel, setEditingModel] = useState<DataModel | null>(null)
  const [form, setForm] = useState({ name: '', display_name: '', description: '', source_type: 'INTERNAL', slug: '' })
  const [slugEdited, setSlugEdited] = useState(false)
  const [spaces, setSpaces] = useState<any[]>([])
  const [spacesLoading, setSpacesLoading] = useState(false)
  const [spacesError, setSpacesError] = useState<string | null>(null)
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [showAttributeDialog, setShowAttributeDialog] = useState(false)
  const [attributeForm, setAttributeForm] = useState({
    name: '',
    display_name: '',
    data_type: 'text',
    is_required: false,
    is_unique: false,
    default_value: '',
    options: [],
    order_index: 0
  })
  const [showAttributeDrawer, setShowAttributeDrawer] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return models.filter(m => m.name.toLowerCase().includes(q) || m.display_name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q))
  }, [models, search])

  async function loadModels() {
    setLoading(true)
    try {
      const res = await fetch(`/api/data-models`)
      const json = await res.json()
      setModels(json.dataModels || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
    loadSpaces()
  }, [])

  function openCreate() {
    setEditingModel(null)
    setForm({ name: '', display_name: '', description: '', source_type: 'INTERNAL', slug: '' })
    setSlugEdited(false)
    setSelectedSpaceIds([])
    setShowModelDialog(true)
  }

  async function openEdit(model: DataModel) {
    setEditingModel(model)
    setForm({ name: model.name, display_name: model.display_name, description: model.description || '', source_type: (model as any).source_type || 'INTERNAL', slug: (model as any).slug || '' })
    setSlugEdited(true)
    
    // Load attributes for this model BEFORE opening dialog
    await loadAttributes(model.id)

    // Load associated spaces
    try {
      console.log('Loading spaces for model:', model.id)
      const res = await fetch(`/api/data-models/${model.id}/spaces`)
      console.log('Spaces API response:', res.status, res.statusText)
      const json = await res.json()
      console.log('Spaces data:', json)
      const spaceIds = (json.spaces || []).map((s: any) => s.id)
      console.log('Setting selected space IDs:', spaceIds)
      setSelectedSpaceIds(spaceIds)
    } catch (error) {
      console.error('Error loading spaces:', error)
      setSelectedSpaceIds([])
    }
    
    // Open dialog after attributes are loaded
    setShowModelDialog(true)
  }

  async function loadAttributes(modelId: string) {
    setAttributesLoading(true)
    try {
      console.log('Loading attributes for model:', modelId)
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      console.log('Attributes API response status:', res.status)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const json = await res.json()
      console.log('Attributes API response:', json)
      const attributesData = json.attributes || []
      console.log('Setting attributes:', attributesData)
      setAttributes(attributesData)
    } catch (error) {
      console.error('Error loading attributes:', error)
      setAttributes([])
    } finally {
      setAttributesLoading(false)
    }
  }

  async function loadSpaces() {
    setSpacesLoading(true)
    setSpacesError(null)
    try {
      console.log('Loading spaces...')
      const res = await fetch(`/api/spaces?page=1&limit=1000`)
      console.log('Spaces API response:', res.status, res.statusText)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load spaces')
      }
      const json = await res.json()
      console.log('Spaces loaded:', json.spaces)
      setSpaces(json.spaces || [])
    } catch (e: any) {
      console.error('Error loading spaces:', e)
      setSpacesError(e.message || 'Failed to load spaces')
    } finally {
      setSpacesLoading(false)
    }
  }

  async function saveModel() {
    const method = editingModel ? 'PUT' : 'POST'
    const url = editingModel ? `/api/data-models/${editingModel.id}` : '/api/data-models'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingModel ? form : { ...form, space_ids: selectedSpaceIds }),
    })
    if (res.ok) {
      // If editing, update spaces associations separately
      if (editingModel) {
        await fetch(`/api/data-models/${editingModel.id}/spaces`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ space_ids: selectedSpaceIds })
        })
      }
      setShowModelDialog(false)
      await loadModels()
    }
  }

  async function deleteModel(model: DataModel) {
    if (!confirm(`Delete model "${model.display_name}"?`)) return
    const res = await fetch(`/api/data-models/${model.id}`, { method: 'DELETE' })
    if (res.ok) await loadModels()
  }

  function openCreateAttribute() {
    setAttributeForm({
      name: '',
      display_name: '',
      data_type: 'text',
      is_required: false,
      is_unique: false,
      default_value: '',
      options: [],
      order_index: 0
    })
    setShowAttributeDialog(true)
  }

  const openAttributeDrawer = (attribute: Attribute) => {
    console.log('Opening attribute drawer for:', attribute)
    setSelectedAttribute(attribute)
    setShowAttributeDrawer(true)
  }

  const handleAttributeSave = (updatedAttribute: Attribute) => {
    setAttributes(prev => prev.map(attr => 
      attr.id === updatedAttribute.id ? updatedAttribute : attr
    ))
    setShowAttributeDrawer(false)
    setSelectedAttribute(null)
  }

  const handleAttributeDelete = (attributeId: string) => {
    setAttributes(prev => prev.filter(attr => attr.id !== attributeId))
    setShowAttributeDrawer(false)
    setSelectedAttribute(null)
  }

  const handleAttributeReorder = (attributeId: string, newOrder: number) => {
    setAttributes(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const currentIndex = sorted.findIndex(attr => attr.id === attributeId)
      const targetIndex = sorted.findIndex(attr => attr.order === newOrder)
      
      if (currentIndex === -1 || targetIndex === -1) return prev
      
      const newSorted = [...sorted]
      const [movedItem] = newSorted.splice(currentIndex, 1)
      newSorted.splice(targetIndex, 0, movedItem)
      
      return newSorted.map((attr, index) => ({
        ...attr,
        order: index
      }))
    })
  }

  async function saveAttribute() {
    if (!editingModel) return
    
    try {
      const res = await fetch(`/api/data-models/${editingModel.id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributeForm)
      })
      
      if (res.ok) {
        setShowAttributeDialog(false)
        await loadAttributes(editingModel.id)
      } else {
        const error = await res.json()
        console.error('Error creating attribute:', error)
        alert('Failed to create attribute: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating attribute:', error)
      alert('Failed to create attribute')
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* SIMPLE TEST - This should always be visible */}
        <div className="p-4 bg-red-500 text-white text-center font-bold text-xl">
          🚨 PAGE IS WORKING - IF YOU SEE THIS, THE PAGE IS RENDERING 🚨
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Models</h1>
            <p className="text-muted-foreground">Define dynamic models and attributes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default" asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/data/models/erd">
                <GitBranch className="mr-2 h-4 w-4" />
                ERD View
              </a>
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Model
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Models</CardTitle>
            <CardDescription>List of defined data models</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.display_name}</TableCell>
                    <TableCell className="max-w-[360px] truncate">{m.description}</TableCell>
                    <TableCell>
                      <Badge variant={m.is_active ? 'default' : 'secondary'}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{(m as any).data_model_attributes?.[0]?.count ?? 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                        <Edit className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteModel(m)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No models found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{editingModel ? 'Edit Data Model' : 'New Data Model'}</DialogTitle>
              <DialogDescription>
                {editingModel ? 'Edit model details and manage attributes' : 'Define the model metadata'}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="model" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="model" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Model Details
                </TabsTrigger>
                <TabsTrigger value="attributes" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Attributes
                </TabsTrigger>
                <TabsTrigger value="options" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Attribute Options
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="model" className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                      <Input 
                        value={form.name} 
                        onChange={(e) => {
                          const name = e.target.value
                          const toSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
                          setForm({ ...form, name, slug: !slugEdited ? toSlug(name) : form.slug })
                        }} 
                        placeholder="Enter model name"
                      />
                </div>
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                      <Input 
                        value={form.display_name} 
                        onChange={(e) => setForm({ ...form, display_name: e.target.value })} 
                        placeholder="Enter display name"
                      />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    value={form.slug}
                    onChange={(e) => { setForm({ ...form, slug: e.target.value.toLowerCase() }); setSlugEdited(true) }}
                    placeholder="auto-generated-from-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    value={form.slug}
                    onChange={(e) => { setForm({ ...form, slug: e.target.value.toLowerCase() }); setSlugEdited(true) }}
                    placeholder="auto-generated-from-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Associate Spaces</label>
                  {spacesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading spaces...</div>
                  ) : spacesError ? (
                    <div className="text-sm text-red-500">{spacesError}</div>
                  ) : (
                    <MultiSelect
                      options={spaces.map(s => ({ value: s.id, label: s.name }))}
                      selected={selectedSpaceIds}
                      onChange={setSelectedSpaceIds}
                      placeholder="Select spaces..."
                      className="w-full"
                    />
                  )}
                  <div className="text-xs text-muted-foreground mt-1">Select one or more spaces</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                    <Input 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Source Type</label>
                    <Select
                      value={form.source_type}
                      onValueChange={(v) => setForm({ ...form, source_type: v as any })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTERNAL">In-app database</SelectItem>
                        <SelectItem value="EXTERNAL">External datasource</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="attributes" className="space-y-4">
                <div className="space-y-4">
                  {/* ATTRIBUTES TAB TEST */}
                  <div className="p-4 bg-green-500 text-white text-center font-bold">
                    🎯 ATTRIBUTES TAB IS WORKING - IF YOU SEE THIS, THE TAB IS RENDERING 🎯
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Model Attributes</h3>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          console.log('Test button clicked')
                          console.log('Current attributes:', attributes)
                          console.log('Show drawer state:', showAttributeDrawer)
                          console.log('Selected attribute:', selectedAttribute)
                          
                          // Test with a mock attribute
                          const testAttribute = {
                            id: 'test-1',
                            data_model_id: 'test-model',
                            name: 'test_name',
                            display_name: 'Test Attribute',
                            type: 'text',
                            is_required: false,
                            is_unique: false,
                            order: 1
                          }
                          console.log('Testing with mock attribute:', testAttribute)
                          openAttributeDrawer(testAttribute)
                        }}
                      >
                        Test Debug
                      </Button>
                      <Button size="sm" onClick={openCreateAttribute}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Attribute
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Debug Information */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Debug Information</h4>
                      <div className="text-sm text-yellow-700">
                        <div>Attributes Loading: {attributesLoading.toString()}</div>
                        <div>Attributes Count: {attributes.length}</div>
                        <div>Show Drawer: {showAttributeDrawer.toString()}</div>
                        <div>Selected Attribute: {selectedAttribute?.display_name || 'None'}</div>
                      </div>
                    </div>

                    {/* Simple Test Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          console.log('Test button clicked')
                          alert('Test button works!')
                        }}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Test Button
                      </Button>
                      <Button 
                        onClick={() => {
                          const testAttr = {
                            id: 'test-1',
                            data_model_id: 'test',
                            name: 'test',
                            display_name: 'Test Attribute',
                            type: 'text',
                            is_required: false,
                            is_unique: false,
                            order: 1
                          }
                          openAttributeDrawer(testAttr)
                        }}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Test Drawer
                      </Button>
                    </div>

                    {attributesLoading ? (
                      <div className="text-center py-4">Loading attributes...</div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {console.log('Rendering attributes:', attributes)}
                        
                        {/* Test attribute to verify rendering */}
                        <div className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-white shadow-sm border-green-500">
                          <div className="flex-1">
                            <div className="font-medium text-green-700">TEST ATTRIBUTE</div>
                            <div className="text-sm text-muted-foreground">
                              test_name • text • Optional
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('TEST Edit button clicked')
                                alert('Test Edit button works!')
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="text-xs">Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('TEST Delete button clicked')
                                alert('Test Delete button works!')
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="text-xs">Delete</span>
                            </Button>
                          </div>
                        </div>
                      
                      {attributes.length > 0 && attributes.map((attr) => {
                        console.log('Rendering attribute:', attr)
                        return (
                        <div 
                          key={attr.id} 
                          className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-white shadow-sm"
                          onClick={(e) => {
                            console.log('Attribute clicked:', attr.display_name, attr)
                            e.preventDefault()
                            e.stopPropagation()
                            openAttributeDrawer(attr)
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{attr.display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {attr.name} • {attr.type} • {attr.is_required ? 'Required' : 'Optional'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Edit button clicked for:', attr.display_name)
                                openAttributeDrawer(attr)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="text-xs">Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Delete button clicked for:', attr.display_name)
                                handleAttributeDelete(attr.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="text-xs">Delete</span>
                            </Button>
                          </div>
                        </div>
                        )
                      })}
                      
                      {attributes.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No attributes found for this model.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="options" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Attribute Options</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage options for select-type attributes. Select an attribute from the Attributes tab to configure its options.
                  </p>
                  
                  {attributes.filter(attr => attr.type === 'SELECT' || attr.type === 'MULTI_SELECT').length > 0 ? (
                    <div className="space-y-4">
                      {attributes
                        .filter(attr => attr.type === 'SELECT' || attr.type === 'MULTI_SELECT')
                        .map((attr) => (
                          <div key={attr.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{attr.display_name}</h4>
                              <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Type: {attr.type} • Options: {attr.options?.length || 0}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No select-type attributes found. Add SELECT or MULTI_SELECT attributes in the Attributes tab.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModelDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveModel}>
                {editingModel ? 'Update' : 'Create'} Model
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attribute Creation Dialog */}
        <Dialog open={showAttributeDialog} onOpenChange={setShowAttributeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Attribute</DialogTitle>
              <DialogDescription>
                Create a new attribute for {editingModel?.display_name || 'this model'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={attributeForm.name}
                    onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                    placeholder="e.g., customer_name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={attributeForm.display_name}
                    onChange={(e) => setAttributeForm({ ...attributeForm, display_name: e.target.value })}
                    placeholder="e.g., Customer Name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data Type</label>
                  <select
                    value={attributeForm.data_type}
                    onChange={(e) => setAttributeForm({ ...attributeForm, data_type: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="url">URL</option>
                    <option value="select">Select</option>
                    <option value="multi_select">Multi Select</option>
                    <option value="textarea">Textarea</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Default Value</label>
                  <Input
                    value={attributeForm.default_value}
                    onChange={(e) => setAttributeForm({ ...attributeForm, default_value: e.target.value })}
                    placeholder="Optional default value"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={attributeForm.is_required}
                    onChange={(e) => setAttributeForm({ ...attributeForm, is_required: e.target.checked })}
                  />
                  <span className="text-sm">Required</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={attributeForm.is_unique}
                    onChange={(e) => setAttributeForm({ ...attributeForm, is_unique: e.target.checked })}
                  />
                  <span className="text-sm">Unique</span>
                </label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAttributeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveAttribute}>
                  Create Attribute
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AttributeDetailDrawer
          open={showAttributeDrawer}
          onOpenChange={setShowAttributeDrawer}
          attribute={selectedAttribute}
          onSave={handleAttributeSave}
          onDelete={handleAttributeDelete}
          onReorder={handleAttributeReorder}
          allAttributes={attributes}
        />
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs">
            <div>Drawer Open: {showAttributeDrawer.toString()}</div>
            <div>Selected Attribute: {selectedAttribute?.display_name || 'None'}</div>
            <div>Attributes Count: {attributes.length}</div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}


