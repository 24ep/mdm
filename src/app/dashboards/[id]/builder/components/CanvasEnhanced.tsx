'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2, FileSpreadsheet, FileText, FileImage, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { DashboardElement, DataSource } from '../hooks/useDashboardState'
import { ToolboxItem } from '../types'
import { SelectionToolbar } from './SelectionToolbar'

// DnD Kit imports
import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  useDroppable
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  useSortable,
  SortableContext as SortableContextType,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CanvasProps {
  dashboard: any
  selectedElement: DashboardElement | null
  selectedElements: DashboardElement[]
  draggedItem: ToolboxItem | null
  isDragging: boolean
  draggedElement: DashboardElement | null
  isResizing: boolean
  gridSize: number
  zoom: number
  canvasWidth: number
  canvasHeight: number
  showPixelMode: boolean
  showCanvasBorder: boolean
  showGrid: boolean
  snapToGrid: boolean
  activeFilters: Record<string, any>
  realtimeData: any
  canvasBackground: {
    type: 'color' | 'gradient' | 'image'
    color: string
    gradient: { from: string; to: string; angle: number }
    image: { url: string; size: 'cover' | 'contain' | 'auto'; repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'; position: string }
  }
  onElementClick: (element: DashboardElement, e?: React.MouseEvent) => void
  onElementMouseDown: (e: React.MouseEvent, element: DashboardElement) => void
  onElementMouseMove: (e: React.MouseEvent, element: DashboardElement) => void
  onCanvasMouseDown: (e: React.MouseEvent) => void
  onCanvasMouseMove: (e: React.MouseEvent) => void
  onCanvasMouseUp: () => void
  isSelecting: boolean
  selectionRect: { x: number; y: number; width: number; height: number } | null
  onStartResize: (element: DashboardElement, direction: string, clientX: number, clientY: number) => void
  onUpdateElement: (elementId: string, updates: Partial<DashboardElement>) => void
  onDeleteElement: (elementId: string) => void
  onBulkDelete: () => void
  onDuplicate: () => void
  onClearSelection: () => void
  pan: { x: number; y: number }
  onPan: (pan: { x: number; y: number }) => void
  onZoom: (zoom: number) => void
  onAddElement: (element: Partial<DashboardElement>) => void
  onBulkUpdate: (updates: Partial<DashboardElement>) => void
  activePageId?: string
  fullpageBackground?: boolean
}

// Enhanced collision detection for better drag and drop
const customCollisionDetection: CollisionDetection = (args) => {
  // First, let's see what droppable items are intersecting with the pointer
  const pointerIntersections = pointerWithin(args)
  
  // If there are intersections with the pointer, return those
  if (pointerIntersections.length > 0) {
    return pointerIntersections
  }
  
  // If there are no intersections with the pointer, return the intersections with the rectangle
  return rectIntersection(args)
}

// Sortable Element Component
function SortableElement({ 
  element, 
  isSelected, 
  isMultiSelected,
  onElementClick, 
  onElementMouseDown, 
  onElementMouseMove,
  onStartResize,
  onUpdateElement,
  onDeleteElement,
  gridSize,
  canvasWidth,
  canvasHeight,
  showPixelMode,
  zoom,
  pan,
  activeFilters,
  realtimeData,
  isDragging,
  draggedElement,
  isResizing
}: {
  element: DashboardElement
  isSelected: boolean
  isMultiSelected: boolean
  onElementClick: (element: DashboardElement, e?: React.MouseEvent) => void
  onElementMouseDown: (e: React.MouseEvent, element: DashboardElement) => void
  onElementMouseMove: (e: React.MouseEvent, element: DashboardElement) => void
  onStartResize: (element: DashboardElement, direction: string, clientX: number, clientY: number) => void
  onUpdateElement: (elementId: string, updates: Partial<DashboardElement>) => void
  onDeleteElement: (elementId: string) => void
  gridSize: number
  canvasWidth: number
  canvasHeight: number
  showPixelMode: boolean
  zoom: number
  pan: { x: number; y: number }
  activeFilters: Record<string, any>
  realtimeData: any
  isDragging: boolean
  draggedElement: DashboardElement | null
  isResizing: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: element.id,
    data: {
      type: 'element',
      element,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isSortableDragging ? 1000 : element.z_index,
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on resize handles
    if ((e.target as HTMLElement).closest('.resize-handle')) {
      return
    }
    onElementMouseDown(e, element)
  }, [element, onElementMouseDown])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    onElementMouseMove(e, element)
  }, [element, onElementMouseMove])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onElementClick(element, e)
  }, [element, onElementClick])

  const handleStartResize = useCallback((direction: string, clientX: number, clientY: number) => {
    onStartResize(element, direction, clientX, clientY)
  }, [element, onStartResize])

  // Render element content based on type
  const renderElementContent = () => {
    const kind = element.type

    if (kind === 'CHART' || kind.startsWith('SHAPE_')) {
      return (
        <ChartRenderer
          type={element.type || 'CHART'}
          chartType={element.chart_type || 'bar'}
          data={realtimeData || []}
          dimensions={element.data_config?.dimensions || []}
          measures={element.data_config?.measures || []}
          filters={element.data_config?.filters || []}
          title={element.name || ''}
          config={element.config || {}}
        />
      )
    }

    if (kind === 'KPI' || kind === 'METRIC') {
      const value = (element.data_config as any)?.value || 1234
      const label = (element.data_config as any)?.label || 'Total Sales'
      const change = (element.data_config as any)?.change || '+12.5%'
      const isPositive = change.startsWith('+')
      
      return (
        <div className="w-full h-full flex flex-col justify-center items-center p-4" style={{ fontFamily: element.style?.fontFamily || 'Roboto, sans-serif' }}>
          <div className="text-3xl font-bold" style={{ color: element.style?.color || '#111827' }}>
            {value.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">{label}</div>
          <div className={`text-xs mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </div>
        </div>
      )
    }

    if (kind === 'PROGRESS') {
      const value = (element.data_config as any)?.value || 75
      const label = (element.data_config as any)?.label || 'Progress'
      const max = (element.data_config as any)?.max || 100
      const percentage = Math.min(100, Math.max(0, (value / max) * 100))
      
      return (
        <div className="w-full h-full flex flex-col justify-center p-4" style={{ fontFamily: element.style?.fontFamily || 'Roboto, sans-serif' }}>
          <div className="text-sm mb-2" style={{ color: element.style?.color || '#111827' }}>{label}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1">{value}/{max} ({percentage.toFixed(0)}%)</div>
        </div>
      )
    }

    if (kind === 'GAUGE') {
      const value = (element.data_config as any)?.value || 75
      const label = (element.data_config as any)?.label || 'Performance'
      const max = (element.data_config as any)?.max || 100
      const percentage = Math.min(100, Math.max(0, (value / max) * 100))
      const angle = (percentage / 100) * 180 - 90
      
      return (
        <div className="w-full h-full flex flex-col justify-center items-center p-4" style={{ fontFamily: element.style?.fontFamily || 'Roboto, sans-serif' }}>
          <div className="relative w-20 h-20 mb-2">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              <circle 
                cx="50" cy="50" r="40" 
                stroke="#3b82f6" 
                strokeWidth="8" 
                fill="none"
                strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: element.style?.color || '#111827' }}>
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="text-sm" style={{ color: element.style?.color || '#111827' }}>{label}</div>
        </div>
      )
    }

    if (kind === 'TEXT') {
      return (
        <div 
          className="w-full h-full flex items-center p-4"
          style={{ 
            fontFamily: element.style?.fontFamily || 'Roboto, sans-serif',
            fontSize: element.style?.fontSize || 14,
            fontWeight: element.style?.fontWeight || 'normal',
            color: element.style?.color || '#111827',
            textAlign: element.style?.textAlign || 'left'
          }}
        >
          {(element.data_config as any)?.text || 'Text Element'}
        </div>
      )
    }

    if (kind === 'IMAGE') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <img 
            src={(element.data_config as any)?.url || '/api/placeholder/200/150'} 
            alt={(element.data_config as any)?.alt || 'Image'} 
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      )
    }

    if (kind === 'RICH_TEXT') {
      return (
        <div 
          className="w-full h-full p-4 overflow-auto"
          style={{ 
            fontFamily: element.style?.fontFamily || 'Roboto, sans-serif',
            fontSize: element.style?.fontSize || 14,
            color: element.style?.color || '#111827'
          }}
          dangerouslySetInnerHTML={{ 
            __html: (element.data_config as any)?.html || '<p>Rich text content</p>' 
          }}
        />
      )
    }

    if (kind === 'IFRAME') {
      return (
        <div className="w-full h-full p-4">
          <iframe 
            src={(element.data_config as any)?.url || 'https://example.com'} 
            className="w-full h-full border-0 rounded"
            title="Embedded Content"
          />
        </div>
      )
    }

    if (kind === 'YOUTUBE') {
      const videoId = (element.data_config as any)?.videoId || 'dQw4w9WgXcQ'
      return (
        <div className="w-full h-full p-4">
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full border-0 rounded"
            title="YouTube Video"
            allowFullScreen
          />
        </div>
      )
    }

    if (kind === 'VIDEO') {
      return (
        <div className="w-full h-full p-4">
          <video 
            src={(element.data_config as any)?.url || '/api/placeholder/video.mp4'} 
            className="w-full h-full object-contain rounded"
            controls
          />
        </div>
      )
    }

    if (kind === 'HTML') {
      return (
        <div 
          className="w-full h-full p-4 overflow-auto"
          dangerouslySetInnerHTML={{ 
            __html: (element.data_config as any)?.html || '<div>Custom HTML content</div>' 
          }}
        />
      )
    }

    if (kind === 'PYTHON') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50 rounded">
          <div className="text-center">
            <div className="text-2xl mb-2">🐍</div>
            <div className="text-sm text-gray-600">Python Script</div>
          </div>
        </div>
      )
    }

    if (kind === 'ICON') {
      const iconName = (element.data_config as any)?.icon || 'star'
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div 
            className="text-4xl"
            style={{ color: element.style?.color || '#111827' }}
          >
            {iconName === 'star' && '⭐'}
            {iconName === 'heart' && '❤️'}
            {iconName === 'fire' && '🔥'}
            {iconName === 'thumbs-up' && '👍'}
            {iconName === 'rocket' && '🚀'}
            {!['star', 'heart', 'fire', 'thumbs-up', 'rocket'].includes(iconName) && '⭐'}
          </div>
        </div>
      )
    }

    if (kind === 'DATE_RANGE') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-white border border-gray-200 rounded">
          <div className="text-sm text-gray-600">📅 Date Range Picker</div>
        </div>
      )
    }

    if (kind === 'DROPDOWN_FILTER') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-white border border-gray-200 rounded">
          <div className="text-sm text-gray-600">🔽 Dropdown Filter</div>
        </div>
      )
    }

    if (kind === 'SEARCH_BOX') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-white border border-gray-200 rounded">
          <div className="text-sm text-gray-600">🔍 Search Box</div>
        </div>
      )
    }

    if (kind === 'GLOBAL_FILTER') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-white border border-gray-200 rounded">
          <div className="text-sm text-gray-600">🌐 Global Filter</div>
        </div>
      )
    }

    if (kind === 'BUTTON') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            style={{ fontFamily: element.style?.fontFamily || 'Roboto, sans-serif' }}
          >
            {(element.data_config as any)?.text || 'Button'}
          </button>
        </div>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center p-4 text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm">{element.name || 'Element'}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`absolute group ${
        isSelected || isMultiSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg' 
          : ''
      } ${isDragging && draggedElement?.id === element.id ? 'cursor-grabbing' : 
        isResizing && isSelected ? 'cursor-grabbing' : 'cursor-move'}`}
      style={{
        ...style,
        left: element.config?.freeform?.x != null ? element.config.freeform.x : (element.position_x / gridSize) * canvasWidth,
        top: element.config?.freeform?.y != null ? element.config.freeform.y : (element.position_y / gridSize) * canvasHeight,
        width: element.config?.freeform?.w != null ? element.config.freeform.w : (element.width / gridSize) * canvasWidth,
        height: element.config?.freeform?.h != null ? element.config.freeform.h : (element.height / gridSize) * canvasHeight,
        zIndex: isSortableDragging ? 1000 : element.z_index,
        borderColor: element.style?.borderColor,
        borderWidth: typeof element.style?.borderWidth === 'object' 
          ? `${element.style.borderWidth.top || 0}px ${element.style.borderWidth.right || 0}px ${element.style.borderWidth.bottom || 0}px ${element.style.borderWidth.left || 0}px`
          : (element.style?.borderWidth ?? 0),
        borderStyle: (typeof element.style?.borderWidth === 'object' 
          ? (element.style.borderWidth.top || element.style.borderWidth.right || element.style.borderWidth.bottom || element.style.borderWidth.left)
          : (element.style?.borderWidth ?? 0)) > 0 ? 'solid' : 'none',
        borderRadius: typeof element.style?.borderRadius === 'object'
          ? `${element.style.borderRadius.topLeft || 0}px ${element.style.borderRadius.topRight || 0}px ${element.style.borderRadius.bottomRight || 0}px ${element.style.borderRadius.bottomLeft || 0}px`
          : (element.style?.borderRadius ?? 0),
        boxShadow: (() => {
          const elementShadow = element.style?.boxShadow ? 
            `${element.style.boxShadow.offsetX || 0}px ${element.style.boxShadow.offsetY || 0}px ${element.style.boxShadow.blur || 0}px ${element.style.boxShadow.spread || 0}px ${element.style.boxShadow.color || '#000000'}${Math.round((element.style.boxShadow.opacity || 0.25) * 255).toString(16).padStart(2, '0')}`
            : undefined
          const selectionShadow = (isSelected || isMultiSelected) && !isDragging && !isResizing ? 
            '0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.2)' 
            : undefined
          return [elementShadow, selectionShadow].filter(Boolean).join(', ')
        })(),
        filter: (() => {
          const fc: any = element.style?.filterConfig
          if (fc) {
            const parts = []
            if (typeof fc.blur === 'number') parts.push(`blur(${fc.blur}px)`)
            if (typeof fc.brightness === 'number') parts.push(`brightness(${fc.brightness}%)`)
            if (typeof fc.contrast === 'number') parts.push(`contrast(${fc.contrast}%)`)
            if (typeof fc.saturate === 'number') parts.push(`saturate(${fc.saturate}%)`)
            if (typeof fc.grayscale === 'number') parts.push(`grayscale(${fc.grayscale}%)`)
            if (typeof fc.hueRotate === 'number') parts.push(`hue-rotate(${fc.hueRotate}deg)`)
            return parts.join(' ')
          }
          return element.style?.filter || undefined
        })(),
        backdropFilter: (() => {
          const fc: any = element.style?.filterConfig
          if (fc && typeof fc.backdropBlur === 'number') {
            return `blur(${fc.backdropBlur}px)`
          }
          return element.style?.backdropFilter || undefined
        })(),
        opacity: typeof element.style?.opacity === 'number' ? element.style.opacity : 1,
        background: (() => {
          const s: any = element.style || {}
          const opacity = typeof s.backgroundOpacity === 'number' ? Math.max(0, Math.min(1, s.backgroundOpacity)) : 1
          const withOpacity = (hex: string) => {
            try {
              const h = hex.replace('#','')
              const bigint = parseInt(h, 16)
              const r = (bigint >> 16) & 255
              const g = (bigint >> 8) & 255
              const b = bigint & 255
              return `rgba(${r}, ${g}, ${b}, ${opacity})`
            } catch { return hex }
          }
          if (s.backgroundType === 'linear') {
            const angle = s.backgroundGradientAngle ?? 180
            const from = withOpacity(s.backgroundGradientFrom || s.backgroundColor || '#ffffff')
            const to = withOpacity(s.backgroundGradientTo || s.backgroundColor || '#f8fafc')
            return `linear-gradient(${angle}deg, ${from}, ${to})`
          }
          if (s.backgroundType === 'radial') {
            const from = withOpacity(s.backgroundGradientFrom || s.backgroundColor || '#ffffff')
            const to = withOpacity(s.backgroundGradientTo || s.backgroundColor || '#f8fafc')
            return `radial-gradient(circle, ${from}, ${to})`
          }
          const solid = withOpacity(s.backgroundColor || 'transparent')
          return solid
        })(),
        transform: `rotate(${element.style?.rotation || 0}deg) ${CSS.Transform.toString(transform)}`,
        transition: isSortableDragging ? 'none' : transition,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {renderElementContent()}
      
      {/* Resize handles - corners and sides */}
      {isSelected && !isSortableDragging && (
        <>
          {/* Corners */}
          <div
            className="resize-handle absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-sm cursor-nw-resize"
            onMouseDown={(e) => { e.stopPropagation(); handleStartResize('nw', e.clientX, e.clientY) }}
          />
          <div
            className="resize-handle absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-sm cursor-ne-resize"
            onMouseDown={(e) => { e.stopPropagation(); handleStartResize('ne', e.clientX, e.clientY) }}
          />
          <div
            className="resize-handle absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-sm cursor-sw-resize"
            onMouseDown={(e) => { e.stopPropagation(); handleStartResize('sw', e.clientX, e.clientY) }}
          />
          <div
            className="resize-handle absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-sm cursor-se-resize"
            onMouseDown={(e) => { e.stopPropagation(); handleStartResize('se', e.clientX, e.clientY) }}
          />

          {/* Sides */}
          <div
            className="resize-handle absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-sm cursor-n-resize"
            onMouseDown={(e) => { e.stopPropagation(); handleStartResize('n', e.clientX, e.clientY) }}
          />
          <div
            className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-sm cursor-s-resize"
            onMouseDown={(e) => { e.stopPropagation(); handleStartResize('s', e.clientX, e.clientY) }}
          />
          <div
            className="resize-handle absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-sm cursor-w-resize"
            onMouseDown={(e) => { e.stopPropagation(); handleStartResize('w', e.clientX, e.clientY) }}
          />
          <div
            className="resize-handle absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-sm cursor-e-resize"
            onMouseDown={(e) => { e.stopPropagation(); handleStartResize('e', e.clientX, e.clientY) }}
          />
        </>
      )}
      
      {/* Element name label */}
      {(isSelected || isMultiSelected) && !isSortableDragging && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {element.name || element.type}
        </div>
      )}
    </div>
  )
}

export function CanvasEnhanced({
  dashboard,
  selectedElement,
  selectedElements,
  draggedItem,
  isDragging,
  draggedElement,
  isResizing,
  gridSize,
  zoom,
  canvasWidth,
  canvasHeight,
  showPixelMode,
  showCanvasBorder,
  showGrid,
  snapToGrid,
  activeFilters,
  realtimeData,
  canvasBackground,
  onElementClick,
  onElementMouseDown,
  onElementMouseMove,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  isSelecting,
  selectionRect,
  onStartResize,
  onUpdateElement,
  onDeleteElement,
  onBulkDelete,
  onDuplicate,
  onClearSelection,
  pan,
  onPan,
  onZoom,
  onAddElement,
  onBulkUpdate,
  activePageId,
  fullpageBackground,
}: CanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOverlayElement, setDragOverlayElement] = useState<DashboardElement | null>(null)
  const { setNodeRef: setCanvasDroppableRef } = useDroppable({ id: 'canvas' })

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Find the element being dragged
    const element = dashboard.elements.find((el: DashboardElement) => el.id === active.id)
    if (element) {
      setDragOverlayElement(element)
    }
  }, [dashboard.elements])

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    // Handle dropping from toolbox
    if (active.data.current?.type === 'toolbox-item' && over.id === 'canvas') {
      // This will be handled in handleDragEnd
      return
    }
    
    // Handle reordering elements
    if (active.data.current?.type === 'element' && over.data.current?.type === 'element') {
      const activeElement = active.data.current.element as DashboardElement
      const overElement = over.data.current.element as DashboardElement
      
      // Calculate new position based on drop location
      const rect = over.rect
      const newX = rect.left - pan.x
      const newY = rect.top - pan.y
      
      onUpdateElement(activeElement.id, {
        config: {
          ...activeElement.config,
          freeform: {
            ...activeElement.config?.freeform,
            x: newX,
            y: newY,
          }
        }
      })
    }
  }, [pan, onUpdateElement])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDragOverlayElement(null)
    
    if (!over) return
    
    // Handle dropping from toolbox
    if (active.data.current?.type === 'toolbox-item' && over.id === 'canvas') {
      const toolboxItem = active.data.current.toolboxItem as ToolboxItem
      const rect = over.rect
      
      // Calculate position relative to canvas
      const x = rect.left - pan.x
      const y = rect.top - pan.y
      
      // Create new element
      const newElement: Partial<DashboardElement> = {
        type: toolboxItem.type,
        name: toolboxItem.name,
        position_x: 0,
        position_y: 0,
        width: 200,
        height: 150,
        z_index: dashboard.elements.length + 1,
        config: {
          freeform: {
            x,
            y,
            w: 200,
            h: 150,
          }
        },
        style: {
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderRadius: 0,
        },
        data_config: {
          data_model_id: null,
          query: '',
          dimensions: [],
          measures: [],
          filters: [],
        },
        is_visible: true,
      }
      
      onAddElement(newElement)
      return
    }
    
    // Handle element reordering
    if (active.data.current?.type === 'element' && over.data.current?.type === 'element') {
      const activeElement = active.data.current.element as DashboardElement
      const overElement = over.data.current.element as DashboardElement
      
      if (activeElement.id !== overElement.id) {
        // Update z-index to bring element to front
        onUpdateElement(activeElement.id, {
          z_index: Math.max(...dashboard.elements.map((el: DashboardElement) => el.z_index)) + 1
        })
      }
    }
  }, [pan, onAddElement, onUpdateElement, dashboard.elements])

  // Calculate selected rectangle for multi-select
  const selectedRect = selectedElement ? {
    x: selectedElement.config?.freeform?.x != null ? selectedElement.config.freeform.x : (selectedElement.position_x / gridSize) * canvasWidth,
    y: selectedElement.config?.freeform?.y != null ? selectedElement.config.freeform.y : (selectedElement.position_y / gridSize) * canvasHeight,
    w: selectedElement.config?.freeform?.w != null ? selectedElement.config.freeform.w : (selectedElement.width / gridSize) * canvasWidth,
  } : undefined

  return (
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        {/* Canvas */}
        <div
          ref={(node) => { setCanvasDroppableRef(node as HTMLElement) }}
          id="canvas"
          className="relative w-full h-full"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            transformOrigin: '0 0',
            background: (() => {
              if (canvasBackground.type === 'gradient') {
                return `linear-gradient(${canvasBackground.gradient.angle}deg, ${canvasBackground.gradient.from}, ${canvasBackground.gradient.to})`
              }
              if (canvasBackground.type === 'image') {
                return `url(${canvasBackground.image.url}) ${canvasBackground.image.repeat} ${canvasBackground.image.position}`
              }
              return canvasBackground.color
            })(),
            backgroundSize: canvasBackground.type === 'image' ? canvasBackground.image.size : 'auto',
          }}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
        >
          {/* Grid */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                opacity: 0.5,
              }}
            />
          )}

          {/* Canvas border */}
          {showCanvasBorder && (
            <div className="absolute inset-0 border-2 border-dashed border-gray-300 pointer-events-none" />
          )}

          {/* Elements */}
          <SortableContext items={dashboard.elements.map((el: DashboardElement) => el.id)} strategy={verticalListSortingStrategy}>
            {dashboard.elements.map((element: DashboardElement) => (
              <SortableElement
                key={element.id}
                element={element}
                isSelected={selectedElement?.id === element.id}
                isMultiSelected={selectedElements.some(el => el.id === element.id)}
                onElementClick={onElementClick}
                onElementMouseDown={onElementMouseDown}
                onElementMouseMove={onElementMouseMove}
                onStartResize={onStartResize}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                gridSize={gridSize}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                showPixelMode={showPixelMode}
                zoom={zoom}
                pan={pan}
                activeFilters={activeFilters}
                realtimeData={realtimeData}
                isDragging={isDragging}
                draggedElement={draggedElement}
                isResizing={isResizing}
              />
            ))}
          </SortableContext>

          {/* Selection rectangle */}
          {isSelecting && selectionRect && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            />
          )}
        </div>

        {/* Selection Toolbar */}
        {selectedElement && (
          <SelectionToolbar
            selectedElement={selectedElement}
            selectedElements={selectedElements}
            onUpdateElement={onUpdateElement}
            onBulkUpdate={onBulkUpdate}
            onDelete={onBulkDelete}
            onDuplicate={onDuplicate}
            zoom={zoom}
            pan={pan}
            selectedRect={selectedRect}
          />
        )}
      </div>
  )
}
