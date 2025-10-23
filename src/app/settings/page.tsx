'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useSpace } from '@/contexts/space-context'
import SpacesManager from './components/SpacesManager'
import { EnhancedUserManagement } from './components/EnhancedUserManagement'
import toast from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Combobox } from '@/components/ui/combobox'
import { ColorPicker } from '@/components/ui/color-picker'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Settings as SettingsIcon,
  Users,
  Shield,
  Database,
  FileText,
  Upload,
  Download,
  Palette,
  Trash2,
  History,
  Edit,
  Building2,
  GitBranch,
  FolderTree,
  Calendar,
  Briefcase,
  UserCheck,
  X,
  Layout,
  Type,
  Image,
  ArrowUp,
  ArrowDown,
  Pin,
  PinOff,
  Plus,
  LayoutDashboard,
  GripVertical,
  Box,
  Tag,
  Settings,
  Key
} from 'lucide-react'
import { ColorPicker, ColorSwatch } from '@/components/ui/color-swatch'
import IconPicker from '@/components/ui/icon-picker'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { useSidebar } from '@/contexts/sidebar-context'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { createPortal } from 'react-dom'
import { Z_INDEX } from '@/lib/z-index'
import * as LucideIcons from 'lucide-react'
// ERDInlineView no longer used in Settings; shown on Data Models page instead
import { AuditLogsAdvanced } from '@/components/ui/audit-logs-advanced'
import { ScrollableTable } from '@/components/ui/scrollable-table'
import { FaviconUpload } from '@/components/ui/favicon-upload'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function DynamicModelIcon({ name, className }: { name?: string, className?: string }) {
  if (!name) return (
    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded bg-black/10">?</span>
  )
  const AnyIcons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  const Icon = AnyIcons[name]
  if (!Icon) return (
    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded bg-black/10">?</span>
  )
  return <Icon className={className} />
}

export default function SettingsPage() {
  const { currentSpace } = useSpace()
  const [deletePolicyDays, setDeletePolicyDays] = useState(30)
  const [faviconUrl, setFaviconUrl] = useState('')
  
  // Sidebar Configuration
  const { settings: sidebarSettings, updateSettings: updateSidebarSettings, resetSettings: resetSidebarSettings } = useSidebar()
  
  // Data Model Management State (loaded from API)
  const [dataModels, setDataModels] = useState<any[]>([])
  const [showErdInline, setShowErdInline] = useState(false)
  const [dataModelsLoading, setDataModelsLoading] = useState(false)
  const [dataModelsError, setDataModelsError] = useState<string | null>(null)
  const [showDataModelDialog, setShowDataModelDialog] = useState(false)
  const [showDataModelDrawer, setShowDataModelDrawer] = useState(false)
  const [editingDataModel, setEditingDataModel] = useState<any>(null)
  const [dataModelForm, setDataModelForm] = useState<{ name: string; slug: string; description: string; status: string; icon: string; tags: string[]; source_type: 'INTERNAL' | 'EXTERNAL'; space_ids: string[] }>({ name: '', slug: '', description: '', status: 'Active', icon: '', tags: [], source_type: 'INTERNAL', space_ids: [] })
  const [externalForm, setExternalForm] = useState<{ db_type: 'postgres' | 'mysql'; host: string; port: string; database: string; username: string; password: string; schema: string; table: string; allow_edit: boolean }>({ db_type: 'postgres', host: '', port: '', database: '', username: '', password: '', schema: '', table: '', allow_edit: false })
  const [testConnLoading, setTestConnLoading] = useState(false)
  const [schemas, setSchemas] = useState<string[]>([])
  const [tablesBySchema, setTablesBySchema] = useState<Record<string, string[]>>({})
  const [columnsPreview, setColumnsPreview] = useState<Array<{ name: string; data_type: string; is_nullable: boolean; is_primary_key: boolean }>>([])
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([])
  const [spacesLoading, setSpacesLoading] = useState(false)
  const [dataModelSpaces, setDataModelSpaces] = useState<any[]>([])

  function HistoryList({ dataModelId }: { dataModelId?: string }) {
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    const load = async (reset = false) => {
      if (!dataModelId) return
      try {
        setLoading(true)
        const p = reset ? 1 : page
        const qs = new URLSearchParams({ entityType: 'DataModel', entityId: dataModelId, page: String(p), limit: '20' })
        const res = await fetch(`/api/audit-logs?${qs.toString()}`)
        const json = await res.json()
        if (res.ok) {
          const newItems = json.data || []
          setItems(reset ? newItems : [...items, ...newItems])
          const total = json.pagination?.total || 0
          const loaded = (reset ? newItems.length : items.length + newItems.length)
          setHasMore(loaded < total)
          setPage(p + 1)
        }
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => { setItems([]); setPage(1); setHasMore(true); load(true) }, [dataModelId])

    if (!dataModelId) return <div className="text-sm text-muted-foreground">Select a data model to view history.</div>

    return (
      <div className="space-y-0">
        {items.length === 0 && !loading && (
          <div className="text-sm text-muted-foreground">No changes yet.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex items-start py-3 border-b last:border-b-0">
            <div className={`w-2 h-2 rounded-full mr-3 mt-2 ${it.action === 'UPDATE' ? 'bg-yellow-500' : it.action === 'DELETE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{it.action} {it.entity_type}</span>
                <span className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground">{it.user_name || it.user_email || 'System'}</div>
              {it.old_value || it.new_value ? (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium">Before</div>
                    <pre className="text-xs bg-muted/30 p-2 rounded overflow-auto max-h-40">{JSON.stringify(it.old_value, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="text-xs font-medium">After</div>
                    <pre className="text-xs bg-muted/30 p-2 rounded overflow-auto max-h-40">{JSON.stringify(it.new_value, null, 2)}</pre>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{loading ? 'Loading…' : items.length ? `${items.length} loaded` : ''}</div>
          {hasMore && (
            <Button variant="outline" size="sm" onClick={() => load(false)} disabled={loading}>Load More</Button>
          )}
        </div>
      </div>
    )
  }
  
  // Tags and Organization State
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string>('')
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  
  // Search State
  const [dataModelSearch, setDataModelSearch] = useState('')
  
  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings = await response.json()
          setDeletePolicyDays(settings.deletePolicyDays || 30)
          setFaviconUrl(settings.faviconUrl || '')
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  // Save settings
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            deletePolicyDays,
            faviconUrl,
          },
        }),
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  }

  // Filtered data models based on search and tag filter
  const filteredDataModels = useMemo(() => {
    return dataModels.filter(model => {
      const matchesSearch = !dataModelSearch || 
        model.name.toLowerCase().includes(dataModelSearch.toLowerCase()) ||
        model.display_name?.toLowerCase().includes(dataModelSearch.toLowerCase()) ||
        model.description?.toLowerCase().includes(dataModelSearch.toLowerCase())
      
      const matchesTag = !tagFilter || 
        (model.tags && model.tags.includes(tagFilter))
      
      return matchesSearch && matchesTag
    })
  }, [dataModels, dataModelSearch, tagFilter])
  
  // Attribute Management State
  const [showAttributeDialog, setShowAttributeDialog] = useState(false)
  const [showAttributeDetail, setShowAttributeDetail] = useState(false)
  
  const [editingAttribute, setEditingAttribute] = useState<any>(null)
  const [selectedDataModel, setSelectedDataModel] = useState<any>(null)
  const [attributeForm, setAttributeForm] = useState({
    name: '',
    display_name: '',
    data_type: 'TEXT',
    description: '',
    is_required: false,
    is_unique: false,
    min_length: 0,
    max_length: 0,
    default_value: '',
    tooltip: '',
    validation_rules: '',
    options: [],
    order_index: 0,
    is_auto_increment: false,
    auto_increment_prefix: '',
    auto_increment_suffix: '',
    auto_increment_start: 1,
    auto_increment_padding: 3
  })
  type AttributeOption = { value: string; label: string; color: string; order: number }
  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([])
  
  // Data Entity configuration state
  const [selectedDataModelForEntity, setSelectedDataModelForEntity] = useState('')
  const [selectedAttributeForEntity, setSelectedAttributeForEntity] = useState('')
  const [availableDataModels, setAvailableDataModels] = useState<any[]>([])
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([])

  // Attributes state loaded from API
  const [attributes, setAttributes] = useState<any[]>([])
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [attributesError, setAttributesError] = useState<string | null>(null)
  const [attributeSearch, setAttributeSearch] = useState('')
  const [attributeTypeFilter, setAttributeTypeFilter] = useState('all')

  // Filter attributes based on search term and type filter
  const filteredAttributes = useMemo(() => {
    let filtered = attributes

    // Apply search filter
    if (attributeSearch.trim()) {
      const searchLower = attributeSearch.toLowerCase()
      filtered = filtered.filter(attr => 
        attr.display_name?.toLowerCase().includes(searchLower) ||
        attr.name?.toLowerCase().includes(searchLower) ||
        attr.data_type?.toLowerCase().includes(searchLower) ||
        attr.description?.toLowerCase().includes(searchLower)
      )
    }

    // Apply type filter
    if (attributeTypeFilter && attributeTypeFilter !== 'all') {
      filtered = filtered.filter(attr => attr.data_type === attributeTypeFilter)
    }

    return filtered
  }, [attributes, attributeSearch, attributeTypeFilter])

  async function loadAttributes(dataModelId: string) {
    setAttributesLoading(true)
    setAttributesError(null)
    try {
      const res = await fetch(`/api/data-models/${dataModelId}/attributes`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load attributes')
      }
      const json = await res.json()
      setAttributes(json.attributes || [])
    } catch (e: any) {
      setAttributesError(e.message || 'Failed to load attributes')
    } finally {
      setAttributesLoading(false)
    }
  }

  // Load available data models for data entity configuration
  async function loadAvailableDataModels() {
    try {
      const spaceParam = currentSpace?.id ? `&space_id=${currentSpace.id}` : ''
      const res = await fetch(`/api/data-models?page=1&limit=100${spaceParam}`, { cache: 'no-store' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load data models')
      }
      const json = await res.json()
      setAvailableDataModels(json.dataModels || [])
    } catch (e: any) {
      console.error('Failed to load data models:', e)
    }
  }

  // Load attributes for selected data model in data entity configuration
  async function loadAvailableAttributes(dataModelId: string) {
    if (!dataModelId) {
      setAvailableAttributes([])
      return
    }
    try {
      const res = await fetch(`/api/data-models/${dataModelId}/attributes`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load attributes')
      }
      const json = await res.json()
      setAvailableAttributes(json.attributes || [])
    } catch (e: any) {
      console.error('Failed to load attributes:', e)
      setAvailableAttributes([])
    }
  }

  // Data Model Action Handlers
  const handleCreateDataModel = () => {
    setEditingDataModel(null)
    setDataModelForm({ 
      name: '', 
      slug: '',
      description: '', 
      status: 'Active', 
      icon: '', 
      tags: [], 
      source_type: 'INTERNAL',
      space_ids: currentSpace?.id ? [currentSpace.id] : []
    })
    setSelectedDataModel(null)
    setShowDataModelDrawer(true)
    // Clear attributes for new data model
    setAttributes([])
    setAttributesError(null)
  }

  // Tag Management Functions
  const addTag = (tagName: string) => {
    if (tagName.trim() && !dataModelForm.tags.includes(tagName.trim())) {
      setDataModelForm(prev => ({ ...prev, tags: [...prev.tags, tagName.trim()] }))
    }
  }

  const removeTag = (tagName: string) => {
    setDataModelForm(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagName) }))
  }

  const createNewTag = () => {
    if (newTagName.trim() && !availableTags.includes(newTagName.trim())) {
      setAvailableTags(prev => [...prev, newTagName.trim()])
      addTag(newTagName.trim())
      setNewTagName('')
    }
  }

  const deleteTag = (tagName: string) => {
    setAvailableTags(prev => prev.filter((tag: string) => tag !== tagName))
    // Remove tag from all data models
    setDataModels(prev => prev.map((model: any) => ({
      ...model,
      tags: (model.tags as string[])?.filter((tag: string) => tag !== tagName) || []
    })))
  }

  const handleEditDataModel = async (model: any) => {
    setEditingDataModel(model)
    setSelectedDataModel(model)
    setDataModelForm({ 
      name: model.name, 
      slug: model.slug || '',
      description: model.description || '', 
      status: model.status || 'Active',
      icon: model.icon || '',
      tags: model.tags || [],
      source_type: (model.source_type as any) || 'INTERNAL',
      space_ids: [] // Will be loaded below
    })
    setShowDataModelDrawer(true)
    // Load attributes for the selected data model
    if (model?.id) {
      loadAttributes(model.id)
      // Load spaces associated with this data model
      await loadDataModelSpaces(model.id)
    }
  }

  async function loadDataModels() {
    setDataModelsLoading(true)
    setDataModelsError(null)
    try {
      const spaceParam = currentSpace?.id ? `&space_id=${currentSpace.id}` : ''
      const res = await fetch(`/api/data-models?page=1&limit=100${spaceParam}`, { cache: 'no-store' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load data models')
      }
      const json = await res.json()
      setDataModels(json.dataModels || [])
    } catch (e: any) {
      setDataModelsError(e.message || 'Failed to load data models')
    } finally {
      setDataModelsLoading(false)
    }
  }

  useEffect(() => { loadDataModels() }, [currentSpace?.id])

  // Load available spaces for the user
  const loadAvailableSpaces = async () => {
    setSpacesLoading(true)
    try {
      const res = await fetch('/api/spaces?page=1&limit=100')
      if (res.ok) {
        const json = await res.json()
        setAvailableSpaces(json.spaces || [])
      }
    } catch (e) {
      console.error('Failed to load spaces:', e)
    } finally {
      setSpacesLoading(false)
    }
  }

  // Load spaces associated with a data model
  const loadDataModelSpaces = async (dataModelId: string) => {
    try {
      const res = await fetch(`/api/data-models/${dataModelId}/spaces`)
      if (res.ok) {
        const json = await res.json()
        setDataModelSpaces(json.spaces || [])
        setDataModelForm(prev => ({ ...prev, space_ids: json.spaces.map((s: any) => s.id) }))
      }
    } catch (e) {
      console.error('Failed to load data model spaces:', e)
    }
  }

  useEffect(() => {
    loadAvailableSpaces()
  }, [])

  const handleSaveDataModel = async () => {
    if (!dataModelForm.name.trim()) return
    if (!dataModelForm.space_ids.length) {
      toast.error('Please select at least one space')
      return
    }

    try {
    if (editingDataModel) {
        // Update data model basic info
        const res = await fetch(`/api/data-models/${editingDataModel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: dataModelForm.name, slug: dataModelForm.slug, description: dataModelForm.description, icon: dataModelForm.icon, source_type: dataModelForm.source_type, allow_external_edit: externalForm.allow_edit, external_schema: externalForm.schema || null, external_table: externalForm.table || null })
        })
        if (!res.ok) throw new Error('Update failed')
        
        // Update space associations
        const spaceRes = await fetch(`/api/data-models/${editingDataModel.id}/spaces`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ space_ids: dataModelForm.space_ids })
        })
        if (!spaceRes.ok) throw new Error('Failed to update space associations')
    } else {
        const res = await fetch('/api/data-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: dataModelForm.name, 
            display_name: dataModelForm.name, 
            description: dataModelForm.description, 
            icon: dataModelForm.icon, 
            source_type: dataModelForm.source_type, 
            space_ids: dataModelForm.space_ids,
            slug: dataModelForm.slug,
            allow_external_edit: externalForm.allow_edit, 
            external_schema: externalForm.schema || null, 
            external_table: externalForm.table || null 
          })
        })
        if (!res.ok) throw new Error('Create failed')
      }
      await loadDataModels()
    setShowDataModelDrawer(false)
    setEditingDataModel(null)
      setDataModelForm({ name: '', slug: '', description: '', status: 'Active', icon: '', tags: [], space_ids: [], source_type: 'INTERNAL' })
      setExternalForm({ db_type: 'postgres', host: '', port: '', database: '', username: '', password: '', schema: '', table: '', allow_edit: false })
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
  }

  const handleDeleteDataModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this data model?')) return
    try {
      const res = await fetch(`/api/data-models/${modelId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await loadDataModels()
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    try {
      // Update sort orders for affected models
      const newModels = Array.from(dataModels)
      const [reorderedItem] = newModels.splice(sourceIndex, 1)
      newModels.splice(destinationIndex, 0, reorderedItem)

      // Update sort orders
      const updates = newModels.map((model, index) => ({
        id: model.id,
        sort_order: index * 100 // Use increments of 100 for easier reordering
      }))

      // Batch update all affected models
      await Promise.all(updates.map(update => 
        fetch(`/api/data-models/${update.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: update.sort_order })
        })
      ))

      await loadDataModels()
    } catch (e: any) {
      toast.error(e.message || 'Sort failed')
    }
  }

  const handleTogglePin = async (modelId: string) => {
    try {
      const model = dataModels.find(m => m.id === modelId)
      if (!model) return
      
      const res = await fetch(`/api/data-models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !model.is_pinned })
      })
      if (!res.ok) throw new Error('Pin toggle failed')
      await loadDataModels()
      
      // Show success toast
      toast.success(model.is_pinned ? 'Data model unpinned from sidebar' : 'Data model pinned to sidebar')
    } catch (e: any) {
      toast.error(e.message || 'Pin toggle failed')
    }
  }


  // Attribute Management Handlers
  const handleManageAttributes = (model: any) => {
    setSelectedDataModel(model)
    setShowAttributeDialog(true)
    setAttributeSearch('') // Clear search when opening attribute management
    setAttributeTypeFilter('all') // Clear type filter when opening attribute management
    if (model?.id) {
      loadAttributes(model.id)
    }
  }

  const handleCreateAttribute = () => {
    setEditingAttribute(null)
    setAttributeForm({
      name: 'id', // Primary key as attribute_code
      display_name: '',
      data_type: 'TEXT',
      description: '',
      is_required: false,
      is_unique: false,
      min_length: 0,
      max_length: 0,
      default_value: '',
      tooltip: '',
      validation_rules: '',
      options: [],
      order_index: 0,
      is_auto_increment: false,
      auto_increment_prefix: '',
      auto_increment_suffix: '',
      auto_increment_start: 1,
      auto_increment_padding: 3
    })
    setAttributeOptions([])
    setSelectedDataModelForEntity('')
    setSelectedAttributeForEntity('')
    loadAvailableDataModels() // Load data models for data entity configuration
    setShowAttributeDetail(true)
  }

  const handleEditAttribute = (attribute: any) => {
    console.log('Edit attribute clicked:', attribute)
    setEditingAttribute(attribute)
    setAttributeForm({
      name: attribute.name,
      display_name: attribute.display_name,
      data_type: attribute.data_type,
      description: attribute.description || '',
      is_required: attribute.is_required,
      is_unique: attribute.is_unique,
      min_length: attribute.min_length || 0,
      max_length: attribute.max_length || 0,
      default_value: attribute.default_value || '',
      tooltip: attribute.tooltip || '',
      validation_rules: attribute.validation_rules || '',
      options: attribute.options || [],
      order_index: attribute.order_index || 0,
      is_auto_increment: attribute.is_auto_increment || false,
      auto_increment_prefix: attribute.auto_increment_prefix || '',
      auto_increment_suffix: attribute.auto_increment_suffix || '',
      auto_increment_start: attribute.auto_increment_start || 1,
      auto_increment_padding: attribute.auto_increment_padding || 3
    })
    setAttributeOptions(attribute.options || [])
    // Load options from API if attribute has an ID
    if (attribute.id) {
      loadAttributeOptions(attribute.id)
    }
    console.log('Opening attribute detail drawer')
    setShowAttributeDetail(true)
  }

  const handleSaveAttribute = async () => {
    if (!attributeForm.name.trim()) return

    const attributeData = {
      ...attributeForm,
      options: attributeOptions.filter(opt => opt.value.trim() && opt.label.trim()).map((opt, index) => ({ ...opt, order: index })),
      // Include data entity configuration if type is DATA_ENTITY
      ...(attributeForm.data_type === 'DATA_ENTITY' && {
        data_entity_model_id: selectedDataModelForEntity,
        data_entity_attribute_id: selectedAttributeForEntity
      })
    }

    try {
      if (!selectedDataModel?.id) throw new Error('No data model selected')
      if (editingAttribute) {
        // Map our form data to the API's expected format
        const updateData = {
          name: attributeData.name,
          display_name: attributeData.display_name,
          type: attributeData.data_type, // Map data_type to type
          is_required: attributeData.is_required,
          is_unique: attributeData.is_unique,
          default_value: attributeData.default_value,
          options: attributeData.options,
          validation: attributeData.validation_rules ? { rules: attributeData.validation_rules } : null,
          order: attributeData.order_index,
          is_active: true
        }
        
        const res = await fetch(`/api/data-models/attributes/${editingAttribute.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to update attribute')
        }
        
        const result = await res.json()
        const updatedAttribute = result.attribute
        
        // Update attribute options if we have valid options
        if (updatedAttribute?.id && attributeData.options?.length > 0) {
          try {
            const optionsRes = await fetch(`/api/data-models/${selectedDataModel.id}/attributes/${updatedAttribute.id}/options`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ options: attributeData.options })
            })
            if (!optionsRes.ok) {
              console.error('Failed to save attribute options')
            }
          } catch (error) {
            console.error('Error saving attribute options:', error)
          }
        }
      } else {
        const res = await fetch(`/api/data-models/${selectedDataModel.id}/attributes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attributeData)
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to create attribute')
        }
        
        const result = await res.json()
        const newAttribute = result.attribute
        
        // Save attribute options if we have valid options
        if (newAttribute?.id && attributeData.options?.length > 0) {
          try {
            const optionsRes = await fetch(`/api/data-models/${selectedDataModel.id}/attributes/${newAttribute.id}/options`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ options: attributeData.options })
            })
            if (!optionsRes.ok) {
              console.error('Failed to save attribute options')
            }
          } catch (error) {
            console.error('Error saving attribute options:', error)
          }
        }
      }
      await loadAttributes(selectedDataModel.id)
      
      // Show success message
      toast.success(editingAttribute ? 'Attribute updated successfully' : 'Attribute created successfully')
      
      setShowAttributeDetail(false)
      setEditingAttribute(null)
      setAttributeForm({
        name: '',
        display_name: '',
        data_type: 'TEXT',
        description: '',
        is_required: false,
        is_unique: false,
        min_length: 0,
        max_length: 0,
        default_value: '',
        tooltip: '',
        validation_rules: '',
        options: [],
        order_index: 0,
        is_auto_increment: false,
        auto_increment_prefix: '',
        auto_increment_suffix: '',
        auto_increment_start: 1,
        auto_increment_padding: 3
      })
      setAttributeOptions([])
    } catch (e: any) {
      toast.error(e.message || 'Save attribute failed')
    }
  }

  const handleDeleteAttribute = (attributeId: string) => {
    console.log('Delete attribute clicked:', attributeId)
    if (confirm('Are you sure you want to delete this attribute?')) {
      console.log('Deleting attribute:', attributeId)
      // TODO: Implement actual deletion
    }
  }

  const addAttributeOption = () => {
    setAttributeOptions(prev => [...prev, { value: '', label: '', color: '#3B82F6', order: prev.length }])
  }

  const removeAttributeOption = (index: number) => {
    setAttributeOptions(prev => prev.filter((_, i) => i !== index))
  }

  const updateAttributeOption = (index: number, field: 'value' | 'label' | 'color', value: string) => {
    setAttributeOptions(prev => prev.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    ))
  }

  const handleAttributeOptionsDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(attributeOptions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order indices
    const updatedItems = items.map((item, index) => ({ ...item, order: index }))
    setAttributeOptions(updatedItems)
  }

  // Load attribute options from API
  const loadAttributeOptions = async (attributeId: string) => {
    try {
      const res = await fetch(`/api/data-models/${selectedDataModel?.id}/attributes/${attributeId}/options`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load options')
      }
      const json = await res.json()
      setAttributeOptions(json.options || [])
    } catch (e: any) {
      console.error('Failed to load attribute options:', e)
    }
  }

  // Save attribute options to API
  const saveAttributeOptions = async (attributeId: string) => {
    try {
      const validOptions = attributeOptions.filter(opt => opt.value.trim() && opt.label.trim())
      const res = await fetch(`/api/data-models/${selectedDataModel?.id}/attributes/${attributeId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: validOptions })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save options')
      }
    } catch (e: any) {
      console.error('Failed to save attribute options:', e)
    }
  }

  return (
    <MainLayout>
      <Tabs defaultValue="system" orientation="vertical" className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-64 bg-card border-r flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">System Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Applied to all spaces</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            <TabsList className="w-full flex-col h-auto bg-transparent">
              <TabsTrigger className="justify-start w-full" value="system">System</TabsTrigger>
              <TabsTrigger className="justify-start w-full" value="api-docs">API Docs</TabsTrigger>
              <TabsTrigger className="justify-start w-full" value="users">Users</TabsTrigger>
            </TabsList>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-6">
            {/* System Settings */}
            <TabsContent value="system" className="space-y-6 w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5" />
                    <span>System Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide settings and policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="delete-policy">Delete Policy (Days)</Label>
                    <Input
                      id="delete-policy"
                      type="number"
                      value={deletePolicyDays}
                      onChange={(e) => setDeletePolicyDays(Number(e.target.value))}
                      placeholder="30"
                    />
                    <p className="text-sm text-muted-foreground">
                      Number of days to keep deleted data before permanent removal
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Audit Trail</Label>
                      <p className="text-sm text-muted-foreground">
                        Track all system activities and changes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Real-time Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable Server-Sent Events for real-time data updates
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Favicon Settings */}
              <FaviconUpload
                currentFavicon={faviconUrl}
                onFaviconChange={setFaviconUrl}
                onRemove={() => setFaviconUrl('')}
              />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={saveSettings} className="w-full sm:w-auto">
                  Save Settings
                </Button>
              </div>
            </TabsContent>


            {/* Sidebar Configuration */}
            <TabsContent value="sidebar" className="space-y-6 w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Layout className="h-5 w-5" />
                    <span>Sidebar Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Customize the appearance and behavior of the sidebar
                  </CardDescription>
                  <div className="mt-4">
                    <Link href={`/${currentSpace?.slug || currentSpace?.id}/studio`}>
                      <Button className="w-full">
                        <Layout className="h-4 w-4 mr-2" />
                        Open Space Studio
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-2">
                      Use the advanced Space Studio to create custom layouts, configure sidebar items, and build pages with drag-and-drop components.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sidebar Size */}
                  <div className="space-y-2">
                    <Label>Sidebar Size</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant={sidebarSettings.size === 'small' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSidebarSettings({ size: 'small' })}
                      >
                        Small (200px)
                      </Button>
                      <Button
                        variant={sidebarSettings.size === 'medium' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSidebarSettings({ size: 'medium' })}
                      >
                        Medium (256px)
                      </Button>
                      <Button
                        variant={sidebarSettings.size === 'large' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSidebarSettings({ size: 'large' })}
                      >
                        Large (320px)
                      </Button>
                    </div>
                    </div>

                  {/* Background Type */}
                  <div className="space-y-2">
                    <Label>Background Type</Label>
                    <RadioGroup value={sidebarSettings.backgroundType} onValueChange={(value: string) => updateSidebarSettings({ backgroundType: value as 'color' | 'image' })} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="color" id="color" />
                        <label htmlFor="color" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center space-x-2">
                          <Palette className="h-4 w-4" />
                          <span>Color</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="image" />
                        <label htmlFor="image" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center space-x-2">
                          <Image className="h-4 w-4" />
                          <span>Image</span>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Background Color */}
                  {sidebarSettings.backgroundType === 'color' && (
                    <ColorPicker
                      label="Background Color"
                      value={sidebarSettings.backgroundColor}
                      onChange={(color) => updateSidebarSettings({ backgroundColor: color })}
                    />
                  )}

                  {/* Background Image */}
                  {sidebarSettings.backgroundType === 'image' && (
                    <div className="space-y-2">
                      <Label>Background Image</Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                updateSidebarSettings({ backgroundImage: e.target?.result as string })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                      {sidebarSettings.backgroundImage && (
                        <div className="mt-2">
                          <img
                            src={sidebarSettings.backgroundImage}
                            alt="Sidebar background preview"
                            className="w-32 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Font Color */}
                  <ColorPicker
                    label="Font Color"
                    value={sidebarSettings.fontColor}
                    onChange={(color) => updateSidebarSettings({ fontColor: color })}
                  />

                  

                  {/* Save Settings */}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetSidebarSettings}>Reset to Default</Button>
                    <Button onClick={() => {
                      // Settings are automatically saved via context
                      toast.success('Sidebar settings saved!')
                    }}>Save Sidebar Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spaces - removed (moved to Space Settings) */}
            {/* <TabsContent value="spaces" className="space-y-6 w-full"> */}
              <div className="p-6">
                {/* Embedded Spaces Manager */}
                <div>
                  {showErdInline && (
                    <div className="mb-6 border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">ERD Diagram</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowErdInline(false)}>Close</Button>
                      </div>
                      {/* ERD view removed from Settings; open from Data Models page */}
                    </div>
                  )}
                  {/* <SpacesManager /> */}
                </div>
              </div>
            {/* </TabsContent> */}

            {/* Data Model - moved to Space Settings */}
            {false && (
            <TabsContent value="data-model" className="space-y-6 w-full">
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Data Model Management</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create, update, and manage data models and their attributes
                  </p>
                </div>
                
                {/* Top Actions + Search */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Input 
                        placeholder="Search data models by name, display name, or description..." 
                        value={dataModelSearch} 
                        onChange={(e) => setDataModelSearch(e.target.value)} 
                        className={dataModelSearch ? 'pr-8' : ''}
                      />
                      {dataModelSearch && (
                        <button
                          onClick={() => setDataModelSearch('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground hidden sm:block">
                      {filteredDataModels.length} of {dataModels.length} data models
                    </div>
                    <Button onClick={handleCreateDataModel}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Data Model
                    </Button>
                  </div>
                </div>
                
                <div>
                  {/* Tag Filter Section */}
                  <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Filter by Tags:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={tagFilter === '' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTagFilter('')}
                          >
                            All
                          </Button>
                          {availableTags.map(tag => (
                            <Button
                              key={tag}
                              variant={tagFilter === tag ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                            >
                              {tag}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTagManager(true)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage Tags
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  {/* Tag Filter Section */}
                  <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Filter by Tags:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={tagFilter === '' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTagFilter('')}
                          >
                            All
                          </Button>
                          {availableTags.map(tag => (
                            <Button
                              key={tag}
                              variant={tagFilter === tag ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                            >
                              {tag}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTagManager(true)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage Tags
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3">Data Model</th>
                            <th className="text-left p-3">Records</th>
                            <th className="text-left p-3">Tags</th>
                            <th className="text-center p-3">Pin</th>
                            <th className="text-right p-3">Actions</th>
                          </tr>
                        </thead>
                          <Droppable droppableId="data-models">
                            {(provided) => (
                              <tbody ref={provided.innerRef} {...provided.droppableProps}>
                          {filteredDataModels.map((model, index) => (
                                  <Draggable key={model.id} draggableId={model.id} index={index}>
                                    {(provided, snapshot) => (
                                      <tr 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`border-t hover:bg-muted/50 cursor-pointer ${snapshot.isDragging ? 'bg-blue-50' : ''}`}
                                      >
                              <td className="p-3">
                                <div className="flex items-center space-x-3">
                                            <div 
                                              {...provided.dragHandleProps}
                                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                                              title="Drag to reorder"
                                            >
                                              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                                              </svg>
                                            </div>
                                            <DynamicModelIcon name={model.icon} className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col">
                                              <span className="font-medium">{model.display_name || model.name}</span>
                                              {model.space_slugs && model.space_slugs.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {model.space_slugs.map((slug: string, slugIndex: number) => (
                                                    <span
                                                      key={slugIndex}
                                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800"
                                                    >
                                                      {slug}
                                                    </span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                </div>
                              </td>
                              <td className="p-3">
                                          <span className="text-muted-foreground">{model.count?.toLocaleString?.() || 0} records</span>
                              </td>
                              <td className="p-3">
                                {model.tags && model.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {model.tags.map((tag: string, tagIndex: number) => (
                                      <span
                                        key={tagIndex}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                                        <td className="p-3 text-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                            onClick={(e) => { e.stopPropagation(); handleTogglePin(model.id); }}
                                            title={model.is_pinned ? "Unpin from Sidebar" : "Pin to Sidebar"}
                                            className={model.is_pinned ? "text-blue-600" : "text-gray-400"}
                                          >
                                            {model.is_pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                                  </Button>
                                        </td>
                                        <td className="p-3">
                                          <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                              onClick={(e) => { e.stopPropagation(); handleEditDataModel(model); }}
                                    title="Edit Data Model"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                              onClick={(e) => { e.stopPropagation(); handleDeleteDataModel(model.id); }}
                                    title="Delete Data Model"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                                    )}
                                  </Draggable>
                          ))}
                                {provided.placeholder}
                        </tbody>
                            )}
                          </Droppable>
                      </table>
                    </div>
                    </DragDropContext>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline" onClick={() => setShowErdInline(true)}>
                        <LucideIcons.GitBranch className="mr-2 h-4 w-4" />
                        ERD View
                      </Button>
                      <Button className="flex-1" onClick={handleCreateDataModel}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Data Model
                      </Button>
                    </div>
                  </div>
                </div>
                </div>
            </TabsContent>
            )}

            {/* API Documentation */}
            <TabsContent value="api-docs" className="space-y-6 w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Swagger API Documentation</span>
                  </CardTitle>
                  <CardDescription>
                    Access the complete API documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The Swagger API documentation provides comprehensive information about all available endpoints,
                      request/response schemas, and authentication methods.
                    </p>
                    <Button onClick={() => window.open('/api-docs', '_blank')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Open API Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Logs */}
            <TabsContent value="audit-logs" className="space-y-6 w-full">
              <AuditLogsAdvanced />
            </TabsContent>

            {/* Restore Data */}
            <TabsContent value="restore" className="space-y-6 w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trash2 className="h-5 w-5" />
                    <span>Restore Data</span>
                  </CardTitle>
                  <CardDescription>
                    Restore deleted data within the retention period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      All deleted data is kept for {deletePolicyDays} days before permanent removal.
                      You can restore any data that hasn't exceeded this retention period.
                    </p>
                    
                    <div className="space-y-2">
                      <Label>Deleted Records</Label>
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">No deleted records found</p>
                      </div>
                    </div>
                    
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      View All Deleted Records
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management */}
            <TabsContent value="users" className="space-y-6 w-full">
              <Tabs defaultValue="user-management" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user-management">User Management</TabsTrigger>
                  <TabsTrigger value="roles-permissions">Roles & Permissions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="user-management" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>User Management</span>
                      </CardTitle>
                      <CardDescription>
                        Manage users, teams, roles, and permissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EnhancedUserManagement />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="roles-permissions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Roles & Permissions</span>
                      </CardTitle>
                      <CardDescription>
                        Create roles and assign permissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RolesSection />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Data Model Drawer */}
      {showDataModelDrawer && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDataModelDrawer(false)} style={{ zIndex: Z_INDEX.overlay }} />
          <div className="fixed right-0 top-0 h-screen w-[960px] bg-white shadow-2xl flex flex-col" style={{ zIndex: Z_INDEX.drawer }}>
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">{editingDataModel ? 'Edit Data Model' : 'Create New Data Model'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDataModelDrawer(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="model" className="h-full flex flex-col">
                <TabsList className="flex justify-start w-full p-4 gap-0">
                  <TabsTrigger value="model" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
                    <Database className="h-4 w-4" />
                    Model detail
                  </TabsTrigger>
                  <TabsTrigger value="attributes" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
                    <Box className="h-4 w-4" />
                    Attribute list
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="model" className="flex-1 overflow-auto p-6 space-y-6">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="data-model-name">Name</Label>
                            <p className="text-xs text-muted-foreground">The internal name used for the data model. This will be used in API calls and database references.</p>
                            <Input
                              id="data-model-name"
                              value={dataModelForm.name}
                              onChange={(e) => {
                                const name = e.target.value
                                const toSlug = (t: string) => (t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
                                setDataModelForm({ ...dataModelForm, name, slug: dataModelForm.slug ? dataModelForm.slug : toSlug(name) })
                              }}
                              placeholder="Enter data model name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="data-model-slug">Slug</Label>
                            <p className="text-xs text-muted-foreground">URL-friendly identifier. Auto-generated from the name but can be customized.</p>
                            <Input
                              id="data-model-slug"
                              value={dataModelForm.slug}
                              onChange={(e) => setDataModelForm({ ...dataModelForm, slug: (e.target.value || '').toLowerCase() })}
                              placeholder="auto-generated-from-name"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data-model-description">Description</Label>
                        <p className="text-xs text-muted-foreground">Optional description explaining the purpose and usage of this data model.</p>
                        <textarea
                          id="data-model-description"
                          value={dataModelForm.description}
                          onChange={(e) => setDataModelForm({ ...dataModelForm, description: e.target.value })}
                          placeholder="Enter description (optional)"
                          className="w-full p-3 border border-gray-300 rounded-md resize-vertical min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Configuration</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="data-model-source-type">Source Type</Label>
                          <p className="text-xs text-muted-foreground">Choose whether this model uses internal data or connects to an external database.</p>
                          <Select
                            value={dataModelForm.source_type}
                            onValueChange={(v) => setDataModelForm({ ...dataModelForm, source_type: v as any })}
                          >
                            <SelectTrigger id="data-model-source-type" className="w-full">
                              <SelectValue placeholder="Select source type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INTERNAL">In-app database</SelectItem>
                              <SelectItem value="EXTERNAL">External datasource</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="data-model-spaces">Associated Spaces</Label>
                          <p className="text-xs text-muted-foreground">Select which spaces this data model will be available in.</p>
                          <MultiSelect
                            options={(availableSpaces || []).map(s => ({ value: s.id, label: `${s.name} (${s.slug})` }))}
                            selected={dataModelForm.space_ids}
                            onChange={(ids) => setDataModelForm(prev => ({ ...prev, space_ids: ids }))}
                            placeholder={spacesLoading ? "Loading spaces..." : (availableSpaces?.length ? "Select spaces..." : "No spaces available")}
                            disabled={!!spacesLoading}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

            {dataModelForm.source_type === 'EXTERNAL' && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Database Type</Label>
                    <Select
                      value={externalForm.db_type}
                      onValueChange={(v) => setExternalForm({ ...externalForm, db_type: v as any })}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select DB type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgres">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Host</Label>
                    <Input value={externalForm.host} onChange={(e) => setExternalForm({ ...externalForm, host: e.target.value })} placeholder="e.g. db.example.com" />
                  </div>
                  <div>
                    <Label>Port</Label>
                    <Input value={externalForm.port} onChange={(e) => setExternalForm({ ...externalForm, port: e.target.value })} placeholder={externalForm.db_type === 'postgres' ? '5432' : '3306'} />
                  </div>
                  <div>
                    <Label>Database</Label>
                    <Input value={externalForm.database} onChange={(e) => setExternalForm({ ...externalForm, database: e.target.value })} placeholder="database name" />
                  </div>
                  <div>
                    <Label>Username</Label>
                    <Input value={externalForm.username} onChange={(e) => setExternalForm({ ...externalForm, username: e.target.value })} placeholder="username" />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={externalForm.password} onChange={(e) => setExternalForm({ ...externalForm, password: e.target.value })} placeholder="password" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={testConnLoading || !externalForm.host}
                    onClick={async () => {
                      try {
                        setTestConnLoading(true)
                        const params = {
                          space_id: (selectedDataModel?.space_id || dataModels?.[0]?.space_id || '') as string,
                          db_type: externalForm.db_type,
                          host: externalForm.host,
                          port: externalForm.port ? Number(externalForm.port) : undefined,
                          database: externalForm.database || undefined,
                          username: externalForm.username || undefined,
                          password: externalForm.password || undefined,
                        }
                        const res = await fetch('/api/external-connections/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) })
                        const json = await res.json()
                        if (res.ok) {
                          setSchemas(json.schemas || [])
                          setTablesBySchema(json.tablesBySchema || {})
                          toast.success('Connection successful')
                        } else {
                          toast.error(json.error || 'Connection failed')
                        }
                      } catch (e: any) {
                        toast.error(e.message || 'Connection failed')
                      } finally {
                        setTestConnLoading(false)
                      }
                    }}
                  >
                    {testConnLoading ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>

                {schemas.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Schema</Label>
                      <Select
                        value={externalForm.schema}
                        onValueChange={(v) => setExternalForm({ ...externalForm, schema: v })}
                      >
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select schema" /></SelectTrigger>
                        <SelectContent>
                          {schemas.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Table</Label>
                      <Select
                        value={externalForm.table}
                        onValueChange={async (v) => {
                          setExternalForm({ ...externalForm, table: v })
                          // Fetch columns preview
                          try {
                            const qs = new URLSearchParams({
                              space_id: (selectedDataModel?.space_id || dataModels?.[0]?.space_id || '') as string,
                              db_type: externalForm.db_type,
                              host: externalForm.host,
                              port: externalForm.port || '',
                              database: externalForm.database || '',
                              username: externalForm.username || '',
                              password: externalForm.password || '',
                              schema: externalForm.schema,
                              table: v,
                            })
                            const res = await fetch(`/api/external-connections/test?${qs.toString()}`)
                            const json = await res.json()
                            if (res.ok) {
                              setColumnsPreview(json.columns || [])
                            } else {
                              toast.error(json.error || 'Failed to fetch columns')
                            }
                          } catch (e: any) {
                            toast.error(e.message || 'Failed to fetch columns')
                          }
                        }}
                      >
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select table" /></SelectTrigger>
                        <SelectContent>
                          {(tablesBySchema[externalForm.schema] || []).map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {columnsPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Columns (preview)</Label>
                    <div className="border rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Nullable</th>
                            <th className="text-left p-2">Primary Key</th>
                          </tr>
                        </thead>
                        <tbody>
                          {columnsPreview.map((c) => (
                            <tr key={c.name} className="border-t">
                              <td className="p-2">{c.name}</td>
                              <td className="p-2">{c.data_type}</td>
                              <td className="p-2">{c.is_nullable ? 'Yes' : 'No'}</td>
                              <td className="p-2">{c.is_primary_key ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    id="allow-edit-ext"
                    type="checkbox"
                    checked={externalForm.allow_edit}
                    onChange={(e) => setExternalForm({ ...externalForm, allow_edit: e.target.checked })}
                  />
                  <Label htmlFor="allow-edit-ext">Allow editing external records</Label>
                </div>
              </div>
            )}
                  <div className="space-y-2">
                    <Label htmlFor="data-model-icon">Icon</Label>
                    <IconPickerPopover
                      value={dataModelForm.icon}
                      onChange={(name) => setDataModelForm({ ...dataModelForm, icon: name })}
                    />
                  </div>
            
            {/* Tags Section */}
            <div className="space-y-2">
              <Label htmlFor="data-model-tags">Tags</Label>
              <div className="space-y-3">
                {/* Current Tags Display */}
                {dataModelForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dataModelForm.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Add Tag Section */}
                <div className="flex gap-2">
              <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && value !== '') {
                        addTag(value)
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select existing tag or create new" />
                </SelectTrigger>
                <SelectContent>
                      {availableTags
                        .filter(tag => !dataModelForm.tags.includes(tag))
                        .map(tag => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTagManager(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>
                
                {/* Create New Tag */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Create new tag"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        createNewTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={createNewTag}
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
                </TabsContent>
                <TabsContent value="attributes" className="flex-1 overflow-auto p-4">
                  {/* Reuse existing Manage Attributes table for selectedDataModel */}
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
                      <h3 className="font-medium">Attributes</h3>
                      <Button onClick={handleCreateAttribute} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Attribute
                      </Button>
          </div>
                    <div className="p-4 border-b space-y-3">
                      <div className="flex gap-3">
                        <Input
                          placeholder="Search attributes..."
                          value={attributeSearch}
                          onChange={(e) => setAttributeSearch(e.target.value)}
                          className="max-w-sm"
                        />
                        <Select
                          value={attributeTypeFilter}
                          onValueChange={setAttributeTypeFilter}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="TEXT">Text</SelectItem>
                            <SelectItem value="EMAIL">Email</SelectItem>
                            <SelectItem value="NUMBER">Number</SelectItem>
                            <SelectItem value="DATE">Date</SelectItem>
                            <SelectItem value="BOOLEAN">Boolean</SelectItem>
                            <SelectItem value="SELECT">Single Select</SelectItem>
                            <SelectItem value="MULTI_SELECT">Multi Select</SelectItem>
                            <SelectItem value="TEXTAREA">Textarea</SelectItem>
                            <SelectItem value="PHONE">Phone</SelectItem>
                            <SelectItem value="URL">URL</SelectItem>
                            <SelectItem value="JSON">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
          </div>
                    <ScrollableTable maxHeight="MEDIUM">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3">Display Name</th>
                          <th className="text-left p-3">Key</th>
                          <th className="text-left p-3">Type</th>
                          <th className="text-left p-3">Required</th>
                          <th className="text-left p-3">Unique</th>
                          <th className="text-right p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                          {attributesLoading ? (
                            <tr><td className="p-3" colSpan={6}>Loading...</td></tr>
                          ) : attributesError ? (
                            <tr><td className="p-3 text-red-600" colSpan={6}>{attributesError}</td></tr>
                          ) : (filteredAttributes || []).length === 0 ? (
                            <tr><td className="p-3" colSpan={6}>
                              {attributeSearch ? 'No attributes match your search' : 'No attributes found'}
                            </td></tr>
                          ) : filteredAttributes.map((attr) => (
                            <tr 
                              key={attr.id} 
                              className="border-t hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleEditAttribute(attr)}
                            >
                              <td className="p-3 font-medium">{attr.display_name}</td>
                              <td className="p-3 text-muted-foreground">{attr.name}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  attr.data_type === 'text' ? 'bg-blue-100 text-blue-800' :
                                  attr.data_type === 'email' ? 'bg-green-100 text-green-800' :
                                  attr.data_type === 'select' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {attr.data_type}
                                </span>
                              </td>
                              <td className="p-3">{attr.is_required ? 'Yes' : 'No'}</td>
                              <td className="p-3">{attr.is_unique ? 'Yes' : 'No'}</td>
                              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end space-x-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      console.log('Edit button clicked for:', attr.display_name)
                                      handleEditAttribute(attr)
                                    }}
                                    title="Edit Attribute"
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="ml-1">Edit</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      console.log('Delete button clicked for:', attr.display_name)
                                      handleDeleteAttribute(attr.id)
                                    }}
                                    title="Delete Attribute"
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="ml-1">Delete</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                    </ScrollableTable>
                  </div>
                </TabsContent>
                <TabsContent value="history" className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-muted/50">
                        <h3 className="font-medium">Change History</h3>
                        <p className="text-sm text-muted-foreground">Track all changes made to this data model and its attributes</p>
                        </div>
                      <div className="p-4">
                        <HistoryList dataModelId={selectedDataModel?.id} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end space-x-2 p-4 border-t flex-shrink-0 bg-white">
                <Button variant="outline" onClick={() => setShowDataModelDrawer(false)}>Cancel</Button>
                <Button onClick={handleSaveDataModel}>{editingDataModel ? 'Save Changes' : 'Create Data Model'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Management Drawer */}
      {showAttributeDialog && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setShowAttributeDialog(false)}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-screen w-[800px] flex flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Manage Attributes - {selectedDataModel?.name}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttributeDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Attributes List */}
                <div className="border rounded-lg">
                  <div className="p-4 border-b bg-muted/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Attributes</h3>
                      <Button onClick={handleCreateAttribute} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Attribute
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 border-b space-y-3">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Search attributes..."
                        value={attributeSearch}
                        onChange={(e) => setAttributeSearch(e.target.value)}
                        className="max-w-sm"
                      />
                      <Select
                        value={attributeTypeFilter}
                        onValueChange={setAttributeTypeFilter}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="TEXT">Text</SelectItem>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="NUMBER">Number</SelectItem>
                          <SelectItem value="DATE">Date</SelectItem>
                          <SelectItem value="BOOLEAN">Boolean</SelectItem>
                          <SelectItem value="SELECT">Single Select</SelectItem>
                          <SelectItem value="MULTI_SELECT">Multi Select</SelectItem>
                          <SelectItem value="TEXTAREA">Textarea</SelectItem>
                          <SelectItem value="PHONE">Phone</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="JSON">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="p-4">
                  {/* Sample attributes - in real app, this would be fetched from API */}
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3">Display Name</th>
                          <th className="text-left p-3">Key</th>
                          <th className="text-left p-3">Type</th>
                          <th className="text-left p-3">Required</th>
                          <th className="text-left p-3">Unique</th>
                          <th className="text-right p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attributesLoading ? (
                          <tr><td className="p-3" colSpan={6}>Loading...</td></tr>
                        ) : attributesError ? (
                          <tr><td className="p-3 text-red-600" colSpan={6}>{attributesError}</td></tr>
                        ) : (filteredAttributes || []).length === 0 ? (
                          <tr><td className="p-3" colSpan={6}>
                            {attributeSearch ? 'No attributes match your search' : 'No attributes found'}
                          </td></tr>
                        ) : filteredAttributes.map((attr) => (
                          <tr 
                            key={attr.id} 
                            className="border-t hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleEditAttribute(attr)}
                          >
                            <td className="p-3 font-medium">{attr.display_name}</td>
                            <td className="p-3 text-muted-foreground">{attr.name}</td>
                            <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            attr.data_type === 'text' ? 'bg-blue-100 text-blue-800' :
                            attr.data_type === 'email' ? 'bg-green-100 text-green-800' :
                            attr.data_type === 'select' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {attr.data_type}
                          </span>
                            </td>
                            <td className="p-3">{attr.is_required ? 'Yes' : 'No'}</td>
                            <td className="p-3">{attr.is_unique ? 'Yes' : 'No'}</td>
                            <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditAttribute(attr)}
                                  title="Edit Attribute"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-1">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAttribute(attr.id)}
                                  title="Delete Attribute"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1">Delete</span>
                        </Button>
                      </div>
                            </td>
                          </tr>
                  ))}
                      </tbody>
                    </table>
                </div>
              </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Detail Drawer (Outside data model drawer) */}
      {showAttributeDetail && (
        <div className="fixed inset-0" style={{ zIndex: Z_INDEX.modal }}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAttributeDetail(false)} />
          <div className="fixed right-0 top-0 h-screen w-[800px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
              <h2 className="text-lg font-semibold">Attribute Details - {editingAttribute?.display_name || 'New Attribute'}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttributeDetail(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col flex-1 min-h-0">
              <Tabs defaultValue="details" className="w-full flex-1 flex flex-col min-h-0">
                <TabsList className="flex justify-start w-full p-4 gap-0">
                  <TabsTrigger value="details" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
                    <Type className="h-4 w-4" />
                    Attribute detail
                  </TabsTrigger>
                  <TabsTrigger value="options" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
                    <SettingsIcon className="h-4 w-4" />
                    Attribute options
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="flex-1 overflow-y-auto p-4 min-h-0">
                  <div className="space-y-6">
                  {/* Attribute Code Section */}
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="attr-code" className="w-32 text-right">Attribute Code</Label>
                    <Input
                      id="attr-code"
                      value={attributeForm.name}
                      onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                      placeholder="attribute_code"
                      className="flex-1"
                    />
                  </div>

                  {/* Attribute Label Section */}
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="attr-label" className="w-32 text-right">Attribute Label</Label>
                    <Input
                      id="attr-label"
                      value={attributeForm.display_name}
                      onChange={(e) => setAttributeForm({ ...attributeForm, display_name: e.target.value })}
                      placeholder="Attribute Label"
                      className="flex-1"
                    />
                  </div>

                  {/* Description Section */}
                  <div className="flex items-start space-x-4">
                    <Label htmlFor="attr-description" className="w-32 text-right mt-2">Description</Label>
                    <textarea
                      id="attr-description"
                      value={attributeForm.description}
                      onChange={(e) => setAttributeForm({ ...attributeForm, description: e.target.value })}
                      placeholder="Describe this attribute"
                      className="flex-1 p-2 border border-gray-300 rounded-md resize-vertical min-h-[80px]"
                      rows={3}
                    />
                  </div>

                   {/* Attribute Type Section */}
                   <div className="flex items-center space-x-4">
                     <Label htmlFor="attr-type" className="w-32 text-right">Attribute Type</Label>
                     <Select
                       value={attributeForm.data_type}
                       onValueChange={(value) => setAttributeForm({ ...attributeForm, data_type: value })}
                     >
                       <SelectTrigger className="flex-1">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="TEXT">Text</SelectItem>
                         <SelectItem value="EMAIL">Email</SelectItem>
                         <SelectItem value="NUMBER">Number</SelectItem>
                         <SelectItem value="DATE">Date</SelectItem>
                         <SelectItem value="BOOLEAN">Boolean</SelectItem>
                         <SelectItem value="SELECT">Single Select</SelectItem>
                         <SelectItem value="MULTI_SELECT">Multi Select</SelectItem>
                         <SelectItem value="TEXTAREA">Textarea</SelectItem>
                         <SelectItem value="PHONE">Phone</SelectItem>
                         <SelectItem value="URL">URL</SelectItem>
                         <SelectItem value="JSON">JSON</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                  
                  {/* Data Entity Configuration */}
                  {attributeForm.data_type === 'DATA_ENTITY' && (
                    <>
                       {/* Data Model Section */}
                       <div className="flex items-center space-x-4">
                         <Label htmlFor="data-model-select" className="w-32 text-right">Data Model</Label>
                         <Combobox
                           options={[
                             { value: '', label: 'Select a data model' },
                             ...availableDataModels.map((model) => ({
                               value: model.id,
                               label: model.display_name || model.name
                             }))
                           ]}
                           value={selectedDataModelForEntity}
                           onValueChange={(value) => {
                             setSelectedDataModelForEntity(value)
                             loadAvailableAttributes(value)
                           }}
                           placeholder="Select a data model"
                         />
                       </div>

                      {/* Attribute Select Section */}
                      <div className="flex items-center space-x-4">
                        <Label htmlFor="attribute-select" className="w-32 text-right">Reference Attribute</Label>
                        <Combobox
                          options={[
                            { value: '', label: 'Select an attribute' },
                            ...availableAttributes.map((attr) => ({
                              value: attr.id,
                              label: attr.display_name || attr.name
                            }))
                          ]}
                          value={selectedAttributeForEntity}
                          onValueChange={(value) => setSelectedAttributeForEntity(value)}
                          placeholder="Select an attribute"
                          disabled={!selectedDataModelForEntity}
                        />
                      </div>
                    </>
                  )}

                  {/* Min Length Section */}
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="attr-min" className="w-32 text-right">Min Length</Label>
                    <Input
                      id="attr-min"
                      type="number"
                      value={attributeForm.min_length}
                      onChange={(e) => setAttributeForm({ ...attributeForm, min_length: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="flex-1"
                    />
                  </div>

                  {/* Max Length Section */}
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="attr-max" className="w-32 text-right">Max Length</Label>
                    <Input
                      id="attr-max"
                      type="number"
                      value={attributeForm.max_length}
                      onChange={(e) => setAttributeForm({ ...attributeForm, max_length: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="flex-1"
                    />
                  </div>

                  {/* Default Value Section */}
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="attr-default" className="w-32 text-right">Default Value</Label>
                    <Input
                      id="attr-default"
                      value={attributeForm.default_value}
                      onChange={(e) => setAttributeForm({ ...attributeForm, default_value: e.target.value })}
                      placeholder="Default value"
                      className="flex-1"
                    />
                  </div>

                  {/* Tooltip Section */}
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="attr-tooltip" className="w-32 text-right">Tooltip</Label>
                    <Input
                      id="attr-tooltip"
                      value={attributeForm.tooltip}
                      onChange={(e) => setAttributeForm({ ...attributeForm, tooltip: e.target.value })}
                      placeholder="Helper text shown to users"
                      className="flex-1"
                    />
                  </div>
                </div>
                {/* Checkbox Options Section */}
                <div className="space-y-4">
                  {/* Required Switch Section */}
                  <div className="flex items-center space-x-4 mt-4">
                    <Label htmlFor="is-required" className="w-32 text-right">Required</Label>
                    <Switch
                      id="is-required"
                      checked={attributeForm.is_required}
                      onCheckedChange={(checked) => setAttributeForm({ ...attributeForm, is_required: checked })}
                    />
                  </div>

                  {/* Unique Switch Section */}
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="is-unique" className="w-32 text-right">Unique</Label>
                    <Switch
                      id="is-unique"
                      checked={attributeForm.is_unique}
                      onCheckedChange={(checked) => setAttributeForm({ ...attributeForm, is_unique: checked })}
                    />
                  </div>

                  {/* Auto Increment Configuration */}
                  <div className="space-y-4 border-t pt-4">
                    {/* Auto Increment Switch Section */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-increment"
                        checked={attributeForm.is_auto_increment}
                        onCheckedChange={(checked) => setAttributeForm({ ...attributeForm, is_auto_increment: checked })}
                      />
                      <Label htmlFor="auto-increment">Auto Increment</Label>
                    </div>
                    
                    {attributeForm.is_auto_increment && (
                      <div className="space-y-4 pl-6">
                        {/* Prefix Section */}
                        <div className="flex items-center space-x-4">
                          <Label htmlFor="prefix" className="w-32 text-right">Prefix</Label>
                          <Input
                            id="prefix"
                            value={attributeForm.auto_increment_prefix}
                            onChange={(e) => setAttributeForm({ ...attributeForm, auto_increment_prefix: e.target.value })}
                            placeholder="e.g., CUST, ORD"
                            className="flex-1"
                          />
                        </div>

                        {/* Suffix Section */}
                        <div className="flex items-center space-x-4">
                          <Label htmlFor="suffix" className="w-32 text-right">Suffix</Label>
                          <Input
                            id="suffix"
                            value={attributeForm.auto_increment_suffix}
                            onChange={(e) => setAttributeForm({ ...attributeForm, auto_increment_suffix: e.target.value })}
                            placeholder="e.g., -2024, _V1"
                            className="flex-1"
                          />
                        </div>

                        {/* Start Number Section */}
                        <div className="flex items-center space-x-4">
                          <Label htmlFor="start-number" className="w-32 text-right">Start Number</Label>
                          <Input
                            id="start-number"
                            type="number"
                            value={attributeForm.auto_increment_start}
                            onChange={(e) => setAttributeForm({ ...attributeForm, auto_increment_start: parseInt(e.target.value) || 1 })}
                            placeholder="1"
                            className="flex-1"
                          />
                        </div>

                        {/* Number Padding Section */}
                        <div className="flex items-center space-x-4">
                          <Label htmlFor="padding" className="w-32 text-right">Number Padding</Label>
                          <Input
                            id="padding"
                            type="number"
                            value={attributeForm.auto_increment_padding}
                            onChange={(e) => setAttributeForm({ ...attributeForm, auto_increment_padding: parseInt(e.target.value) || 3 })}
                            placeholder="3"
                            className="flex-1"
                          />
                        </div>

                        {/* Preview Section */}
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Preview:</strong> {attributeForm.auto_increment_prefix}{String(attributeForm.auto_increment_start).padStart(attributeForm.auto_increment_padding, '0')}{attributeForm.auto_increment_suffix}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Examples: CUST-001, ORD-2024-001, INV_001_V1
                          </div>
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const nextValue = attributeForm.auto_increment_start + 1
                                const preview = `${attributeForm.auto_increment_prefix}${String(nextValue).padStart(attributeForm.auto_increment_padding, '0')}${attributeForm.auto_increment_suffix}`
                                toast.success(`Next value would be: ${preview}`)
                              }}
                            >
                              Test Next Value
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

                {/* Options Tab */}
                <TabsContent value="options" className="flex-1 overflow-y-auto p-4 min-h-0">
                  {!(attributeForm.data_type === 'SELECT' || attributeForm.data_type === 'MULTI_SELECT') ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <SettingsIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Attribute options not available</h3>
                      <p className="text-gray-500 mb-6">Options are only available for SELECT and MULTI_SELECT attribute types.</p>
                      <p className="text-sm text-gray-400">Current type: {attributeForm.data_type}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Attribute Options</h3>
                          <p className="text-sm text-muted-foreground">
                            Define the available choices for this {attributeForm.data_type} attribute
                          </p>
                        </div>
                        <Button onClick={addAttributeOption} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Option
                        </Button>
                      </div>

                      {/* Options Management */}
                      {attributeOptions.length === 0 || (attributeOptions.length === 1 && !attributeOptions[0].value && !attributeOptions[0].label) ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SettingsIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No options defined</h3>
                          <p className="text-gray-500 mb-6">Add options to define the available choices for this attribute.</p>
                          <Button onClick={addAttributeOption} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add First Option
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Options Table */}
                <div className="border rounded-lg overflow-hidden">
                            <div className="p-4 border-b bg-muted/50">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Options ({attributeOptions.length})</h4>
                                <div className="text-sm text-muted-foreground">
                                  Drag to reorder • Click to edit
                                </div>
                              </div>
                            </div>
                            
                  <DragDropContext onDragEnd={handleAttributeOptionsDragEnd}>
                    <Droppable droppableId="attribute-options">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                                    <div className="divide-y">
                              {attributeOptions.map((option, index) => (
                                <Draggable key={index} draggableId={`option-${index}`} index={index}>
                                  {(provided, snapshot) => (
                                            <div 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                              className={`p-4 hover:bg-muted/50 transition-colors ${snapshot.isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
                                            >
                                              <div className="flex items-center gap-4">
                                                {/* Drag Handle */}
                                                <div 
                                                  {...provided.dragHandleProps}
                                                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                                                  title="Drag to reorder"
                                                >
                                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                                </div>

                                                {/* Single Row Layout */}
                                                <div className="flex-1 flex items-center gap-3">
                                                  {/* Color Swatch */}
                                                  <div className="flex items-center gap-2">
                                                    <ColorPicker
                                                      value={option.color}
                                                      onChange={(color) => updateAttributeOption(index, 'color', color)}
                                                    />
                                                  </div>
                                                  
                                                  {/* Attribute Code */}
                                                  <div className="flex-1 min-w-0">
                                                    <Input
                                                      value={option.value}
                                                      onChange={(e) => updateAttributeOption(index, 'value', e.target.value)}
                                                      placeholder="Option value"
                                                      className="h-8"
                                                    />
                                                  </div>
                                                  
                                                  {/* Attribute Label */}
                                                  <div className="flex-1 min-w-0">
                                                    <Input
                                                      value={option.label}
                                                      onChange={(e) => updateAttributeOption(index, 'label', e.target.value)}
                                                      placeholder="Option label"
                                                      className="h-8"
                                                    />
                                                  </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeAttributeOption(index)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                                </div>
                                              </div>
                                            </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                                    </div>
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>

                          {/* Add Option Button */}
                          <div className="flex justify-center">
                            <Button variant="outline" onClick={addAttributeOption} className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Add Another Option
                </Button>
                          </div>
                        </div>
                      )}

                      {/* Preview Section */}
                      {attributeOptions.length > 0 && (
                        <div className="border rounded-lg p-4 bg-muted/30">
                          <h4 className="font-medium mb-3">Preview</h4>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              This is how the options will appear to users:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {attributeOptions
                                .filter(option => option.value && option.label)
                                .map((option, index) => (
                                  <div
                                    key={index}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                                    style={{ 
                                      backgroundColor: `${option.color}20`,
                                      borderColor: option.color,
                                      borderWidth: '1px'
                                    }}
                                  >
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: option.color }}
                                    />
                                    <span style={{ color: option.color }}>
                                      {option.label}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                {/* History Tab */}
                <TabsContent value="history" className="flex-1 overflow-y-auto p-4 min-h-0">
                  <div className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-muted/50">
                        <h3 className="font-medium">Attribute Change History</h3>
                        <p className="text-sm text-muted-foreground">Track all changes made to this attribute</p>
                      </div>
                      <div className="p-4">
                        <div className="space-y-0">
                          {/* Sample attribute history entries */}
                          <div className="flex items-center py-3 border-b">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Attribute created</span>
                                <span className="text-xs text-muted-foreground">3 days ago</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Created by John Doe</p>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Name: email, Type: EMAIL, Required: true, Unique: true
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center py-3 border-b">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Attribute properties updated</span>
                                <span className="text-xs text-muted-foreground">2 days ago</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Updated by Jane Smith</p>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className="text-red-600">Max Length: 50</span> → <span className="text-green-600">Max Length: 100</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center py-3 border-b">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Attribute options added</span>
                                <span className="text-xs text-muted-foreground">1 day ago</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Added by Mike Johnson</p>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Added: "personal@company.com" → "Personal Email", "work@company.com" → "Work Email"
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center py-3 border-b">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Auto increment settings updated</span>
                                <span className="text-xs text-muted-foreground">12 hours ago</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Updated by Sarah Wilson</p>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className="text-red-600">Auto Increment: disabled</span> → <span className="text-green-600">Auto Increment: enabled</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center py-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Attribute options updated</span>
                                <span className="text-xs text-muted-foreground">6 hours ago</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Updated by Tom Brown</p>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Updated: "Personal Email" → "Personal Email Address", Added: "Support Email"
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Showing 5 of 8 changes
                            </div>
                            <Button variant="outline" size="sm">
                              Load More
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end space-x-2 p-4 border-t flex-shrink-0 bg-white">
                <Button variant="outline" onClick={() => setShowAttributeDetail(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAttribute}>
                {editingAttribute ? 'Update Attribute' : 'Create Attribute'}
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tag Manager Dialog */}
      <Dialog open={showTagManager} onOpenChange={setShowTagManager}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-tag">Create New Tag</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="new-tag"
                  placeholder="Enter tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      createNewTag()
                    }
                  }}
                />
                <Button onClick={createNewTag} disabled={!newTagName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Existing Tags</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {availableTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags created yet. Create a tag above to get started.</p>
                ) : (
                  availableTags.map((tag: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{tag}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTag(tag)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagManager(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

function UsersSection() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState<string>('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ 
    email: '', 
    name: '', 
    password: '', 
    role: 'USER', 
    is_active: true, 
    default_space_id: '', 
    spaces: [],
    avatar: ''
  })
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([])
  const [loadingSpaces, setLoadingSpaces] = useState(false)
  
  // Reset password state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  // Check if current user can reset passwords (MANAGER+ roles)
  const canResetPassword = useMemo(() => {
    if (!session?.user?.role) return false
    const allowedRoles = ['MANAGER', 'ADMIN', 'SUPER_ADMIN']
    return allowedRoles.includes(session.user.role)
  }, [session?.user?.role])

  async function loadSpaces() {
    setLoadingSpaces(true)
    try {
      const res = await fetch('/api/spaces?limit=100')
      if (res.ok) {
        const data = await res.json()
        setAvailableSpaces(data.spaces || [])
      }
    } catch (e) {
      console.error('Failed to load spaces:', e)
    } finally {
      setLoadingSpaces(false)
    }
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (role) params.set('role', role)
      if (isActive) params.set('is_active', isActive)
      const res = await fetch(`/api/users?${params.toString()}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(`Failed to load users: ${res.status} ${res.statusText} - ${errorData.error || 'Unknown error'}`)
      }
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.pagination?.total || 0)
    } catch (e: any) {
      console.error('Load users error:', e)
      setError(e.message || 'Failed loading users')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      setPage(1)
      load()
    }, 500) // 500ms debounce
    
    setSearchTimeout(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [search])

  useEffect(() => { load() }, [page, limit, role, isActive])

  function openCreate() {
    setEditing(null)
    setForm({ 
      email: '', 
      name: '', 
      password: '', 
      role: 'USER', 
      is_active: true, 
      default_space_id: '', 
      spaces: [],
      avatar: ''
    })
    loadSpaces()
    setOpen(true)
  }

  function openEdit(u: any) {
    setEditing(u)
    setForm({ 
      email: u.email, 
      name: u.name, 
      password: '', 
      role: u.role, 
      is_active: u.is_active,
      default_space_id: u.default_space_id || '',
      spaces: u.spaces || [],
      avatar: u.avatar || null
    })
    loadSpaces()
    setOpen(true)
  }

  async function submit() {
    try {
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/api/users/${editing.id}` : '/api/users'
      const payload: any = { 
        email: form.email, 
        name: form.name, 
        role: form.role, 
        is_active: form.is_active,
        default_space_id: form.default_space_id || null,
        spaces: form.spaces
      }
      if (!editing) payload.password = form.password
      if (editing && form.password) payload.password = form.password
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Save failed')
      setOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
  }

  async function removeUser(id: string) {
    if (!confirm('Delete this user?')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  function openResetPassword(user: any) {
    setResetPasswordUser(user)
    setNewPassword('')
    setConfirmPassword('')
    setResetPasswordOpen(true)
  }

  async function resetPassword() {
    if (!resetPasswordUser) return
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setResettingPassword(true)
    try {
      const res = await fetch(`/api/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Reset failed')
      }
      
      toast.success('Password reset successfully')
      setResetPasswordOpen(false)
      setResetPasswordUser(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      toast.error(e.message || 'Reset failed')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Input 
                placeholder="Search by name or email..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load() } }} 
                className={search ? 'pr-8' : ''}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Role Filter Dropdown */}
          <div className="min-w-[150px]">
            <Select value={role || 'all'} onValueChange={(value) => { setRole(value === 'all' ? '' : value); setPage(1); load() }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Status Filter Dropdown */}
          <div className="min-w-[150px]">
            <Select value={isActive || 'all'} onValueChange={(value) => { setIsActive(value === 'all' ? '' : value); setPage(1); load() }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters Button */}
          <Button 
            variant="outline" 
            onClick={() => { 
              setSearch(''); 
              setRole(''); 
              setIsActive(''); 
              setPage(1); 
              load() 
            }}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        </div>
        <div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {(search || (role && role !== '') || (isActive && isActive !== '')) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {search && (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
              <span>Search: "{search}"</span>
              <button onClick={() => setSearch('')} className="ml-1 hover:text-blue-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {role && (
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
              <span>Role: {role}</span>
              <button onClick={() => setRole('')} className="ml-1 hover:text-green-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {isActive && (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">
              <span>Status: {isActive === 'true' ? 'Active' : 'Inactive'}</span>
              <button onClick={() => setIsActive('')} className="ml-1 hover:text-purple-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">Avatar</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Default Space</th>
              <th className="text-left p-2">Space Access</th>
              <th className="text-left p-2">Active</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={8}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="p-4 text-red-600" colSpan={8}>{error}</td></tr>
            ) : users.length === 0 ? (
              <tr><td className="p-4" colSpan={8}>No users found</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-t hover:bg-muted/50">
                  <td className="p-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar || undefined} alt={u.name || 'User'} />
                      <AvatarFallback className="text-xs">
                        {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 
                         u.email ? u.email[0].toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="p-3 font-medium">{u.email}</td>
                  <td className="p-3">{u.name || '-'}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                      u.role === 'ADMIN' ? 'bg-orange-100 text-orange-800' :
                      u.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-muted-foreground">
                      {u.default_space_name || 'None'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.spaces && u.spaces.length > 0 ? (
                        u.spaces.slice(0, 2).map((space: any) => (
                          <span key={space.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {space.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No access</span>
                      )}
                      {u.spaces && u.spaces.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{u.spaces.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {canResetPassword && u.id !== session?.user?.id && (
                        <Button variant="outline" size="sm" onClick={() => openResetPassword(u)}>
                          <Key className="h-3 w-3 mr-1" />
                          Reset Password
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => removeUser(u.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {users.length} of {total} users
          {total > 0 && (
            <span className="ml-2">
              (Page {page} of {pages})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page >= pages} 
            onClick={() => setPage(p => Math.min(pages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Create User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <AvatarUpload
                userId={editing?.id || 'new'}
                currentAvatar={form.avatar}
                userName={form.name}
                userEmail={form.email}
                onAvatarChange={(avatarUrl) => setForm({ ...form, avatar: avatarUrl || '' })}
                size="lg"
                disabled={!editing} // Only allow avatar upload for existing users
              />
            </div>
            
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <RadioGroup value={form.role} onValueChange={(value: string) => setForm({ ...form, role: value })} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USER" id="user" />
                  <label htmlFor="user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    User
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MANAGER" id="manager" />
                  <label htmlFor="manager" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Manager
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ADMIN" id="admin" />
                  <label htmlFor="admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Admin
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SUPER_ADMIN" id="super_admin" />
                  <label htmlFor="super_admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Super Admin
                  </label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Default Space Selection */}
            <div className="space-y-1">
              <Label>Default Space</Label>
              <Select value={form.default_space_id} onValueChange={(value) => setForm({ ...form, default_space_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select default space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No default space</SelectItem>
                  {availableSpaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name} {space.is_default && '(Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Space Access Multi-Select */}
            <div className="space-y-1">
              <Label>Space Access</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {loadingSpaces ? (
                  <div className="text-sm text-muted-foreground">Loading spaces...</div>
                ) : availableSpaces.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No spaces available</div>
                ) : (
                  availableSpaces.map(space => {
                    const userSpace = form.spaces.find((s: any) => s.id === space.id)
                    return (
                      <div key={space.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`space-${space.id}`}
                            checked={!!userSpace}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({
                                  ...form,
                                  spaces: [...form.spaces, { id: space.id, name: space.name, role: 'member' }]
                                })
                              } else {
                                setForm({
                                  ...form,
                                  spaces: form.spaces.filter((s: any) => s.id !== space.id)
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`space-${space.id}`} className="text-sm">
                            {space.name} {space.is_default && '(Default)'}
                          </label>
                        </div>
                        {userSpace && (
                          <Select
                            value={userSpace.role}
                            onValueChange={(role) => {
                              setForm({
                                ...form,
                                spaces: form.spaces.map((s: any) => 
                                  s.id === space.id ? { ...s, role } : s
                                )
                              })
                            }}
                          >
                            <SelectTrigger className="w-24 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
            {!editing && (
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set a password" />
              </div>
            )}
            {editing && (
              <div className="space-y-1">
                <Label>New Password (optional)</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Resetting password for: <span className="font-medium">{resetPasswordUser?.email}</span>
              </p>
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Enter new password (min 6 characters)" 
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password" 
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600">Passwords do not match</p>
            )}
            {newPassword && newPassword.length < 6 && (
              <p className="text-sm text-red-600">Password must be at least 6 characters long</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={resetPassword} 
              disabled={resettingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
            >
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RolesSection() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [rRes, pRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/permissions'),
      ])
      
      if (!rRes.ok) {
        const errorData = await rRes.json().catch(() => ({}))
        throw new Error(`Failed to load roles: ${rRes.status} ${rRes.statusText} - ${errorData.error || 'Unknown error'}`)
      }
      
      if (!pRes.ok) {
        const errorData = await pRes.json().catch(() => ({}))
        throw new Error(`Failed to load permissions: ${pRes.status} ${pRes.statusText} - ${errorData.error || 'Unknown error'}`)
      }
      
      const r = await rRes.json()
      const p = await pRes.json()
      setRoles(r.roles || [])
      setPermissions(p.permissions || [])
    } catch (e: any) {
      console.error('Load roles/permissions error:', e)
      setError(e.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setSelectedPerms([])
    setOpen(true)
  }

  function openEdit(role: any) {
    setEditing(role)
    setName(role.name)
    setDescription(role.description || '')
    setSelectedPerms((role.permissions || []).map((p: any) => p.id))
    setOpen(true)
  }

  async function save() {
    try {
      if (!name.trim()) throw new Error('Name is required')
      if (editing) {
        const res = await fetch(`/api/roles/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) })
        if (!res.ok) throw new Error('Failed to update role')
      } else {
        const res = await fetch('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) })
        if (!res.ok) throw new Error('Failed to create role')
      }

      // Update permissions mapping
      const targetRoleId = editing ? editing.id : (await (await fetch('/api/roles')).json()).roles.find((r: any) => r.name === name)?.id
      if (targetRoleId) {
        const pres = await fetch(`/api/roles/${targetRoleId}/permissions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissionIds: selectedPerms }) })
        if (!pres.ok) throw new Error('Failed to update permissions')
      }

      setOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this role?')) return
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Manage application roles and permissions</div>
        <Button onClick={openCreate}>Create Role</Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Permissions</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={4}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="p-4 text-red-600" colSpan={4}>{error}</td></tr>
            ) : roles.length === 0 ? (
              <tr><td className="p-4" colSpan={4}>No roles</td></tr>
            ) : (
              roles.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.description || '-'}</td>
                  <td className="p-2">{(r.permissions || []).map((p: any) => p.name).join(', ') || '-'}</td>
                  <td className="p-2 text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => openEdit(r)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(r.id)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-auto border rounded p-2">
                {permissions.map((p) => {
                  const checked = selectedPerms.includes(p.id)
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(selectedPerms)
                          if (e.target.checked) next.add(p.id)
                          else next.delete(p.id)
                          setSelectedPerms(Array.from(next))
                        }}
                      />
                      <span>{p.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
