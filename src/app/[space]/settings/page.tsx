"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Layout, Database, History, Users as UsersIcon, UserCog, UserPlus, Plus, Edit, Trash2, Search, Type, AlertTriangle, FolderPlus, Share2, Folder, FolderOpen, Move } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSpace } from '@/contexts/space-context'
import { SpaceStudioLauncher } from '@/components/space-studio-launcher'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { ColorPicker } from '@/components/ui/color-swatch'
import { AttributeDetailDrawer } from '@/components/data-models/AttributeDetailDrawer'
import { AttributeManagementPanel } from '@/components/attribute-management/AttributeManagementPanel'
import { DraggableAttributeList } from '@/components/attribute-management/DraggableAttributeList'
import { EnhancedAttributeDetailDrawer } from '@/components/attribute-management/EnhancedAttributeDetailDrawer'

export default function SpaceSettingsPage() {
  const params = useParams() as { space: string }
  const searchParams = useSearchParams()
  const allowedTabs = new Set(['details','members','studio','data-model','attachments','restore','danger'])
  const initialTabRaw = (searchParams.get('tab') as string) || 'details'
  const initialTab = allowedTabs.has(initialTabRaw) ? initialTabRaw : 'details'
  const { spaces, currentSpace, refreshSpaces } = useSpace()

  const selectedSpace = useMemo(() => {
    return (
      spaces.find((s: any) => s.id === params.space || s.slug === params.space) || currentSpace || null
    ) as any
  }, [spaces, currentSpace, params.space])

  const [tab, setTab] = useState<string>(initialTab)
  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const [inviteForm, setInviteForm] = useState<{ user_id: string; role: 'member' | 'admin' | 'owner' }>({ user_id: '', role: 'member' })
  const [members, setMembers] = useState<any[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const canManageMembers = selectedSpace?.user_role === 'owner' || selectedSpace?.user_role === 'admin'

  // Embedded Data Models (space-scoped)
  const [models, setModels] = useState<any[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [showModelDrawer, setShowModelDrawer] = useState(false)
  const [editingModel, setEditingModel] = useState<any | null>(null)
  const [modelForm, setModelForm] = useState({ name: '', display_name: '', description: '', slug: '' })
  const [activeModelTab, setActiveModelTab] = useState<'details' | 'attributes' | 'activity'>('details')
  const [attributes, setAttributes] = useState<any[]>([])
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [showAttributeDrawer, setShowAttributeDrawer] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<any | null>(null)
  
  // For data model entities reference
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [referenceModelAttributes, setReferenceModelAttributes] = useState<any[]>([])
  const [loadingReferenceAttributes, setLoadingReferenceAttributes] = useState(false)
  
  // Folder management
  const [folders, setFolders] = useState<any[]>([])
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showShareModelDialog, setShowShareModelDialog] = useState(false)
  const [selectedModelForSharing, setSelectedModelForSharing] = useState<any | null>(null)
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([])
  const [folderForm, setFolderForm] = useState({ name: '', parent_id: '' })
  const [shareForm, setShareForm] = useState({ space_ids: [] as string[] })
  const [spaceDetails, setSpaceDetails] = useState<any | null>(null)
  const [savingLoginImage, setSavingLoginImage] = useState(false)

  // Extra model config
  const [modelIcon, setModelIcon] = useState<string>('')
  const [modelPrimaryColor, setModelPrimaryColor] = useState<string>('#1e40af')
  const [modelTags, setModelTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState<string>('')
  const [modelGroupFolder, setModelGroupFolder] = useState<string>('')
  const [modelOwnerName, setModelOwnerName] = useState<string>('')

  // Attachment storage configuration
  const [attachmentStorage, setAttachmentStorage] = useState({
    provider: 'minio',
    config: {
      // MinIO configuration
      minio: {
        endpoint: '',
        access_key: '',
        secret_key: '',
        bucket: '',
        region: 'us-east-1',
        use_ssl: true
      },
      // AWS S3 configuration
      s3: {
        access_key_id: '',
        secret_access_key: '',
        bucket: '',
        region: 'us-east-1'
      },
      // SFTP configuration
      sftp: {
        host: '',
        port: 22,
        username: '',
        password: '',
        path: '/uploads'
      },
      // FTP configuration
      ftp: {
        host: '',
        port: 21,
        username: '',
        password: '',
        path: '/uploads',
        passive: true
      }
    }
  })
  const [storageTestResult, setStorageTestResult] = useState<any>(null)
  const [testingStorage, setTestingStorage] = useState(false)

  // Attribute creation state
  const [showCreateAttributeDrawer, setShowCreateAttributeDrawer] = useState(false)
  const [createAttributeForm, setCreateAttributeForm] = useState({
    name: '',
    display_name: '',
    type: 'text',
    default_value: '',
    is_required: false,
    is_unique: false,
    options: [] as string[],
    // For data model entities type
    reference_model_id: '',
    reference_attribute_code: '',
    reference_attribute_label: '',
    // For currency type
    currency_code: 'USD',
    decimal_places: '2',
    // For rating type
    rating_scale: '5',
    rating_display: 'stars',
    // For address type
    default_country: '',
    address_format: 'standard',
    require_country: false,
    enable_geocoding: false,
    // For duration type
    duration_format: 'hh:mm:ss',
    max_duration: '',
    // For tags type
    allow_custom_tags: true,
    require_tags: false,
    max_tags: ''
  })

  useEffect(() => {
    const loadSpaceDetails = async () => {
      if (!selectedSpace?.id) return
      try {
        const res = await fetch(`/api/spaces/${selectedSpace.id}`)
        const json = await res.json().catch(() => ({}))
        setSpaceDetails(json.space || null)
      } catch {
        setSpaceDetails(null)
      }
    }
    loadSpaceDetails()
  }, [selectedSpace?.id])



  useEffect(() => {
    if (tab === 'members' && selectedSpace?.id) {
      loadMembers(selectedSpace.id)
    }
    if (tab === 'data-model' && selectedSpace?.id) {
      loadModels()
      loadFolders()
    }
    if (tab === 'attachments' && selectedSpace?.id) {
      loadAttachmentStorageConfig()
    }
  }, [tab, selectedSpace?.id])

  useEffect(() => {
    if (activeModelTab === 'attributes' && editingModel?.id) {
      loadAttributes(editingModel.id)
    }
  }, [activeModelTab, editingModel?.id])

  const loadMembers = async (spaceId: string) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}`)
      if (!res.ok) throw new Error('Failed to load members')
      const json = await res.json()
      setMembers(json.members || [])
      const usersRes = await fetch('/api/users?page=1&limit=200')
      if (usersRes.ok) {
        const usersJson = await usersRes.json()
        const memberIds = new Set((json.members || []).map((m: any) => m.user_id))
        setAvailableUsers((usersJson.users || []).filter((u: any) => !memberIds.has(u.id) && u.is_active))
      }
    } catch (e) {
      toast.error('Failed to load members')
    }
  }

  const loadModels = async () => {
    if (!selectedSpace?.id) return
    setModelsLoading(true)
    try {
      const res = await fetch(`/api/data-models?page=1&limit=200&space_id=${selectedSpace.id}`)
      const json = await res.json().catch(() => ({}))
      setModels(json.dataModels || [])
    } catch (e) {
      toast.error('Failed to load data models')
    } finally {
      setModelsLoading(false)
    }
  }

  const loadFolders = async () => {
    if (!selectedSpace?.id) return
    try {
      const res = await fetch(`/api/folders?space_id=${selectedSpace.id}&type=data_model`)
      if (res.status === 503) {
        // Folders feature not available yet
        setFolders([])
        return
      }
      const json = await res.json().catch(() => ({}))
      setFolders(json.folders || [])
    } catch (e) {
      setFolders([])
    }
  }

  const loadAvailableSpaces = async () => {
    try {
      const res = await fetch('/api/spaces?page=1&limit=200')
      const json = await res.json().catch(() => ({}))
      setAvailableSpaces((json.spaces || []).filter((s: any) => s.id !== selectedSpace?.id))
    } catch (e) {
      setAvailableSpaces([])
    }
  }

  const openCreateModel = () => {
    setEditingModel(null)
    setModelForm({ name: '', display_name: '', description: '', slug: '' })
    setModelIcon('')
    setModelPrimaryColor('#1e40af')
    setModelTags([])
    setModelGroupFolder('')
    setModelOwnerName('')
    setShowModelDrawer(true)
  }

  const openEditModel = (model: any) => {
    setEditingModel(model)
    setModelForm({ 
      name: model.name || '', 
      display_name: model.display_name || '', 
      description: model.description || '', 
      slug: model.slug || '' 
    })
    setModelIcon(model.icon || '')
    setModelPrimaryColor(model.primary_color || '#1e40af')
    setModelTags(model.tags || [])
    setModelGroupFolder(model.group_folder || '')
    setModelOwnerName(model.owner_name || '')
    setShowModelDrawer(true)
  }


  const saveModel = async () => {
    try {
      const body = { 
        ...modelForm,
        icon: modelIcon,
        space_ids: [selectedSpace!.id],
        primary_color: modelPrimaryColor,
        tags: modelTags,
        group_folder: modelGroupFolder,
        owner_name: modelOwnerName
      }
      
      const url = editingModel ? `/api/data-models/${editingModel.id}` : '/api/data-models'
      const method = editingModel ? 'PUT' : 'POST'
      
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      })
      if (!res.ok) throw new Error(editingModel ? 'Failed to update model' : 'Failed to create model')
      setShowModelDrawer(false)
      await loadModels()
      toast.success(editingModel ? 'Model updated' : 'Model created')
    } catch (e) {
      toast.error(editingModel ? 'Failed to update model' : 'Failed to create model')
    }
  }

  const deleteModel = async (m: any) => {
    if (!confirm(`Delete model "${m.display_name || m.name}"?`)) return
    try {
      const res = await fetch(`/api/data-models/${m.id}`, { method: 'DELETE' })
      if (res.ok) { await loadModels(); toast.success('Model deleted') } else { throw new Error() }
    } catch {
      toast.error('Failed to delete model')
    }
  }

  const loadAttributes = async (modelId: string) => {
    setAttributesLoading(true)
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      const json = await res.json().catch(() => ({}))
      setAttributes(json.attributes || [])
    } catch {
      setAttributes([])
    } finally {
      setAttributesLoading(false)
    }
  }

  const loadAvailableModels = async () => {
    if (!selectedSpace?.id) return
    try {
      const res = await fetch(`/api/data-models?page=1&limit=200&space_id=${selectedSpace.id}`)
      const json = await res.json().catch(() => ({}))
      setAvailableModels(json.dataModels || [])
    } catch (e) {
      setAvailableModels([])
    }
  }

  const loadReferenceModelAttributes = async (modelId: string) => {
    if (!modelId) {
      setReferenceModelAttributes([])
      return
    }
    
    setLoadingReferenceAttributes(true)
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      const json = await res.json().catch(() => ({}))
      setReferenceModelAttributes(json.attributes || [])
    } catch (e) {
      setReferenceModelAttributes([])
    } finally {
      setLoadingReferenceAttributes(false)
    }
  }

  const openCreateAttribute = () => {
    setCreateAttributeForm({
      name: '',
      display_name: '',
      type: 'text',
      default_value: '',
      is_required: false,
      is_unique: false,
      options: [],
      reference_model_id: '',
      reference_attribute_code: '',
      reference_attribute_label: '',
      currency_code: 'USD',
      decimal_places: '2',
      rating_scale: '5',
      rating_display: 'stars',
      default_country: '',
      address_format: 'standard',
      require_country: false,
      enable_geocoding: false,
      duration_format: 'hh:mm:ss',
      max_duration: '',
      allow_custom_tags: true,
      require_tags: false,
      max_tags: ''
    })
    setShowCreateAttributeDrawer(true)
    loadAvailableModels()
  }

  const openAttributeDrawer = (attribute: any) => {
    console.log('Opening attribute drawer for:', attribute)
    setSelectedAttribute(attribute)
    setShowAttributeDrawer(true)
  }

  const handleAttributeSave = (updatedAttribute: any) => {
    console.log('Saving attribute:', updatedAttribute)
    setAttributes(prev => prev.map(attr => 
      attr.id === updatedAttribute.id ? updatedAttribute : attr
    ))
    setShowAttributeDrawer(false)
    setSelectedAttribute(null)
    toast.success('Attribute updated successfully')
  }

  const handleAttributeDelete = (attributeId: string) => {
    console.log('Deleting attribute:', attributeId)
    setAttributes(prev => prev.filter(attr => attr.id !== attributeId))
    setShowAttributeDrawer(false)
    setSelectedAttribute(null)
    toast.success('Attribute deleted successfully')
  }

  const handleAttributeReorder = (attributeId: string, newOrder: number) => {
    console.log('Reordering attribute:', attributeId, 'to order:', newOrder)
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
    toast.success('Attribute order updated')
  }

  const createAttribute = async () => {
    if (!editingModel?.id) return
    
    try {
      const res = await fetch(`/api/data-models/${editingModel.id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createAttributeForm)
      })
      
      if (!res.ok) throw new Error('Failed to create attribute')
      
      setShowCreateAttributeDrawer(false)
      await loadAttributes(editingModel.id)
      toast.success('Attribute created')
    } catch (e) {
      toast.error('Failed to create attribute')
    }
  }

  const createFolder = async () => {
    if (!folderForm.name.trim()) return
    
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderForm.name,
          type: 'data_model',
          space_id: selectedSpace?.id,
          parent_id: folderForm.parent_id || null
        })
      })
      
      if (res.status === 503) {
        toast.error('Folders feature not yet available. Please run database migrations.')
        return
      }
      
      if (!res.ok) throw new Error('Failed to create folder')
      
      setShowCreateFolderDialog(false)
      setFolderForm({ name: '', parent_id: '' })
      await loadFolders()
      toast.success('Folder created')
    } catch (e) {
      toast.error('Failed to create folder')
    }
  }

  const loadAttachmentStorageConfig = async () => {
    if (!selectedSpace?.id) return
    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/attachment-storage`)
      const json = await res.json().catch(() => ({}))
      if (json.storage) {
        setAttachmentStorage(json.storage)
      }
    } catch (e) {
      console.error('Failed to load attachment storage config:', e)
    }
  }

  const saveAttachmentStorageConfig = async () => {
    if (!selectedSpace?.id) return
    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/attachment-storage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachmentStorage)
      })
      
      if (!res.ok) throw new Error('Failed to save storage configuration')
      
      toast.success('Attachment storage configuration saved')
    } catch (e) {
      toast.error('Failed to save storage configuration')
    }
  }

  const testStorageConnection = async () => {
    if (!selectedSpace?.id) return
    setTestingStorage(true)
    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/attachment-storage/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachmentStorage)
      })
      
      const json = await res.json()
      setStorageTestResult(json)
      
      if (json.success) {
        toast.success('Storage connection test successful')
      } else {
        toast.error('Storage connection test failed')
      }
    } catch (e) {
      setStorageTestResult({ success: false, error: 'Test failed' })
      toast.error('Storage connection test failed')
    } finally {
      setTestingStorage(false)
    }
  }

  const openShareModel = (model: any) => {
    setSelectedModelForSharing(model)
    setShareForm({ space_ids: model.shared_spaces || [] })
    setShowShareModelDialog(true)
    loadAvailableSpaces()
  }

  const shareModel = async () => {
    if (!selectedModelForSharing?.id) return
    
    try {
      const res = await fetch(`/api/data-models/${selectedModelForSharing.id}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ space_ids: shareForm.space_ids })
      })
      
      if (!res.ok) throw new Error('Failed to share model')
      
      setShowShareModelDialog(false)
      await loadModels()
      toast.success('Model sharing updated')
    } catch (e) {
      toast.error('Failed to share model')
    }
  }

  const moveModelToFolder = async (modelId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/data-models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
      })
      
      if (!res.ok) throw new Error('Failed to move model')
      
      await loadModels()
      toast.success('Model moved')
    } catch (e) {
      toast.error('Failed to move model')
    }
  }







  if (!selectedSpace) {
    return (
      <MainLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Space Settings</CardTitle>
              <CardDescription>Space not found.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Tabs value={tab} onValueChange={setTab} orientation="vertical" className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-64 bg-card border-r flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">Space Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure this space</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <TabsList className="w-full flex-col h-auto bg-transparent">
              <TabsTrigger className="justify-start w-full" value="details">Space detail</TabsTrigger>
              <TabsTrigger className="justify-start w-full" value="members">Space member</TabsTrigger>
              <TabsTrigger className="justify-start w-full" value="studio">Space Studio</TabsTrigger>
              <TabsTrigger className="justify-start w-full" value="data-model">Data Model</TabsTrigger>
              <TabsTrigger className="justify-start w-full" value="attachments">Attachments</TabsTrigger>
              <TabsTrigger className="justify-start w-full" value="restore">Restore</TabsTrigger>
              <TabsTrigger className="justify-start w-full text-red-600 hover:text-red-700" value="danger">Danger Zone</TabsTrigger>
            </TabsList>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-6">
              <TabsContent value="details" className="space-y-6 w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Space detail</span>
                    </CardTitle>
                    <CardDescription>Update the space name, description, and slug</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="space-name">Name</Label>
                      <Input id="space-name" defaultValue={selectedSpace.name} onBlur={async (e) => {
                        const name = e.currentTarget.value.trim()
                        if (!name || name === selectedSpace.name) return
                        const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name })
                        })
                        if (res.ok) { toast.success('Space name updated'); await refreshSpaces() } else { toast.error('Failed to update name') }
                      }} />
                    </div>
                    <div>
                      <Label htmlFor="space-desc">Description</Label>
                      <Textarea id="space-desc" defaultValue={selectedSpace.description || ''} rows={3} onBlur={async (e) => {
                        const description = e.currentTarget.value
                        if (description === (selectedSpace.description || '')) return
                        const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ description })
                        })
                        if (res.ok) { toast.success('Description updated'); await refreshSpaces() } else { toast.error('Failed to update description') }
                      }} />
                    </div>
                    <div>
                      <Label htmlFor="space-slug">Custom URL (slug)</Label>
                      <Input id="space-slug" defaultValue={selectedSpace.slug || ''} onBlur={async (e) => {
                        const slug = e.currentTarget.value.trim()
                        if (slug === (selectedSpace.slug || '')) return
                        const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ slug })
                        })
                        if (res.ok) { toast.success('Slug updated'); await refreshSpaces() } else { toast.error('Failed to update slug') }
                      }} />
                      <p className="text-xs text-muted-foreground mt-1">URL will be /{selectedSpace.slug || selectedSpace.id}/dashboard</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Layout className="h-5 w-5" />
                      <span>Login page</span>
                    </CardTitle>
                    <CardDescription>Set a custom image for this space's login screen</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="login-image-url">Login image URL</Label>
                      <Input
                        id="login-image-url"
                        defaultValue={(() => {
                          const features = spaceDetails?.features || null
                          try { return typeof features === 'string' ? JSON.parse(features)?.login_image_url || '' : (features?.login_image_url || '') } catch { return '' }
                        })()}
                        placeholder="https://.../image.jpg"
                        onBlur={async (e) => {
                          const url = e.currentTarget.value.trim()
                          setSavingLoginImage(true)
                          try {
                            // Merge into existing features JSON
                            let features: any = {}
                            if (spaceDetails?.features) {
                              if (typeof spaceDetails.features === 'string') {
                                try { features = JSON.parse(spaceDetails.features) || {} } catch { features = {} }
                              } else {
                                features = spaceDetails.features || {}
                              }
                            }
                            features.login_image_url = url || null
                            const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ features })
                            })
                            if (res.ok) {
                              toast.success('Login image saved')
                              const j = await res.json().catch(()=>({}))
                              setSpaceDetails(j.space || { ...spaceDetails, features })
                            } else {
                              toast.error('Failed to save login image')
                            }
                          } finally {
                            setSavingLoginImage(false)
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Shown on the left side of the space-specific login page.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="space-y-6 w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UsersIcon className="h-5 w-5" />
                      <span>Space member</span>
                    </CardTitle>
                    <CardDescription>Manage members and roles for this space</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label htmlFor="invite-user">Invite user</Label>
                        <Select value={inviteForm.user_id} onValueChange={(v) => setInviteForm({ ...inviteForm, user_id: v })}>
                          <SelectTrigger id="invite-user"><SelectValue placeholder="Select user" /></SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((u: any) => (
                              <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={inviteForm.role} onValueChange={(v: any) => setInviteForm({ ...inviteForm, role: v })}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {selectedSpace.user_role === 'owner' && <SelectItem value="owner">Owner</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button disabled={!canManageMembers || !inviteForm.user_id} onClick={async () => {
                        const res = await fetch(`/api/spaces/${selectedSpace.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inviteForm) })
                        if (res.ok) { toast.success('User invited'); await loadMembers(selectedSpace.id) } else { toast.error('Failed to invite') }
                      }}>
                        <UserPlus className="h-4 w-4 mr-2" /> Invite
                      </Button>
                    </div>

                    <div className="border rounded-md">
                      <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs text-muted-foreground border-b">
                        <div>User</div><div>Email</div><div>System role</div><div>Space role</div><div>Actions</div>
                      </div>
                      {members.map((m: any) => (
                        <div key={m.id || m.user_id} className="grid grid-cols-5 gap-2 px-3 py-2 items-center border-b last:border-b-0">
                          <div className="font-medium">{m.user_name || 'Unknown'}</div>
                          <div>{m.user_email || 'N/A'}</div>
                          <div><Badge variant="outline">{m.user_system_role || 'N/A'}</Badge></div>
                          <div>
                            {canManageMembers && m.role !== 'owner' ? (
                              <Select value={m.role} onValueChange={async (role) => {
                                const r = await fetch(`/api/spaces/${selectedSpace.id}/members/${m.user_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
                                if (r.ok) { toast.success('Role updated'); await loadMembers(selectedSpace.id) } else { toast.error('Failed to update') }
                              }}>
                                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  {selectedSpace.user_role === 'owner' && <SelectItem value="owner">Owner</SelectItem>}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline">{m.role}</Badge>
                            )}
                          </div>
                          <div>
                            {canManageMembers && m.role !== 'owner' && (
                              <Button variant="outline" size="sm" className="text-red-600" onClick={async () => {
                                if (!confirm('Remove this member?')) return
                                const r = await fetch(`/api/spaces/${selectedSpace.id}/members/${m.user_id}`, { method: 'DELETE' })
                                if (r.ok) { toast.success('Member removed'); await loadMembers(selectedSpace.id) } else { toast.error('Failed to remove') }
                              }}>Remove</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="studio" className="space-y-6 w-full">
                <SpaceStudioLauncher />
              </TabsContent>

              <TabsContent value="data-model" className="space-y-6 w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <span>Data Model</span>
                    </CardTitle>
                    <CardDescription>Manage data models in this space</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search models..."
                          value={modelSearch}
                          onChange={(e) => setModelSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setShowCreateFolderDialog(true)}>
                          <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                        </Button>
                      <Button onClick={openCreateModel}>
                        <Plus className="mr-2 h-4 w-4" /> New Model
                      </Button>
                    </div>
                    </div>
                    <div className="border rounded-md">
                      {modelsLoading ? (
                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                      ) : (
                        <div className="divide-y">
                          {/* Root level models (no folder) */}
                          {(() => {
                            const filteredModels = models.filter((m) => {
                          const q = modelSearch.toLowerCase()
                          return !q || (m.name||'').toLowerCase().includes(q) || (m.display_name||'').toLowerCase().includes(q) || (m.description||'').toLowerCase().includes(q)
                            })
                            
                            const rootModels = filteredModels.filter(m => !m.folder_id)
                            const folderModels = filteredModels.filter(m => m.folder_id)
                            
                            return (
                              <>
                                {/* Root level models */}
                                {rootModels.map((m: any) => (
                          <div key={m.id} className="p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex items-center gap-3">
                                      <Database className="h-4 w-4 text-muted-foreground" />
                                      <div>
                              <div className="font-medium truncate">{m.display_name || m.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{m.description || '—'}</div>
                                        {m.shared_spaces && m.shared_spaces.length > 0 && (
                                          <div className="text-xs text-blue-600 mt-1">
                                            Shared with {m.shared_spaces.length} space(s)
                                          </div>
                                        )}
                                      </div>
                            </div>
                            <div className="flex items-center gap-2">
                                      <Button size="sm" variant="outline" onClick={() => openShareModel(m)}>
                                        <Share2 className="h-4 w-4" />
                                      </Button>
                                      <Select onValueChange={(folderId) => moveModelToFolder(m.id, folderId === 'root' ? null : folderId)}>
                                        <SelectTrigger className="w-32">
                                          <Move className="h-4 w-4" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="root">Root</SelectItem>
                                          {folders.map((folder: any) => (
                                            <SelectItem key={folder.id} value={folder.id}>
                                              {folder.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button size="sm" variant="outline" onClick={()=>openEditModel(m)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                              <Button size="sm" variant="destructive" onClick={()=>deleteModel(m)}>
                                        <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                                ))}
                                
                                {/* Folder-organized models */}
                                {folders.map((folder: any) => {
                                  const folderModelsList = folderModels.filter(m => m.folder_id === folder.id)
                                  if (folderModelsList.length === 0) return null
                                  
                                  return (
                                    <div key={folder.id} className="border-l-2 border-blue-200">
                                      <div className="p-3 bg-blue-50 flex items-center gap-2">
                                        <FolderOpen className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">{folder.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {folderModelsList.length} model(s)
                                        </Badge>
                                      </div>
                                      {folderModelsList.map((m: any) => (
                                        <div key={m.id} className="p-3 pl-8 flex items-center justify-between gap-3">
                                          <div className="min-w-0 flex items-center gap-3">
                                            <Database className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                              <div className="font-medium truncate">{m.display_name || m.name}</div>
                                              <div className="text-xs text-muted-foreground truncate">{m.description || '—'}</div>
                                              {m.shared_spaces && m.shared_spaces.length > 0 && (
                                                <div className="text-xs text-blue-600 mt-1">
                                                  Shared with {m.shared_spaces.length} space(s)
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => openShareModel(m)}>
                                              <Share2 className="h-4 w-4" />
                                            </Button>
                                            <Select onValueChange={(folderId) => moveModelToFolder(m.id, folderId === 'root' ? null : folderId)}>
                                              <SelectTrigger className="w-32">
                                                <Move className="h-4 w-4" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="root">Root</SelectItem>
                                                {folders.map((f: any) => (
                                                  <SelectItem key={f.id} value={f.id}>
                                                    {f.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <Button size="sm" variant="outline" onClick={()=>openEditModel(m)}>
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={()=>deleteModel(m)}>
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                })}
                              </>
                            )
                          })()}
                        </div>
                      )}
                      {!modelsLoading && models.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">No models yet</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Drawer open={showModelDrawer} onOpenChange={setShowModelDrawer}>
                  <DrawerContent widthClassName="w-[720px]">
                    <DrawerHeader>
                      <DrawerTitle>{editingModel ? 'Edit Data Model' : 'New Data Model'}</DrawerTitle>
                      <DrawerDescription>{editingModel ? 'Update details' : 'Create a model for this space'}</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6 space-y-4">
                      <div className="border-b">
                        <div className="flex space-x-8">
                          <button
                            onClick={() => setActiveModelTab('details')}
                            className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                              activeModelTab === 'details'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Database className="h-4 w-4" />
                            Details
                          </button>
                          <button
                            onClick={() => setActiveModelTab('attributes')}
                            className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                              activeModelTab === 'attributes'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Type className="h-4 w-4" />
                            Attributes
                          </button>
                          <button
                            onClick={() => setActiveModelTab('activity')}
                            className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                              activeModelTab === 'activity'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <History className="h-4 w-4" />
                            Activity
                          </button>
                        </div>
                      </div>

                      {activeModelTab==='details' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Name</Label>
                              <Input value={modelForm.name} onChange={(e)=> setModelForm({ ...modelForm, name: e.target.value })} placeholder="e.g. customer" />
                            </div>
                            <div>
                              <Label>Display Name</Label>
                              <Input value={modelForm.display_name} onChange={(e)=> setModelForm({ ...modelForm, display_name: e.target.value })} placeholder="e.g. Customer" />
                            </div>
                          </div>
                          <div>
                            <Label>Slug</Label>
                            <Input value={modelForm.slug} onChange={(e)=> setModelForm({ ...modelForm, slug: e.target.value.toLowerCase() })} placeholder="auto-generated-from-name" />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea value={modelForm.description} onChange={(e)=> setModelForm({ ...modelForm, description: e.target.value })} placeholder="Optional description" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Icon</Label>
                              <div className="mt-1">
                                <IconPickerPopover value={modelIcon} onChange={setModelIcon} />
                              </div>
                            </div>
                            <div>
                              <Label>Primary Color</Label>
                              <ColorPicker value={modelPrimaryColor} onChange={setModelPrimaryColor} />
                            </div>
                          </div>
                          <div>
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {modelTags.map((t)=> (
                                <span key={t} className="px-2 py-0.5 text-xs rounded-full border flex items-center gap-1">
                                  {t}
                                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setModelTags(modelTags.filter(x=>x!==t))}>×</button>
                                </span>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Input value={newTag} onChange={(e)=>setNewTag(e.target.value)} placeholder="Add tag" />
                              <Button variant="outline" onClick={()=>{ const v = newTag.trim(); if (v && !modelTags.includes(v)) { setModelTags([...modelTags, v]); setNewTag('') } }}>Add</Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Group Folder</Label>
                              <Input value={modelGroupFolder} onChange={(e)=> setModelGroupFolder(e.target.value)} placeholder="e.g. CRM/Customers" />
                            </div>
                            <div>
                              <Label>Owner</Label>
                              <Input value={modelOwnerName} onChange={(e)=> setModelOwnerName(e.target.value)} placeholder="Owner name or email" />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeModelTab === 'attributes' && (
                        <DraggableAttributeList
                          modelId={editingModel?.id || ''}
                          onAttributesChange={(newAttributes) => {
                            setAttributes(newAttributes)
                          }}
                        />
                      )}

                      {activeModelTab === 'activity' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Activity</h3>
                          <div className="text-center py-8 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-lg font-medium">No activity yet</p>
                            <p className="text-sm">Activity will appear here as you make changes</p>
                          </div>
                        </div>
                      )}

                    </div>
                    <div className="flex justify-end gap-2 px-6 py-4 border-t">
                      <Button variant="outline" onClick={()=>setShowModelDrawer(false)}>Close</Button>
                      {activeModelTab === 'details' && (
                        <Button onClick={saveModel}>
                          {editingModel ? 'Update Model' : 'Create Model'}
                          </Button>
                      )}
                    </div>
                  </DrawerContent>
                </Drawer>

                {/* Create Attribute Drawer */}
                <Drawer open={showCreateAttributeDrawer} onOpenChange={setShowCreateAttributeDrawer}>
                  <DrawerContent widthClassName="w-[600px]">
                    <DrawerHeader>
                      <DrawerTitle>Create New Attribute</DrawerTitle>
                      <DrawerDescription>Add a new attribute to this data model</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name *</Label>
                            <Input 
                              value={createAttributeForm.name} 
                              onChange={(e) => setCreateAttributeForm({ ...createAttributeForm, name: e.target.value })} 
                              placeholder="e.g. customer_name" 
                            />
                          </div>
                          <div>
                            <Label>Display Name *</Label>
                            <Input 
                              value={createAttributeForm.display_name} 
                              onChange={(e) => setCreateAttributeForm({ ...createAttributeForm, display_name: e.target.value })} 
                              placeholder="e.g. Customer Name" 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Data Type *</Label>
                            <select 
                              value={createAttributeForm.type} 
                            onChange={(e) => {
                              const newType = e.target.value
                              setCreateAttributeForm({ 
                                ...createAttributeForm, 
                                type: newType,
                                // Reset reference fields when changing type
                                reference_model_id: newType === 'data_model_entities' ? createAttributeForm.reference_model_id : '',
                                reference_attribute_code: newType === 'data_model_entities' ? createAttributeForm.reference_attribute_code : '',
                                reference_attribute_label: newType === 'data_model_entities' ? createAttributeForm.reference_attribute_label : ''
                              })
                            }} 
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean</option>
                              <option value="date">Date</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="url">URL</option>
                            <option value="rich_text">Rich Text</option>
                            <option value="currency">Currency</option>
                            <option value="phone_number">Phone Number</option>
                            <option value="address">Address</option>
                            <option value="rating">Rating</option>
                            <option value="color">Color</option>
                            <option value="duration">Duration</option>
                            <option value="geolocation">Geolocation</option>
                            <option value="tags">Tags</option>
                            <option value="reference">Reference</option>
                              <option value="select">Select</option>
                              <option value="multi_select">Multi Select</option>
                              <option value="textarea">Textarea</option>
                              <option value="json">JSON</option>
                            <option value="attachment">Attachment</option>
                            <option value="data_model_entities">Data Model Entities</option>
                            </select>
                          </div>
                          <div>
                            <Label>Default Value</Label>
                            <Input 
                              value={createAttributeForm.default_value} 
                              onChange={(e) => setCreateAttributeForm({ ...createAttributeForm, default_value: e.target.value })} 
                              placeholder="Optional" 
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <label className="inline-flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={createAttributeForm.is_required} 
                              onChange={(e) => setCreateAttributeForm({ ...createAttributeForm, is_required: e.target.checked })} 
                            />
                            <span className="text-sm">Required</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={createAttributeForm.is_unique} 
                              onChange={(e) => setCreateAttributeForm({ ...createAttributeForm, is_unique: e.target.checked })} 
                            />
                            <span className="text-sm">Unique</span>
                          </label>
                        </div>
                        
                        {(createAttributeForm.type === 'select' || createAttributeForm.type === 'multi_select') && (
                          <div className="space-y-3">
                            <Label>Options</Label>
                            <div className="text-sm text-muted-foreground">Add selectable options for this attribute.</div>
                            {createAttributeForm.options.map((opt: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input 
                                  value={typeof opt === 'string' ? opt : (opt?.label ?? '')} 
                                  onChange={(e) => {
                                    const next = [...createAttributeForm.options]
                                    next[idx] = e.target.value
                                    setCreateAttributeForm({ ...createAttributeForm, options: next })
                                  }} 
                                  placeholder={`Option ${idx + 1}`} 
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    const next = [...createAttributeForm.options]
                                    next.splice(idx, 1)
                                    setCreateAttributeForm({ ...createAttributeForm, options: next })
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setCreateAttributeForm({ 
                                  ...createAttributeForm, 
                                  options: [...createAttributeForm.options, ''] 
                                })
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Option
                            </Button>
                          </div>
                        )}

                      {createAttributeForm.type === 'data_model_entities' && (
                        <div className="space-y-4">
                          <Label>Data Model Reference</Label>
                          <div className="text-sm text-muted-foreground mb-3">
                            Select a data model to reference its records as dropdown options.
                      </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label>Reference Data Model *</Label>
                              <select 
                                value={createAttributeForm.reference_model_id} 
                                onChange={(e) => {
                                  const modelId = e.target.value
                                  setCreateAttributeForm({ 
                                    ...createAttributeForm, 
                                    reference_model_id: modelId,
                                    reference_attribute_code: '',
                                    reference_attribute_label: ''
                                  })
                                  loadReferenceModelAttributes(modelId)
                                }} 
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="">Select a data model</option>
                                {availableModels.filter(m => m.id !== editingModel?.id).map((model: any) => (
                                  <option key={model.id} value={model.id}>
                                    {model.display_name || model.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {createAttributeForm.reference_model_id && (
                              <>
                                <div>
                                  <Label>Attribute Code *</Label>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    The attribute that will store the record ID
                                  </div>
                                  <select 
                                    value={createAttributeForm.reference_attribute_code} 
                                    onChange={(e) => setCreateAttributeForm({ 
                                      ...createAttributeForm, 
                                      reference_attribute_code: e.target.value 
                                    })} 
                                    className="w-full p-2 border rounded-md"
                                    disabled={loadingReferenceAttributes}
                                  >
                                    <option value="">Select attribute code</option>
                                    {referenceModelAttributes.map((attr: any) => (
                                      <option key={attr.id} value={attr.name}>
                                        {attr.display_name || attr.name} ({attr.type})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div>
                                  <Label>Attribute Label *</Label>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    The attribute that will be displayed in the dropdown
                                  </div>
                                  <select 
                                    value={createAttributeForm.reference_attribute_label} 
                                    onChange={(e) => setCreateAttributeForm({ 
                                      ...createAttributeForm, 
                                      reference_attribute_label: e.target.value 
                                    })} 
                                    className="w-full p-2 border rounded-md"
                                    disabled={loadingReferenceAttributes}
                                  >
                                    <option value="">Select attribute label</option>
                                    {referenceModelAttributes.map((attr: any) => (
                                      <option key={attr.id} value={attr.name}>
                                        {attr.display_name || attr.name} ({attr.type})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {createAttributeForm.type === 'currency' && (
                        <div className="space-y-4">
                          <Label>Currency Configuration</Label>
                          <div className="text-sm text-muted-foreground mb-3">
                            Configure currency settings for this attribute.
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Currency Code</Label>
                              <select 
                                value={createAttributeForm.currency_code || 'USD'}
                                onChange={(e) => setCreateAttributeForm({ 
                                  ...createAttributeForm, 
                                  currency_code: e.target.value 
                                })}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="JPY">JPY - Japanese Yen</option>
                                <option value="CAD">CAD - Canadian Dollar</option>
                                <option value="AUD">AUD - Australian Dollar</option>
                                <option value="CHF">CHF - Swiss Franc</option>
                                <option value="CNY">CNY - Chinese Yuan</option>
                                <option value="INR">INR - Indian Rupee</option>
                                <option value="BRL">BRL - Brazilian Real</option>
                              </select>
                            </div>
                            <div>
                              <Label>Decimal Places</Label>
                              <Input 
                                type="number"
                                placeholder="2"
                                value={createAttributeForm.decimal_places || '2'}
                                onChange={(e) => setCreateAttributeForm({ 
                                  ...createAttributeForm, 
                                  decimal_places: e.target.value 
                                })}
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                Number of decimal places (0-4)
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {createAttributeForm.type === 'rating' && (
                        <div className="space-y-4">
                          <Label>Rating Configuration</Label>
                          <div className="text-sm text-muted-foreground mb-3">
                            Configure rating scale and display options.
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Rating Scale</Label>
                              <select 
                                value={createAttributeForm.rating_scale || '5'}
                                onChange={(e) => setCreateAttributeForm({ 
                                  ...createAttributeForm, 
                                  rating_scale: e.target.value 
                                })}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="3">3 Stars</option>
                                <option value="5">5 Stars</option>
                                <option value="10">10 Points</option>
                                <option value="100">100 Points</option>
                              </select>
                            </div>
                            <div>
                              <Label>Display Type</Label>
                              <select 
                                value={createAttributeForm.rating_display || 'stars'}
                                onChange={(e) => setCreateAttributeForm({ 
                                  ...createAttributeForm, 
                                  rating_display: e.target.value 
                                })}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="stars">Stars</option>
                                <option value="numbers">Numbers</option>
                                <option value="percentage">Percentage</option>
                                <option value="thumbs">Thumbs Up/Down</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {createAttributeForm.type === 'address' && (
                        <div className="space-y-4">
                          <Label>Address Configuration</Label>
                          <div className="text-sm text-muted-foreground mb-3">
                            Configure address fields and formatting.
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Country</Label>
                                <select 
                                  value={createAttributeForm.default_country || ''}
                                  onChange={(e) => setCreateAttributeForm({ 
                                    ...createAttributeForm, 
                                    default_country: e.target.value 
                                  })}
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="">No default</option>
                                  <option value="US">United States</option>
                                  <option value="CA">Canada</option>
                                  <option value="GB">United Kingdom</option>
                                  <option value="AU">Australia</option>
                                  <option value="DE">Germany</option>
                                  <option value="FR">France</option>
                                  <option value="JP">Japan</option>
                                  <option value="IN">India</option>
                                  <option value="BR">Brazil</option>
                                </select>
                              </div>
                              <div>
                                <Label>Address Format</Label>
                                <select 
                                  value={createAttributeForm.address_format || 'standard'}
                                  onChange={(e) => setCreateAttributeForm({ 
                                    ...createAttributeForm, 
                                    address_format: e.target.value 
                                  })}
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="standard">Standard (Street, City, State, ZIP)</option>
                                  <option value="international">International (Street, City, Province, Postal Code)</option>
                                  <option value="simple">Simple (Address, City, Country)</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <label className="inline-flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={createAttributeForm.require_country || false}
                                  onChange={(e) => setCreateAttributeForm({ 
                                    ...createAttributeForm, 
                                    require_country: e.target.checked 
                                  })} 
                                />
                                <span className="text-sm">Require Country</span>
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={createAttributeForm.enable_geocoding || false}
                                  onChange={(e) => setCreateAttributeForm({ 
                                    ...createAttributeForm, 
                                    enable_geocoding: e.target.checked 
                                  })} 
                                />
                                <span className="text-sm">Enable Geocoding</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {createAttributeForm.type === 'duration' && (
                        <div className="space-y-4">
                          <Label>Duration Configuration</Label>
                          <div className="text-sm text-muted-foreground mb-3">
                            Configure duration format and display options.
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Duration Format</Label>
                              <select 
                                value={createAttributeForm.duration_format || 'hh:mm:ss'}
                                onChange={(e) => setCreateAttributeForm({ 
                                  ...createAttributeForm, 
                                  duration_format: e.target.value 
                                })}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="mm:ss">Minutes:Seconds</option>
                                <option value="hh:mm">Hours:Minutes</option>
                                <option value="hh:mm:ss">Hours:Minutes:Seconds</option>
                                <option value="days">Days</option>
                                <option value="hours">Hours</option>
                                <option value="minutes">Minutes</option>
                                <option value="seconds">Seconds</option>
                              </select>
                            </div>
                            <div>
                              <Label>Max Duration (hours)</Label>
                              <Input 
                                type="number"
                                placeholder="24"
                                value={createAttributeForm.max_duration || ''}
                                onChange={(e) => setCreateAttributeForm({ 
                                  ...createAttributeForm, 
                                  max_duration: e.target.value 
                                })}
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                Maximum duration in hours (optional)
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {createAttributeForm.type === 'tags' && (
                        <div className="space-y-4">
                          <Label>Tags Configuration</Label>
                          <div className="text-sm text-muted-foreground mb-3">
                            Configure tag behavior and options.
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-6">
                              <label className="inline-flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={createAttributeForm.allow_custom_tags || true}
                                  onChange={(e) => setCreateAttributeForm({ 
                                    ...createAttributeForm, 
                                    allow_custom_tags: e.target.checked 
                                  })} 
                                />
                                <span className="text-sm">Allow Custom Tags</span>
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={createAttributeForm.require_tags || false}
                                  onChange={(e) => setCreateAttributeForm({ 
                                    ...createAttributeForm, 
                                    require_tags: e.target.checked 
                                  })} 
                                />
                                <span className="text-sm">Require at least one tag</span>
                              </label>
                            </div>
                            
                            <div>
                              <Label>Max Tags</Label>
                              <Input 
                                type="number"
                                placeholder="10"
                                value={createAttributeForm.max_tags || ''}
                                onChange={(e) => setCreateAttributeForm({ 
                                  ...createAttributeForm, 
                                  max_tags: e.target.value 
                                })}
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                Maximum number of tags allowed (optional)
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 px-6 py-4 border-t">
                      <Button variant="outline" onClick={() => setShowCreateAttributeDrawer(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={createAttribute}
                        disabled={
                          !createAttributeForm.name || 
                          !createAttributeForm.display_name ||
                          (createAttributeForm.type === 'data_model_entities' && (
                            !createAttributeForm.reference_model_id ||
                            !createAttributeForm.reference_attribute_code ||
                            !createAttributeForm.reference_attribute_label
                          ))
                        }
                      >
                        Create Attribute
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>

                {/* Create Folder Dialog */}
                <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Folder</DialogTitle>
                      <DialogDescription>Create a folder to organize your data models</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="folder-name">Folder Name</Label>
                        <Input
                          id="folder-name"
                          value={folderForm.name}
                          onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                          placeholder="e.g. CRM Models"
                        />
                      </div>
                      <div>
                        <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
                        <select
                          id="parent-folder"
                          value={folderForm.parent_id}
                          onChange={(e) => setFolderForm({ ...folderForm, parent_id: e.target.value })}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">No parent (root level)</option>
                          {folders.map((folder: any) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createFolder} disabled={!folderForm.name.trim()}>
                        Create Folder
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Share Model Dialog */}
                <Dialog open={showShareModelDialog} onOpenChange={setShowShareModelDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Data Model</DialogTitle>
                      <DialogDescription>
                        Share "{selectedModelForSharing?.display_name || selectedModelForSharing?.name}" with other spaces
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Select Spaces to Share With</Label>
                        <div className="text-sm text-muted-foreground mb-2">
                          Choose which spaces can access this data model
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                          {availableSpaces.map((space: any) => (
                            <label key={space.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={shareForm.space_ids.includes(space.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setShareForm({ space_ids: [...shareForm.space_ids, space.id] })
                                  } else {
                                    setShareForm({ space_ids: shareForm.space_ids.filter(id => id !== space.id) })
                                  }
                                }}
                              />
                              <div>
                                <div className="font-medium">{space.name}</div>
                                <div className="text-xs text-muted-foreground">{space.description || 'No description'}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowShareModelDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={shareModel}>
                        Update Sharing
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              </TabsContent>

              <TabsContent value="restore" className="space-y-6 w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="h-5 w-5" />
                      <span>Restore</span>
                    </CardTitle>
                    <CardDescription>Import, export, or restore space data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Button onClick={async()=>{
                        try {
                          const res = await fetch(`/api/spaces/${selectedSpace.id}/export`)
                          if (!res.ok) throw new Error('Export failed')
                          const blob = await res.blob()
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${selectedSpace.slug || selectedSpace.id}-export.json`
                          a.click()
                          URL.revokeObjectURL(url)
                        } catch (e) {
                          toast.error('Failed to export')
                        }
                      }}>Export Space Data</Button>
                      <label className="inline-flex items-center gap-2">
                        <Input type="file" accept="application/json" onChange={async(e:any)=>{
                          const file = e.target?.files?.[0]
                          if (!file) return
                          const fd = new FormData()
                          fd.append('file', file)
                          try {
                            const res = await fetch(`/api/spaces/${selectedSpace.id}/import`, { method: 'POST', body: fd })
                            if (res.ok) { toast.success('Import started') } else { throw new Error('Import failed') }
                          } catch (err) { toast.error('Failed to import') }
                        }} />
                        <span className="text-sm">Import from JSON</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-6 w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <span>Attachment Storage Configuration</span>
                    </CardTitle>
                    <CardDescription>
                      Configure how attachment attributes store files in this space. All attachment attributes will use the selected storage provider.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Storage Provider</Label>
                        <select 
                          value={attachmentStorage.provider}
                          onChange={(e) => setAttachmentStorage({ 
                            ...attachmentStorage, 
                            provider: e.target.value 
                          })}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="minio">MinIO (Default)</option>
                          <option value="s3">AWS S3</option>
                          <option value="sftp">SFTP</option>
                          <option value="ftp">FTP</option>
                        </select>
                        <div className="text-xs text-muted-foreground mt-1">
                          Choose the storage provider for all attachment attributes in this space
                        </div>
                      </div>

                      {/* MinIO Configuration */}
                      {attachmentStorage.provider === 'minio' && (
                        <div className="space-y-4 border rounded-lg p-4">
                          <h4 className="font-medium">MinIO Configuration</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Endpoint</Label>
                              <Input 
                                value={attachmentStorage.config.minio.endpoint}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    minio: {
                                      ...attachmentStorage.config.minio,
                                      endpoint: e.target.value
                                    }
                                  }
                                })}
                                placeholder="http://localhost:9000"
                              />
                            </div>
                            <div>
                              <Label>Access Key</Label>
                              <Input 
                                type="password"
                                value={attachmentStorage.config.minio.access_key}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    minio: {
                                      ...attachmentStorage.config.minio,
                                      access_key: e.target.value
                                    }
                                  }
                                })}
                                placeholder="minioadmin"
                              />
                            </div>
                            <div>
                              <Label>Secret Key</Label>
                              <Input 
                                type="password"
                                value={attachmentStorage.config.minio.secret_key}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    minio: {
                                      ...attachmentStorage.config.minio,
                                      secret_key: e.target.value
                                    }
                                  }
                                })}
                                placeholder="minioadmin"
                              />
                            </div>
                            <div>
                              <Label>Bucket Name</Label>
                              <Input 
                                value={attachmentStorage.config.minio.bucket}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    minio: {
                                      ...attachmentStorage.config.minio,
                                      bucket: e.target.value
                                    }
                                  }
                                })}
                                placeholder="attachments"
                              />
                            </div>
                            <div>
                              <Label>Region</Label>
                              <Input 
                                value={attachmentStorage.config.minio.region}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    minio: {
                                      ...attachmentStorage.config.minio,
                                      region: e.target.value
                                    }
                                  }
                                })}
                                placeholder="us-east-1"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                checked={attachmentStorage.config.minio.use_ssl}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    minio: {
                                      ...attachmentStorage.config.minio,
                                      use_ssl: e.target.checked
                                    }
                                  }
                                })}
                              />
                              <Label>Use SSL</Label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AWS S3 Configuration */}
                      {attachmentStorage.provider === 's3' && (
                        <div className="space-y-4 border rounded-lg p-4">
                          <h4 className="font-medium">AWS S3 Configuration</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Access Key ID</Label>
                              <Input 
                                value={attachmentStorage.config.s3.access_key_id}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    s3: {
                                      ...attachmentStorage.config.s3,
                                      access_key_id: e.target.value
                                    }
                                  }
                                })}
                                placeholder="AKIAIOSFODNN7EXAMPLE"
                              />
                            </div>
                            <div>
                              <Label>Secret Access Key</Label>
                              <Input 
                                type="password"
                                value={attachmentStorage.config.s3.secret_access_key}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    s3: {
                                      ...attachmentStorage.config.s3,
                                      secret_access_key: e.target.value
                                    }
                                  }
                                })}
                                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                              />
                            </div>
                            <div>
                              <Label>Bucket Name</Label>
                              <Input 
                                value={attachmentStorage.config.s3.bucket}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    s3: {
                                      ...attachmentStorage.config.s3,
                                      bucket: e.target.value
                                    }
                                  }
                                })}
                                placeholder="my-attachments-bucket"
                              />
                            </div>
                            <div>
                              <Label>Region</Label>
                              <Input 
                                value={attachmentStorage.config.s3.region}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    s3: {
                                      ...attachmentStorage.config.s3,
                                      region: e.target.value
                                    }
                                  }
                                })}
                                placeholder="us-east-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SFTP Configuration */}
                      {attachmentStorage.provider === 'sftp' && (
                        <div className="space-y-4 border rounded-lg p-4">
                          <h4 className="font-medium">SFTP Configuration</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Host</Label>
                              <Input 
                                value={attachmentStorage.config.sftp.host}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    sftp: {
                                      ...attachmentStorage.config.sftp,
                                      host: e.target.value
                                    }
                                  }
                                })}
                                placeholder="sftp.example.com"
                              />
                            </div>
                            <div>
                              <Label>Port</Label>
                              <Input 
                                type="number"
                                value={attachmentStorage.config.sftp.port}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    sftp: {
                                      ...attachmentStorage.config.sftp,
                                      port: parseInt(e.target.value) || 22
                                    }
                                  }
                                })}
                                placeholder="22"
                              />
                            </div>
                            <div>
                              <Label>Username</Label>
                              <Input 
                                value={attachmentStorage.config.sftp.username}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    sftp: {
                                      ...attachmentStorage.config.sftp,
                                      username: e.target.value
                                    }
                                  }
                                })}
                                placeholder="username"
                              />
                            </div>
                            <div>
                              <Label>Password</Label>
                              <Input 
                                type="password"
                                value={attachmentStorage.config.sftp.password}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    sftp: {
                                      ...attachmentStorage.config.sftp,
                                      password: e.target.value
                                    }
                                  }
                                })}
                                placeholder="password"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label>Upload Path</Label>
                              <Input 
                                value={attachmentStorage.config.sftp.path}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    sftp: {
                                      ...attachmentStorage.config.sftp,
                                      path: e.target.value
                                    }
                                  }
                                })}
                                placeholder="/uploads"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FTP Configuration */}
                      {attachmentStorage.provider === 'ftp' && (
                        <div className="space-y-4 border rounded-lg p-4">
                          <h4 className="font-medium">FTP Configuration</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Host</Label>
                              <Input 
                                value={attachmentStorage.config.ftp.host}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    ftp: {
                                      ...attachmentStorage.config.ftp,
                                      host: e.target.value
                                    }
                                  }
                                })}
                                placeholder="ftp.example.com"
                              />
                            </div>
                            <div>
                              <Label>Port</Label>
                              <Input 
                                type="number"
                                value={attachmentStorage.config.ftp.port}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    ftp: {
                                      ...attachmentStorage.config.ftp,
                                      port: parseInt(e.target.value) || 21
                                    }
                                  }
                                })}
                                placeholder="21"
                              />
                            </div>
                            <div>
                              <Label>Username</Label>
                              <Input 
                                value={attachmentStorage.config.ftp.username}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    ftp: {
                                      ...attachmentStorage.config.ftp,
                                      username: e.target.value
                                    }
                                  }
                                })}
                                placeholder="username"
                              />
                            </div>
                            <div>
                              <Label>Password</Label>
                              <Input 
                                type="password"
                                value={attachmentStorage.config.ftp.password}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    ftp: {
                                      ...attachmentStorage.config.ftp,
                                      password: e.target.value
                                    }
                                  }
                                })}
                                placeholder="password"
                              />
                            </div>
                            <div>
                              <Label>Upload Path</Label>
                              <Input 
                                value={attachmentStorage.config.ftp.path}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    ftp: {
                                      ...attachmentStorage.config.ftp,
                                      path: e.target.value
                                    }
                                  }
                                })}
                                placeholder="/uploads"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                checked={attachmentStorage.config.ftp.passive}
                                onChange={(e) => setAttachmentStorage({
                                  ...attachmentStorage,
                                  config: {
                                    ...attachmentStorage.config,
                                    ftp: {
                                      ...attachmentStorage.config.ftp,
                                      passive: e.target.checked
                                    }
                                  }
                                })}
                              />
                              <Label>Passive Mode</Label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Test Connection */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Button 
                            onClick={testStorageConnection}
                            disabled={testingStorage}
                            variant="outline"
                          >
                            {testingStorage ? 'Testing...' : 'Test Connection'}
                          </Button>
                          <Button onClick={saveAttachmentStorageConfig}>
                            Save Configuration
                          </Button>
                        </div>

                        {storageTestResult && (
                          <div className={`p-4 rounded-lg ${
                            storageTestResult.success 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}>
                            <div className={`font-medium ${
                              storageTestResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {storageTestResult.success ? 'Connection Successful' : 'Connection Failed'}
                            </div>
                            {storageTestResult.message && (
                              <div className={`text-sm mt-1 ${
                                storageTestResult.success ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {storageTestResult.message}
                              </div>
                            )}
                            {storageTestResult.error && (
                              <div className="text-sm mt-1 text-red-700">
                                Error: {storageTestResult.error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="danger" className="space-y-6 w-full">
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Danger Zone</span>
                    </CardTitle>
                    <CardDescription>
                      Irreversible and destructive actions. Please proceed with caution.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-900">Delete Space</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Permanently delete this space and all its data. This action cannot be undone.
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              className="ml-4"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Space
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="text-red-600">Delete Space</DialogTitle>
                              <DialogDescription>
                                Are you absolutely sure you want to delete "{selectedSpace?.name}"? This will permanently delete:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>All data models and their data</li>
                                  <li>All dashboards and visualizations</li>
                                  <li>All space members and permissions</li>
                                  <li>All workflows and automation</li>
                                  <li>All imported/exported data</li>
                                </ul>
                                <strong className="text-red-600 mt-3 block">
                                  This action cannot be undone.
                                </strong>
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {}}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/spaces/${selectedSpace.id}`, {
                                      method: 'DELETE',
                                    })

                                    if (!response.ok) {
                                      const error = await response.json()
                                      throw new Error(error.error || 'Failed to delete space')
                                    }

                                    toast.success('Space deleted successfully')
                                    await refreshSpaces()
                                    
                                    // Redirect to spaces page or another space
                                    const remainingSpaces = spaces.filter(s => s.id !== selectedSpace.id)
                                    if (remainingSpaces.length > 0) {
                                      const defaultSpace = remainingSpaces.find(s => s.is_default) || remainingSpaces[0]
                                      window.location.href = `/${defaultSpace.slug || defaultSpace.id}/settings`
                                    } else {
                                      sessionStorage.setItem('navigate-to-spaces', 'true')
                                      window.location.href = '/spaces'
                                    }
                                  } catch (error) {
                                    console.error('Error deleting space:', error)
                                    toast.error(error instanceof Error ? error.message : 'Failed to delete space')
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Space
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Attribute Detail Drawer */}
      <AttributeDetailDrawer
        open={showAttributeDrawer}
        onOpenChange={setShowAttributeDrawer}
        attribute={selectedAttribute}
        onSave={handleAttributeSave}
        onDelete={handleAttributeDelete}
        onReorder={handleAttributeReorder}
        allAttributes={attributes}
      />
    </MainLayout>
  )
}



