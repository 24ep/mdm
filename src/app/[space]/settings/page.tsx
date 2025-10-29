"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserInviteInput } from '@/components/ui/user-invite-input'
import { MemberManagementPanel } from '@/components/space-management/MemberManagementPanel'
import { MemberPermissionsPanel } from '@/components/space-management/MemberPermissionsPanel'
import { MemberAuditLog } from '@/components/space-management/MemberAuditLog'
import { Building2, Layout, Database, History, Users as UsersIcon, UserCog, UserPlus, Plus, Edit, Trash2, Search, Type, AlertTriangle, FolderPlus, Share2, Folder, FolderOpen, Move, Settings, Palette, Shield, Archive, Trash, MoreVertical, ChevronDown, ChevronRight, ArrowLeft, ExternalLink, Grid3X3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSpace } from '@/contexts/space-context'
import { useSession } from 'next-auth/react'
import { PagesManagement } from '@/components/studio/pages-management'
import { SpaceStudio } from '@/components/studio/space-studio'
import { useSpacesEditor } from '@/hooks/use-space-studio'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { ColorPicker } from '@/components/ui/color-swatch'
import { AttributeDetailDrawer } from '@/components/data-models/AttributeDetailDrawer'
import { AttributeManagementPanel } from '@/components/attribute-management/AttributeManagementPanel'
import { DraggableAttributeList } from '@/components/attribute-management/DraggableAttributeList'
import { EnhancedAttributeDetailDrawer } from '@/components/attribute-management/EnhancedAttributeDetailDrawer'
import { getStorageProviderIcon, getStorageProviderLabel } from '@/lib/storage-provider-icons'
import { DataModelTreeView } from '@/components/data-model/DataModelTreeView'

export default function SpaceSettingsPage() {
  const router = useRouter()
  const params = useParams() as { space: string }
  const searchParams = useSearchParams()
  const allowedTabs = ['details','members','space-studio','data-model','attachments','restore','danger']
  const initialTabRaw = (searchParams.get('tab') as string) || 'details'
  const initialTab = allowedTabs.includes(initialTabRaw) ? initialTabRaw : 'details'
  const { spaces, currentSpace, refreshSpaces } = useSpace()
  const { data: session } = useSession()

  // Spaces Editor: pages/templates management for this space
  const {
    pages: editorPages,
    templates: editorTemplates,
    createPage: createEditorPage,
    updatePage: updateEditorPage,
    deletePage: deleteEditorPage,
    assignTemplateToPage: assignTemplateToEditorPage,
    refreshConfig: refreshEditorConfig
  } = useSpacesEditor(currentSpace?.id || '')

  // Reset all pages function
  const handleResetPages = async () => {
    try {
      const { SpacesEditorManager } = await import('@/lib/space-studio-manager')
      await SpacesEditorManager.clearSpacesEditorConfig(currentSpace?.id || '')
      await refreshEditorConfig()
      toast.success('All pages have been removed')
    } catch (error) {
      console.error('Failed to reset pages:', error)
      toast.error('Failed to reset pages')
    }
  }

  const homepage = useMemo(() => {
    if (!editorPages || editorPages.length === 0) return null
    const byOrder = [...editorPages]
      .filter(p => p.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    return byOrder[0] || null
  }, [editorPages])

  const selectedSpace = useMemo(() => {
    return (
      spaces.find((s: any) => s.id === params.space || s.slug === params.space) || currentSpace || null
    ) as any
  }, [spaces, currentSpace, params.space])

  const [tab, setTab] = useState<string>(initialTab)
  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const [members, setMembers] = useState<any[]>([])
  const [memberPermissions, setMemberPermissions] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const canManageMembers = selectedSpace?.user_role === 'owner' || selectedSpace?.user_role === 'admin'

  // Handle user invitation
  const handleInviteUser = async (user: any, role: string) => {
    if (!selectedSpace?.id) return

    try {
      if (user.id) {
        // Existing user - add directly to space
        const res = await fetch(`/api/spaces/${selectedSpace.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, role })
        })
        
        if (res.ok) {
          toast.success('User added to space')
          await loadMembers(selectedSpace.id)
        } else {
          const error = await res.json()
          toast.error(error.error || 'Failed to add user')
        }
      } else {
        // New user - send invitation email
        const res = await fetch(`/api/spaces/${selectedSpace.id}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, role })
        })
        
        if (res.ok) {
          toast.success('Invitation sent successfully')
        } else {
          const error = await res.json()
          toast.error(error.error || 'Failed to send invitation')
        }
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error('Failed to invite user')
    }
  }

  // Handle bulk operations
  const handleBulkOperation = async (operation: string, userIds: string[], data?: any) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, userIds, data })
      })
      
      if (res.ok) {
        await loadMembers(selectedSpace.id)
        toast.success('Bulk operation completed successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to perform bulk operation')
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error)
      toast.error('Failed to perform bulk operation')
    }
  }

  // Handle member role update
  const handleUpdateRole = async (userId: string, role: string) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      
      if (res.ok) {
        await loadMembers(selectedSpace.id)
        toast.success('Role updated successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role')
    }
  }

  // Handle member removal
  const handleRemoveMember = async (userId: string) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        await loadMembers(selectedSpace.id)
        toast.success('Member removed successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  // Handle permission updates
  const handleUpdatePermissions = async (userId: string, permissions: string[]) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      })
      
      if (res.ok) {
        toast.success('Permissions updated successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Failed to update permissions')
    }
  }

  // Load audit logs
  const loadAuditLogs = async () => {
    if (!selectedSpace?.id) return

    try {
      setAuditLogsLoading(true)
      const res = await fetch(`/api/spaces/${selectedSpace.id}/audit-log`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.auditLogs || [])
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setAuditLogsLoading(false)
    }
  }

  // Embedded Data Models (space-scoped)
  const [models, setModels] = useState<any[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [showModelDrawer, setShowModelDrawer] = useState(false)
  const [editingModel, setEditingModel] = useState<any | null>(null)
  const [modelForm, setModelForm] = useState({ name: '', display_name: '', description: '', slug: '' })
  
  // Data Model Type Selection
  const [showDataModelTypeDialog, setShowDataModelTypeDialog] = useState(false)
  const [selectedDataModelType, setSelectedDataModelType] = useState<'internal' | 'external' | null>(null)
  
  // External Data Source Connection
  const [showDatabaseSelection, setShowDatabaseSelection] = useState(false)
  const [databaseSearch, setDatabaseSearch] = useState('')
  const [selectedDatabaseType, setSelectedDatabaseType] = useState<'postgres' | 'mysql' | null>(null)
  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [connectionForm, setConnectionForm] = useState({
    name: '',
    db_type: 'postgres' as 'postgres' | 'mysql',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    schema: '',
    table: ''
  })
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null)
  const [connectionSchemas, setConnectionSchemas] = useState<string[]>([])
  const [connectionTables, setConnectionTables] = useState<Record<string, string[]>>({})
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
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])

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
      loadAuditLogs()
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
      const res = await fetch(`/api/spaces/${spaceId}/members`)
      if (!res.ok) throw new Error('Failed to load members')
      const json = await res.json()
      setMembers(json.members || [])
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
    // Show dialog to select data model type
    setShowDataModelTypeDialog(true)
    setSelectedDataModelType(null)
    setShowDatabaseSelection(false)
    setShowConnectionForm(false)
    setDatabaseSearch('')
    setSelectedDatabaseType(null)
    setConnectionForm({
      name: '',
      db_type: 'postgres',
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
      schema: '',
      table: ''
    })
  }

  const handleSelectDataModelType = (type: 'internal' | 'external') => {
    setSelectedDataModelType(type)
    if (type === 'external') {
      setShowDatabaseSelection(true)
      setShowDataModelTypeDialog(false)
    } else {
      // Internal - proceed with existing flow
      setShowDataModelTypeDialog(false)
      setEditingModel(null)
      setModelForm({ name: '', display_name: '', description: '', slug: '' })
      setModelIcon('')
      setModelPrimaryColor('#1e40af')
      setModelTags([])
      setModelGroupFolder('')
      setModelOwnerName('')
      setShowModelDrawer(true)
    }
  }

  const handleSelectDatabase = (dbType: 'postgres' | 'mysql') => {
    setSelectedDatabaseType(dbType)
    setConnectionForm(prev => ({ ...prev, db_type: dbType, port: dbType === 'postgres' ? '5432' : '3306' }))
    setShowDatabaseSelection(false)
    setShowConnectionForm(true)
  }

  const testConnection = async () => {
    if (!selectedSpace?.id) return
    
    setTestingConnection(true)
    setConnectionTestResult(null)
    
    try {
      const res = await fetch('/api/external-connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: selectedSpace.id,
          db_type: connectionForm.db_type,
          host: connectionForm.host,
          port: connectionForm.port ? parseInt(connectionForm.port) : undefined,
          database: connectionForm.database || undefined,
          username: connectionForm.username || undefined,
          password: connectionForm.password || undefined
        })
      })
      
      const json = await res.json()
      if (res.ok && json.ok) {
        setConnectionTestResult({ success: true, schemas: json.schemas, tablesBySchema: json.tablesBySchema })
        setConnectionSchemas(json.schemas || [])
        setConnectionTables(json.tablesBySchema || {})
        toast.success('Connection test successful')
      } else {
        setConnectionTestResult({ success: false, error: json.error || 'Connection failed' })
        toast.error('Connection test failed')
      }
    } catch (error: any) {
      setConnectionTestResult({ success: false, error: error.message || 'Connection test failed' })
      toast.error('Connection test failed')
    } finally {
      setTestingConnection(false)
    }
  }

  const saveExternalConnection = async () => {
    if (!selectedSpace?.id) return
    
    if (!connectionForm.name || !connectionForm.host || !connectionForm.db_type) {
      toast.error('Please fill in all required fields')
      return
    }

    // For PostgreSQL, schema and table are required. For MySQL, schema might be optional
    if (!connectionForm.table) {
      toast.error('Please select a table')
      return
    }

    // For PostgreSQL, schema is required. For MySQL, use database name as schema if not provided
    const schemaToUse = connectionForm.schema || (connectionForm.db_type === 'mysql' ? connectionForm.database : null)
    if (connectionForm.db_type === 'postgres' && !schemaToUse) {
      toast.error('Please select a schema')
      return
    }

    try {
      // Create external connection
      const connectionRes = await fetch('/api/external-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: selectedSpace.id,
          name: connectionForm.name,
          db_type: connectionForm.db_type,
          host: connectionForm.host,
          port: connectionForm.port ? parseInt(connectionForm.port) : (connectionForm.db_type === 'postgres' ? 5432 : 3306),
          database: connectionForm.database || null,
          username: connectionForm.username || null,
          password: connectionForm.password || null,
          options: {}
        })
      })

      if (!connectionRes.ok) {
        const error = await connectionRes.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create connection')
      }

      const connectionData = await connectionRes.json()
      const connectionId = connectionData.connection?.id || connectionData.id

      // Create data model linked to external connection
      const modelRes = await fetch('/api/data-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: connectionForm.table || connectionForm.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: connectionForm.name,
          description: `External data source: ${connectionForm.db_type} - ${connectionForm.host}/${connectionForm.database || ''}`,
          slug: connectionForm.table || connectionForm.name.toLowerCase().replace(/\s+/g, '_'),
          space_ids: [selectedSpace.id],
          source_type: 'EXTERNAL',
          external_connection_id: connectionId,
          external_schema: schemaToUse || connectionForm.database || null,
          external_table: connectionForm.table
        })
      })

      if (!modelRes.ok) {
        throw new Error('Failed to create data model')
      }

      toast.success('External data source connected successfully')
      setShowConnectionForm(false)
      setShowDatabaseSelection(false)
      setSelectedDataModelType(null)
      setConnectionForm({
        name: '',
        db_type: 'postgres',
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
        schema: '',
        table: ''
      })
      await loadModels()
    } catch (error: any) {
      console.error('Error saving external connection:', error)
      toast.error(error.message || 'Failed to save external connection')
    }
  }

  // Database types available
  const databaseTypes = [
    { id: 'postgres', name: 'PostgreSQL', icon: '🐘', description: 'PostgreSQL database' },
    { id: 'mysql', name: 'MySQL', icon: '🐬', description: 'MySQL database' }
  ]

  const filteredDatabaseTypes = databaseTypes.filter(db => 
    db.name.toLowerCase().includes(databaseSearch.toLowerCase()) ||
    db.description.toLowerCase().includes(databaseSearch.toLowerCase())
  )

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

  const handleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => prev.includes(folderId) ? prev : [...prev, folderId])
  }

  const handleFolderCollapse = (folderId: string) => {
    setExpandedFolders(prev => prev.filter(id => id !== folderId))
  }

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          parent_id: parentId,
          space_id: selectedSpace?.id,
          type: 'data_model'
        })
      })
      if (res.ok) {
        await loadFolders()
        toast.success('Folder created')
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Failed to create folder')
    }
  }

  const handleEditFolder = async (folder: any) => {
    // TODO: Implement folder editing
    toast('Folder editing not implemented yet')
  }

  const handleDeleteFolder = async (folder: any) => {
    if (!confirm(`Delete folder "${folder.name}"? This will move all models to root level.`)) return
    try {
      const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadFolders()
        await loadModels()
        toast.success('Folder deleted')
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Failed to delete folder')
    }
  }







  if (!selectedSpace) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Space Settings</CardTitle>
            <CardDescription>Space not found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Space Dropdown */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <h1 className="text-xl font-bold">Space Settings</h1>
                <p className="text-sm text-muted-foreground">Configure your workspace</p>
              </div>
            </div>
            
            <div className="h-6 w-px bg-border" />
            
            {/* Space dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Space:</span>
              <Select 
                value={selectedSpace?.id || ''} 
                onValueChange={(spaceId) => {
                  const space = spaces.find(s => s.id === spaceId)
                  if (space) {
                    router.push(`/${space.slug || space.id}/settings`)
                  }
                }}
              >
                <SelectTrigger className="w-56">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="truncate">{selectedSpace?.name || 'Select Space'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {spaces.map((space: any) => (
                    <SelectItem key={space.id} value={space.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{space.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Go to Space/Homepage button with open-in-new-tab icon */}
            <Button
              variant={homepage ? 'default' : 'outline'}
              size="sm"
              disabled={!homepage}
              onClick={() => {
                if (!homepage) return
                const base = `/${selectedSpace?.slug || selectedSpace?.id}`
                router.push(`${base}${homepage.path}`)
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {homepage ? 'Go to Space' : 'No homepage'}
            </Button>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Back to Spaces button - moved to right with board icon */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/spaces')}
              className="flex items-center gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              Back to Spaces
            </Button>

            {/* Account avatar */}
            <div className="h-8 w-8">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(session?.user as any)?.image || ''} alt={(session?.user as any)?.name || 'User'} />
                <AvatarFallback>{((session?.user as any)?.name || 'U').slice(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-50 dark:bg-gray-900 flex flex-col border-r">
          <nav className="flex-1 p-4 space-y-0">
            <TabsList className="w-full flex-col h-auto bg-transparent">
              <TabsTrigger className="justify-start w-full h-auto p-3 mb-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800 data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-800 rounded-lg border-0 border-b-0 data-[state=active]:border-b-0 data-[state=active]:!border-b-0" value="details">
                <div className="flex items-center space-x-3 w-full">
                  <Building2 className="h-4 w-4 text-foreground flex-shrink-0" style={{ display: 'block' }} />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium">Space Details</span>
                    <span className="text-xs text-muted-foreground break-words leading-tight">Name, description, and basic info</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger className="justify-start w-full h-auto p-3 mb-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800 data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-800 rounded-lg border-0 border-b-0 data-[state=active]:border-b-0 data-[state=active]:!border-b-0" value="space-studio">
                <div className="flex items-center space-x-3 w-full">
                  <Layout className="h-4 w-4 text-foreground flex-shrink-0" style={{ display: 'block' }} />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium">Space Studio</span>
                    <span className="text-xs text-muted-foreground break-words leading-tight">Design layout and manage space pages</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger className="justify-start w-full h-auto p-3 mb-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800 data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-800 rounded-lg border-0 border-b-0 data-[state=active]:border-b-0 data-[state=active]:!border-b-0" value="members">
                <div className="flex items-center space-x-3 w-full">
                  <UsersIcon className="h-4 w-4 text-foreground flex-shrink-0" style={{ display: 'block' }} />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium">Members</span>
                    <span className="text-xs text-muted-foreground break-words leading-tight">Manage team members and permissions</span>
                  </div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger className="justify-start w-full h-auto p-3 mb-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800 data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-800 rounded-lg border-0 border-b-0 data-[state=active]:border-b-0 data-[state=active]:!border-b-0" value="data-model">
                <div className="flex items-center space-x-3 w-full">
                  <Database className="h-4 w-4 text-foreground flex-shrink-0" style={{ display: 'block' }} />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium">Data Model</span>
                    <span className="text-xs text-muted-foreground break-words leading-tight">Define data structure and attributes</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger className="justify-start w-full h-auto p-3 mb-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800 data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-800 rounded-lg border-0 border-b-0 data-[state=active]:border-b-0 data-[state=active]:!border-b-0" value="attachments">
                <div className="flex items-center space-x-3 w-full">
                  <FolderPlus className="h-4 w-4 text-foreground flex-shrink-0" />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium">Attachments</span>
                    <span className="text-xs text-muted-foreground break-words leading-tight">File storage and management</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger className="justify-start w-full h-auto p-3 mb-1 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800 data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-800 rounded-lg border-0 border-b-0 data-[state=active]:border-b-0 data-[state=active]:!border-b-0" value="restore">
                <div className="flex items-center space-x-3 w-full">
                  <Archive className="h-4 w-4 text-foreground flex-shrink-0" />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium">Restore</span>
                    <span className="text-xs text-muted-foreground break-words leading-tight">Backup and restore data</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger className="justify-start w-full h-auto p-3 mb-1 text-red-600 hover:text-red-700 data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-900/20 data-[state=inactive]:hover:bg-red-50 dark:data-[state=inactive]:hover:bg-red-900/10 rounded-lg border-0 border-b-0 data-[state=active]:border-b-0 data-[state=active]:!border-b-0" value="danger">
                <div className="flex items-center space-x-3 w-full">
                  <AlertTriangle className="h-4 w-4 text-current flex-shrink-0" />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium">Danger Zone</span>
                    <span className="text-xs text-muted-foreground break-words leading-tight">Delete space and irreversible actions</span>
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 flat-cards">
              <div className="space-y-6">
              <TabsContent value="details" className="space-y-6 w-full">
                {/* Space Overview Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSpace.name}</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {selectedSpace.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Building2 className="h-3 w-3 mr-1" />
                            Space ID: {selectedSpace.id}
                          </Badge>
                          <Badge variant="outline" className="border-0">
                            <Layout className="h-3 w-3 mr-1" />
                            URL: /{selectedSpace.slug || selectedSpace.id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedSpace.created_at ? new Date(selectedSpace.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Sub-tabs */}
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="flex gap-2 justify-start">
                    <TabsTrigger value="basic" className="flex items-center gap-2 justify-start">
                      <Settings className="h-4 w-4" />
                      Basic Information
                    </TabsTrigger>
                    <TabsTrigger value="login" className="flex items-center gap-2 justify-start">
                      <Layout className="h-4 w-4" />
                      Login Page
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <Card className="border-0 shadow-sm bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                          <Settings className="h-5 w-5" />
                          <span>Basic Information</span>
                        </CardTitle>
                        <CardDescription>Update your space's core details and configuration</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="space-name" className="text-sm font-medium">Space Name</Label>
                            <Input 
                              id="space-name" 
                              defaultValue={selectedSpace.name} 
                              className="h-11 border border-input bg-background"
                              onBlur={async (e) => {
                                const name = e.currentTarget.value.trim()
                                if (!name || name === selectedSpace.name) return
                                const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                                  method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name })
                                })
                                if (res.ok) { toast.success('Space name updated'); await refreshSpaces() } else { toast.error('Failed to update name') }
                              }} 
                            />
                            <p className="text-xs text-muted-foreground">The display name for your space</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="space-slug" className="text-sm font-medium">Custom URL (Slug)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">/</span>
                              <Input 
                                id="space-slug" 
                                defaultValue={selectedSpace.slug || ''} 
                                className="h-11 pl-8 border border-input bg-background"
                                placeholder="my-space"
                                onBlur={async (e) => {
                                  const slug = e.currentTarget.value.trim()
                                  if (slug === (selectedSpace.slug || '')) return
                                  const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ slug })
                                  })
                                  if (res.ok) { toast.success('Slug updated'); await refreshSpaces() } else { toast.error('Failed to update slug') }
                                }} 
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Custom URL: /{selectedSpace.slug || selectedSpace.id}/dashboard</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="space-desc" className="text-sm font-medium">Description</Label>
                          <Textarea 
                            id="space-desc" 
                            defaultValue={selectedSpace.description || ''} 
                            rows={4} 
                            className="resize-none border border-input bg-background"
                            placeholder="Describe what this space is used for..."
                            onBlur={async (e) => {
                              const description = e.currentTarget.value
                              if (description === (selectedSpace.description || '')) return
                              const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ description })
                              })
                              if (res.ok) { toast.success('Description updated'); await refreshSpaces() } else { toast.error('Failed to update description') }
                            }} 
                          />
                          <p className="text-xs text-muted-foreground">A brief description of your space's purpose</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="login" className="space-y-6 mt-6">
                    <Card className="border-0 shadow-sm bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                          <Layout className="h-5 w-5" />
                          <span>Login Page Customization</span>
                        </CardTitle>
                        <CardDescription>Customize the appearance of your space's login screen</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="login-image-url" className="text-sm font-medium">Login Image URL</Label>
                          <Input
                            id="login-image-url"
                            defaultValue={(() => {
                              const features = spaceDetails?.features || null
                              try { return typeof features === 'string' ? JSON.parse(features)?.login_image_url || '' : (features?.login_image_url || '') } catch { return '' }
                            })()}
                            placeholder="https://.../image.jpg"
                            className="border border-input bg-background"
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
                          <p className="text-xs text-muted-foreground">Shown on the left side of the space-specific login page.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="members" className="space-y-6 w-full">
                <Tabs defaultValue="management" className="w-full">
                  <TabsList className="flex gap-2 justify-start flex-wrap">
                    <TabsTrigger value="management" className="justify-start">Management</TabsTrigger>
                    <TabsTrigger value="permissions" className="justify-start">Permissions</TabsTrigger>
                    <TabsTrigger value="activity" className="justify-start">Activity</TabsTrigger>
                    <TabsTrigger value="audit" className="justify-start">Audit Log</TabsTrigger>
                  </TabsList>

                  <TabsContent value="management" className="space-y-6">
                    <MemberManagementPanel
                      spaceId={selectedSpace.id}
                      members={members}
                      onInvite={handleInviteUser}
                      onUpdateRole={handleUpdateRole}
                      onRemoveMember={handleRemoveMember}
                      onBulkOperation={handleBulkOperation}
                      canManageMembers={canManageMembers}
                      loading={false}
                    />
                  </TabsContent>

                  <TabsContent value="permissions" className="space-y-6">
                    <MemberPermissionsPanel
                      spaceId={selectedSpace.id}
                      members={members}
                      onUpdatePermissions={handleUpdatePermissions}
                      canManagePermissions={canManageMembers}
                    />
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Member Activity</CardTitle>
                        <CardDescription>
                          Track member activity and engagement in this space.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Activity tracking coming soon...</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="audit" className="space-y-6">
                    <MemberAuditLog
                      spaceId={selectedSpace.id}
                      auditLogs={auditLogs}
                      loading={auditLogsLoading}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              

              <TabsContent value="space-studio" className="space-y-6 w-full">
                <SpaceStudio 
                  spaceId={currentSpace?.id || ''}
                />
              </TabsContent>

              <TabsContent value="data-model" className="space-y-6 w-full">
                <DataModelTreeView
                  models={models}
                  folders={folders}
                  loading={modelsLoading}
                  searchValue={modelSearch}
                  onSearchChange={setModelSearch}
                  onModelEdit={openEditModel}
                  onModelDelete={deleteModel}
                  onModelMove={moveModelToFolder}
                  onModelShare={openShareModel}
                  onCreateModel={openCreateModel}
                  onCreateFolder={handleCreateFolder}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onFolderExpand={handleFolderExpand}
                  onFolderCollapse={handleFolderCollapse}
                  expandedFolders={expandedFolders}
                />

                <Drawer open={showModelDrawer} onOpenChange={setShowModelDrawer}>
                  <DrawerContent widthClassName="w-[720px]">
                    <DrawerHeader>
                      <DrawerTitle>{editingModel ? 'Edit Data Model' : 'New Data Model'}</DrawerTitle>
                      <DrawerDescription>{editingModel ? 'Update details' : 'Create a model for this space'}</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6 space-y-4">
                      <div className="border-b">
                        <div className="flex space-x-8 justify-start">
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
                              <Input value={modelForm.name} onChange={(e)=> setModelForm({ ...modelForm, name: e.target.value })} placeholder="e.g. customer" className="border border-input bg-background" />
                            </div>
                            <div>
                              <Label>Display Name</Label>
                              <Input value={modelForm.display_name} onChange={(e)=> setModelForm({ ...modelForm, display_name: e.target.value })} placeholder="e.g. Customer" className="border border-input bg-background" />
                            </div>
                          </div>
                          <div>
                            <Label>Slug</Label>
                            <Input value={modelForm.slug} onChange={(e)=> setModelForm({ ...modelForm, slug: e.target.value.toLowerCase() })} placeholder="auto-generated-from-name" className="border border-input bg-background" />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea value={modelForm.description} onChange={(e)=> setModelForm({ ...modelForm, description: e.target.value })} placeholder="Optional description" className="border border-input bg-background" />
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
                              <Input value={newTag} onChange={(e)=>setNewTag(e.target.value)} placeholder="Add tag" className="border border-input bg-background" />
                              <Button variant="outline" className="border-0" onClick={()=>{ const v = newTag.trim(); if (v && !modelTags.includes(v)) { setModelTags([...modelTags, v]); setNewTag('') } }}>Add</Button>
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
                      <Button variant="outline" className="border-0" onClick={()=>setShowModelDrawer(false)}>Close</Button>
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
                                  className="border-0"
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
                              className="border-0"
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
                      <Button variant="outline" className="border-0" onClick={() => setShowCreateAttributeDrawer(false)}>
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
                      <Button variant="outline" className="border-0" onClick={() => setShowCreateFolderDialog(false)}>
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
                      <Button variant="outline" className="border-0" onClick={() => setShowShareModelDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={shareModel}>
                        Update Sharing
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Data Model Type Selection Dialog */}
                <Dialog open={showDataModelTypeDialog} onOpenChange={setShowDataModelTypeDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Data Model</DialogTitle>
                      <DialogDescription>
                        Choose the type of data model you want to create
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <button
                        onClick={() => handleSelectDataModelType('internal')}
                        className="w-full p-6 text-left border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg">Internal Data Model</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Create a new data model within this space
                            </div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleSelectDataModelType('external')}
                        className="w-full p-6 text-left border-2 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ExternalLink className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg">External Data Source</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Connect to an external database
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDataModelTypeDialog(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Database Selection Dialog */}
                <Dialog open={showDatabaseSelection} onOpenChange={(open) => {
                  setShowDatabaseSelection(open)
                  if (!open) {
                    setDatabaseSearch('')
                  }
                }}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Select Database Type</DialogTitle>
                      <DialogDescription>
                        Choose the database type you want to connect to
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search databases..."
                          value={databaseSearch}
                          onChange={(e) => setDatabaseSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Database List */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredDatabaseTypes.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No databases found
                          </div>
                        ) : (
                          filteredDatabaseTypes.map((db) => (
                            <button
                              key={db.id}
                              onClick={() => handleSelectDatabase(db.id as 'postgres' | 'mysql')}
                              className="w-full p-4 text-left border rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-3xl">{db.icon}</div>
                                <div className="flex-1">
                                  <div className="font-semibold">{db.name}</div>
                                  <div className="text-sm text-muted-foreground">{db.description}</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowDatabaseSelection(false)
                        setShowDataModelTypeDialog(true)
                      }}>
                        Back
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Connection Form Dialog */}
                <Dialog open={showConnectionForm} onOpenChange={(open) => {
                  setShowConnectionForm(open)
                  if (!open) {
                    setConnectionTestResult(null)
                    setConnectionSchemas([])
                    setConnectionTables({})
                  }
                }}>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Configure External Connection</DialogTitle>
                      <DialogDescription>
                        Enter connection details for {selectedDatabaseType === 'postgres' ? 'PostgreSQL' : 'MySQL'} database
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Connection Name */}
                      <div>
                        <Label htmlFor="connection-name">Connection Name *</Label>
                        <Input
                          id="connection-name"
                          value={connectionForm.name}
                          onChange={(e) => setConnectionForm({ ...connectionForm, name: e.target.value })}
                          placeholder="e.g. Production Database"
                          className="mt-1"
                        />
                      </div>

                      {/* Host */}
                      <div>
                        <Label htmlFor="host">Host *</Label>
                        <Input
                          id="host"
                          value={connectionForm.host}
                          onChange={(e) => setConnectionForm({ ...connectionForm, host: e.target.value })}
                          placeholder="localhost or IP address"
                          className="mt-1"
                        />
                      </div>

                      {/* Port */}
                      <div>
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          type="number"
                          value={connectionForm.port}
                          onChange={(e) => setConnectionForm({ ...connectionForm, port: e.target.value })}
                          placeholder={connectionForm.db_type === 'postgres' ? '5432' : '3306'}
                          className="mt-1"
                        />
                      </div>

                      {/* Database */}
                      <div>
                        <Label htmlFor="database">Database</Label>
                        <Input
                          id="database"
                          value={connectionForm.database}
                          onChange={(e) => setConnectionForm({ ...connectionForm, database: e.target.value })}
                          placeholder="Database name"
                          className="mt-1"
                        />
                      </div>

                      {/* Username */}
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={connectionForm.username}
                          onChange={(e) => setConnectionForm({ ...connectionForm, username: e.target.value })}
                          placeholder="Database username"
                          className="mt-1"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={connectionForm.password}
                          onChange={(e) => setConnectionForm({ ...connectionForm, password: e.target.value })}
                          placeholder="Database password"
                          className="mt-1"
                        />
                      </div>

                      {/* Schema and Table Selection (shown after test) */}
                      {connectionTestResult?.success && connectionSchemas.length > 0 && (
                        <>
                          <div>
                            <Label htmlFor="schema">
                              Schema * {connectionForm.db_type === 'mysql' && <span className="text-xs text-muted-foreground">(typically the database name)</span>}
                            </Label>
                            <Select
                              value={connectionForm.schema}
                              onValueChange={(value) => {
                                setConnectionForm({ ...connectionForm, schema: value, table: '' })
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select schema" />
                              </SelectTrigger>
                              <SelectContent>
                                {connectionSchemas.map((schema) => (
                                  <SelectItem key={schema} value={schema}>
                                    {schema}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {connectionForm.schema && connectionTables[connectionForm.schema] && (
                            <div>
                              <Label htmlFor="table">Table *</Label>
                              <Select
                                value={connectionForm.table}
                                onValueChange={(value) => setConnectionForm({ ...connectionForm, table: value })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select table" />
                                </SelectTrigger>
                                <SelectContent>
                                  {connectionTables[connectionForm.schema].map((table) => (
                                    <SelectItem key={table} value={table}>
                                      {table}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      )}

                      {/* Test Result */}
                      {connectionTestResult && (
                        <div className={`p-4 rounded-lg ${
                          connectionTestResult.success
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                          <div className={`font-medium ${
                            connectionTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                          }`}>
                            {connectionTestResult.success ? '✓ Connection Successful' : '✗ Connection Failed'}
                          </div>
                          {connectionTestResult.error && (
                            <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                              {connectionTestResult.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowConnectionForm(false)
                          setShowDatabaseSelection(true)
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="outline"
                        onClick={testConnection}
                        disabled={testingConnection || !connectionForm.host}
                      >
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                      </Button>
                      <Button
                        onClick={saveExternalConnection}
                        disabled={
                          !connectionForm.name || 
                          !connectionForm.host || 
                          !connectionTestResult?.success || 
                          !connectionForm.table ||
                          (connectionForm.db_type === 'postgres' && !connectionForm.schema)
                        }
                      >
                        Save Connection
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              </TabsContent>

              <TabsContent value="restore" className="space-y-6 w-full">
                <Card className="bg-card">
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
                <Card className="bg-card">
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
                        <Select 
                          value={attachmentStorage.provider}
                          onValueChange={(value) => setAttachmentStorage({ 
                            ...attachmentStorage, 
                            provider: value 
                          })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select storage provider">
                              <div className="flex items-center gap-2">
                                {getStorageProviderIcon(attachmentStorage.provider)}
                                <span>{getStorageProviderLabel(attachmentStorage.provider)}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minio">
                              <div className="flex items-center gap-2">
                                {getStorageProviderIcon('minio')}
                                <span>MinIO (Default)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="s3">
                              <div className="flex items-center gap-2">
                                {getStorageProviderIcon('s3')}
                                <span>AWS S3</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="sftp">
                              <div className="flex items-center gap-2">
                                {getStorageProviderIcon('sftp')}
                                <span>SFTP</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="ftp">
                              <div className="flex items-center gap-2">
                                {getStorageProviderIcon('ftp')}
                                <span>FTP</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                            className="border-0"
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
                              <Button variant="outline" className="border-0" onClick={() => {}}>
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
            {/* <style jsx>{`
              .flat-cards :global(.bg-card) { background-color: transparent !important; }
              .flat-cards :global(.shadow-sm) { box-shadow: none !important; }
              .flat-cards :global(.border) { border-width: 0 !important; }
              :global(input:not([class*="border"])) { 
                border: 1px solid hsl(var(--border)) !important; 
                background-color: hsl(var(--background)) !important; 
              }
              :global(textarea:not([class*="border"])) { 
                border: 1px solid hsl(var(--border)) !important; 
                background-color: hsl(var(--background)) !important; 
              }
              :global([data-state="active"]) { 
                border-bottom: none !important; 
              }
              :global(.tabs-trigger) { 
                border-bottom: none !important; 
              }
            `}</style> */}
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
    </div>
  )
}



