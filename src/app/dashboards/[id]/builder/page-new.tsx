'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import { useDashboardState } from './hooks/useDashboardState'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { Toolbox } from './components/Toolbox'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { TOOLBOX_GROUPS } from './constants/toolbox'
import { DashboardElement } from './hooks/useDashboardState'

export default function DashboardBuilderPage() {
  const router = useRouter()
  
  const {
    dashboard,
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

  const {
    draggedItem,
    draggedElement,
    isDragging,
    isResizing,
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
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})

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
  const realtimeData = useRealtimeData(
    selectedElement?.data_config?.data_model_id || '',
    selectedElement?.data_config?.query || '',
    {
      enabled: selectedElement?.data_config?.refresh_interval ? true : false,
      interval: selectedElement?.data_config?.refresh_interval || 30000
    }
  )

  const addElement = useCallback((item: any, x: number, y: number) => {
    if (!dashboard) return

    // Ensure element stays within grid bounds
    const clampedX = Math.max(0, Math.min(x, gridSize - item.defaultSize.width))
    const clampedY = Math.max(0, Math.min(y, gridSize - item.defaultSize.height))

    const newElement: DashboardElement = {
      id: `element_${Date.now()}`,
      name: item.name,
      type: item.type,
      chart_type: item.chart_type,
      position_x: clampedX,
      position_y: clampedY,
      width: item.defaultSize.width,
      height: item.defaultSize.height,
      z_index: dashboard.elements.length,
      config: {},
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16
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

    setDashboardHistory({
      ...dashboard,
      elements: [...dashboard.elements, newElement]
    })
    
    toast.success(`${item.name} added to dashboard`)
  }, [dashboard, gridSize, setDashboardHistory])

  const handleElementClick = (element: DashboardElement) => {
    setSelectedElement(element)
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

  const clearAllFilters = () => {
    setActiveFilters({})
    toast.success('All filters cleared')
  }

  const handleChartInteraction = (element: DashboardElement, interactionData: any) => {
    // Handle chart interactions for filtering
    console.log('Chart interaction:', element.id, interactionData)
  }

  const exportToCSV = async (element: DashboardElement) => {
    toast.success('CSV export functionality would be implemented here')
  }

  const exportToJSON = async (element: DashboardElement) => {
    toast.success('JSON export functionality would be implemented here')
  }

  const exportToPDF = async (element: DashboardElement) => {
    toast.success('PDF export functionality would be implemented here')
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
      <div className="flex h-screen">
        {/* Toolbox Sidebar */}
        <Toolbox
          groups={TOOLBOX_GROUPS}
          collapsedGroups={collapsedGroups}
          onToggleGroup={toggleGroupCollapse}
          onDragStart={handleDragStart}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
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
            saving={saving}
            activeFilters={activeFilters}
            canUndo={canUndo}
            canRedo={canRedo}
            onSave={saveDashboard}
            onUndo={undo}
            onRedo={redo}
            onClearFilters={clearAllFilters}
            onShowDataSourcePanel={() => toast('Data source panel would open here')}
            onShowShareDialog={() => toast('Share dialog would open here')}
            onShowTemplates={() => toast('Templates dialog would open here')}
            onShowVersioning={() => toast('Versioning dialog would open here')}
            onShowAdvancedStyling={() => toast('Advanced styling dialog would open here')}
            onShowDataPreview={() => toast('Data preview dialog would open here')}
            onShowSettings={() => toast('Settings dialog would open here')}
            onPreview={() => router.push(`/dashboards/${dashboard.id}`)}
          />

          {/* Canvas */}
          <Canvas
            dashboard={dashboard}
            selectedElement={selectedElement}
            draggedItem={draggedItem}
            isDragging={isDragging}
            draggedElement={draggedElement}
            isResizing={isResizing}
            gridSize={gridSize}
            zoom={zoom}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            showPixelMode={showPixelMode}
            snapToGrid={snapToGrid}
            activeFilters={activeFilters}
            realtimeData={realtimeData}
            onElementClick={handleElementClick}
            onElementMouseDown={handleElementMouseDown}
            onElementMouseMove={handleElementMouseMove}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, addElement)}
            onDeleteElement={deleteElement}
            onExportCSV={exportToCSV}
            onExportJSON={exportToJSON}
            onExportPDF={exportToPDF}
            onChartInteraction={handleChartInteraction}
            gridToPixel={gridToPixel}
          />
        </div>
      </div>
    </MainLayout>
  )
}
