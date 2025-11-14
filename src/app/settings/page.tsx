'use client'

import React from 'react'
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
import { ColorSwatch } from '@/components/ui/color-swatch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import IconPicker from '@/components/ui/icon-picker'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { useSidebar } from '@/contexts/sidebar-context'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createPortal } from 'react-dom'
import { Z_INDEX } from '@/lib/z-index'
// ERDInlineView no longer used in Settings; shown on Data Models page instead
import { AuditLogsAdvanced } from '@/components/ui/audit-logs-advanced'
import { ScrollableTable } from '@/components/ui/scrollable-table'
import { FaviconUpload } from '@/components/ui/favicon-upload'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DynamicModelIcon } from './components/DynamicModelIcon'
import { UsersSection } from './components/UsersSection'
import { RolesSection } from './components/RolesSection'

type AttributeOption = { value: string; label: string; color: string; order: number }

function SortableAttributeOption({
  option,
  index,
  onUpdate,
  onDelete,
}: {
  option: AttributeOption
  index: number
  onUpdate: (field: 'color' | 'value' | 'label', value: string) => void
  onDelete: () => void
}) {
  const {
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `option-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 hover:bg-muted/50 transition-colors ${isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Single Row Layout */}
        <div className="flex-1 flex items-center gap-3">
          {/* Color Swatch */}
          <div className="flex items-center gap-2">
            <ColorInput
              value={option.color}
              onChange={(color) => onUpdate('color', color)}
              allowImageVideo={false}
              className="relative"
              placeholder="#000000"
              inputClassName="h-8 text-xs pl-7"
            />
          </div>
          
          {/* Attribute Code */}
          <div className="flex-1 min-w-0">
            <Input
              value={option.value}
              onChange={(e) => onUpdate('value', e.target.value)}
              placeholder="Option value"
              className="h-8"
            />
          </div>

          {/* Attribute Label */}
          <div className="flex-1 min-w-0">
            <Input
              value={option.label}
              onChange={(e) => onUpdate('label', e.target.value)}
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
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function SortableDataModelRow({
  model,
  onTogglePin,
  onEdit,
  onDelete,
}: {
  model: any
  onTogglePin: (id: string) => void
  onEdit: (model: any) => void
  onDelete: (id: string) => void
}) {
  const {
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: model.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-t hover:bg-muted/50 cursor-pointer ${isDragging ? 'bg-blue-50' : ''}`}
    >
      <td className="p-3">
        <div className="flex items-center space-x-3">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            title="Drag to reorder"
          >
            <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
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
          onClick={(e) => { e.stopPropagation(); onTogglePin(model.id); }}
          title={model.is_pinned ? "Unpin from Sidebar" : "Pin to Sidebar"}
          className={model.is_pinned ? "text-blue-600" : "text-muted-foreground"}
        >
          {model.is_pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
        </Button>
      </td>
      <td className="p-3">
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(model); }}
            title="Edit Data Model"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(model.id); }}
            title="Delete Data Model"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export default function SettingsPage() {
  const { currentSpace } = useSpace()
  const [deletePolicyDays, setDeletePolicyDays] = useState(30)
  const [faviconUrl, setFaviconUrl] = useState('')
  
  // Debug logging
  console.log('SettingsPage - currentSpace:', currentSpace)
  
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
      console.log('Loading data models, currentSpace:', currentSpace)
      
      // If no current space, try to load without space filter first
      let apiUrl = '/api/data-models?page=1&limit=100'
      if (currentSpace?.id) {
        apiUrl += `&space_id=${currentSpace.id}`
      }
      
      console.log('API URL:', apiUrl)
      const res = await fetch(apiUrl, { cache: 'no-store' })
      console.log('API Response status:', res.status)
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('API Error:', err)
        
        // If space_id is required, try to get spaces first
        if (err.error && err.error.includes('Space ID is required')) {
          console.log('Space ID required, trying to load spaces first...')
          const spacesRes = await fetch('/api/spaces?page=1&limit=10')
          if (spacesRes.ok) {
            const spacesData = await spacesRes.json()
            console.log('Available spaces:', spacesData.spaces)
            
            if (spacesData.spaces && spacesData.spaces.length > 0) {
              // Use the first available space
              const firstSpace = spacesData.spaces[0]
              console.log('Using first available space:', firstSpace.id)
              const res2 = await fetch(`/api/data-models?page=1&limit=100&space_id=${firstSpace.id}`, { cache: 'no-store' })
              if (res2.ok) {
                const json2 = await res2.json()
                console.log('API Response data (with space):', json2)
                setDataModels(json2.dataModels || [])
                return
              }
            }
          }
        }
        
        throw new Error(err.error || 'Failed to load data models')
      }
      
      const json = await res.json()
      console.log('API Response data:', json)
      setDataModels(json.dataModels || [])
    } catch (e: any) {
      console.error('Error loading data models:', e)
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sourceIndex = filteredDataModels.findIndex((model) => model.id === active.id)
    const destinationIndex = filteredDataModels.findIndex((model) => model.id === over.id)

    if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) return

    try {
      // Update sort orders for affected models
      const newModels = arrayMove(filteredDataModels, sourceIndex, destinationIndex)

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

  const handleAttributeOptionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = attributeOptions.findIndex((_, index) => `option-${index}` === active.id)
    const newIndex = attributeOptions.findIndex((_, index) => `option-${index}` === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const items = arrayMove(attributeOptions, oldIndex, newIndex)

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
    <>
    <div className="flex h-full">
      <Tabs defaultValue="system">
        {/* Left Sidebar */}
        <div className="w-72 bg-card flex flex-col border-r">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">System Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Applied to all spaces</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <TabsList orientation="vertical" className="w-full flex-col h-auto bg-transparent space-y-1">
              <TabsTrigger 
                className="justify-start w-full h-12 px-4 py-3 rounded-lg text-left hover:bg-muted/50 transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm" 
                value="system"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5" />
                  <div>
                    <div className="font-medium">System</div>
                    <div className="text-xs text-muted-foreground">Core settings & policies</div>
                  </div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                className="justify-start w-full h-12 px-4 py-3 rounded-lg text-left hover:bg-muted/50 transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm" 
                value="api-docs"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5" />
                  <div>
                    <div className="font-medium">API Documentation</div>
                    <div className="text-xs text-muted-foreground">Swagger & endpoints</div>
                  </div>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                className="justify-start w-full h-12 px-4 py-3 rounded-lg text-left hover:bg-muted/50 transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm" 
                value="users"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Users & Roles</div>
                    <div className="text-xs text-muted-foreground">Manage access & permissions</div>
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="p-8 max-w-4xl">
            <div className="space-y-8">
            {/* System Settings */}
            <TabsContent value="system" className="space-y-6 w-full">
              <Card className="w-full shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <SettingsIcon className="h-6 w-6 text-primary" />
                    <span>System Settings</span>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Configure system-wide settings and policies that apply to all spaces
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
              <Card className="w-full max-w-full">
                <CardHeader className="w-full">
                  <CardTitle className="flex items-center space-x-2">
                    <Layout className="h-5 w-5" />
                    <span>Sidebar Configuration</span>
                  </CardTitle>
                  <CardDescription className="break-words overflow-wrap-anywhere whitespace-normal max-w-full">
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
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <ColorInput
                        value={sidebarSettings.backgroundColor}
                        onChange={(color) => updateSidebarSettings({ backgroundColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#ffffff"
                        inputClassName="h-8 text-xs pl-7"
                      />
                    </div>
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
                  <div className="space-y-2">
                    <Label>Font Color</Label>
                    <ColorInput
                      value={sidebarSettings.fontColor}
                      onChange={(color) => updateSidebarSettings({ fontColor: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#000000"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>

                  

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
                    {dataModelsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading data models...</p>
                      </div>
                    ) : dataModelsError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600">{dataModelsError}</p>
                        <div className="mt-4 space-y-2">
                          <Button onClick={loadDataModels} className="mr-2">
                            Try Again
                          </Button>
                          <Button onClick={handleCreateDataModel} variant="outline">
                            Create Sample Data Model
                          </Button>
                        </div>
                      </div>
                    ) : filteredDataModels.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No models yet</p>
                        <div className="mt-4 space-y-2">
                          <Button onClick={handleCreateDataModel} className="mr-2">
                            Create Your First Data Model
                          </Button>
                          <Button onClick={async () => {
                            // Create a sample data model
                            try {
                              const res = await fetch('/api/data-models', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  name: 'Sample Data Model',
                                  slug: 'sample-data-model',
                                  description: 'A sample data model to get you started',
                                  status: 'Active',
                                  source_type: 'INTERNAL',
                                  space_ids: currentSpace?.id ? [currentSpace.id] : []
                                })
                              })
                              if (res.ok) {
                                await loadDataModels()
                                toast.success('Sample data model created!')
                              }
                            } catch (e) {
                              toast.error('Failed to create sample data model')
                            }
                          }} variant="outline">
                            Create Sample Data Model
                          </Button>
                        </div>
                      </div>
                    ) : (
                    <>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
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
                          <SortableContext
                            items={filteredDataModels.map(model => model.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <tbody>
                              {filteredDataModels.map((model) => (
                                <SortableDataModelRow
                                  key={model.id}
                                  model={model}
                                  onTogglePin={handleTogglePin}
                                  onEdit={handleEditDataModel}
                                  onDelete={handleDeleteDataModel}
                                />
                              ))}
                            </tbody>
                          </SortableContext>
                        </table>
                      </div>
                    </DndContext>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline" onClick={() => setShowErdInline(true)}>
                        <GitBranch className="mr-2 h-4 w-4" />
                        ERD View
                      </Button>
                      <Button className="flex-1" onClick={handleCreateDataModel}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Data Model
                      </Button>
                    </div>
                    </>
                    )}
                  </div>
                </div>
                </div>
            </TabsContent>
            )}

            {/* API Documentation */}
            <TabsContent value="api-docs" className="space-y-6 w-full">
              <Card className="w-full shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <FileText className="h-6 w-6 text-primary" />
                    <span>API Documentation</span>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Access comprehensive API documentation with Swagger integration
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
              <Card className="w-full max-w-full">
                <CardHeader className="w-full">
                  <CardTitle className="flex items-center space-x-2">
                    <Trash2 className="h-5 w-5" />
                    <span>Restore Data</span>
                  </CardTitle>
                  <CardDescription className="break-words overflow-wrap-anywhere whitespace-normal max-w-full">
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
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center space-x-3">
                  <Users className="h-7 w-7 text-primary" />
                  <span>Users & Roles</span>
                </h2>
                <p className="text-muted-foreground mt-2">
                  Manage user accounts, roles, and permissions across your organization
                </p>
              </div>
              
              <div className="w-full">
                <Tabs defaultValue="user-management">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="user-management" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>User Management</span>
                  </TabsTrigger>
                  <TabsTrigger value="roles-permissions" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Roles & Permissions</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="user-management" className="space-y-6">
                  <Card className="w-full shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-3 text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        <span>User Management</span>
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Manage users, teams, roles, and permissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EnhancedUserManagement />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="roles-permissions" className="space-y-6">
                  <Card className="w-full shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-3 text-lg">
                        <Shield className="h-5 w-5 text-primary" />
                        <span>Roles & Permissions</span>
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Create roles and assign permissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RolesSection />
                    </CardContent>
                  </Card>
                </TabsContent>
                  </Tabs>
                </div>
            </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>
    </div>

      {/* Data Model Drawer */}
      {showDataModelDrawer && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDataModelDrawer(false)} style={{ zIndex: Z_INDEX.overlay }} />
          <div className="fixed right-0 top-0 h-screen w-[960px] bg-background shadow-2xl flex flex-col" style={{ zIndex: Z_INDEX.drawer }}>
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">{editingDataModel ? 'Edit Data Model' : 'Create New Data Model'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDataModelDrawer(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <Tabs defaultValue="model">
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
                          className="w-full p-3 border border-border rounded-md resize-vertical min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
                                  'bg-muted text-foreground'
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
              </div>
              <div className="flex justify-end space-x-2 p-4 border-t flex-shrink-0 bg-background">
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
          <div className="fixed right-0 top-0 h-screen w-[800px] flex flex-col bg-background shadow-xl">
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
                            'bg-muted text-foreground'
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
          <div className="fixed right-0 top-0 h-screen w-[800px] bg-background shadow-2xl flex flex-col">
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
              <div className="w-full flex-1 flex flex-col min-h-0">
                <Tabs defaultValue="details">
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
                      className="flex-1 p-2 border border-border rounded-md resize-vertical min-h-[80px]"
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
                          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            <strong>Preview:</strong> {attributeForm.auto_increment_prefix}{String(attributeForm.auto_increment_start).padStart(attributeForm.auto_increment_padding, '0')}{attributeForm.auto_increment_suffix}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
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
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <SettingsIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Attribute options not available</h3>
                      <p className="text-muted-foreground mb-6">Options are only available for SELECT and MULTI_SELECT attribute types.</p>
                      <p className="text-sm text-muted-foreground">Current type: {attributeForm.data_type}</p>
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
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <SettingsIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium text-foreground mb-2">No options defined</h3>
                          <p className="text-muted-foreground mb-6">Add options to define the available choices for this attribute.</p>
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
                            
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleAttributeOptionsDragEnd}
                  >
                    <SortableContext
                      items={attributeOptions.map((_, index) => `option-${index}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="divide-y">
                        {attributeOptions.map((option, index) => (
                          <SortableAttributeOption
                            key={index}
                            option={option}
                            index={index}
                            onUpdate={(field, value) => updateAttributeOption(index, field, value)}
                            onDelete={() => removeAttributeOption(index)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
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
              </div>
              <div className="flex justify-end space-x-2 p-4 border-t flex-shrink-0 bg-background">
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
    </>
    )
}
