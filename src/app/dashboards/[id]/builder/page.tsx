'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { useDataModelData } from '@/hooks/useDataModelData'
import { useDashboardState } from './hooks/useDashboardState'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { ToolboxEnhanced as Toolbox } from './components/ToolboxEnhanced'
import { CanvasEnhanced as Canvas } from './components/CanvasEnhanced'
import { DndContext, DragEndEvent, pointerWithin, rectIntersection, useSensor, useSensors, PointerSensor, KeyboardSensor, CollisionDetection, useDndMonitor } from '@dnd-kit/core'
import { Toolbar } from './components/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { TemplatesDialog } from './components/TemplatesDialog'
import { FilterPanel } from './components/FilterPanel'
import { CombinedToolsDrawer } from './components/CombinedToolsDrawer'
import { useInteractiveFiltering } from './hooks/useInteractiveFiltering'
import { exportElement } from './utils/exportUtils'
import { TOOLBOX_GROUPS } from './constants/toolbox'
import { DashboardElement } from './hooks/useDashboardState'

export default function DashboardBuilderPage() {
  const router = useRouter()
  
  const {
    dashboard,
    setDashboard,
    loading,
    saving,
    selectedElement,
    setSelectedElement,
    dataSources,
    gridSize,
    setGridSize,
    zoom,
    setZoom,
    showPixelMode,
    setShowPixelMode,
    snapToGrid,
    setSnapToGrid,
    canvasWidth,
    setCanvasWidth,
    canvasHeight,
    setCanvasHeight,
    saveDashboard,
    updateElement,
    deleteElement
  } = useDashboardState()

  // Pages state (derived from dashboard)
  const [activePageId, setActivePageId] = useState<string | null>(null)
  React.useEffect(() => {
    if (!dashboard) return
    if (dashboard.pages && dashboard.pages.length > 0) {
      if (!activePageId || !dashboard.pages.find(p => p.id === activePageId)) {
        setActivePageId(dashboard.pages[0].id)
      }
    } else {
      // Initialize with a default page if none
      const defaultPage = { id: `page_1`, name: 'Page 1', order: 0 }
      const updated = { ...dashboard, pages: [defaultPage] }
      setDashboard(updated)
      setDashboardHistory(updated)
      setActivePageId(defaultPage.id)
    }
  }, [dashboard?.id])

  const addPage = () => {
    if (!dashboard) return
    const nextOrder = (dashboard.pages?.length || 0)
    const id = `page_${Date.now()}`
    const newPage = { id, name: `Page ${nextOrder + 1}`, order: nextOrder }
    const updated = { ...dashboard, pages: [...(dashboard.pages || []), newPage] }
    setDashboard(updated)
    setDashboardHistory(updated)
    setActivePageId(id)
  }
  const renamePage = (id: string, name: string) => {
    if (!dashboard) return
    const updated = { ...dashboard, pages: (dashboard.pages || []).map(p => p.id === id ? { ...p, name } : p) }
    setDashboard(updated)
    setDashboardHistory(updated)
  }
  const deletePage = (id: string) => {
    if (!dashboard) return
    const remaining = (dashboard.pages || []).filter(p => p.id !== id)
    const updated = { ...dashboard, pages: remaining }
    setDashboard(updated)
    setDashboardHistory(updated)
    if (activePageId === id) setActivePageId(remaining[0]?.id || null)
  }

  const {
    draggedItem,
    draggedElement,
    isDragging,
    isResizing,
    startResize,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleElementMouseDown,
    gridToPixel,
    pixelToGrid,
    snapToGridValue
  } = useDragAndDrop(gridSize, snapToGrid, updateElement)

  // UI State
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [uiActiveFilters, setUiActiveFilters] = useState<Record<string, any>>({})
  // Removed dashboard-level data source dialog state (chart-level only)
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [showCanvasBorder, setShowCanvasBorder] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  // Global drag overlay state (for toolbox drag preview and pointer coords)
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null)
  const [activeToolboxItem, setActiveToolboxItem] = useState<any | null>(null)
  
  // Multi-select state
  const [selectedElements, setSelectedElements] = useState<DashboardElement[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  // Combined tools drawer
  const [showToolsDrawer, setShowToolsDrawer] = useState(false)
  const [toolsInitialTab, setToolsInitialTab] = useState<'share'|'versions'|'styling'|'settings'>('share')
  const [canvasBackground, setCanvasBackground] = useState<{
    type: 'color' | 'gradient' | 'image'
    color: string
    gradient: { from: string; to: string; angle: number }
    image: { url: string; size: 'cover' | 'contain' | 'auto'; repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'; position: string }
  }>({
    type: 'color',
    color: dashboard?.background_color || '#ffffff',
    gradient: { from: '#ffffff', to: '#f8fafc', angle: 180 },
    image: { url: '', size: 'cover', repeat: 'no-repeat', position: 'center' }
  })
  const [shareSettings, setShareSettings] = useState({
    visibility: 'PRIVATE' as const,
    allowed_users: [],
    embed_enabled: false
  })
  // Shared DnD provider (so Toolbox and Canvas share context)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )
  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args)
    if (pointer.length > 0) return pointer
    return rectIntersection(args)
  }
  const handleGlobalDragEnd = (event: DragEndEvent) => {
    const { active } = event
    if (active.data.current?.type === 'toolbox-item') {
      const toolboxItem = active.data.current.toolboxItem
      const canvasEl = document.getElementById('canvas')
      if (canvasEl && dragPointer) {
        const rect = canvasEl.getBoundingClientRect()
        const inside = dragPointer.x >= rect.left && dragPointer.x <= rect.right && dragPointer.y >= rect.top && dragPointer.y <= rect.bottom
        if (inside) {
          const pxX = Math.max(0, dragPointer.x - rect.left)
          const pxY = Math.max(0, dragPointer.y - rect.top)
          // Use rect.width/height to account for zoom/transform
          const fracX = pxX / Math.max(1, rect.width)
          const fracY = pxY / Math.max(1, rect.height)
          const gridX = Math.max(0, Math.round(fracX * gridSize))
          const gridY = Math.max(0, Math.round(fracY * gridSize))
          addElement(toolboxItem, gridX, gridY)
        }
      }
    }
    setDragPointer(null)
    setActiveToolboxItem(null)
  }

  // Monitor component to track pointer inside DndContext
  const GlobalDndMonitor = React.useCallback(() => {
    const removePointerListenerRef = React.useRef<null | (() => void)>(null)
    useDndMonitor({
      onDragStart(event) {
        const { active } = event
        if (active.data.current?.type === 'toolbox-item') {
          setActiveToolboxItem(active.data.current.toolboxItem)
        }
        // start pointer tracking for reliable coordinates
        const handler = (e: PointerEvent) => setDragPointer({ x: e.clientX, y: e.clientY })
        window.addEventListener('pointermove', handler)
        removePointerListenerRef.current = () => window.removeEventListener('pointermove', handler)
      },
      onDragMove(event) {
        // pointermove listener keeps dragPointer fresh; nothing required here
      },
      onDragEnd() {
        setDragPointer(null)
        setActiveToolboxItem(null)
        removePointerListenerRef.current?.()
        removePointerListenerRef.current = null
      },
      onDragCancel() {
        setDragPointer(null)
        setActiveToolboxItem(null)
        removePointerListenerRef.current?.()
        removePointerListenerRef.current = null
      }
    })
    return null
  }, [])
  const [currentTheme, setCurrentTheme] = useState({
    id: 'light',
    name: 'Light Theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5
    },
    spacing: {
      base: 8,
      small: 4,
      medium: 16,
      large: 24
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12
    },
    shadows: {
      small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      large: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
    }
  })

  // Interactive filtering
  const {
    activeFilters,
    addFilter,
    removeFilter,
    clearAllFilters: clearAllInteractiveFilters,
    handleChartInteraction: handleInteractiveChartInteraction,
    applyFiltersToData,
    configureCrossFiltering,
    getFiltersForElement
  } = useInteractiveFiltering()

  // Undo/Redo functionality
  const {
    state: dashboardHistory,
    setState: setDashboardHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo(dashboard)

  // Real-time data functionality
  const selectedDataSource = selectedElement?.data_config?.data_model_id ? 
    dataSources.find(ds => ds.id === selectedElement.data_config.data_model_id) : null
  
  const realtimeData = useDataModelData(
    selectedDataSource?.data_model_id || '',
    selectedElement?.data_config?.query || '',
    {
      enabled: !!dashboard?.refresh_interval_ms,
      interval: dashboard?.refresh_interval_ms || 30000,
      filters: selectedElement?.data_config?.filters || []
    }
  )

  const addElement = useCallback((item: any, x: number, y: number) => {
    if (!dashboard) return

    // Freeform positioning - no grid alignment
    const clampedX = Math.max(0, Math.min(x, gridSize - item.defaultSize.width))
    const clampedY = Math.max(0, Math.min(y, gridSize - item.defaultSize.height))

    const pxX = (clampedX / gridSize) * canvasWidth
    const pxY = (clampedY / gridSize) * canvasHeight
    const pxW = (item.defaultSize.width / gridSize) * canvasWidth
    const pxH = (item.defaultSize.height / gridSize) * canvasHeight
    const minW = Math.max(pxW, 280)
    const minH = Math.max(pxH, 180)

    const newElement: DashboardElement = {
      id: `element_${Date.now()}`,
      name: item.name,
      type: item.type,
      chart_type: item.chart_type,
      page_id: activePageId || (dashboard.pages?.[0]?.id || null) as any,
      position_x: clampedX,
      position_y: clampedY,
      width: item.defaultSize.width,
      height: item.defaultSize.height,
      z_index: dashboard.elements.length,
      config: {
        freeform: { x: pxX, y: pxY, w: minW, h: minH }
      },
      style: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 12,
        padding: 12,
        opacity: 1
      },
      data_config: {
        data_model_id: null,
        query: '',
        dimensions: [],
        measures: [],
        filters: [],
        refresh_interval: 300,
        cache_enabled: true
      },
      is_visible: true
    }

    // Update the dashboard state directly
    if (dashboard) {
      const updatedDashboard = {
      ...dashboard,
      elements: [...dashboard.elements, newElement]
      }
      setDashboard(updatedDashboard)
      setDashboardHistory(updatedDashboard)
    }
    setSelectedElement(newElement)
    
    toast.success(`${item.name} added to dashboard`)
  }, [dashboard, gridSize, setDashboard, setDashboardHistory])

  const handleElementClick = (element: DashboardElement, e?: React.MouseEvent) => {
    if (e?.ctrlKey || e?.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedElements(prev => {
        const isSelected = prev.some(el => el.id === element.id)
        if (isSelected) {
          return prev.filter(el => el.id !== element.id)
        } else {
          return [...prev, element]
        }
      })
      setSelectedElement(null) // Clear single selection
    } else {
      // Single select
      setSelectedElement(element)
      setSelectedElements([]) // Clear multi-selection
    }
  }

  const handleElementMouseMove = (e: React.MouseEvent, element: DashboardElement) => {
    if (isDragging || isResizing) return
    
    // Handle cursor changes for resize detection
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const width = rect.width
    const height = rect.height
    
    const edgeThreshold = 8
    const isNearEdge = x < edgeThreshold || x > width - edgeThreshold || 
                      y < edgeThreshold || y > height - edgeThreshold
    
    if (isNearEdge) {
      (e.currentTarget as HTMLElement).style.cursor = 'resize'
    } else {
      (e.currentTarget as HTMLElement).style.cursor = 'move'
    }
  }

  // Multi-select handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Clicked on empty canvas area
      setIsSelecting(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const startX = e.clientX - rect.left
      const startY = e.clientY - rect.top
      setSelectionStart({ x: startX, y: startY })
      setSelectionRect({ x: startX, y: startY, width: 0, height: 0 })
      setSelectedElement(null)
      setSelectedElements([])
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && selectionStart) {
      const rect = e.currentTarget.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      
      const x = Math.min(selectionStart.x, currentX)
      const y = Math.min(selectionStart.y, currentY)
      const width = Math.abs(currentX - selectionStart.x)
      const height = Math.abs(currentY - selectionStart.y)
      
      setSelectionRect({ x, y, width, height })
    }
  }

  const handleCanvasMouseUp = () => {
    if (isSelecting && selectionRect && dashboard?.elements) {
      // Find elements that intersect with selection rectangle
      const selectedIds = dashboard.elements
        .filter((element: DashboardElement) => {
          if (!activePageId || element.page_id === activePageId) {
            const elementX = element.config?.freeform?.x != null ? element.config.freeform.x : (element.position_x / gridSize) * canvasWidth
            const elementY = element.config?.freeform?.y != null ? element.config.freeform.y : (element.position_y / gridSize) * canvasHeight
            const elementW = element.config?.freeform?.w != null ? element.config.freeform.w : (element.width / gridSize) * canvasWidth
            const elementH = element.config?.freeform?.h != null ? element.config.freeform.h : (element.height / gridSize) * canvasHeight
            
            // Check if element intersects with selection rectangle
            return !(elementX + elementW < selectionRect.x || 
                    elementX > selectionRect.x + selectionRect.width ||
                    elementY + elementH < selectionRect.y || 
                    elementY > selectionRect.y + selectionRect.height)
          }
          return false
        })
        .map((element: DashboardElement) => element.id)
      
      if (selectedIds.length > 0) {
        const selectedElementsList = dashboard.elements.filter((element: DashboardElement) => 
          selectedIds.includes(element.id)
        )
        setSelectedElements(selectedElementsList)
      }
    }
    
    setIsSelecting(false)
    setSelectionRect(null)
    setSelectionStart(null)
  }

  const clearAllFilters = () => {
    clearAllInteractiveFilters()
    toast.success('All filters cleared')
  }

  // Bulk delete function
  const handleBulkDelete = () => {
    if (selectedElements.length > 0) {
      selectedElements.forEach(element => {
        deleteElement(element.id)
      })
      setSelectedElements([])
      toast.success(`${selectedElements.length} elements deleted`)
    } else if (selectedElement) {
      deleteElement(selectedElement.id)
      setSelectedElement(null)
      toast.success('Element deleted')
    }
  }

  // Duplicate function
  const handleDuplicate = () => {
    if (selectedElements.length > 0) {
      const duplicatedElements = selectedElements.map(element => ({
        ...element,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${element.name} (Copy)`,
        position_x: element.position_x + 20,
        position_y: element.position_y + 20,
        config: {
          ...element.config,
          freeform: element.config?.freeform ? {
            ...element.config.freeform,
            x: (element.config.freeform.x || 0) + 20,
            y: (element.config.freeform.y || 0) + 20
          } : undefined
        }
      }))
      
      setDashboard(prev => prev ? {
        ...prev,
        elements: [...prev.elements, ...duplicatedElements]
      } : prev)
      
      setSelectedElements(duplicatedElements)
      setSelectedElement(null)
      toast.success(`${selectedElements.length} elements duplicated`)
    } else if (selectedElement) {
      const duplicatedElement = {
        ...selectedElement,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${selectedElement.name} (Copy)`,
        position_x: selectedElement.position_x + 20,
        position_y: selectedElement.position_y + 20,
        config: {
          ...selectedElement.config,
          freeform: selectedElement.config?.freeform ? {
            ...selectedElement.config.freeform,
            x: (selectedElement.config.freeform.x || 0) + 20,
            y: (selectedElement.config.freeform.y || 0) + 20
          } : undefined
        }
      }
      
      setDashboard(prev => prev ? {
        ...prev,
        elements: [...prev.elements, duplicatedElement]
      } : prev)
      
      setSelectedElement(duplicatedElement)
      toast.success('Element duplicated')
    }
  }

  const handleChartInteraction = (element: DashboardElement, interactionData: any) => {
    // Handle chart interactions for filtering
    handleInteractiveChartInteraction(element.id, {
      elementId: element.id,
      field: interactionData.field || 'value',
      value: interactionData.value,
      interactionType: interactionData.type || 'click',
      timestamp: new Date().toISOString()
    })
  }

  // Apply Global Filter elements
  React.useEffect(() => {
    if (!dashboard) return
    const globalFilters = (dashboard.elements || []).filter((el: any) => el.chart_type === 'GLOBAL_FILTER')
    globalFilters.forEach((gf: any) => {
      const logic = gf.config?.logic === 'OR' ? 'OR' : 'AND'
      const conds = Array.isArray(gf.config?.conditions) ? gf.config.conditions : (gf.config?.field ? [{ field: gf.config.field, operator: gf.config.operator || '=', value: gf.config.value, isActive: true }] : [])
      conds.filter((c: any) => c?.field && c?.isActive).forEach((c: any, idx: number) => {
        addFilter({
          field: c.field,
          operator: c.operator || '=',
          value: c.value,
          sourceElementId: gf.id,
          isActive: true
        })
      })
    })
    return () => {
      // Clear all global filters by reinitializing filters from hook if needed (or track ids)
      // For simplicity, clear all and re-apply elsewhere if needed
      clearAllInteractiveFilters()
    }
  }, [dashboard?.elements])

  const exportToCSV = async (element: DashboardElement) => {
    try {
      // Mock data - in real app, this would come from the element's data source
      const mockData = [
        { id: 1, name: 'John Doe', value: 100, category: 'A' },
        { id: 2, name: 'Jane Smith', value: 200, category: 'B' },
        { id: 3, name: 'Bob Johnson', value: 150, category: 'A' }
      ]
      
      await exportElement(element, mockData, 'csv', dashboard?.name || 'Dashboard')
      toast.success('CSV exported successfully')
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }

  const exportToJSON = async (element: DashboardElement) => {
    try {
      const mockData = [
        { id: 1, name: 'John Doe', value: 100, category: 'A' },
        { id: 2, name: 'Jane Smith', value: 200, category: 'B' },
        { id: 3, name: 'Bob Johnson', value: 150, category: 'A' }
      ]
      
      await exportElement(element, mockData, 'json', dashboard?.name || 'Dashboard')
      toast.success('JSON exported successfully')
    } catch (error) {
      toast.error('Failed to export JSON')
    }
  }

  const exportToPDF = async (element: DashboardElement) => {
    try {
      const mockData = [
        { id: 1, name: 'John Doe', value: 100, category: 'A' },
        { id: 2, name: 'Jane Smith', value: 200, category: 'B' },
        { id: 3, name: 'Bob Johnson', value: 150, category: 'A' }
      ]
      
      await exportElement(element, mockData, 'pdf', dashboard?.name || 'Dashboard')
      toast.success('PDF exported successfully')
    } catch (error) {
      toast.error('Failed to export PDF')
    }
  }

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const saveDataSource = async (dataSource: any) => {
    try {
      // Create a new data source based on the selected data model
      const newDataSource = {
        id: `ds_${Date.now()}`,
        name: dataSource.name,
        type: 'DATA_MODEL' as const,
        data_model_id: dataSource.data_model_id,
        query: dataSource.query || '',
        is_active: dataSource.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Add to dashboard's data sources
      if (dashboard) {
        const updatedDashboard = {
          ...dashboard,
          datasources: [...(dashboard.datasources || []), newDataSource]
        }
        setDashboard(updatedDashboard)
        setDashboardHistory(updatedDashboard)
      }

      toast.success('Data source created successfully')
    } catch (error) {
      console.error('Error saving data source:', error)
      toast.error('Failed to save data source')
    }
  }

  const handleUpdateShareSettings = (settings: any) => {
    setShareSettings(settings)
    toast.success('Share settings updated successfully')
  }

  const handleSelectTemplate = (template: any) => {
    // Apply template to dashboard
    if (dashboard) {
      const updatedDashboard = {
        ...dashboard,
        elements: template.elements
      }
      setDashboard(updatedDashboard)
      setDashboardHistory(updatedDashboard)
    }
    toast.success(`Applied template: ${template.name}`)
  }

  const handleCreateBlank = () => {
    toast.success('Created blank dashboard')
  }

  const handleSaveSettings = (settings: any) => {
    // Update dashboard with new settings
    if (dashboard) {
      const updatedDashboard = {
        ...dashboard,
        ...settings
      }
      setDashboard(updatedDashboard)
      setDashboardHistory(updatedDashboard)
    }
    toast.success('Dashboard settings saved successfully')
  }

  const handleRemoveFilter = (filterId: string) => {
    removeFilter(filterId)
    toast.success('Filter removed')
  }

  const handleVersionSelect = (version: any) => {
    // Apply version to dashboard
    if (dashboard) {
      setDashboardHistory({
        ...dashboard,
        elements: version.dashboard_data.elements || []
      })
    }
    toast.success(`Restored to version ${version.version}`)
  }

  const handleVersionCreate = (versionData: any) => {
    // In real app, save to backend
    toast.success('Version created successfully')
  }

  const handleVersionRestore = (versionId: string) => {
    // In real app, restore from backend
    toast.success('Version restored successfully')
  }

  const handleVersionDelete = (versionId: string) => {
    // In real app, delete from backend
    toast.success('Version deleted successfully')
  }

  const handleThemeChange = (theme: any) => {
    setCurrentTheme(theme)
    // Apply theme to dashboard
    if (dashboard) {
      setDashboardHistory({
        ...dashboard,
        theme: theme
      })
    }
  }

  const handleThemeSave = (theme: any) => {
    setCurrentTheme(theme)
    // Save theme to backend
    toast.success('Theme saved successfully')
  }

  const handleThemeReset = () => {
    const defaultTheme = {
      id: 'light',
      name: 'Light Theme',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5
      },
      spacing: {
        base: 8,
        small: 4,
        medium: 16,
        large: 24
      },
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12
      },
      shadows: {
        small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        large: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
      }
    }
    setCurrentTheme(defaultTheme)
    toast.success('Theme reset to default')
  }

  const handleThemeExport = (theme: any) => {
    const dataStr = JSON.stringify(theme, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${theme.name.replace(/\s+/g, '_')}_theme.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Theme exported successfully')
  }

  const handleThemeImport = (theme: any) => {
    setCurrentTheme(theme)
    toast.success('Theme imported successfully')
  }

  // Delete selected element(s) with Delete key
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete') return
      const active = document.activeElement as HTMLElement | null
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return
      if (selectedElements.length > 0 || selectedElement) {
        e.preventDefault()
        handleBulkDelete()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedElement, selectedElements, handleBulkDelete])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard builder...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!dashboard) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard not found</h2>
            <p className="text-muted-foreground mb-4">The dashboard you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboards')}>
              Back to Dashboards
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={handleGlobalDragEnd}>
      <GlobalDndMonitor />
      <div className="flex h-screen">
        {/* Toolbox Sidebar */}
        <Toolbox
          groups={TOOLBOX_GROUPS}
          collapsedGroups={collapsedGroups}
          onToggleGroup={toggleGroupCollapse}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Pages Navigation (placement-aware) */}
          {(dashboard.page_nav_placement || 'top') === 'top' && (
          <div className="h-10 border-b bg-background flex items-center px-2 gap-2">
            {(dashboard.pages || []).sort((a,b) => a.order - b.order).map((p) => (
              <div key={p.id} className={`px-3 py-1 rounded cursor-pointer ${activePageId === p.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} onClick={() => setActivePageId(p.id)} title="Click to switch">
                <input
                  className={`bg-transparent border-0 focus:outline-none ${activePageId === p.id ? 'text-primary-foreground' : ''}`}
                  value={p.name}
                  onChange={(e) => renamePage(p.id, e.target.value)}
                />
                </div>
              ))}
            <Button size="sm" variant="outline" onClick={addPage}>+ Page</Button>
                </div>
              )}
          {/* Toolbar */}
          <Toolbar
            dashboard={dashboard}
            gridSize={gridSize}
            setGridSize={setGridSize}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            showPixelMode={showPixelMode}
            setShowPixelMode={setShowPixelMode}
            zoom={zoom}
            setZoom={setZoom}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            saving={saving}
            activeFilters={activeFilters}
            canUndo={canUndo}
            canRedo={canRedo}
            onSave={saveDashboard}
            onUndo={undo}
            onRedo={redo}
            onClearFilters={clearAllFilters}
            onShowTools={() => { setToolsInitialTab('settings'); setShowToolsDrawer(true) }}
            onPreview={() => setShowPreview(true)}
            onRenameDashboard={(name) => setDashboard(dashboard ? { ...dashboard, name } : dashboard)}
          />

          {/* Canvas */}
          <Canvas
            dashboard={dashboard}
            selectedElement={selectedElement}
            selectedElements={selectedElements}
            draggedItem={draggedItem}
            isDragging={isDragging}
            draggedElement={draggedElement}
            isResizing={isResizing}
            gridSize={gridSize}
            zoom={zoom}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            showPixelMode={showPixelMode}
            showCanvasBorder={dashboard?.fullpage_background ? false : showCanvasBorder}
            canvasBackground={canvasBackground}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            activeFilters={activeFilters}
            realtimeData={realtimeData}
            onElementClick={handleElementClick}
            onElementMouseDown={handleElementMouseDown}
            onElementMouseMove={handleElementMouseMove}
            onCanvasMouseDown={handleCanvasMouseDown}
            onCanvasMouseMove={handleCanvasMouseMove}
            onCanvasMouseUp={handleCanvasMouseUp}
            isSelecting={isSelecting}
            selectionRect={selectionRect}
          onStartResize={(element, direction, clientX, clientY) => startResize(element, direction, clientX, clientY)}
            onDeleteElement={deleteElement}
            onBulkDelete={handleBulkDelete}
            onDuplicate={handleDuplicate}
            onUpdateElement={updateElement}
            onClearSelection={() => {
              setSelectedElement(null)
              setSelectedElements([])
            }}
            activePageId={activePageId || undefined}
            fullpageBackground={!!dashboard?.fullpage_background}
            pan={{ x: 0, y: 0 }}
            onPan={() => {}}
            onZoom={() => {}}
            onAddElement={(element) => {
              // Convert the new element format to the old format
              const item = { type: element.type, name: element.name }
              addElement(item, 0, 0)
            }}
            onBulkUpdate={() => {}}
          />
        </div>

        {/* Properties Panel */}
        <PropertiesPanel
          selectedElement={selectedElement}
          gridSize={gridSize}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          showPixelMode={showPixelMode}
          onUpdateElement={updateElement}
          gridToPixel={gridToPixel}
        />

        {/* Filter Panel */}
        <FilterPanel
          activeFilters={activeFilters}
          dashboardElements={dashboard?.elements || []}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={clearAllFilters}
                    />
                  </div>

      {/* Removed Dashboard-level Data Source Dialog (chart-level only) */}

      {/* Templates Dialog */}
      <TemplatesDialog
        open={showTemplatesDialog}
        onOpenChange={setShowTemplatesDialog}
        onSelectTemplate={handleSelectTemplate}
        onCreateBlank={handleCreateBlank}
      />
      
      {/* Combined Tools Drawer */}
      <CombinedToolsDrawer
        open={showToolsDrawer}
        onOpenChange={setShowToolsDrawer}
        initialTab={toolsInitialTab}
        dashboardName={dashboard?.name || 'Dashboard'}
        shareSettings={shareSettings}
        onUpdateShareSettings={handleUpdateShareSettings}
        versions={[]}
        onVersionSelect={(id) => handleVersionRestore(id)}
        onVersionCreate={(name, version, description) => handleVersionCreate({ name, version, description })}
        onVersionDelete={(id) => handleVersionDelete(id)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onThemeSave={handleThemeSave}
        onThemeReset={handleThemeReset}
        themePresets={[currentTheme, {
          id: 'dark',
          name: 'Dark Theme',
          colors: { primary: '#60a5fa', secondary: '#94a3b8', background: '#0b1220', surface: '#111827', text: '#e5e7eb', textSecondary: '#94a3b8', border: '#1f2937', accent: '#f59e0b', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          typography: { fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
          spacing: { base: 8, small: 4, medium: 16, large: 24 },
          borderRadius: { small: 4, medium: 8, large: 12 },
          shadows: { small: '0 1px 2px 0 rgb(0 0 0 / 0.3)', medium: '0 4px 6px -1px rgb(0 0 0 / 0.4)', large: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }
        }]}
        onThemeExport={handleThemeExport}
        onThemeImport={handleThemeImport}
        dashboard={{ id: dashboard?.id || '', name: dashboard?.name || '', description: dashboard?.description || '' }}
        onSaveSettings={(updates) => handleSaveSettings({ ...dashboard, ...updates })}
        refreshIntervalMs={dashboard?.refresh_interval_ms}
        onSaveCanvasSettings={(updates) => {
          if (!dashboard) return
          const updated = { ...dashboard, ...updates }
          setDashboard(updated)
          setDashboardHistory(updated)
          toast.success('Canvas settings saved')
        }}
        pageNavPlacement={dashboard?.page_nav_placement || 'top'}
        onSavePageNavPlacement={(placement) => {
          if (!dashboard) return
          const updated = { ...dashboard, page_nav_placement: placement }
          setDashboard(updated)
          setDashboardHistory(updated)
          toast.success('Page navigation placement saved')
        }}
      />

      {/* Full-screen Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-none w-[100vw] h-[100vh] p-0">
          <DialogHeader className="px-4 py-3 h-14 border-b pr-12">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate">Preview: {dashboard?.name || 'Dashboard'}</DialogTitle>
              {(() => {
                const previewUrl = dashboard?.public_link ? `/embed/dashboard/${dashboard.public_link}` : `/dashboards/${dashboard?.id}`
                return (
                  <Button asChild variant="outline" size="sm">
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open full page
                    </a>
                  </Button>
                )
              })()}
      </div>
          </DialogHeader>
          <div className="w-full h-[calc(100vh-56px)] bg-gray-50">
            <div className="w-full h-full">
              <Canvas
                dashboard={dashboard}
                selectedElement={null}
                selectedElements={[]}
                draggedItem={null}
                isDragging={false}
                draggedElement={null}
                isResizing={false}
                gridSize={gridSize}
                zoom={100}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                showPixelMode={false}
                showCanvasBorder={true}
                canvasBackground={canvasBackground}
                showGrid={false}
                snapToGrid={false}
                activeFilters={activeFilters}
                realtimeData={realtimeData}
                onElementClick={() => {}}
                onElementMouseDown={() => {}}
                onElementMouseMove={() => {}}
                onCanvasMouseDown={() => {}}
                onCanvasMouseMove={() => {}}
                onCanvasMouseUp={() => {}}
                isSelecting={false}
                selectionRect={null}
                onStartResize={() => {}}
                onDeleteElement={() => {}}
                onBulkDelete={() => {}}
                onDuplicate={() => {}}
                onUpdateElement={() => {}}
                onClearSelection={() => {}}
                pan={{ x: 0, y: 0 }}
                onPan={() => {}}
                onZoom={() => {}}
                onAddElement={() => {}}
                onBulkUpdate={() => {}}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Global drag overlay preview */}
      {activeToolboxItem && dragPointer && (
        <div
          className="pointer-events-none fixed z-[9999] opacity-50"
          style={{
            left: dragPointer.x + 8,
            top: dragPointer.y + 8,
            width: 160,
            height: 110,
            border: '2px dashed #3b82f6',
            borderRadius: 8,
            background: 'white',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-blue-600 text-xs font-medium px-2 text-center">
            {activeToolboxItem.name}
          </div>
        </div>
      )}
      </DndContext>
    </MainLayout>
  )
}
