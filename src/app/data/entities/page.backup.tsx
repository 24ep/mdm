'use client'

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { DataModel, Attribute, DataRecord, SortConfig, AdvancedFilter, FilterSet } from '@/app/data/entities/types'
import { renderCellValue, renderEditFieldHelper, getFilterComponentHelper } from '@/app/data/entities/helpers'
import { AdvancedFiltersDialog } from '@/app/data/entities/components/AdvancedFiltersDialog'
// import { AttributeVisibilityDrawer } from '@/app/data/entities/components/AttributeVisibilityDrawer'
import { SettingsDrawer } from '@/app/data/entities/components/SettingsDrawer'
import { RecordDetailDrawer } from '@/app/data/entities/components/RecordDetailDrawer'
import { RecordDetailModal } from '@/app/data/entities/components/RecordDetailModal'
import { AttributeVisibilityDrawer } from '@/app/data/entities/components/AttributeVisibilityDrawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import DataEditor, { GridCell, GridCellKind } from '@glideapps/glide-data-grid'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Plus, Filter, Search, Hash, Calendar, CheckSquare, ToggleLeft, Users, Database, Mail, Link, Phone, Code, GripVertical, Eye, EyeOff, Settings, Edit, Trash2, FileDown, FilterX, Save, Share, Bookmark, ExternalLink, History, User, Clock, Download, Upload, MoreHorizontal, Table as TableIcon, List, Grid3X3, FileSpreadsheet, Kanban, BarChart3 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerClose } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'


export default function DataEntitiesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const modelParam = searchParams.get('model')
  const pathSegments = (pathname || '').split('/').filter(Boolean)
  const modelFromPath = (() => {
    const idx = pathSegments.lastIndexOf('entities')
    return idx >= 0 && pathSegments[idx + 1] ? pathSegments[idx + 1] : null
  })()
  const modelId = modelParam || modelFromPath
  const recordQueryId = searchParams.get('record')
  
  const [loading, setLoading] = useState(false)
  const [dataModel, setDataModel] = useState<DataModel | null>(null)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [records, setRecords] = useState<DataRecord[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [error, setError] = useState<string | null>(null)
  
  // Stable snapshot of records before filters for option generation
  const [baseRecords, setBaseRecords] = useState<DataRecord[]>([])
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  
  // Filtering state
  const [filters, setFilters] = useState<Record<string, any>>({})
  
  // Option search text per attribute (for option filtering in popovers)
  const [optionSearch, setOptionSearch] = useState<Record<string, string>>({})

  // Settings drawer state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tableDensity, setTableDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable')
  // Column order stored as attribute ids; initialize after attributes load
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  // Admin/global settings (UI only placeholders)
  const isAdmin = true
  type ComboColumn = { id: string; name: string; type: 'left-right' | 'grouping'; rows: string[]; separator: string }
  const [comboColumns, setComboColumns] = useState<ComboColumn[]>([])
  const [renderStyleOverrides, setRenderStyleOverrides] = useState<Record<string, 'text' | 'badge' | 'link'>>({})
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>({})
  const [comboType, setComboType] = useState<'left-right' | 'grouping'>('left-right')
  const [groupingRows, setGroupingRows] = useState<string[]>([])
  const [editingComboId, setEditingComboId] = useState<string | null>(null)
  
  // New combination column form state
  const [showNewComboForm, setShowNewComboForm] = useState(false)
  const [newComboName, setNewComboName] = useState('')
  const [newComboType, setNewComboType] = useState<'left-right' | 'grouping'>('left-right')
  const [newComboSeparator, setNewComboSeparator] = useState(' ')
  const [newComboLeft, setNewComboLeft] = useState('')
  const [newComboRight, setNewComboRight] = useState('')
  
  // Row selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // Advanced filter state
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false)
  const [filterSets, setFilterSets] = useState<FilterSet[]>([])
  const [currentFilterSet, setCurrentFilterSet] = useState<FilterSet | null>(null)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([])
  const [filterSetName, setFilterSetName] = useState('')
  const [filterSetDescription, setFilterSetDescription] = useState('')
  const [filterSetIsPublic, setFilterSetIsPublic] = useState(false)
  
  // Record detail state
  const [recordDetailOpen, setRecordDetailOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<DataRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState(false)
  const [recordFormData, setRecordFormData] = useState<Record<string, any>>({})
  // Settings drawer state
  const [recordSettingsOpen, setRecordSettingsOpen] = useState(false)
  
  // Record layout settings state
  const [recordLayoutSettings, setRecordLayoutSettings] = useState({
    displayMode: 'drawer',
    layoutColumns: '2',
    labelPosition: 'top',
    labelWidthMode: 'auto' as 'auto' | 'custom',
    labelCustomWidthPx: 180 as number,
    listViewOrder: [] as string[],
    gridViewOrder: [] as string[],
    editableFields: {} as Record<string, boolean>,
    // Tab configuration
    tabCount: 3,
    customTabs: [
      { id: 'details', name: 'Details', enabled: true, icon: 'List', showLabel: true },
      { id: 'activity', name: 'Activity', enabled: true, icon: 'History', showLabel: true },
      { id: 'settings', name: 'Settings', enabled: true, icon: 'Settings', showLabel: true }
    ],
    // Attribute visibility per tab
    attributeVisibility: {} as Record<string, Record<string, boolean>>,
    // Attribute ordering per tab
    attributeOrder: {} as Record<string, string[]>,
    // Activity tab settings
    showActivityTab: true,
    activityFields: {
      showCreated: true,
      showUpdated: true,
      showExported: true,
      showImported: true,
      showViewed: true
    }
  })

  // Tab drag and drop state
  const [tabDragId, setTabDragId] = useState<string | null>(null)
  const [tabDragOverId, setTabDragOverId] = useState<string | null>(null)

  // Attribute drag and drop state for tabs
  const [attrDragId, setAttrDragId] = useState<string | null>(null)
  const [attrDragOverId, setAttrDragOverId] = useState<string | null>(null)
  const [currentDragTab, setCurrentDragTab] = useState<string | null>(null)
  
  // State to track which tab's attribute visibility is being shown
  const [selectedTabForVisibility, setSelectedTabForVisibility] = useState<string | null>(null)
  // Drawer state for Attribute Visibility
  const [attrVisibilityOpen, setAttrVisibilityOpen] = useState(false)

  // Spreadsheet column widths (by attribute id)
  const [sheetColWidths, setSheetColWidths] = useState<Record<string, number>>({})
  const sheetResizeState = useRef<{ attrId: string | null, startX: number, startWidth: number }>({ attrId: null, startX: 0, startWidth: 0 })

  const startResize = (e: React.MouseEvent, attrId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const currentWidth = sheetColWidths[attrId] ?? 160
    sheetResizeState.current = { attrId, startX: e.clientX, startWidth: currentWidth }
    window.addEventListener('mousemove', onResizing)
    window.addEventListener('mouseup', endResize)
  }
  const onResizing = (e: MouseEvent) => {
    const st = sheetResizeState.current
    if (!st.attrId) return
    const delta = e.clientX - st.startX
    const next = Math.max(60, st.startWidth + delta)
    setSheetColWidths(prev => ({ ...prev, [st.attrId!]: next }))
  }
  const endResize = () => {
    sheetResizeState.current = { attrId: null, startX: 0, startWidth: 0 }
    window.removeEventListener('mousemove', onResizing)
    window.removeEventListener('mouseup', endResize)
  }

  // View modes state
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'grid' | 'spreadsheet' | 'kanban' | 'gantt'>('table')
  const [gridColumns, setGridColumns] = useState<number>(3)
  const [kanbanColumnAttrId, setKanbanColumnAttrId] = useState<string | null>(null)
  const [ganttStartAttrId, setGanttStartAttrId] = useState<string | null>(null)
  const [ganttEndAttrId, setGanttEndAttrId] = useState<string | null>(null)

  // Initialize column order when attributes change
  useEffect(() => {
    if (attributes.length > 0 && columnOrder.length === 0) {
      setColumnOrder(attributes.map(a => a.id))
    }
  }, [attributes])

  // Build a map of synthetic combo attributes
  const comboAttributes: Attribute[] = useMemo(() => {
    return comboColumns.map((cc) => ({
      id: cc.id,
      name: cc.id,
      display_name: cc.name,
      type: 'COMBO',
      is_required: false,
      is_unique: false,
      order: 0,
      options: cc
    }))
  }, [comboColumns])

  // Ensure combo columns are present in columnOrder
  useEffect(() => {
    if (comboAttributes.length === 0) return
    setColumnOrder((prev) => {
      const set = new Set(prev)
      let changed = false
      comboAttributes.forEach(a => { if (!set.has(a.id)) { set.add(a.id); changed = true } })
      return changed ? [...prev, ...comboAttributes.map(a=>a.id).filter(id => !prev.includes(id))] : prev
    })
  }, [comboAttributes])

  // Drag-and-drop handlers for column reordering
  const onDragStartAttr = (e: React.DragEvent, id: string) => {
    setDragId(id)
    setIsDragging(true)
    try { e.dataTransfer.setData('text/plain', id) } catch {}
  }
  const onDragOverAttr = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const onDragEnterAttr = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    setDragOverId(targetId)
    // Reorder on hover for smoother feel
    setColumnOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragId)
      const to = next.indexOf(targetId)
      if (from === -1 || to === -1 || from === to) return prev
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }
  const onDropAttr = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    setColumnOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragId)
      const to = next.indexOf(targetId)
      if (from === -1 || to === -1) return prev
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDragId(null)
    setDragOverId(null)
    setIsDragging(false)
  }
  const onDragEndAttr = () => { setIsDragging(false); setDragOverId(null); setDragId(null) }

  const toggleColumnHidden = (id: string) => {
    setHiddenColumns(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const addComboColumn = () => {
    if (!newComboName) return
    
    if (newComboType === 'left-right') {
      if (!newComboLeft || !newComboRight) return
      setComboColumns(prev => [...prev, {
        id: `combo-${Date.now()}`,
        name: newComboName,
        type: 'left-right',
        rows: [newComboLeft, newComboRight],
        separator: newComboSeparator || ' '
      }])
    } else {
      const rows = groupingRows.filter(Boolean)
      if (rows.length === 0) return
      setComboColumns(prev => [...prev, {
        id: `combo-${Date.now()}`,
        name: newComboName,
        type: 'grouping',
        rows,
        separator: newComboSeparator || '\n'
      }])
      setGroupingRows([])
    }
    
    // Reset form
    setShowNewComboForm(false)
    setNewComboName('')
    setNewComboType('left-right')
    setNewComboSeparator(' ')
    setNewComboLeft('')
    setNewComboRight('')
    setGroupingRows([])
  }

  // Row selection functions
  const handleSelectRow = (recordId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recordId)) {
        newSet.delete(recordId)
      } else {
        newSet.add(recordId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(records.map(r => r.id))
      setSelectedRows(allIds)
      setSelectAll(true)
    }
  }

  const handleBulkUpdate = () => {
    if (selectedRows.size === 0) return
    // TODO: Implement bulk update dialog
    console.log('Bulk update for records:', Array.from(selectedRows))
  }

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return
    // TODO: Implement bulk delete confirmation
    console.log('Bulk delete for records:', Array.from(selectedRows))
  }

  const handleExportSelected = () => {
    if (selectedRows.size === 0) return
    // TODO: Implement export selected records
    console.log('Export selected records:', Array.from(selectedRows))
  }

  // Advanced filter functions
  const addAdvancedFilter = () => {
    setAdvancedFilters(prev => [...prev, {
      id: `filter-${Date.now()}`,
      attribute: '',
      operator: 'equals',
      value: ''
    }])
  }

  const updateAdvancedFilter = (id: string, field: keyof AdvancedFilter, value: string) => {
    setAdvancedFilters(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  const removeAdvancedFilter = (id: string) => {
    setAdvancedFilters(prev => prev.filter(f => f.id !== id))
  }

  const applyAdvancedFilters = () => {
    // Convert advanced filters to regular filters format
    const newFilters: Record<string, string> = {}
    advancedFilters.forEach(filter => {
      if (filter.attribute && filter.value) {
        newFilters[filter.attribute] = filter.value
      }
    })
    setFilters(newFilters)
    setAdvancedFilterOpen(false)
  }

  const saveFilterSet = () => {
    if (!filterSetName.trim()) return
    
    const newFilterSet: FilterSet = {
      id: `filterset-${Date.now()}`,
      name: filterSetName,
      description: filterSetDescription,
      filters: advancedFilters,
      isPublic: filterSetIsPublic,
      createdBy: 'Current User', // TODO: Get from auth
      createdAt: new Date().toISOString(),
      dataModelId: modelId || ''
    }
    
    setFilterSets(prev => [...prev, newFilterSet])
    setFilterSetName('')
    setFilterSetDescription('')
    setFilterSetIsPublic(false)
  }

  const loadFilterSet = (filterSet: FilterSet) => {
    setAdvancedFilters(filterSet.filters)
    setCurrentFilterSet(filterSet)
  }

  const deleteFilterSet = (id: string) => {
    setFilterSets(prev => prev.filter(fs => fs.id !== id))
    if (currentFilterSet?.id === id) {
      setCurrentFilterSet(null)
    }
  }

  // Record detail functions
  const openRecordDetail = (record: DataRecord) => {
    setSelectedRecord(record)
    setRecordFormData(record.values || {})
    setRecordDetailOpen(true)
    setEditingRecord(false)
    try {
      const params = new URLSearchParams(window.location.search)
      params.set('record', record.id)
      router.push(`${pathname}?${params.toString()}`)
    } catch {}
  }

  const startEditingRecord = () => {
    setEditingRecord(true)
  }

  const cancelEditingRecord = () => {
    setEditingRecord(false)
    setRecordFormData(selectedRecord?.values || {})
  }

  const saveRecordChanges = async () => {
    if (!selectedRecord) return
    
    try {
      // TODO: Implement API call to update record
      console.log('Saving record changes:', {
        recordId: selectedRecord.id,
        changes: recordFormData
      })
      
      // Update local state
      setSelectedRecord(prev => prev ? { ...prev, values: recordFormData } : null)
      setEditingRecord(false)
      
      // Refresh records list
      loadRecords()
    } catch (error) {
      console.error('Error saving record:', error)
    }
  }


  const saveRecordLayoutSettings = async () => {
    try {
      if (!dataModel?.id) throw new Error('Data model not loaded')
      const key = `record_layout_settings:${dataModel.id}`
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { [key]: recordLayoutSettings } })
      })
      if (!res.ok) throw new Error('Failed to save settings')
      alert('Layout settings saved successfully!')
    } catch (error) {
      console.error('Error saving layout settings:', error)
      alert('Failed to save layout settings. Please try again.')
    }
  }

  useEffect(() => {
    const loadSavedLayoutSettings = async () => {
      try {
        if (!dataModel?.id) return
        const key = `record_layout_settings:${dataModel.id}`
        const res = await fetch('/api/settings')
        if (!res.ok) return
        const allSettings = await res.json()
        const saved = allSettings?.[key]
        if (saved && typeof saved === 'object') {
          setRecordLayoutSettings((prev) => ({
            ...prev,
            ...saved,
            // Ensure required arrays/objects exist even if missing in saved
            attributeVisibility: saved.attributeVisibility || prev.attributeVisibility,
            attributeOrder: saved.attributeOrder || prev.attributeOrder,
            listViewOrder: saved.listViewOrder || prev.listViewOrder,
            gridViewOrder: saved.gridViewOrder || prev.gridViewOrder,
            editableFields: saved.editableFields || prev.editableFields,
            customTabs: saved.customTabs || prev.customTabs,
          }))
        }
      } catch (e) {
        console.warn('Failed to load saved layout settings', e)
      }
    }
    loadSavedLayoutSettings()
  }, [dataModel?.id])

  const updateLayoutSetting = (key: string, value: any) => {
    setRecordLayoutSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateEditableField = (attributeId: string, editable: boolean) => {
    setRecordLayoutSettings(prev => ({
      ...prev,
      editableFields: { ...prev.editableFields, [attributeId]: editable }
    }))
  }

  // Enhanced layout settings functions
  const updateTabSetting = (tabId: string, field: string, value: any) => {
    setRecordLayoutSettings(prev => ({
      ...prev,
      customTabs: prev.customTabs.map(tab => 
        tab.id === tabId ? { ...tab, [field]: value } : tab
      )
    }))
  }

  const updateAttributeVisibility = (tabId: string, attributeId: string, visible: boolean) => {
    setRecordLayoutSettings(prev => ({
      ...prev,
      attributeVisibility: {
        ...prev.attributeVisibility,
        [tabId]: {
          ...prev.attributeVisibility[tabId],
          [attributeId]: visible
        }
      }
    }))
  }

  const updateAttributeOrder = (tabId: string, attributeIds: string[]) => {
    setRecordLayoutSettings(prev => ({
      ...prev,
      attributeOrder: {
        ...prev.attributeOrder,
        [tabId]: attributeIds
      }
    }))
  }

  const addCustomTab = () => {
    const newTabId = `tab_${Date.now()}`
    setRecordLayoutSettings(prev => ({
      ...prev,
      customTabs: [...prev.customTabs, { id: newTabId, name: '', enabled: true }],
      tabCount: prev.tabCount + 1
    }))
  }

  const removeCustomTab = (tabId: string) => {
    setRecordLayoutSettings(prev => ({
      ...prev,
      customTabs: prev.customTabs.filter(tab => tab.id !== tabId),
      tabCount: prev.tabCount - 1
    }))
  }

  const copyRecordLink = () => {
    if (selectedRecord && dataModel) {
      const url = `${window.location.origin}/data/entities?model=${dataModel.id}&record=${selectedRecord.id}`
      navigator.clipboard.writeText(url)
      alert('Record link copied to clipboard!')
    }
  }

  // Sync open state from URL on load
  useEffect(() => {
    if (recordQueryId && records.length > 0) {
      const rec = records.find(r => r.id === recordQueryId)
      if (rec) {
        setSelectedRecord(rec)
        setRecordFormData(rec.values || {})
        setRecordDetailOpen(true)
        setEditingRecord(false)
      }
    }
  }, [recordQueryId, records])

  const closeRecordDetail = () => {
    setRecordDetailOpen(false)
    setSelectedRecord(null)
    setEditingRecord(false)
    try {
      router.push(`${pathname}`)
    } catch {}
  }

  // Tab drag and drop functions
  const onTabDragStart = (e: React.DragEvent, tabId: string) => {
    setTabDragId(tabId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', tabId)
  }

  const onTabDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setTabDragOverId(tabId)
  }

  const onTabDragEnter = (e: React.DragEvent, tabId: string) => {
    e.preventDefault()
    setTabDragOverId(tabId)
  }

  const onTabDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault()
    
    if (!tabDragId || tabDragId === targetTabId) {
      setTabDragId(null)
      setTabDragOverId(null)
      return
    }

    const tabs = [...recordLayoutSettings.customTabs]
    const dragIndex = tabs.findIndex(tab => tab.id === tabDragId)
    const targetIndex = tabs.findIndex(tab => tab.id === targetTabId)

    if (dragIndex !== -1 && targetIndex !== -1) {
      // Remove the dragged tab
      const [draggedTab] = tabs.splice(dragIndex, 1)
      // Insert it at the target position
      tabs.splice(targetIndex, 0, draggedTab)

      setRecordLayoutSettings(prev => ({
        ...prev,
        customTabs: tabs
      }))
    }

    setTabDragId(null)
    setTabDragOverId(null)
  }

  const onTabDragEnd = () => {
    setTabDragId(null)
    setTabDragOverId(null)
  }

  // Attribute management functions for tabs
  const addAttributeToTab = (tabId: string, attributeId: string) => {
    setRecordLayoutSettings(prev => ({
      ...prev,
      attributeVisibility: {
        ...prev.attributeVisibility,
        [tabId]: {
          ...prev.attributeVisibility[tabId],
          [attributeId]: true
        }
      },
      attributeOrder: {
        ...prev.attributeOrder,
        [tabId]: [
          ...(prev.attributeOrder[tabId] || []),
          attributeId
        ]
      }
    }))
  }

  const removeAttributeFromTab = (tabId: string, attributeId: string) => {
    setRecordLayoutSettings(prev => ({
      ...prev,
      attributeVisibility: {
        ...prev.attributeVisibility,
        [tabId]: {
          ...prev.attributeVisibility[tabId],
          [attributeId]: false
        }
      },
      attributeOrder: {
        ...prev.attributeOrder,
        [tabId]: (prev.attributeOrder[tabId] || []).filter(id => id !== attributeId)
      }
    }))
  }

  const getTabAttributes = (tabId: string) => {
    const tabOrder = recordLayoutSettings.attributeOrder[tabId] || []
    const visibleAttributes = attributes.filter(attr => 
      recordLayoutSettings.attributeVisibility[tabId]?.[attr.id] === true
    )
    
    // Sort by custom order if available, otherwise by original order
    return visibleAttributes.sort((a, b) => {
      const aIndex = tabOrder.indexOf(a.id)
      const bIndex = tabOrder.indexOf(b.id)
      
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }

  const getAvailableAttributesForTab = (tabId: string) => {
    const tabAttributeIds = new Set(
      attributes.filter(attr => 
        recordLayoutSettings.attributeVisibility[tabId]?.[attr.id] === true
      ).map(attr => attr.id)
    )
    
    return attributes.filter(attr => !tabAttributeIds.has(attr.id))
  }

  // Attribute drag and drop functions for tabs
  const onAttrDragStart = (e: React.DragEvent, attributeId: string, tabId: string) => {
    setAttrDragId(attributeId)
    setCurrentDragTab(tabId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', attributeId)
  }

  const onAttrDragOver = (e: React.DragEvent, attributeId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setAttrDragOverId(attributeId)
  }

  const onAttrDragEnter = (e: React.DragEvent, attributeId: string) => {
    e.preventDefault()
    setAttrDragOverId(attributeId)
  }

  const onAttrDrop = (e: React.DragEvent, targetAttributeId: string, tabId: string) => {
    e.preventDefault()
    
    if (!attrDragId || attrDragId === targetAttributeId || currentDragTab !== tabId) {
      setAttrDragId(null)
      setAttrDragOverId(null)
      setCurrentDragTab(null)
      return
    }

    const tabAttributes = getTabAttributes(tabId)
    const dragIndex = tabAttributes.findIndex(attr => attr.id === attrDragId)
    const targetIndex = tabAttributes.findIndex(attr => attr.id === targetAttributeId)

    if (dragIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...tabAttributes]
      const [draggedAttr] = newOrder.splice(dragIndex, 1)
      newOrder.splice(targetIndex, 0, draggedAttr)

      setRecordLayoutSettings(prev => ({
        ...prev,
        attributeOrder: {
          ...prev.attributeOrder,
          [tabId]: newOrder.map(attr => attr.id)
        }
      }))
    }

    setAttrDragId(null)
    setAttrDragOverId(null)
    setCurrentDragTab(null)
  }

  const onAttrDragEnd = () => {
    setAttrDragId(null)
    setAttrDragOverId(null)
    setCurrentDragTab(null)
  }

  const renderEditField = (attribute: Attribute, value: any) => {
    return renderEditFieldHelper(attribute, value, {
      onValueChange: (newValue: any) => {
        setRecordFormData(prev => ({ ...prev, [attribute.name]: newValue }))
      }
    })
  }
  
  const getFilterComponent = (attribute: Attribute) => {
    return getFilterComponentHelper(attribute, {
      currentValue: filters[attribute.name] || '',
      handleFilter,
      baseRecords,
      optionSearch,
      setOptionSearch,
    })
  }
  
  const getSortIcon = (attributeName: string) => {
    if (sortConfig?.key !== attributeName) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }
  
  // renderCellValue moved to helpers
  
  if (!modelId) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">No Model Selected</h2>
            <p className="text-muted-foreground">Please select a data model from the sidebar.</p>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  if (loading && !dataModel) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
         {/* Header */}
         {!(recordLayoutSettings.displayMode === 'page' && recordDetailOpen) && (
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold tracking-tight">
               {dataModel?.display_name || 'Data Records'}
             </h1>
             <p className="text-muted-foreground">
               {dataModel?.description || 'View and manage data records'}
             </p>
           </div>
          <div className="flex items-center gap-2">
            {dataModel && (
              <Button variant="outline" size="sm" onClick={() => router.push('/data/entities')}>
                Close
              </Button>
            )}
            {/* View mode selector and settings */}
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">
                  <div className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Table
                  </div>
                </SelectItem>
                <SelectItem value="list">
        }
        
        // Ensure selectOptions is an array
        if (!Array.isArray(selectOptions)) {
          selectOptions = []
        }
        
        console.log('🔍 SELECT selectOptions after parsing:', selectOptions)
        
        return (
          <Select value={value || ''} onValueChange={handleValueChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${attribute.display_name}`} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option: any, index: number) => {
                console.log(`🔍 SELECT option ${index}:`, option, 'type:', typeof option)
                const optionValue = option.value || option
                const optionLabel = option.label || option
                return (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )
      
      case 'MULTI_SELECT':
        let multiSelectOptions = []
        try {
          if (attribute.options) {
            console.log('🔍 MULTI_SELECT attribute.options:', attribute.options, 'type:', typeof attribute.options)
            
            if (Array.isArray(attribute.options)) {
              // Already an array
              multiSelectOptions = attribute.options
            } else if (typeof attribute.options === 'string') {
              // Try to parse as JSON
              try {
                const parsed = JSON.parse(attribute.options)
                if (Array.isArray(parsed)) {
                  multiSelectOptions = parsed
                } else if (typeof parsed === 'object' && parsed !== null) {
                  // Check if it has an "options" key (common format)
                  if (parsed.options && Array.isArray(parsed.options)) {
                    multiSelectOptions = parsed.options
                  } else {
                    // If it's an object, convert to array of objects
                    multiSelectOptions = Object.entries(parsed).map(([key, val]) => ({
                      value: key,
                      label: val
                    }))
                  }
                } else {
                  // If it's a single value, treat as comma-separated
                  multiSelectOptions = attribute.options.split(',').map(opt => ({
                    value: opt.trim(),
                    label: opt.trim()
                  }))
                }
              } catch (parseError) {
                // If JSON parsing fails, treat as comma-separated string
                multiSelectOptions = attribute.options.split(',').map(opt => ({
                  value: opt.trim(),
                  label: opt.trim()
                }))
              }
            } else if (typeof attribute.options === 'object' && attribute.options !== null) {
              // Check if it has an "options" key (common format)
              if (attribute.options.options && Array.isArray(attribute.options.options)) {
                multiSelectOptions = attribute.options.options
              } else {
                // Convert object to array
                multiSelectOptions = Object.entries(attribute.options).map(([key, val]) => ({
                  value: key,
                  label: val
                }))
              }
            }
          }
        } catch (error) {
          console.warn('Error parsing multi-select options in renderEditField:', error)
          multiSelectOptions = []
        }
        
        // Ensure multiSelectOptions is an array
        if (!Array.isArray(multiSelectOptions)) {
          multiSelectOptions = []
        }
        
        
        const selectedValues = Array.isArray(value) ? value : (value ? String(value).split(',') : [])
        
        const handleMultiSelectChange = (optionValue: string, checked: boolean) => {
          let newValues: string[]
          if (checked) {
            newValues = [...selectedValues, optionValue]
          } else {
            newValues = selectedValues.filter(v => v !== optionValue)
          }
          handleValueChange(newValues.join(','))
        }
        
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {multiSelectOptions.map((option: any) => {
                const optionValue = option.value || option
                const optionLabel = option.label || option
                const isSelected = selectedValues.includes(optionValue)
                
                return (
                  <div key={optionValue} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${attribute.name}-${optionValue}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleMultiSelectChange(optionValue, checked as boolean)}
                    />
                    <Label htmlFor={`${attribute.name}-${optionValue}`} className="text-sm">
                      {optionLabel}
                    </Label>
                  </div>
                )
              })}
            </div>
            {selectedValues.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Selected: {selectedValues.join(', ')}
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={`Enter ${attribute.display_name}`}
          />
        )
    }
  }

  const densityRowClass = tableDensity === 'compact' ? 'py-1' : tableDensity === 'spacious' ? 'py-4' : 'py-2'
  const densityCellClass = tableDensity === 'compact' ? 'px-2 py-1' : tableDensity === 'spacious' ? 'px-4 py-3' : 'px-3 py-2'

  const orderedVisibleAttributes: Attribute[] = useMemo(() => {
    const idToAttr = new Map([...attributes, ...comboAttributes].map(a => [a.id, a]))
    const ordered = columnOrder.length ? columnOrder.map(id => idToAttr.get(id)).filter(Boolean) as Attribute[] : attributes
    return ordered.filter(a => !hiddenColumns[a.id])
  }, [attributes, comboAttributes, columnOrder, hiddenColumns])

  // Attribute ordering for list/card (grid) views
  const getViewAttributes = useCallback((mode: 'list' | 'grid') => {
    const base = orderedVisibleAttributes
    const order = mode === 'list' ? recordLayoutSettings.listViewOrder : recordLayoutSettings.gridViewOrder
    if (!order || order.length === 0) return base
    const idToIndex = new Map(order.map((id, idx) => [id, idx]))
    return [...base].sort((a, b) => {
      const ai = idToIndex.has(a.id) ? (idToIndex.get(a.id) as number) : Number.MAX_SAFE_INTEGER
      const bi = idToIndex.has(b.id) ? (idToIndex.get(b.id) as number) : Number.MAX_SAFE_INTEGER
      return ai - bi
    })
  }, [orderedVisibleAttributes, recordLayoutSettings.listViewOrder, recordLayoutSettings.gridViewOrder])

  // Drag state for list/grid layout reordering
  const [listDragId, setListDragId] = useState<string | null>(null)
  const [listDragOverId, setListDragOverId] = useState<string | null>(null)
  const [gridDragId, setGridDragId] = useState<string | null>(null)
  const [gridDragOverId, setGridDragOverId] = useState<string | null>(null)

  const onListDragStart = (e: React.DragEvent, attrId: string) => {
    setListDragId(attrId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', attrId)
  }
  const onListDragOver = (e: React.DragEvent, attrId: string) => {
    e.preventDefault()
    setListDragOverId(attrId)
  }
  const onListDrop = (e: React.DragEvent, targetAttrId: string) => {
    e.preventDefault()
    const dragId = listDragId
    setListDragId(null)
    setListDragOverId(null)
    if (!dragId || dragId === targetAttrId) return
    const current = recordLayoutSettings.listViewOrder.length ? recordLayoutSettings.listViewOrder : orderedVisibleAttributes.map(a => a.id)
    const newOrder = current.filter(id => id !== dragId)
    const targetIdx = newOrder.indexOf(targetAttrId)
    if (targetIdx === -1) newOrder.push(dragId)
    else newOrder.splice(targetIdx, 0, dragId)
    setRecordLayoutSettings(prev => ({ ...prev, listViewOrder: newOrder }))
  }

  const onGridDragStart = (e: React.DragEvent, attrId: string) => {
    setGridDragId(attrId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', attrId)
  }
  const onGridDragOver = (e: React.DragEvent, attrId: string) => {
    e.preventDefault()
    setGridDragOverId(attrId)
  }
  const onGridDrop = (e: React.DragEvent, targetAttrId: string) => {
    e.preventDefault()
    const dragId = gridDragId
    setGridDragId(null)
    setGridDragOverId(null)
    if (!dragId || dragId === targetAttrId) return
    const current = recordLayoutSettings.gridViewOrder.length ? recordLayoutSettings.gridViewOrder : orderedVisibleAttributes.map(a => a.id)
    const newOrder = current.filter(id => id !== dragId)
    const targetIdx = newOrder.indexOf(targetAttrId)
    if (targetIdx === -1) newOrder.push(dragId)
    else newOrder.splice(targetIdx, 0, dragId)
    setRecordLayoutSettings(prev => ({ ...prev, gridViewOrder: newOrder }))
  }

  // Ordered list for settings drawer (no hidden filtering, to allow toggling)
  const orderedAllAttributes: Attribute[] = useMemo(() => {
    const idToAttr = new Map([...attributes, ...comboAttributes].map(a => [a.id, a]))
    return (columnOrder.length ? columnOrder : [...attributes, ...comboAttributes].map(a => a.id))
      .map(id => idToAttr.get(id))
      .filter(Boolean) as Attribute[]
  }, [attributes, comboAttributes, columnOrder])
  
  // Load data model and attributes
  useEffect(() => {
    if (!modelId) return
    
    async function loadModelData() {
      setLoading(true)
      try {
        // Load model info
        console.log('🔍 Loading model info...')
        const modelRes = await fetch(`/api/data-models/${modelId}`)
        console.log('🔍 Model API Response:', modelRes.status, modelRes.statusText)
        if (modelRes.ok) {
          const modelData = await modelRes.json()
          console.log('🔍 Model Data:', modelData)
          setDataModel(modelData.dataModel)
        } else {
          console.error('❌ Model API Error:', modelRes.status, modelRes.statusText)
        }
        
        // Load attributes
        console.log('🔍 Loading attributes...')
        const attrRes = await fetch(`/api/data-models/${modelId}/attributes`)
        console.log('🔍 Attributes API Response:', attrRes.status, attrRes.statusText)
        if (attrRes.ok) {
          const attrData = await attrRes.json()
          console.log('🔍 Attributes Data:', attrData)
          console.log('🔍 Attributes count:', attrData.attributes?.length || 0)
          if (attrData.attributes && attrData.attributes.length > 0) {
            console.log('🔍 First 5 attributes:')
            attrData.attributes.slice(0, 5).forEach((attr: any) => {
              console.log(`   ${attr.name} (${attr.display_name}) - ${attr.type}`)
            })
          }
          setAttributes(attrData.attributes || [])
        } else {
          console.error('❌ Attributes API Error:', attrRes.status, attrRes.statusText)
        }
      } catch (error) {
        console.error('Error loading model data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadModelData()
  }, [modelId])
  
  // Load records with current filters and sorting
  useEffect(() => {
    if (!modelId) return
    
    async function loadRecords() {
      setLoading(true)
      try {
         const params = new URLSearchParams({
           data_model_id: modelId,
           page: pagination.page.toString(),
           limit: pagination.limit.toString(),
         })
         
         // Add filters
         Object.entries(filters).forEach(([key, value]) => {
           if (value !== '' && value !== null && value !== undefined) {
             params.append(`filter_${key}`, value)
           }
         })
         
         if (sortConfig) {
           params.append('sort_by', sortConfig.key)
           params.append('sort_direction', sortConfig.direction)
         }
        
        
        const apiUrl = `/api/data-records?${params}`
    
        
        const res = await fetch(apiUrl)
        
        if (res.ok) {
          const data = await res.json()
     
          setRecords(data.records || [])
          setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
        } else {
          console.error('❌ API Error:', res.status, res.statusText)
          const errorText = await res.text()
          console.error('❌ Error Response:', errorText.substring(0, 500))
          setError(`API Error: ${res.status} ${res.statusText}`)
          // Set empty state to show 0 records
          setRecords([])
          setPagination({ page: 1, limit: 20, total: 0, pages: 0 })
        }
      } catch (error) {
        console.error('Error loading records:', error)
      } finally {
        setLoading(false)
      }
    }
    
     loadRecords()
  }, [modelId, pagination.page, sortConfig, filters])
  
  useEffect(() => {
    if (!modelId) return
    
    // Load a one-time unfiltered snapshot for option generation
    async function loadBaseSnapshot() {
      try {
        const params = new URLSearchParams({ data_model_id: modelId, page: '1', limit: '1000' })
        const res = await fetch(`/api/data-records?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setBaseRecords(Array.isArray(data.records) ? data.records : [])
        }
      } catch (_) {
        // ignore snapshot errors
      }
    }
    loadBaseSnapshot()
  }, [modelId])
  
  const handleSort = (attributeName: string) => {
    setSortConfig(prev => {
      if (prev?.key === attributeName) {
        return prev.direction === 'asc' 
          ? { key: attributeName, direction: 'desc' }
          : null
      }
      return { key: attributeName, direction: 'asc' }
    })
  }
  
  const clearFilters = () => {
    setSortConfig(null)
    setFilters({})
  }
   
  const handleFilter = (attributeName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [attributeName]: value
    }))
  }

  // Compute how many conditions are applied for a given attribute (for badge display)
  const getFilterCountForAttribute = (attribute: Attribute): number => {
    const raw = filters[attribute.name]
    if (raw === undefined || raw === null || raw === '') return 0

    const type = attribute.type?.toUpperCase()
    switch (type) {
      case 'SELECT':
      case 'MULTI_SELECT':
      case 'USERS':
      case 'USER':
      case 'ENTITY':
      case 'ENTITIES':
      case 'TAGS':
      case 'STATUS': {
        const parts = Array.isArray(raw) ? raw : String(raw).split(',')
        return parts.filter((p: any) => String(p).trim() !== '').length
      }
      case 'NUMBER':
      case 'DATE':
      case 'DATETIME':
      case 'CURRENCY':
      case 'PERCENTAGE':
      case 'RATING': {
        const [min, max] = String(raw).split(',')
        let c = 0
        if (min && String(min).trim() !== '') c += 1
        if (max && String(max).trim() !== '') c += 1
        return c
      }
      case 'BOOLEAN':
        return 1
      default:
        return 1
    }
  }

  // Build display tags for header based on active filters per attribute
  const getFilterTagsForAttribute = (attribute: Attribute): string[] => {
    const raw = filters[attribute.name]
    if (raw === undefined || raw === null || raw === '') return []
    const type = attribute.type?.toUpperCase()

    if (['SELECT','MULTI_SELECT','USERS','USER','ENTITY','ENTITIES','TAGS','STATUS'].includes(type)) {
      const parts = Array.isArray(raw) ? raw : String(raw).split(',')
      return parts.map((p: any) => String(p).trim()).filter(Boolean)
    }

    if (['NUMBER','CURRENCY','PERCENTAGE','RATING'].includes(type)) {
      const [min, max] = String(raw).split(',')
      const tags: string[] = []
      if (min && String(min).trim() !== '') tags.push(`≥ ${min}`)
      if (max && String(max).trim() !== '') tags.push(`≤ ${max}`)
      return tags
    }

    if (['DATE','DATETIME'].includes(type)) {
      const [from, to] = String(raw).split(',')
      const tags: string[] = []
      if (from && String(from).trim() !== '') tags.push(`from ${from}`)
      if (to && String(to).trim() !== '') tags.push(`to ${to}`)
      return tags
    }

    if (type === 'BOOLEAN') {
      return [String(raw) === 'true' ? 'Yes' : String(raw) === 'false' ? 'No' : String(raw)]
    }

    // default text-like
    return [String(raw)]
  }
  
  const getFilterComponent = (attribute: Attribute) => {
    return getFilterComponentHelper(attribute, {
      currentValue: filters[attribute.name] || '',
      handleFilter,
      baseRecords,
      optionSearch,
      setOptionSearch,
    })
  }
  const getSortIcon = (attributeName: string) => {
    if (sortConfig?.key !== attributeName) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }
  
  
  // renderCellValue moved to helpers
  
  if (!modelId) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">No Model Selected</h2>
            <p className="text-muted-foreground">Please select a data model from the sidebar.</p>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  if (loading && !dataModel) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
         {/* Header */}
         {!(recordLayoutSettings.displayMode === 'page' && recordDetailOpen) && (
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold tracking-tight">
               {dataModel?.display_name || 'Data Records'}
             </h1>
             <p className="text-muted-foreground">
               {dataModel?.description || 'View and manage data records'}
             </p>
           </div>
          <div className="flex items-center gap-2">
            {dataModel && (
              <Button variant="outline" size="sm" onClick={() => router.push('/data/entities')}>
                Close
              </Button>
            )}
            {/* View mode selector and settings */}
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">
                  <div className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Table
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List
                  </div>
                </SelectItem>
                <SelectItem value="grid">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Grid
                  </div>
                </SelectItem>
                <SelectItem value="spreadsheet">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Spreadsheet
                  </div>
                </SelectItem>
                <SelectItem value="kanban">
                  <div className="flex items-center gap-2">
                    <Kanban className="h-4 w-4" />
                    Kanban
                  </div>
                </SelectItem>
                <SelectItem value="gantt">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Gantt
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {viewMode === 'grid' && (
              <Select value={String(gridColumns)} onValueChange={(v) => setGridColumns(Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Grid cols" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 columns</SelectItem>
                  <SelectItem value="3">3 columns</SelectItem>
                  <SelectItem value="4">4 columns</SelectItem>
                  <SelectItem value="5">5 columns</SelectItem>
                </SelectContent>
              </Select>
            )}
            {viewMode === 'kanban' && (
              <Select value={kanbanColumnAttrId || ''} onValueChange={setKanbanColumnAttrId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Kanban column attribute" />
                </SelectTrigger>
                <SelectContent>
                  {attributes.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {viewMode === 'gantt' && (
              <div className="flex items-center gap-2">
                <Select value={ganttStartAttrId || ''} onValueChange={setGanttStartAttrId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Start date attr" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes.filter(a => a.type?.toLowerCase?.() === 'date' || a.type?.toLowerCase?.() === 'datetime').map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={ganttEndAttrId || ''} onValueChange={setGanttEndAttrId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="End date attr" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes.filter(a => a.type?.toLowerCase?.() === 'date' || a.type?.toLowerCase?.() === 'datetime').map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
             {Object.keys(filters).length > 0 && (
               <Button
                 variant="outline"
                 onClick={clearFilters}
                 className="text-sm"
               >
                 Clear Filters ({Object.keys(filters).length})
               </Button>
             )}
            <AdvancedFiltersDialog
              open={advancedFilterOpen}
              onOpenChange={setAdvancedFilterOpen}
              attributes={attributes}
              advancedFilters={advancedFilters}
              addAdvancedFilter={addAdvancedFilter}
              updateAdvancedFilter={updateAdvancedFilter}
              removeAdvancedFilter={removeAdvancedFilter}
              filterSets={filterSets}
              loadFilterSet={loadFilterSet}
              deleteFilterSet={deleteFilterSet}
              filterSetName={filterSetName}
              setFilterSetName={setFilterSetName}
              filterSetDescription={filterSetDescription}
              setFilterSetDescription={setFilterSetDescription}
              filterSetIsPublic={filterSetIsPublic}
              setFilterSetIsPublic={(v: boolean) => setFilterSetIsPublic(v)}
              saveFilterSet={saveFilterSet}
              applyAdvancedFilters={applyAdvancedFilters}
            />
            <SettingsDrawer
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              renderTrigger={() => (
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" /> Customize
                </Button>
              )}
              ctx={{
                tableDensity, setTableDensity, orderedAllAttributes, dragOverId, isDragging,
                onDragStartAttr, onDragOverAttr, onDragEnterAttr, onDropAttr, onDragEndAttr,
                isAdmin, renderStyleOverrides, setRenderStyleOverrides, labelOverrides, setLabelOverrides,
                editingComboId, setEditingComboId, hiddenColumns, toggleColumnHidden,
                attributes, comboColumns, setComboColumns, setColumnOrder,
                showNewComboForm, setShowNewComboForm, newComboName, setNewComboName,
                newComboType, setNewComboType, newComboSeparator, setNewComboSeparator,
                newComboLeft, setNewComboLeft, newComboRight, setNewComboRight,
                groupingRows, setGroupingRows, addComboColumn,
              }}
            />
             <Button>
               <Plus className="mr-2 h-4 w-4" />
               Add Record
             </Button>
           </div>
         </div>
         )}
        
        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-600">
                <strong>Error:</strong> {error}
                <br />
                <small>Check browser console for more details.</small>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Bulk Actions */}
        {selectedRows.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{selectedRows.size} record{selectedRows.size !== 1 ? 's' : ''} selected</span>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedRows(new Set())
                    setSelectAll(false)
                  }}>
                    Clear Selection
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportSelected}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkUpdate}>
                    <Edit className="mr-2 h-4 w-4" />
                    Bulk Update
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Bulk Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Records Table */}
        {!(recordLayoutSettings.displayMode === 'page' && recordDetailOpen) && (
        <Card>
          <CardHeader>
            <CardTitle>Records</CardTitle>
            <CardDescription>
              {pagination.total} total records • Page {pagination.page} of {pagination.pages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Alternative views */}
            {viewMode === 'list' && (
              <div className="space-y-2 mb-4">
                {records.map((record) => (
                  <div key={record.id} className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer" onClick={() => openRecordDetail(record)}>
                    <div className="flex items-center justify-between">
                      {(() => { const listAttrs = getViewAttributes('list'); return (
                        <div className="font-medium">{listAttrs[0] ? renderCellValue(record, listAttrs[0]) : record.id}</div>
                      )})()}
                      <div className="text-sm text-muted-foreground">{new Date(record.created_at).toLocaleString()}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {(() => { const listAttrs = getViewAttributes('list'); return listAttrs.slice(1, 5).map(attr => (
                        <div key={attr.id} className="truncate"><span className="text-muted-foreground">{attr.display_name}:</span> {renderCellValue(record, attr)}</div>
                      ))})()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'grid' && (
              <div className={`grid gap-3 mb-4`} style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
                {records.map((record) => (
                  <Card key={record.id} className="hover:shadow cursor-pointer" onClick={() => openRecordDetail(record)}>
                    <CardHeader className="pb-2">
                      {(() => { const gridAttrs = getViewAttributes('grid'); return (
                        <CardTitle className="text-base truncate">{gridAttrs[0] ? renderCellValue(record, gridAttrs[0]) : record.id}</CardTitle>
                      )})()}
                      <CardDescription>{new Date(record.created_at).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {(() => { const gridAttrs = getViewAttributes('grid'); return gridAttrs.slice(1, 6).map(attr => (
                        <div key={attr.id} className="flex justify-between gap-3">
                          <span className="text-muted-foreground truncate">{attr.display_name}</span>
                          <span className="truncate max-w-[60%]">{renderCellValue(record, attr)}</span>
                        </div>
                      ))})()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {viewMode === 'spreadsheet' && (
              <div className="rounded-md border overflow-hidden mb-4" style={{ height: 400 }}>
                <AutoSizer>
                  {({ width, height }) => {
                    const columns = orderedVisibleAttributes.map(a => ({ title: a.display_name, id: a.id }))
                    const getContent = ([col, row]: readonly [number, number]): GridCell => {
                      const attr = orderedVisibleAttributes[col]
                      const rec = records[row]
                      const value = attr && rec ? (rec.values || {})[attr.name] ?? '' : ''
                      return {
                        kind: GridCellKind.Text,
                        allowOverlay: true,
                        displayData: String(value),
                        data: String(value)
                      }
                    }
                    return (
                      <DataEditor
                        width={width}
                        height={height}
                        columns={columns as any}
                        getCellContent={getContent as any}
                        rows={records.length}
                        rowMarkers="number"
                        smoothScrollX
                        smoothScrollY
                        onColumnResize={(col, size) => {
                          const attr = orderedVisibleAttributes[col]
                          if (attr) setSheetColWidths(prev => ({ ...prev, [attr.id]: size }))
                        }}
                        columnWidths={orderedVisibleAttributes.map(a => sheetColWidths[a.id] ?? 160)}
                        onCellEdited={(cell, newValue: any) => {
                          const [col, row] = cell as [number, number]
                          const attr = orderedVisibleAttributes[col]
                          if (!attr) return
                          const text = typeof newValue?.data === 'string' ? newValue.data : String(newValue?.data ?? '')
                          setRecords(prev => {
                            const next = [...prev]
                            const rec = { ...next[row] }
                            const values = { ...(rec.values || {}) }
                            values[attr.name] = text
                            rec.values = values
                            next[row] = rec
                            return next
                          })
                          // TODO: Persist change via API (debounced/batch)
                        }}
                      />
                    )
                  }}
                </AutoSizer>
              </div>
            )}

            {viewMode === 'kanban' && (
              <div className="flex gap-4 overflow-x-auto mb-4">
                {(() => {
                  const attr = attributes.find(a => a.id === kanbanColumnAttrId)
                  if (!attr) return <div className="text-sm text-muted-foreground">Select a column attribute</div>
                  const groups = new Map<string, typeof records>()
                  records.forEach(r => {
                    const key = String((r.values || {})[attr.name] ?? 'Unassigned')
                    if (!groups.has(key)) groups.set(key, [])
                    groups.get(key)!.push(r)
                  })
                  const ordered = Array.from(groups.entries())
                  return ordered.map(([col, items]) => (
                    <div key={col} className="min-w-[260px] bg-muted/30 border rounded-md p-2">
                      <div className="font-medium mb-2">{col} <span className="text-xs text-muted-foreground">({items.length})</span></div>
                      <div className="space-y-2">
                        {items.map(rec => (
                          <div key={rec.id} className="bg-background border rounded p-2 cursor-pointer" onClick={() => openRecordDetail(rec)}>
                            <div className="font-medium truncate">{orderedVisibleAttributes[0] ? renderCellValue(rec, orderedVisibleAttributes[0]) : rec.id}</div>
                            <div className="mt-1 text-xs text-muted-foreground truncate">{new Date(rec.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {viewMode === 'gantt' && (
              <div className="w-full overflow-x-auto mb-4">
                {(() => {
                  const startAttr = attributes.find(a => a.id === ganttStartAttrId)
                  const endAttr = attributes.find(a => a.id === ganttEndAttrId)
                  if (!startAttr || !endAttr) return <div className="text-sm text-muted-foreground">Select start and end date attributes</div>
                  const items = records.map(r => {
                    const start = new Date((r.values || {})[startAttr.name])
                    const end = new Date((r.values || {})[endAttr.name])
                    return { r, start, end }
                  }).filter(x => !isNaN(x.start as any) && !isNaN(x.end as any))
                  if (items.length === 0) return <div className="text-sm text-muted-foreground">No schedulable records</div>
                  const min = new Date(Math.min(...items.map(x => +x.start)))
                  const max = new Date(Math.max(...items.map(x => +x.end)))
                  const rangeMs = Math.max(1, (+max - +min))
                  return (
                    <div className="space-y-2">
                      {items.map(({ r, start, end }) => {
                        const leftPct = Math.max(0, Math.min(100, ((+start - +min) / rangeMs) * 100))
                        const widthPct = Math.max(0.5, ((+end - +start) / rangeMs) * 100)
                        return (
                          <div key={r.id} className="flex items-center gap-3">
                            <div className="w-48 truncate text-sm">{orderedVisibleAttributes[0] ? renderCellValue(r, orderedVisibleAttributes[0]) : r.id}</div>
                            <div className="relative flex-1 h-6 bg-muted rounded">
                              <div className="absolute h-6 top-0 rounded bg-primary/70" style={{ left: `${leftPct}%`, width: `${widthPct}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Default Table view */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-[50px]">
                       <Checkbox
                         checked={selectAll}
                         onCheckedChange={handleSelectAll}
                         aria-label="Select all"
                       />
                     </TableHead>
                     {orderedVisibleAttributes.map((attribute) => (
                       <TableHead key={attribute.id} className="min-w-[150px]">
                         <div className="flex items-center justify-between">
                           <Button
                             variant="ghost"
                             size="sm"
                             className="h-auto p-0 font-semibold"
                             onClick={() => handleSort(attribute.name)}
                           >
                             <div className="flex items-center gap-2">
                               {attribute.display_name}
                               {getSortIcon(attribute.name)}
                               {(() => {
                                 const count = getFilterCountForAttribute(attribute)
                                 return count > 0 ? (
                                   <Badge className="h-5 px-1.5 text-[10px]" variant="secondary">{count}</Badge>
                                 ) : null
                               })()}
                               {(() => {
                                 const tags = getFilterTagsForAttribute(attribute)
                                 if (tags.length === 0) return null
                                 const maxShown = 3
                                 const shown = tags.slice(0, maxShown)
                                 const overflow = tags.length - shown.length
                                 return (
                                   <div className="flex items-center gap-1 flex-wrap">
                                     {shown.map((t, idx) => (
                                       <Badge key={`${attribute.id}-tag-${idx}`} className="h-5 px-1.5 text-[10px]" variant="outline">{t}</Badge>
                                     ))}
                                     {overflow > 0 && (
                                       <Badge className="h-5 px-1.5 text-[10px]" variant="outline">+{overflow}</Badge>
                                     )}
                                   </div>
                                 )
                               })()}
                             </div>
                           </Button>
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-6 w-6 p-0"
                               >
                                 <Filter className="h-4 w-4" />
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent 
                               className="w-[500px] min-w-[400px] max-w-[600px] p-4" 
                               align="start"
                               style={{ width: '500px', minWidth: '400px', maxWidth: '600px' }}
                             >
                               <div className="space-y-4">
                                 <div className="space-y-3">
                                   {getFilterComponent(attribute)}
                                 </div>
                                 <div className="flex justify-between items-center pt-2 border-t">
                                   <span className="text-xs text-muted-foreground">
                                     {filters[attribute.name] ? 'Filter active' : 'No filter'}
                                   </span>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => handleFilter(attribute.name, '')}
                                     className="h-7 px-2 text-xs"
                                   >
                                     Clear
                                   </Button>
                                 </div>
                               </div>
                             </PopoverContent>
                           </Popover>
                         </div>
                       </TableHead>
                     ))}
                     <TableHead className="w-[100px]">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow 
                      key={record.id} 
                      className={`${densityRowClass} cursor-pointer hover:bg-muted/50`}
                      onClick={() => openRecordDetail(record)}
                    >
                      <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.has(record.id)}
                          onCheckedChange={() => handleSelectRow(record.id)}
                          aria-label={`Select record ${record.id}`}
                        />
                      </TableCell>
                      {orderedVisibleAttributes.map((attribute) => (
                        <TableCell key={attribute.id} className={densityCellClass}>
                          {renderCellValue(record, attribute)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={orderedVisibleAttributes.length + 1} className="text-center text-muted-foreground">
                        No records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            )}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Record Detail - Drawer mode */}
        {recordLayoutSettings.displayMode === 'drawer' && (
          <RecordDetailDrawer
            open={recordDetailOpen}
            onOpenChange={setRecordDetailOpen}
            ctx={{
              selectedRecord, dataModel, copyRecordLink, setRecordSettingsOpen,
              editingRecord, startEditingRecord, cancelEditingRecord, saveRecordChanges, closeRecordDetail,
              recordLayoutSettings, getTabAttributes, renderEditField, recordFormData, renderCellValue
            }}
          />
        )}

        {/* Record Detail - Modal mode */}
        {recordLayoutSettings.displayMode === 'modal' && recordDetailOpen && (
          <RecordDetailModal
            open={recordDetailOpen}
            ctx={{
              dataModel, selectedRecord, copyRecordLink, setRecordSettingsOpen, editingRecord,
              startEditingRecord, cancelEditingRecord, saveRecordChanges, closeRecordDetail,
              renderCellValue, renderEditField, recordFormData, getTabAttributes, recordLayoutSettings,
            }}
          />
        )}

        {/* Record Detail - Full Page mode */}
        {recordLayoutSettings.displayMode === 'page' && recordDetailOpen && (
          <div className="flex flex-col h-full">
            <div className="border-b bg-background">
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">{selectedRecord ? `Record Details` : 'Record Details'}</div>
                  <div className="text-sm text-muted-foreground">
                    {dataModel?.display_name} • ID: {selectedRecord?.id}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyRecordLink}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Share Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRecordSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedRecord && (
                <div className="max-w-[1400px] mx-auto">
                  <Tabs defaultValue="details" className="space-y-4 h-full flex flex-col">
                    <TabsList className="flex w-full justify-start gap-2">
                      {recordLayoutSettings.customTabs
                        .filter(t => t.id !== 'settings' && t.enabled)
                        .map(t => (
                          <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-2">
                            {(() => {
                              const iconMap: any = { List, History, Settings, Grid3X3, TableIcon, User, Clock, BarChart3 }
                              const IconComp = iconMap[t.icon || 'List'] || List
                              return <IconComp className="h-4 w-4" />
                            })()}
                            {(t.showLabel ?? true) && t.name}
                          </TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="details" className="space-y-4 flex-1 overflow-y-auto">
                      <div className={`grid grid-cols-1 ${recordLayoutSettings.layoutColumns === '1' ? 'md:grid-cols-1' : recordLayoutSettings.layoutColumns === '3' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 text-left`}>
                        {orderedVisibleAttributes.map((attribute) => (
                          <div key={attribute.id} className="text-left">
                            {recordLayoutSettings.labelPosition === 'left' ? (
                              <div className="gap-3 items-start" style={{
                                display: 'grid',
                                gridTemplateColumns: `${recordLayoutSettings.labelWidthMode === 'custom' ? `${recordLayoutSettings.labelCustomWidthPx}px` : 'max-content'} 1fr`
                              }}>
                                <Label className="text-sm font-medium text-left pt-2">
                                  {attribute.display_name}
                                  {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                <div>
                                  {editingRecord ? (
                                    <div className="text-left">
                                      {renderEditField(attribute, recordFormData[attribute.name] || '')}
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-muted rounded-md text-left">
                                      {renderCellValue(selectedRecord, attribute)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-left">
                                  {attribute.display_name}
                                  {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                {editingRecord ? (
                                  <div className="text-left">
                                    {renderEditField(attribute, recordFormData[attribute.name] || '')}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-muted rounded-md text-left">
                                    {renderCellValue(selectedRecord, attribute)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="activity" className="space-y-4">
                      <div className="text-sm text-muted-foreground">Activity will always be shown by default.</div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Drawer */}
        <Drawer open={recordSettingsOpen} onOpenChange={setRecordSettingsOpen}>
          <DrawerContent className="h-screen w-[50vw] flex flex-col">
            <DrawerHeader className="border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <div>
                  <DrawerTitle className="text-xl">Record Settings</DrawerTitle>
                  <DrawerDescription>
                    {dataModel?.display_name} • ID: {selectedRecord?.id}
                  </DrawerDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="default" size="sm" onClick={saveRecordLayoutSettings}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRecordSettingsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Settings Content (moved from settings tab) */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Record Layout Settings</h3>
                  <Button variant="outline" size="sm" onClick={copyRecordLink}>
                    <Share className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>

                {/* Display Mode & Layout */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Display Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Display Mode</Label>
                      <Select 
                        value={recordLayoutSettings.displayMode} 
                        onValueChange={(value) => updateLayoutSetting('displayMode', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="drawer">Drawer</SelectItem>
                          <SelectItem value="modal">Modal</SelectItem>
                          <SelectItem value="page">Full Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Layout Columns</Label>
                      <Select 
                        value={recordLayoutSettings.layoutColumns} 
                        onValueChange={(value) => updateLayoutSetting('layoutColumns', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Column</SelectItem>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Label Position</Label>
                      <Select 
                        value={recordLayoutSettings.labelPosition} 
                        onValueChange={(value) => updateLayoutSetting('labelPosition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {recordLayoutSettings.labelPosition === 'left' && (
                      <div className="space-y-2">
                        <Label>Label Width</Label>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <Select 
                            value={recordLayoutSettings.labelWidthMode}
                            onValueChange={(value) => updateLayoutSetting('labelWidthMode', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          {recordLayoutSettings.labelWidthMode === 'custom' && (
                            <div className="col-span-2">
                              <Input 
                                type="number" 
                                min={80} 
                                max={480}
                                value={recordLayoutSettings.labelCustomWidthPx}
                                onChange={(e) => updateLayoutSetting('labelCustomWidthPx', Number(e.target.value))}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* List/Card View Layout (drag & drop) */}
                {(viewMode === 'list' || viewMode === 'grid') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-medium">{viewMode === 'list' ? 'List' : 'Card'} View Configuration</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Drag attributes to reorder the {viewMode === 'list' ? 'list preview' : 'card preview'}.</div>
                      {viewMode === 'list' ? (
                        <div className="space-y-2">
                          {(recordLayoutSettings.listViewOrder.length ? recordLayoutSettings.listViewOrder : orderedVisibleAttributes.map(a => a.id))
                            .map(id => orderedVisibleAttributes.find(a => a.id === id))
                            .filter(Boolean)
                            .map(a => a as Attribute)
                            .slice(0, 6)
                            .map(attr => (
                              <div key={attr.id}
                                   draggable
                                   onDragStart={(e) => onListDragStart(e, attr.id)}
                                   onDragOver={(e) => onListDragOver(e, attr.id)}
                                   onDrop={(e) => onListDrop(e, attr.id)}
                                   className={`flex items-center justify-between border rounded p-2 ${listDragOverId === attr.id ? 'bg-blue-50 border-blue-400' : ''}`}>
                                <div className="flex items-center gap-3">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{attr.display_name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[50%]">Preview value</div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(recordLayoutSettings.gridViewOrder.length ? recordLayoutSettings.gridViewOrder : orderedVisibleAttributes.map(a => a.id))
                            .map(id => orderedVisibleAttributes.find(a => a.id === id))
                            .filter(Boolean)
                            .map(a => a as Attribute)
                            .slice(0, 6)
                            .map(attr => (
                              <div key={attr.id}
                                   draggable
                                   onDragStart={(e) => onGridDragStart(e, attr.id)}
                                   onDragOver={(e) => onGridDragOver(e, attr.id)}
                                   onDrop={(e) => onGridDrop(e, attr.id)}
                                   className={`border rounded p-3 ${gridDragOverId === attr.id ? 'bg-blue-50 border-blue-400' : ''}`}>
                                <div className="text-sm font-medium truncate">{attr.display_name}</div>
                                <div className="text-xs text-muted-foreground truncate">Preview value</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-medium">Tab Configuration</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure tab visibility, icon, and attributes. Use the eye icon to manage attributes.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addCustomTab}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tab
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recordLayoutSettings.customTabs.filter((t) => t.id !== 'settings').map((tab) => (
                      <div 
                        key={tab.id} 
                        className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-200 ${
                          tabDragId === tab.id ? 'opacity-50 scale-95' : ''
                        } ${
                          tabDragOverId === tab.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                        draggable
                        onDragStart={(e) => onTabDragStart(e, tab.id)}
                        onDragOver={(e) => onTabDragOver(e, tab.id)}
                        onDragEnter={(e) => onTabDragEnter(e, tab.id)}
                        onDrop={(e) => onTabDrop(e, tab.id)}
                        onDragEnd={onTabDragEnd}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab hover:text-foreground" />
                        <Checkbox 
                          checked={tab.enabled}
                          onCheckedChange={(checked) => updateTabSetting(tab.id, 'enabled', checked)}
                        />
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            placeholder={tab.name ? "Tab name" : "Enter tab name..."}
                            value={tab.name}
                            onChange={(e) => updateTabSetting(tab.id, 'name', e.target.value)}
                            className="w-40"
                          />
                        </div>
                        {tab.id !== 'activity' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { setSelectedTabForVisibility(tab.id); setAttrVisibilityOpen(true) }}
                          className={'hover:bg-gray-50'}
                          title={'Configure attribute visibility in a drawer'}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        )}
                        {tab.id !== 'details' && tab.id !== 'activity' && tab.id !== 'settings' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeCustomTab(tab.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveRecordLayoutSettings}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Layout Settings
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Attribute Visibility Drawer */}
        <AttributeVisibilityDrawer
          open={attrVisibilityOpen}
          onOpenChange={setAttrVisibilityOpen}
          selectedTabId={selectedTabForVisibility}
          setSelectedTabId={setSelectedTabForVisibility}
          recordLayoutSettings={recordLayoutSettings}
          getTabAttributes={getTabAttributes}
          getAvailableAttributesForTab={getAvailableAttributesForTab}
          addAttributeToTab={addAttributeToTab}
          removeAttributeFromTab={removeAttributeFromTab}
          updateEditableField={updateEditableField}
          attrDragId={attrDragId}
          attrDragOverId={attrDragOverId}
          onAttrDragStart={onAttrDragStart}
          onAttrDragOver={onAttrDragOver}
          onAttrDragEnter={onAttrDragEnter}
          onAttrDrop={onAttrDrop}
          onAttrDragEnd={onAttrDragEnd}
        />
      </div>
    </MainLayout>
  )
}
