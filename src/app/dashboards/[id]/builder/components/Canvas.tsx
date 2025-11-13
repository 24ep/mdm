'use client'

import React from 'react'
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
import { SketchPicker, ColorResult } from 'react-color'
import { SelectionToolbar } from './SelectionToolbar'

interface CanvasProps {
  dashboard: any
  selectedElement: DashboardElement | null
  selectedElements?: DashboardElement[]
  draggedItem: ToolboxItem | null
  isDragging: boolean
  draggedElement: DashboardElement | null
  isResizing: boolean
  gridSize: number
  zoom: number
  canvasWidth: number
  canvasHeight: number
  showPixelMode: boolean
  showCanvasBorder?: boolean
  showGrid?: boolean
  snapToGrid: boolean
  activeFilters: Record<string, any>
  realtimeData: any
  canvasBackground?: {
    type: 'color' | 'gradient' | 'image'
    color: string
    gradient: { from: string; to: string; angle: number }
    image: { url: string; size: 'cover' | 'contain' | 'auto'; repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'; position: string }
  }
  onElementClick: (element: DashboardElement, e?: React.MouseEvent) => void
  onElementMouseDown: (e: React.MouseEvent, element: DashboardElement) => void
  onElementMouseMove: (e: React.MouseEvent, element: DashboardElement) => void
  onCanvasMouseDown?: (e: React.MouseEvent) => void
  onCanvasMouseMove?: (e: React.MouseEvent) => void
  onCanvasMouseUp?: () => void
  isSelecting?: boolean
  selectionRect?: { x: number; y: number; width: number; height: number } | null
  onStartResize?: (element: DashboardElement, direction: string, clientX: number, clientY: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDeleteElement: (elementId: string) => void
  onBulkDelete?: () => void
  onDuplicate?: () => void
  onExportCSV: (element: DashboardElement) => void
  onExportJSON: (element: DashboardElement) => void
  onExportPDF: (element: DashboardElement) => void
  onChartInteraction: (element: DashboardElement, interactionData: any) => void
  gridToPixel: (gridValue: number, gridSize: number, canvasSize: number) => number
  onUpdateElement?: (elementId: string, updates: Partial<DashboardElement>) => void
  onClearSelection?: () => void
  activePageId?: string | null
  fullpageBackground?: boolean
}

export function Canvas({
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
  onDragOver,
  onDrop,
  onDeleteElement,
  onBulkDelete,
  onDuplicate,
  onExportCSV,
  onExportJSON,
  onExportPDF,
  onChartInteraction,
  gridToPixel,
  onUpdateElement,
  onClearSelection,
  activePageId,
  fullpageBackground
}: CanvasProps) {
  const [isPanning, setIsPanning] = React.useState(false)
  const [pan, setPan] = React.useState({ x: 0, y: 0 })
  const lastPosRef = React.useRef<{ x: number; y: number } | null>(null)

  // Rotation state
  const [rotatingElementId, setRotatingElementId] = React.useState<string | null>(null)
  const rotateStateRef = React.useRef<{ centerX: number; centerY: number; startAngle: number; initialRotation: number } | null>(null)

  const beginRotate = (e: React.MouseEvent, element: DashboardElement) => {
    e.stopPropagation()
    const target = (e.currentTarget as HTMLElement).parentElement?.parentElement as HTMLElement | null
    const container = target ?? (e.currentTarget as HTMLElement)
    const rect = container.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const startAngle = Math.atan2(dy, dx)
    const initialRotation = Number(element.config?.rotation || 0) * (Math.PI / 180)
    rotateStateRef.current = { centerX, centerY, startAngle, initialRotation }
    setRotatingElementId(element.id)
    document.addEventListener('mousemove', handleRotateMove as any)
    document.addEventListener('mouseup', endRotate as any)
  }

  const handleRotateMove = (e: MouseEvent) => {
    if (!rotatingElementId || !rotateStateRef.current) return
    const { centerX, centerY, startAngle, initialRotation } = rotateStateRef.current
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const currentAngle = Math.atan2(dy, dx)
    const delta = currentAngle - startAngle
    let rotationDeg = ((initialRotation + delta) * 180) / Math.PI
    // Snap when Alt is pressed to 15° increments
    if (e.altKey) {
      rotationDeg = Math.round(rotationDeg / 15) * 15
    }
    rotationDeg = Math.round(rotationDeg)
    // Update element config (merge with existing)
    const el = document.querySelector(`[data-element-id="${rotatingElementId}"]`) // not used; kept placeholder
    onUpdateElement?.(rotatingElementId, { config: { rotation: rotationDeg } } as any)
  }

  const endRotate = () => {
    setRotatingElementId(null)
    rotateStateRef.current = null
    document.removeEventListener('mousemove', handleRotateMove as any)
    document.removeEventListener('mouseup', endRotate as any)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.shiftKey) { // middle mouse or Shift+drag
      e.preventDefault()
      setIsPanning(true)
      lastPosRef.current = { x: e.clientX, y: e.clientY }
    }
    // Call the prop handler for multi-select
    onCanvasMouseDown?.(e)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !lastPosRef.current) return
    const dx = e.clientX - lastPosRef.current.x
    const dy = e.clientY - lastPosRef.current.y
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    // Call the prop handler for multi-select
    onCanvasMouseMove?.(e)
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
    lastPosRef.current = null
    // Call the prop handler for multi-select
    onCanvasMouseUp?.()
  }

  const selectedRect = React.useMemo(() => {
    if (!selectedElement) return null as null | { x: number; y: number; w: number }
    const x = selectedElement.config?.freeform?.x != null ? selectedElement.config.freeform.x : (selectedElement.position_x / gridSize) * canvasWidth
    const y = selectedElement.config?.freeform?.y != null ? selectedElement.config.freeform.y : (selectedElement.position_y / gridSize) * canvasHeight
    const w = selectedElement.config?.freeform?.w != null ? selectedElement.config.freeform.w : (selectedElement.width / gridSize) * canvasWidth
    return { x, y, w }
  }, [selectedElement, gridSize, canvasWidth, canvasHeight])

  const handleButtonClick = async (element: DashboardElement) => {
    const cfg: any = element.config || {}
    const action = (cfg.action || 'none').toLowerCase()
    try {
      if (action === 'navigate' && cfg.url) {
        if (cfg.newTab) {
          window.open(cfg.url, '_blank')
        } else {
          window.location.href = cfg.url
        }
      } else if (action === 'open_dialog') {
        const title = cfg.dialogTitle || 'Info'
        const content = cfg.dialogContent || ''
        window.alert(`${title}\n\n${content}`)
      } else if (action === 'apply_filter') {
        onChartInteraction(element, {
          type: 'button_filter',
          field: cfg.filterField,
          operator: cfg.filterOperator || '=',
          value: cfg.filterValue
        })
      } else if (action === 'refresh_data') {
        realtimeData.refresh()
      } else if (action === 'run_webhook' && cfg.webhookUrl) {
        await fetch(cfg.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: typeof cfg.webhookPayload === 'string' ? cfg.webhookPayload : JSON.stringify(cfg.webhookPayload || {})
        })
      }
    } catch (e) {
      console.error('Button action failed', e)
    }
  }
  return (
    <div className={`flex-1 overflow-auto ${fullpageBackground ? 'bg-transparent p-0' : 'bg-muted/30 p-8'}`}> 
      <div
        className={`relative ${showCanvasBorder ? 'border border-border' : ''} min-h-full canvas-container`}
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          fontFamily: dashboard.font_family,
          fontSize: `${dashboard.font_size}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
          transformOrigin: 'top left',
          backgroundColor: canvasBackground?.type === 'color' ? canvasBackground?.color : undefined,
          backgroundImage: canvasBackground?.type === 'gradient'
            ? `linear-gradient(${canvasBackground?.gradient.angle}deg, ${canvasBackground?.gradient.from}, ${canvasBackground?.gradient.to})`
            : (canvasBackground?.type === 'image' && canvasBackground?.image.url ? `url(${canvasBackground?.image.url})` : undefined),
          backgroundSize: canvasBackground?.type === 'image' ? canvasBackground?.image.size : undefined,
          backgroundRepeat: canvasBackground?.type === 'image' ? canvasBackground?.image.repeat : undefined,
          backgroundPosition: canvasBackground?.type === 'image' ? canvasBackground?.image.position : undefined
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        data-zoom={zoom}
        data-cw={canvasWidth}
        data-ch={canvasHeight}
      >
        {/* Grid overlay removed for freeform canvas */}
        
        {/* Grid Labels (when pixel mode is enabled) */}
        {showPixelMode && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Horizontal grid labels */}
            {Array.from({ length: gridSize + 1 }, (_, i) => (
              <div
                key={`h-${i}`}
                className="absolute text-xs text-gray-400 font-mono"
                style={{
                  left: `${(i / gridSize) * 100}%`,
                  top: '-20px',
                  transform: 'translateX(-50%)'
                }}
              >
                {Math.round(gridToPixel(i, gridSize, canvasWidth))}px
              </div>
            ))}
            {/* Vertical grid labels */}
            {Array.from({ length: gridSize + 1 }, (_, i) => (
              <div
                key={`v-${i}`}
                className="absolute text-xs text-gray-400 font-mono"
                style={{
                  top: `${(i / gridSize) * 100}%`,
                  left: '-40px',
                  transform: 'translateY(-50%)'
                }}
              >
                {Math.round(gridToPixel(i, gridSize, canvasHeight))}px
              </div>
            ))}
          </div>
        )}

        {/* Dashboard Elements */}
        {(dashboard.elements || []).filter((el: any) => !activePageId || el.page_id === activePageId).map((element: DashboardElement) => (
          <div key={element.id}>
            {/* Element Name Label - Only show when selected */}
            {(selectedElement?.id === element.id || selectedElements?.some(el => el.id === element.id)) && (
              <div
                className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded-sm pointer-events-none z-20"
                style={{
                  left: (element.config?.freeform?.x != null ? element.config.freeform.x : (element.position_x / gridSize) * canvasWidth) + pan.x,
                  top: (element.config?.freeform?.y != null ? element.config.freeform.y : (element.position_y / gridSize) * canvasHeight) + pan.y - 24,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
              >
                {element.name || element.type || 'Element'}
              </div>
            )}
            
            {/* Element Container */}
            <div
            className={`absolute group ${
              (selectedElement?.id === element.id || selectedElements?.some(el => el.id === element.id)) && !isDragging && !isResizing
                ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg' 
                : ''
            } ${isDragging && draggedElement?.id === element.id ? 'cursor-grabbing' : 
              isResizing && selectedElement?.id === element.id ? 'cursor-grabbing' : 'cursor-move'}`}
            style={{
              left: element.config?.freeform?.x != null ? element.config.freeform.x : (element.position_x / gridSize) * canvasWidth,
              top: element.config?.freeform?.y != null ? element.config.freeform.y : (element.position_y / gridSize) * canvasHeight,
              width: element.config?.freeform?.w != null ? element.config.freeform.w : (element.width / gridSize) * canvasWidth,
              height: element.config?.freeform?.h != null ? element.config.freeform.h : (element.height / gridSize) * canvasHeight,
              zIndex: element.z_index,
              // Apply border on the outer container
              borderColor: typeof element.style?.borderColor === 'string' ? element.style.borderColor : undefined,
              borderTopColor: typeof element.style?.borderColor === 'object' ? element.style.borderColor.top : undefined,
              borderRightColor: typeof element.style?.borderColor === 'object' ? element.style.borderColor.right : undefined,
              borderBottomColor: typeof element.style?.borderColor === 'object' ? element.style.borderColor.bottom : undefined,
              borderLeftColor: typeof element.style?.borderColor === 'object' ? element.style.borderColor.left : undefined,
              borderWidth: typeof element.style?.borderWidth === 'object' 
                ? `${element.style.borderWidth.top || 0}px ${element.style.borderWidth.right || 0}px ${element.style.borderWidth.bottom || 0}px ${element.style.borderWidth.left || 0}px`
                : (element.style?.borderWidth ?? 0),
              borderStyle: (typeof element.style?.borderWidth === 'object' 
                ? (element.style.borderWidth.top || element.style.borderWidth.right || element.style.borderWidth.bottom || element.style.borderWidth.left)
                : (element.style?.borderWidth ?? 0)) > 0 ? 'solid' : 'none',
              borderRadius: typeof element.style?.borderRadius === 'object'
                ? `${element.style.borderRadius.topLeft || 0}px ${element.style.borderRadius.topRight || 0}px ${element.style.borderRadius.bottomRight || 0}px ${element.style.borderRadius.bottomLeft || 0}px`
                : (element.style?.borderRadius ?? 0),
              // Apply advanced effects
              boxShadow: (() => {
                const elementShadow = element.style?.boxShadow ? 
                  `${element.style.boxShadow.offsetX || 0}px ${element.style.boxShadow.offsetY || 0}px ${element.style.boxShadow.blur || 0}px ${element.style.boxShadow.spread || 0}px ${element.style.boxShadow.color || '#000000'}${Math.round((element.style.boxShadow.opacity || 0.25) * 255).toString(16).padStart(2, '0')}`
                  : undefined
                const selectionShadow = selectedElement?.id === element.id ? 
                  '0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.2)' 
                  : undefined
                return [elementShadow, selectionShadow].filter(Boolean).join(', ')
              })(),
              // CSS filters from structured config or raw string
              filter: (() => {
                const fc: any = element.style?.filterConfig
                if (fc) {
                  const parts: string[] = []
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
              // Background default transparent (no black by default)
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
                // solid
                const solid = withOpacity(s.backgroundColor || 'transparent')
                return solid
              })()
            }}
            onMouseDown={(e) => onElementMouseDown(e, element)}
            onMouseMove={(e) => onElementMouseMove(e, element)}
            onClick={(e) => onElementClick(element, e)}
          >
            <div
              className="w-full h-full relative"
              style={{
                padding: element.style?.padding ?? 0,
                // Inner background same as outer
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
                })()
              }}
            >
              {(() => {
                const kind = (element.chart_type || element.type || '').toUpperCase()
                
                // KPI and Metric Cards - Looker Studio Style
                if (kind === 'KPI' || kind === 'METRIC') {
                  const cfg: any = element.config || {}
                  const value = cfg.value || (kind === 'KPI' ? '$1,234,567' : '89.2%')
                  const label = cfg.label || (kind === 'KPI' ? 'Total Revenue' : 'Conversion Rate')
                  const trend = cfg.trend || (kind === 'KPI' ? 12.5 : -2.3)
                  const trendLabel = cfg.trendLabel || 'vs last month'
                  const isPositive = trend >= 0
                  
                  return (
                    <div className="w-full h-full bg-white overflow-hidden">
                      <div className="p-4 flex flex-col justify-center h-full">
                        <div className="text-2xl font-normal text-gray-900 mb-1" style={{ fontFamily: 'Roboto, sans-serif' }}>
                          {value}
                        </div>
                        <div className={`text-sm flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-1 text-xs">{isPositive ? '▲' : '▼'}</span>
                          <span className="font-medium">{Math.abs(trend)}%</span>
                          <span className="ml-1 text-gray-500 text-xs">{trendLabel}</span>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                // Progress Bar - Looker Studio Style
                if (kind === 'PROGRESS') {
                  const cfg: any = element.config || {}
                  const value = Math.min(100, Math.max(0, cfg.value || 75))
                  const label = cfg.label || 'Project Completion'
                  const showPercentage = cfg.showPercentage !== false
                  
                  return (
                    <div className="w-full h-full bg-white overflow-hidden">
                      <div className="p-4 flex flex-col justify-center h-full">
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-sm text-gray-600">Progress</div>
                          {showPercentage && (
                            <div className="text-sm font-medium text-gray-900">{value}%</div>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 transition-all duration-300"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {value >= 100 ? 'Completed' : `${100 - value}% remaining`}
                        </div>
                      </div>
                    </div>
                  )
                }
                
                // Gauge - Looker Studio Style
                if (kind === 'GAUGE') {
                  const cfg: any = element.config || {}
                  const value = Math.min(100, Math.max(0, cfg.value || 68))
                  const label = cfg.label || 'Performance Score'
                  const min = cfg.min || 0
                  const max = cfg.max || 100
                  const normalizedValue = ((value - min) / (max - min)) * 100
                  const angle = (normalizedValue / 100) * 180 // Half circle
                  const color = value >= 80 ? '#34a853' : value >= 60 ? '#fbbc04' : '#ea4335'
                  
                  return (
                    <div className="w-full h-full bg-white overflow-hidden">
                      <div className="p-4 flex flex-col items-center justify-center h-full">
                        <div className="relative w-24 h-12 mb-3">
                          <svg viewBox="0 0 100 50" className="w-full h-full">
                            <path
                              d="M 10 40 A 40 40 0 0 1 90 40"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="4"
                            />
                            <path
                              d="M 10 40 A 40 40 0 0 1 90 40"
                              fill="none"
                              stroke={color}
                              strokeWidth="4"
                              strokeDasharray={`${angle * 1.26} 251.2`}
                              strokeDashoffset="125.6"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-lg font-normal text-gray-900" style={{ fontFamily: 'Roboto, sans-serif' }}>
                              {value}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">Score</div>
                      </div>
                    </div>
                  )
                }
                
                // Text Block - Looker Studio Style
                if (kind === 'TEXT') {
                  const cfg: any = element.config || {}
                  const text = cfg.text || 'Dashboard Title'
                  const fontSize = cfg.fontSize || 24
                  const fontWeight = cfg.fontWeight || 'bold'
                  const textAlign = cfg.textAlign || 'center'
                  const color = cfg.color || '#1f2937'
                  
                  return (
                    <div className="w-full h-full bg-white overflow-hidden">
                      <div 
                        className="w-full h-full flex items-center justify-center p-4"
                        style={{ 
                          fontSize: `${fontSize}px`,
                          fontWeight,
                          textAlign,
                          color,
                          fontFamily: 'Roboto, sans-serif'
                        }}
                      >
                        <div className="text-center">
                          <div className="font-normal text-gray-900">{text}</div>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                // Image
                if (kind === 'IMAGE') {
                  const cfg: any = element.config || {}
                  const src = cfg.src || ''
                  const alt = cfg.alt || 'Image'
                  const objectFit = cfg.objectFit || 'cover'
                  
                  return src ? (
                    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <img 
                        src={src} 
                        alt={alt}
                        className="w-full h-full"
                        style={{ objectFit }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 shadow-sm">
                      <div className="text-center text-gray-500 p-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium">Image Placeholder</div>
                        <div className="text-xs mt-1">Configure image source in properties</div>
                      </div>
                    </div>
                  )
                }
                
                // Rich Text
                if (kind === 'RICH_TEXT') {
                  const cfg: any = element.config || {}
                  const content = cfg.content || `
                    <div class="space-y-3">
                      <h3 class="text-lg font-semibold text-gray-900">Rich Text Content</h3>
                      <p class="text-gray-600">This is a sample rich text block with <strong>bold text</strong> and <em>italic text</em>.</p>
                      <ul class="list-disc list-inside text-gray-600 space-y-1">
                        <li>First bullet point</li>
                        <li>Second bullet point</li>
                        <li>Third bullet point</li>
                      </ul>
                    </div>
                  `
                  
                  return (
                    <div 
                      className="w-full h-full p-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  )
                }
                
                // Web Page (simple iframe wrapper)
                if (kind === 'WEB_PAGE') {
                  const cfg: any = element.config || {}
                  const url = cfg.url || ''
                  return url ? (
                    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <iframe 
                        src={url}
                        className="w-full h-full border-0"
                        title={element.name || 'Web Page'}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 shadow-sm">
                      <div className="text-center text-gray-500 p-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M3 12h18M3 19h18" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium">Web Page</div>
                        <div className="text-xs mt-1">Set page URL in properties</div>
                      </div>
                    </div>
                  )
                }

                // iFrame Embed
                if (kind === 'IFRAME') {
                  const cfg: any = element.config || {}
                  const src = cfg.src || ''
                  
                  return src ? (
                    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <iframe 
                        src={src}
                        className="w-full h-full border-0"
                        title="Embedded Content"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 shadow-sm">
                      <div className="text-center text-gray-500 p-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium">iFrame Embed</div>
                        <div className="text-xs mt-1">Set iframe source in properties</div>
                      </div>
                    </div>
                  )
                }
                
                // YouTube
                if (kind === 'YOUTUBE') {
                  const cfg: any = element.config || {}
                  const url = cfg.url || ''
                  
                  return url ? (
                    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <iframe 
                        src={url}
                        className="w-full h-full border-0"
                        title="YouTube Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 shadow-sm">
                      <div className="text-center text-gray-500 p-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                        <div className="text-sm font-medium">YouTube Video</div>
                        <div className="text-xs mt-1">Set YouTube embed URL in properties</div>
                      </div>
                    </div>
                  )
                }
                
                // Video
                if (kind === 'VIDEO') {
                  const cfg: any = element.config || {}
                  const src = cfg.src || ''
                  
                  return src ? (
                    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <video 
                        src={src}
                        className="w-full h-full"
                        controls
                        autoPlay={cfg.autoplay}
                        loop={cfg.loop}
                        muted={cfg.muted}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 shadow-sm">
                      <div className="text-center text-gray-500 p-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium">Video Player</div>
                        <div className="text-xs mt-1">Set video URL in properties</div>
                      </div>
                    </div>
                  )
                }
                
                // HTML Embed
                if (kind === 'HTML') {
                  const cfg: any = element.config || {}
                  const html = cfg.html || `
                    <div class="p-4">
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Custom HTML</h3>
                      <p class="text-gray-600 mb-3">This is a custom HTML block with styling.</p>
                      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p class="text-blue-800 text-sm">Custom HTML content goes here</p>
                      </div>
                    </div>
                  `
                  
                  return (
                    <div 
                      className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  )
                }
                
                // Python Widget
                if (kind === 'PYTHON') {
                  const cfg: any = element.config || {}
                  const code = cfg.code || `import pandas as pd
import matplotlib.pyplot as plt

# Sample data analysis
data = pd.DataFrame({
    'month': ['Jan', 'Feb', 'Mar', 'Apr'],
    'sales': [100, 150, 200, 175]
})

print("Sales Analysis:")
print(data.describe())`
                  const output = cfg.output || 'Sales Analysis:\n       sales\ncount    4.000000\nmean   156.250000\nstd     41.457276\nmin    100.000000\n25%    137.500000\n50%    162.500000\n75%    181.250000\nmax    200.000000'
                  
                  return (
                    <div className="w-full h-full flex flex-col p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-sm font-medium text-gray-700 mb-2">Python Code:</div>
                      <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded mb-3 flex-1 overflow-auto font-mono">
                        {code}
                      </pre>
                      <div className="text-sm font-medium text-gray-700 mb-1">Output:</div>
                      <div className="text-xs bg-gray-50 p-3 rounded font-mono">
                        {output}
                      </div>
                    </div>
                  )
                }
                
                // Icon
                if (kind === 'ICON') {
                  const cfg: any = element.config || {}
                  const iconName = cfg.iconName || 'star'
                  const size = cfg.size || 48
                  const color = cfg.color || '#3b82f6'
                  
                  // Icon mapping with better visual representation
                  const iconMap: Record<string, any> = {
                    star: '⭐',
                    heart: '❤️',
                    home: '🏠',
                    user: '👤',
                    settings: '⚙️',
                    bell: '🔔',
                    check: '✅',
                    alert: '⚠️',
                    camera: '📷',
                    cloud: '☁️',
                    folder: '📁',
                    mail: '📧',
                    phone: '📞',
                    play: '▶️',
                    pause: '⏸️',
                    search: '🔍',
                    plus: '➕',
                    minus: '➖',
                    x: '❌'
                  }
                  
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-center">
                        <div 
                          className="mb-2"
                          style={{ 
                            fontSize: `${size}px`,
                            color
                          }}
                        >
                          {iconMap[iconName.toLowerCase()] || iconMap.star}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">{iconName}</div>
                      </div>
                    </div>
                  )
                }
                
                // Control Elements - Looker Studio Style
                if (kind === 'DATE_RANGE') {
                  return (
                    <div className="w-full h-full bg-white overflow-hidden">
                      <div className="p-4 flex flex-col justify-center h-full">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">From</label>
                            <input 
                              type="date" 
                              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                              defaultValue="2024-01-01"
                              style={{ fontFamily: 'Roboto, sans-serif' }}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">To</label>
                            <input 
                              type="date" 
                              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                              defaultValue="2024-12-31"
                              style={{ fontFamily: 'Roboto, sans-serif' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                if (kind === 'DROPDOWN_FILTER') {
                  return (
                    <div className="w-full h-full bg-white overflow-hidden">
                      <div className="p-4 flex flex-col justify-center h-full">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Select Category</label>
                          <select className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500" style={{ fontFamily: 'Roboto, sans-serif' }}>
                            <option value="all">All Categories</option>
                            <option value="electronics">Electronics</option>
                            <option value="clothing">Clothing</option>
                            <option value="books">Books</option>
                            <option value="home">Home & Garden</option>
                            <option value="sports">Sports</option>
                          </select>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Selected: All Categories
                        </div>
                      </div>
                    </div>
                  )
                }
                
                if (kind === 'SEARCH_BOX') {
                  return (
                    <div className="w-full h-full bg-white overflow-hidden">
                      <div className="p-4 flex flex-col justify-center h-full">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Search Query</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="Search products, customers..."
                              className="w-full px-3 py-2 pl-8 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                              defaultValue=""
                              style={{ fontFamily: 'Roboto, sans-serif' }}
                            />
                            <svg className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Press Enter to search
                        </div>
                      </div>
                    </div>
                  )
                }
                
                if (kind === 'GLOBAL_FILTER') {
                  return (
                    <div className="w-full h-full bg-white overflow-hidden">
                      <div className="p-4 flex flex-col justify-center h-full">
                        <div>
                          <label className="text-xs text-gray-600 mb-2 block">Filter Options</label>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input type="checkbox" id="active" className="mr-2" defaultChecked />
                              <label htmlFor="active" className="text-sm text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>Active customers only</label>
                            </div>
                            <div className="flex items-center">
                              <input type="checkbox" id="premium" className="mr-2" />
                              <label htmlFor="premium" className="text-sm text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>Premium accounts</label>
                            </div>
                            <div className="flex items-center">
                              <input type="checkbox" id="verified" className="mr-2" defaultChecked />
                              <label htmlFor="verified" className="text-sm text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>Verified users</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                // Button (existing implementation)
                if (kind === 'BUTTON') {
                  const cfg: any = element.config || {}
                  return (
                    <div className="w-full h-full flex items-center justify-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <Button
                        variant="default"
                        className="px-6 py-2"
                        onClick={(e) => { e.stopPropagation(); handleButtonClick(element) }}
                      >
                        {cfg.label || 'Click Me'}
                      </Button>
                    </div>
                  )
                }
                
                // Shape Elements - these are handled by ChartRenderer but we need to add them here too
                if (kind === 'RECTANGLE' || kind === 'CIRCLE' || kind === 'ELLIPSE' || 
                    kind === 'ROUNDED_RECT' || kind === 'LINE' || kind === 'ARROW' || 
                    kind === 'TRIANGLE' || kind === 'STAR' || kind === 'HEXAGON' || 
                    kind === 'DIVIDER') {
                  // For now, return null as these are handled by ChartRenderer
                  // We could implement them here directly if needed
                  return null
                }
                
                return null
              })()}
              {/* Only render ChartRenderer for chart elements */}
              {(() => {
                const kind = (element.chart_type || element.type || '').toUpperCase()
                const isChartElement = [
                  'BAR', 'HORIZONTAL_BAR', 'LINE', 'AREA', 'PIE', 'DONUT', 
                  'SCATTER', 'RADAR', 'FUNNEL', 'WATERFALL', 'BOX_PLOT',
                  'CHOROPLETH', 'BUBBLE_MAP', 'TABLE', 'PIVOT_TABLE',
                  'RECTANGLE', 'CIRCLE', 'ELLIPSE', 'ROUNDED_RECT', 'LINE', 
                  'ARROW', 'TRIANGLE', 'STAR', 'HEXAGON', 'DIVIDER'
                ].includes(kind)
                
                if (isChartElement) {
                  return (
              <ChartRenderer
                type={element.type}
                chartType={element.chart_type || 'BAR'}
                data={realtimeData.data || []}
                dimensions={element.data_config?.dimensions || []}
                measures={element.data_config?.measures || []}
                filters={Object.values(activeFilters).filter((filter: any) => filter.sourceElementId !== element.id)}
                title={element.name}
                isLive={!!element.data_config?.refresh_interval}
                refreshInterval={element.data_config?.refresh_interval || 30000}
                onRefresh={() => realtimeData.refresh()}
                onFilter={(filter) => onChartInteraction(element, { type: 'click', ...filter })}
                onExport={() => {}}
                config={element.config}
                className="w-full h-full"
              />
                  )
                }
                return null
              })()}
              {(() => {
                const isTable = (element.chart_type || element.type || '').toUpperCase() === 'TABLE'
                const hasModel = !!element.data_config?.data_model_id
                const hasDims = Array.isArray(element.data_config?.dimensions) && element.data_config.dimensions.length > 0
                const hasMeas = Array.isArray(element.data_config?.measures) && element.data_config.measures.length > 0
                const needsConfig = !hasModel || (isTable ? !hasDims : (!hasDims && !hasMeas))
                if (!needsConfig) return null
                return (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="pointer-events-none select-none w-[85%] max-w-sm text-center text-gray-500 px-2 py-2 text-[13px] leading-5">
                      Configure data on the right panel: choose a data model and fields.
                    </div>
                  </div>
                )
              })()}
            </div>

              {/* Export: 3-dot menu on hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 bg-white shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                      title="Export"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onExportCSV(element)}>
                      <FileSpreadsheet className="h-3 w-3 mr-2" /> CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExportJSON(element)}>
                      <FileText className="h-3 w-3 mr-2" /> JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExportPDF(element)}>
                      <FileImage className="h-3 w-3 mr-2" /> PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Resize Handles */}
              {selectedElement?.id === element.id && (
                <>
                  {/* Rotate Handle for shapes */}
                  {element.type === 'SHAPE' && (
                    <div
                      className="absolute w-3 h-3 bg-orange-500 border-2 border-white rounded-full cursor-grab hover:scale-110 transition-all duration-150 z-10"
                      style={{ top: -20, left: '50%', transform: 'translateX(-50%)' }}
                      onMouseDown={(e) => beginRotate(e, element)}
                      title="Rotate"
                    />
                  )}
                  {/* Corner handles */}
                  <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-nw-resize hover:bg-blue-600 hover:scale-110 transition-all duration-150 z-10 rounded-sm"
                    style={{ top: -8, left: -8 }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onStartResize?.(element, 'top-left', e.clientX, e.clientY)
                    }}
                  />
                  <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-ne-resize hover:bg-blue-600 hover:scale-110 transition-all duration-150 z-10 rounded-sm"
                    style={{ top: -8, right: -8 }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onStartResize?.(element, 'top-right', e.clientX, e.clientY)
                    }}
                  />
                  <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-sw-resize hover:bg-blue-600 hover:scale-110 transition-all duration-150 z-10 rounded-sm"
                    style={{ bottom: -8, left: -8 }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onStartResize?.(element, 'bottom-left', e.clientX, e.clientY)
                    }}
                  />
                  <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-se-resize hover:bg-blue-600 hover:scale-110 transition-all duration-150 z-10 rounded-sm"
                    style={{ bottom: -8, right: -8 }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onStartResize?.(element, 'bottom-right', e.clientX, e.clientY)
                    }}
                  />
                  
                  {/* Edge handles */}
                  <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-n-resize hover:bg-blue-600 hover:scale-110 transition-all duration-150 z-10 rounded-sm"
                    style={{ top: -8, left: '50%', transform: 'translateX(-50%)' }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onStartResize?.(element, 'top', e.clientX, e.clientY)
                    }}
                  />
                  <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-s-resize hover:bg-blue-600 hover:scale-110 transition-all duration-150 z-10 rounded-sm"
                    style={{ bottom: -8, left: '50%', transform: 'translateX(-50%)' }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onStartResize?.(element, 'bottom', e.clientX, e.clientY)
                    }}
                  />
                  <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-w-resize hover:bg-blue-600 hover:scale-110 transition-all duration-150 z-10 rounded-sm"
                    style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onStartResize?.(element, 'left', e.clientX, e.clientY)
                    }}
                  />
                  <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white cursor-e-resize hover:bg-blue-600 hover:scale-110 transition-all duration-150 z-10 rounded-sm"
                    style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onStartResize?.(element, 'right', e.clientX, e.clientY)
                    }}
                  />
                </>
              )}
            </div>
          </div>
        ))}

        {/* Selection Rectangle */}
        {isSelecting && selectionRect && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-10"
                    style={{
              left: selectionRect.x,
              top: selectionRect.y,
              width: selectionRect.width,
              height: selectionRect.height,
            }}
          />
        )}

        {/* Selection Toolbar - positioned near selected element */}
        <SelectionToolbar
          selectedElement={selectedElement}
          selectedElements={selectedElements}
          onUpdateElement={onUpdateElement}
          onBulkUpdate={(updates) => {
            selectedElements?.forEach(element => {
              onUpdateElement?.(element.id, updates)
            })
          }}
          onDelete={onBulkDelete}
          onDuplicate={onDuplicate}
          zoom={zoom}
          pan={pan}
          selectedRect={selectedRect || undefined}
        />


        {/* Floating style bar under toolbar when an element is selected */}
        {selectedElement && selectedRect && (
          <div 
            className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-3 z-50"
            style={{
              left: selectedRect.x + pan.x,
              top: selectedRect.y + selectedRect.w + pan.y + 8,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* removed element selected popover */}
            </div>
          )}

        {/* Drop Zone Indicator */}
        {draggedItem && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-50 flex items-center justify-center">
            <div className="text-blue-600 font-medium">
              Drop {draggedItem.name} here
        </div>
            </div>
          )}
            </div>
        </div>
      )
    }


