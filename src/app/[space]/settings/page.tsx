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
import { Building2, Layout, Database, History, Users as UsersIcon, UserCog, UserPlus, Plus, Edit, Trash2, Search, Type } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSpace } from '@/contexts/space-context'
import { SpaceStudioLauncher } from '@/components/space-studio-launcher'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { ColorPicker } from '@/components/ui/color-swatch'

export default function SpaceSettingsPage() {
  const params = useParams() as { space: string }
  const searchParams = useSearchParams()
  const allowedTabs = new Set(['details','members','studio','data-model','restore'])
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
  const [attrForm, setAttrForm] = useState({ name: '', display_name: '', data_type: 'text', is_required: false, is_unique: false, default_value: '' })
  const [spaceDetails, setSpaceDetails] = useState<any | null>(null)
  const [savingLoginImage, setSavingLoginImage] = useState(false)

  // Extra model config
  const [modelIcon, setModelIcon] = useState<string>('')
  const [modelPrimaryColor, setModelPrimaryColor] = useState<string>('#1e40af')
  const [modelTags, setModelTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState<string>('')
  const [modelGroupFolder, setModelGroupFolder] = useState<string>('')
  const [modelOwnerName, setModelOwnerName] = useState<string>('')

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

  // Attribute Drawer state
  const [showAttributeDrawer, setShowAttributeDrawer] = useState(false)
  const [activeAttributeTab, setActiveAttributeTab] = useState<'config' | 'options' | 'activity'>('config')
  const [selectedAttribute, setSelectedAttribute] = useState<any | null>(null)
  const [attributeEditForm, setAttributeEditForm] = useState<any>({
    name: '',
    display_name: '',
    type: 'text',
    is_required: false,
    is_unique: false,
    default_value: '',
    options: [] as any[]
  })

  // Activity logs
  const [modelActivity, setModelActivity] = useState<any[]>([])
  const [modelActivityLoading, setModelActivityLoading] = useState(false)
  const [attrActivity, setAttrActivity] = useState<any[]>([])
  const [attrActivityLoading, setAttrActivityLoading] = useState(false)

  useEffect(() => {
    if (tab === 'members' && selectedSpace?.id) {
      loadMembers(selectedSpace.id)
    }
    if (tab === 'data-model' && selectedSpace?.id) {
      loadModels()
    }
  }, [tab, selectedSpace?.id])

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

  const openCreateModel = () => {
    setEditingModel(null)
    setModelForm({ name: '', display_name: '', description: '', slug: '' })
    setShowModelDrawer(true)
  }

  const openEditModel = (m: any) => {
    setEditingModel(m)
    setModelForm({ name: m.name || '', display_name: m.display_name || '', description: m.description || '', slug: (m.slug || '') })
    setActiveModelTab('details')
    setShowModelDrawer(true)
    loadAttributes(m.id)
    // seed extra model fields if present
    setModelIcon(m.icon || '')
    setModelPrimaryColor((m.primary_color as string) || '#1e40af')
    setModelTags(Array.isArray(m.tags) ? m.tags : [])
    setModelGroupFolder((m.group_folder as string) || '')
    setModelOwnerName((m.owner_name as string) || '')
  }

  const saveModel = async () => {
    try {
      const method = editingModel ? 'PUT' : 'POST'
      const url = editingModel ? `/api/data-models/${editingModel.id}` : '/api/data-models'
      const body = editingModel 
        ? { 
            ...modelForm,
            icon: modelIcon,
            primary_color: modelPrimaryColor,
            tags: modelTags,
            group_folder: modelGroupFolder,
            owner_name: modelOwnerName
          }
        : { 
            ...modelForm,
            icon: modelIcon,
            space_ids: [selectedSpace!.id],
            primary_color: modelPrimaryColor,
            tags: modelTags,
            group_folder: modelGroupFolder,
            owner_name: modelOwnerName
          }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save model')
      if (editingModel) {
        await fetch(`/api/data-models/${editingModel.id}/spaces`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ space_ids: [selectedSpace!.id] }) })
      }
      setShowModelDrawer(false)
      await loadModels()
      toast.success('Model saved')
    } catch (e) {
      toast.error('Failed to save model')
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

  const createAttribute = async () => {
    if (!editingModel) return
    try {
      const res = await fetch(`/api/data-models/${editingModel.id}/attributes`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(attrForm) })
      if (!res.ok) throw new Error('Failed')
      setAttrForm({ name: '', display_name: '', data_type: 'text', is_required: false, is_unique: false, default_value: '' })
      await loadAttributes(editingModel.id)
      toast.success('Attribute created')
    } catch {
      toast.error('Failed to create attribute')
    }
  }

  const deleteAttribute = async (attr: any) => {
    if (!editingModel) return
    if (!confirm(`Delete attribute "${attr.display_name || attr.name}"?`)) return
    try {
      const res = await fetch(`/api/data-models/${editingModel.id}/attributes/${attr.id}`, { method:'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await loadAttributes(editingModel.id)
      toast.success('Attribute deleted')
    } catch {
      toast.error('Failed to delete attribute')
    }
  }

  const openAttributeDrawer = (attr: any) => {
    setSelectedAttribute(attr)
    setActiveAttributeTab('config')
    setAttributeEditForm({
      name: attr.name || '',
      display_name: attr.display_name || '',
      type: (attr.type || 'text').toLowerCase(),
      is_required: !!attr.is_required,
      is_unique: !!attr.is_unique,
      default_value: attr.default_value || '',
      options: (() => {
        if (Array.isArray(attr.options)) return attr.options
        if (typeof attr.options === 'string') {
          try {
            const parsed = JSON.parse(attr.options)
            return Array.isArray(parsed) ? parsed : []
          } catch { return [] }
        }
        return attr.options && Array.isArray(attr.options) ? attr.options : []
      })()
    })
    setShowAttributeDrawer(true)
  }

  const saveAttributeConfig = async () => {
    if (!editingModel || !selectedAttribute) return
    try {
      const res = await fetch(`/api/data-models/${editingModel.id}/attributes/${selectedAttribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: attributeEditForm.name,
          display_name: attributeEditForm.display_name,
          type: attributeEditForm.type,
          is_required: attributeEditForm.is_required,
          is_unique: attributeEditForm.is_unique,
          default_value: attributeEditForm.default_value,
          options: attributeEditForm.options
        })
      })
      if (!res.ok) throw new Error('Failed')
      await loadAttributes(editingModel.id)
      toast.success('Attribute updated')
      setShowAttributeDrawer(false)
    } catch (e) {
      toast.error('Failed to update attribute')
    }
  }

  const loadModelActivity = async (modelId?: string) => {
    const id = modelId || editingModel?.id
    if (!id) return
    setModelActivityLoading(true)
    try {
      const qs = new URLSearchParams({ entityType: 'DataModel', entityId: id, page: '1', limit: '20' })
      const res = await fetch(`/api/audit-logs?${qs.toString()}`)
      const json = await res.json().catch(() => ({}))
      setModelActivity(json.data || [])
    } finally {
      setModelActivityLoading(false)
    }
  }

  const loadAttributeActivity = async (attrId?: string) => {
    const id = attrId || selectedAttribute?.id
    if (!id) return
    setAttrActivityLoading(true)
    try {
      const qs = new URLSearchParams({ entityType: 'DataModelAttribute', entityId: id, page: '1', limit: '20' })
      const res = await fetch(`/api/audit-logs?${qs.toString()}`)
      const json = await res.json().catch(() => ({}))
      setAttrActivity(json.data || [])
    } finally {
      setAttrActivityLoading(false)
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
              <TabsTrigger className="justify-start w-full" value="restore">Restore</TabsTrigger>
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
                      <Button onClick={openCreateModel}>
                        <Plus className="mr-2 h-4 w-4" /> New Model
                      </Button>
                    </div>
                    <div className="border rounded-md divide-y">
                      {modelsLoading ? (
                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                      ) : (
                        (models.filter((m)=>{
                          const q = modelSearch.toLowerCase()
                          return !q || (m.name||'').toLowerCase().includes(q) || (m.display_name||'').toLowerCase().includes(q) || (m.description||'').toLowerCase().includes(q)
                        })).map((m:any)=> (
                          <div key={m.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{m.display_name || m.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{m.description || '—'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={()=>openEditModel(m)}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={()=>deleteModel(m)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        ))
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
                        <div className="flex gap-2">
                          <Button variant={activeModelTab==='details'?'default':'ghost'} size="sm" onClick={()=>setActiveModelTab('details')} className="flex items-center gap-1">
                            <Database className="h-4 w-4" /> Details
                          </Button>
                          {editingModel && (
                            <Button variant={activeModelTab==='attributes'?'default':'ghost'} size="sm" onClick={()=>setActiveModelTab('attributes')} className="flex items-center gap-1">
                              <Type className="h-4 w-4" /> Attributes
                            </Button>
                          )}
                          {editingModel && (
                            <Button variant={activeModelTab==='activity'?'default':'ghost'} size="sm" onClick={()=>{ setActiveModelTab('activity'); loadModelActivity(editingModel.id) }} className="flex items-center gap-1">
                              <History className="h-4 w-4" /> Activity
                            </Button>
                          )}
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

                      {activeModelTab==='attributes' && editingModel && (
                        <div className="space-y-4">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <Label>Name</Label>
                                <Input value={attrForm.name} onChange={(e)=> setAttrForm({ ...attrForm, name: e.target.value })} placeholder="e.g. customer_name" />
                              </div>
                              <div>
                                <Label>Display Name</Label>
                                <Input value={attrForm.display_name} onChange={(e)=> setAttrForm({ ...attrForm, display_name: e.target.value })} placeholder="e.g. Customer Name" />
                              </div>
                              <div>
                                <Label>Data Type</Label>
                                <select value={attrForm.data_type} onChange={(e)=> setAttrForm({ ...attrForm, data_type: e.target.value })} className="w-full p-2 border rounded-md">
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
                                <Label>Default Value</Label>
                                <Input value={attrForm.default_value} onChange={(e)=> setAttrForm({ ...attrForm, default_value: e.target.value })} placeholder="Optional" />
                              </div>
                              <label className="inline-flex items-center gap-2">
                                <input type="checkbox" checked={attrForm.is_required} onChange={(e)=> setAttrForm({ ...attrForm, is_required: e.target.checked })} />
                                <span className="text-sm">Required</span>
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input type="checkbox" checked={attrForm.is_unique} onChange={(e)=> setAttrForm({ ...attrForm, is_unique: e.target.checked })} />
                                <span className="text-sm">Unique</span>
                              </label>
                            </div>
                            <Button size="sm" onClick={createAttribute}>
                              <Plus className="h-4 w-4 mr-1" /> Add Attribute
                            </Button>
                          </div>

                          <div className="border rounded-md divide-y">
                            {attributesLoading ? (
                              <div className="p-4 text-center text-muted-foreground">Loading...</div>
                            ) : attributes.length ? (
                              attributes.map((attr:any)=> (
                                <div key={attr.id} className="p-3 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-medium truncate cursor-pointer" onClick={()=>openAttributeDrawer(attr)}>{attr.display_name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{attr.name} • {attr.type}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="destructive" onClick={()=>deleteAttribute(attr)}>
                                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">No attributes</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 px-6 py-4 border-t">
                      <Button variant="outline" onClick={()=>setShowModelDrawer(false)}>Close</Button>
                      <Button onClick={saveModel}>{editingModel ? 'Update' : 'Create'} Model</Button>
                    </div>
                  </DrawerContent>
                </Drawer>

                <Drawer open={showAttributeDrawer} onOpenChange={setShowAttributeDrawer}>
                  <DrawerContent widthClassName="w-[560px]">
                    <DrawerHeader>
                      <DrawerTitle>Attribute</DrawerTitle>
                      <DrawerDescription>Configure attribute and options</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6 space-y-4">
                      <div className="border-b">
                        <div className="flex gap-2">
                          <Button variant={activeAttributeTab==='config'?'default':'ghost'} size="sm" onClick={()=>setActiveAttributeTab('config')}>Config</Button>
                          <Button variant={activeAttributeTab==='options'?'default':'ghost'} size="sm" onClick={()=>setActiveAttributeTab('options')}>Options</Button>
                          {selectedAttribute && (
                            <Button variant={activeAttributeTab==='activity'?'default':'ghost'} size="sm" onClick={()=>{ setActiveAttributeTab('activity'); loadAttributeActivity(selectedAttribute.id) }}>Activity</Button>
                          )}
                        </div>
                      </div>

                      {activeAttributeTab==='config' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Name</Label>
                              <Input value={attributeEditForm.name} onChange={(e)=> setAttributeEditForm({ ...attributeEditForm, name: e.target.value })} />
                            </div>
                            <div>
                              <Label>Display Name</Label>
                              <Input value={attributeEditForm.display_name} onChange={(e)=> setAttributeEditForm({ ...attributeEditForm, display_name: e.target.value })} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Type</Label>
                              <select value={attributeEditForm.type} onChange={(e)=> setAttributeEditForm({ ...attributeEditForm, type: e.target.value })} className="w-full p-2 border rounded-md">
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
                              <Label>Default Value</Label>
                              <Input value={attributeEditForm.default_value} onChange={(e)=> setAttributeEditForm({ ...attributeEditForm, default_value: e.target.value })} />
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <label className="inline-flex items-center gap-2">
                              <input type="checkbox" checked={attributeEditForm.is_required} onChange={(e)=> setAttributeEditForm({ ...attributeEditForm, is_required: e.target.checked })} />
                              <span className="text-sm">Required</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input type="checkbox" checked={attributeEditForm.is_unique} onChange={(e)=> setAttributeEditForm({ ...attributeEditForm, is_unique: e.target.checked })} />
                              <span className="text-sm">Unique</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {activeAttributeTab==='options' && (
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">Add selectable options (for select/multi_select).</div>
                          {((Array.isArray(attributeEditForm.options) ? attributeEditForm.options : [])).map((opt: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input value={typeof opt === 'string' ? opt : (opt?.label ?? '')} onChange={(e)=>{
                                const base = Array.isArray(attributeEditForm.options) ? attributeEditForm.options : []
                                const next = [...base]
                                next[idx] = e.target.value
                                setAttributeEditForm({ ...attributeEditForm, options: next })
                              }} placeholder={`Option ${idx+1}`} />
                              <Button variant="outline" size="sm" onClick={()=>{
                                const base = Array.isArray(attributeEditForm.options) ? attributeEditForm.options : []
                                const next = [...base]
                                next.splice(idx,1)
                                setAttributeEditForm({ ...attributeEditForm, options: next })
                              }}>Remove</Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={()=> {
                            const base = Array.isArray(attributeEditForm.options) ? attributeEditForm.options : []
                            setAttributeEditForm({ ...attributeEditForm, options: [...base, ''] })
                          }}>
                            <Plus className="h-4 w-4 mr-1" /> Add Option
                          </Button>
                        </div>
                      )}
                      {activeAttributeTab==='activity' && (
                        <div className="space-y-3">
                          {attrActivityLoading ? (
                            <div className="p-4 text-center text-muted-foreground">Loading...</div>
                          ) : (
                            <div className="space-y-2">
                              {attrActivity.length === 0 && <div className="text-sm text-muted-foreground">No activity</div>}
                              {attrActivity.map((log:any) => (
                                <div key={log.id} className="text-sm border rounded p-2">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">{log.action}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{log.user_name || 'Unknown'} • {log.user_email || ''}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 px-6 py-4 border-t">
                      <Button variant="outline" onClick={()=>setShowAttributeDrawer(false)}>Close</Button>
                      <Button onClick={saveAttributeConfig}>Save</Button>
                    </div>
                  </DrawerContent>
                </Drawer>
                {activeModelTab==='activity' && (
                  <div className="mt-4">
                    {modelActivityLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Loading...</div>
                    ) : (
                      <div className="space-y-2">
                        {modelActivity.length === 0 && <div className="text-sm text-muted-foreground">No activity</div>}
                        {modelActivity.map((log:any) => (
                          <div key={log.id} className="text-sm border rounded p-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{log.action}</div>
                              <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{log.user_name || 'Unknown'} • {log.user_email || ''}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
            </div>
          </div>
        </div>
      </Tabs>
    </MainLayout>
  )
}



