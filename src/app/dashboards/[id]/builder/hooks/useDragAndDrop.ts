import { useState, useEffect, useCallback, useRef } from 'react'
import { DashboardElement } from './useDashboardState'

export interface ToolboxItem {
  id: string
  name: string
  icon: any
  type: string
  chart_type?: string
  description: string
  defaultSize: { width: number; height: number }
}

export function useDragAndDrop(
  gridSize: number,
  snapToGrid: boolean,
  updateElement: (elementId: string, updates: Partial<DashboardElement>) => void
) {
  const [draggedItem, setDraggedItem] = useState<ToolboxItem | null>(null)
  const [draggedElement, setDraggedElement] = useState<DashboardElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  const [resizeStartData, setResizeStartData] = useState({
    // Mouse starting point (client coords)
    x: 0,
    y: 0,
    // Grid units snapshot (for syncing after resize ends)
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
    // Pixel snapshot of rect relative to canvas (for smooth pixel-based resizing)
    pxX: 0,
    pxY: 0,
    pxW: 0,
    pxH: 0,
    lockAspect: false
  })

  // Smooth updates via requestAnimationFrame batching
  const rafIdRef = useRef<number | null>(null)
  const pendingUpdateRef = useRef<{ elementId: string; updates: Partial<DashboardElement> } | null>(null)

  const flushUpdate = () => {
    if (!pendingUpdateRef.current) return
    const { elementId, updates } = pendingUpdateRef.current
    pendingUpdateRef.current = null
    updateElement(elementId, updates)
  }

  const scheduleUpdate = (elementId: string, updates: Partial<DashboardElement>) => {
    pendingUpdateRef.current = { elementId, updates }
    if (rafIdRef.current != null) return
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      flushUpdate()
    })
  }

  // Grid and Pixel Conversion Utilities
  const gridToPixel = (gridValue: number, gridSize: number, canvasSize: number) => {
    return (gridValue / gridSize) * canvasSize
  }

  const pixelToGrid = (pixelValue: number, gridSize: number, canvasSize: number) => {
    return (pixelValue / canvasSize) * gridSize
  }

  const snapToGridValue = (value: number, gridSize: number, snap: boolean = true) => {
    if (!snap) return value
    return Math.round(value)
  }

  // Global mouse event handlers for dragging and resizing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedElement) {
        // Handle dragging using pixel → grid conversion over actual canvas rect (zoom-aware)
        const canvasElement = document.querySelector('.canvas-container') as HTMLElement | null
        if (!canvasElement) return

        const canvasRect = canvasElement.getBoundingClientRect()
        const zoomAttr = Number((canvasElement as any).dataset?.zoom || 100)
        const zoomScale = zoomAttr / 100
        const canvasWidthCss = canvasRect.width / zoomScale
        const canvasHeightCss = canvasRect.height / zoomScale

        const xPx = (e.clientX - canvasRect.left - dragOffset.x) / zoomScale
        const yPx = (e.clientY - canvasRect.top - dragOffset.y) / zoomScale

        // Freeform: store pixel positions in config.freeform
        const currentW = draggedElement.config?.freeform?.w != null
          ? Number(draggedElement.config.freeform.w)
          : gridToPixel(draggedElement.width, gridSize, canvasWidthCss)
        const currentH = draggedElement.config?.freeform?.h != null
          ? Number(draggedElement.config.freeform.h)
          : gridToPixel(draggedElement.height, gridSize, canvasHeightCss)
        const pxX = Math.max(0, Math.min(xPx, canvasWidthCss - currentW))
        const pxY = Math.max(0, Math.min(yPx, canvasHeightCss - currentH))

        // Freeform movement - no grid alignment
        scheduleUpdate(draggedElement.id, {
          config: {
            ...(draggedElement.config || {}),
            freeform: { ...(draggedElement.config?.freeform || {}), x: pxX, y: pxY, w: currentW, h: currentH }
          },
          position_x: (pxX / canvasWidthCss) * gridSize,
          position_y: (pxY / canvasHeightCss) * gridSize
        })
      } else if (isResizing && resizeDirection && draggedElement) {
        // Handle resizing in pure pixels
        const canvasElement = document.querySelector('.canvas-container') as HTMLElement | null
        if (!canvasElement) return
        const canvasRect = canvasElement.getBoundingClientRect()
        const zoomAttr = Number((canvasElement as any).dataset?.zoom || 100)
        const zoomScale = zoomAttr / 100
        const deltaX = (e.clientX - resizeStartData.x) / zoomScale
        const deltaY = (e.clientY - resizeStartData.y) / zoomScale

        let pxX = resizeStartData.pxX
        let pxY = resizeStartData.pxY
        let pxW = resizeStartData.pxW
        let pxH = resizeStartData.pxH

        // Apply resize in pixel space
        if (resizeDirection.includes('right')) {
          pxW = resizeStartData.pxW + deltaX
        }
        if (resizeDirection.includes('left')) {
          pxW = resizeStartData.pxW - deltaX
          pxX = resizeStartData.pxX + deltaX
        }
        if (resizeDirection.includes('bottom')) {
          pxH = resizeStartData.pxH + deltaY
        }
        if (resizeDirection.includes('top')) {
          pxH = resizeStartData.pxH - deltaY
          pxY = resizeStartData.pxY + deltaY
        }

        // Constraints in pixels
        const minSize = 20
        pxW = Math.max(minSize, pxW)
        pxH = Math.max(minSize, pxH)

        // Maintain aspect ratio
        const isShape = draggedElement.type === 'SHAPE'
        const shouldLock = resizeStartData.lockAspect || (isShape && (draggedElement.config?.lockAspect === true))
        if (shouldLock) {
          const aspect = resizeStartData.pxW > 0 ? (resizeStartData.pxH / resizeStartData.pxW) : 1
          if (resizeDirection.includes('left') || resizeDirection.includes('right')) {
            pxH = Math.round(pxW * aspect)
          } else if (resizeDirection.includes('top') || resizeDirection.includes('bottom')) {
            const inv = resizeStartData.pxH > 0 ? (resizeStartData.pxW / resizeStartData.pxH) : 1
            pxW = Math.round(pxH * inv)
          }
        }

        // Keep within canvas bounds
        const canvasWidthCss = canvasRect.width / zoomScale
        const canvasHeightCss = canvasRect.height / zoomScale
        pxX = Math.max(0, Math.min(pxX, canvasWidthCss - pxW))
        pxY = Math.max(0, Math.min(pxY, canvasHeightCss - pxH))

        // Sync grid fields without snapping (no dependency at runtime)
        const newWidth = (pxW / canvasWidthCss) * gridSize
        const newHeight = (pxH / canvasHeightCss) * gridSize
        const newPositionX = (pxX / canvasWidthCss) * gridSize
        const newPositionY = (pxY / canvasHeightCss) * gridSize

        scheduleUpdate(draggedElement.id, {
          width: newWidth,
          height: newHeight,
          position_x: newPositionX,
          position_y: newPositionY,
          config: {
            ...(draggedElement.config || {}),
            freeform: { ...(draggedElement.config?.freeform || {}), x: pxX, y: pxY, w: pxW, h: pxH }
          }
        })
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setDraggedElement(null)
      setDragOffset({ x: 0, y: 0 })
      setIsResizing(false)
      setResizeDirection('')
      setResizeStartData({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        positionX: 0,
        positionY: 0,
        pxX: 0,
        pxY: 0,
        pxW: 0,
        pxH: 0,
        lockAspect: false
      })
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, draggedElement, dragOffset, isResizing, resizeDirection, resizeStartData, gridSize, snapToGrid, updateElement])

  const handleDragStart = (e: React.DragEvent, item: ToolboxItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'copy'
    // Use a transparent drag image to avoid default black border/ghost
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, 1, 1)
      }
      e.dataTransfer.setDragImage(canvas, 0, 0)
    } catch {}
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent, addElement: (item: ToolboxItem, x: number, y: number) => void) => {
    e.preventDefault()
    if (!draggedItem) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Freeform drop - no grid alignment
    const gridX = pixelToGrid(x, gridSize, 100)
    const gridY = pixelToGrid(y, gridSize, 100)

    addElement(draggedItem, gridX, gridY)
    setDraggedItem(null)
  }

  const handleElementMouseDown = (e: any, element: DashboardElement) => {
    // Guard against non-event inputs to prevent runtime errors
    if (typeof e?.preventDefault === 'function') e.preventDefault()
    if (typeof e?.stopPropagation === 'function') e.stopPropagation()
    
    const currentTarget = e?.currentTarget as HTMLElement | undefined
    if (!currentTarget) return
    const rect = currentTarget.getBoundingClientRect()
    const canvasRect = currentTarget.closest('.canvas-container')?.getBoundingClientRect()
    
    if (!canvasRect) return

    const resizeDir = detectResizeDirection(e, element)
    
    if (resizeDir) {
      // Start resize operation
      setIsResizing(true)
      setResizeDirection(resizeDir)
      const canvasEl = currentTarget.closest('.canvas-container') as HTMLElement | null
      const canvasRect = canvasEl?.getBoundingClientRect()
      const elRect = currentTarget.getBoundingClientRect()
      const zoomAttr = canvasEl ? Number((canvasEl as any).dataset?.zoom || 100) : 100
      const zoomScale = zoomAttr / 100
      const pxX = canvasRect ? (elRect.left - canvasRect.left) / zoomScale : 0
      const pxY = canvasRect ? (elRect.top - canvasRect.top) / zoomScale : 0
      const pxW = elRect.width / zoomScale
      const pxH = elRect.height / zoomScale
      setResizeStartData({
        x: e?.clientX ?? 0,
        y: e?.clientY ?? 0,
        width: element.width,
        height: element.height,
        positionX: element.position_x,
        positionY: element.position_y,
        pxX,
        pxY,
        pxW,
        pxH,
        lockAspect: !!e?.shiftKey
      })
      setDraggedElement(element)
    } else {
      // Start drag operation
      const clientX = e?.clientX ?? 0
      const clientY = e?.clientY ?? 0
      const offsetX = clientX - rect.left
      const offsetY = clientY - rect.top
      
      setDraggedElement(element)
      setIsDragging(true)
      setDragOffset({ x: offsetX, y: offsetY })
    }
  }

  const detectResizeDirection = (e: React.MouseEvent, element: DashboardElement) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const width = rect.width
    const height = rect.height
    
    const edgeThreshold = 8 // pixels from edge to trigger resize
    const isNearLeft = x < edgeThreshold
    const isNearRight = x > width - edgeThreshold
    const isNearTop = y < edgeThreshold
    const isNearBottom = y > height - edgeThreshold
    
    if (isNearLeft && isNearTop) return 'top-left'
    if (isNearRight && isNearTop) return 'top-right'
    if (isNearLeft && isNearBottom) return 'bottom-left'
    if (isNearRight && isNearBottom) return 'bottom-right'
    if (isNearLeft) return 'left'
    if (isNearRight) return 'right'
    if (isNearTop) return 'top'
    if (isNearBottom) return 'bottom'
    
    return null
  }

  const getResizeCursor = (direction: string) => {
    switch (direction) {
      case 'top-left':
      case 'bottom-right':
        return 'cursor-nw-resize'
      case 'top-right':
      case 'bottom-left':
        return 'cursor-ne-resize'
      case 'top':
      case 'bottom':
        return 'cursor-n-resize'
      case 'left':
      case 'right':
        return 'cursor-e-resize'
      default:
        return 'cursor-move'
    }
  }

  // Explicit resize starter for external callers (e.g., Canvas resize handles)
  const startResize = (
    element: DashboardElement,
    direction: string,
    clientX: number,
    clientY: number
  ) => {
    setIsResizing(true)
    setResizeDirection(direction)
    // Derive pixel rect relative to canvas for smooth, zoom-aware resizing
    const canvasEl = document.querySelector('.canvas-container') as HTMLElement | null
    const canvasRect = canvasEl?.getBoundingClientRect()
    const zoomAttr = canvasEl ? Number((canvasEl as any).dataset?.zoom || 100) : 100
    const zoomScale = zoomAttr / 100
    const canvasWidthCss = canvasRect ? canvasRect.width / zoomScale : 0
    const canvasHeightCss = canvasRect ? canvasRect.height / zoomScale : 0

    const startPxX = (element.config?.freeform?.x != null)
      ? Number(element.config.freeform.x)
      : gridToPixel(element.position_x, gridSize, canvasWidthCss)
    const startPxY = (element.config?.freeform?.y != null)
      ? Number(element.config.freeform.y)
      : gridToPixel(element.position_y, gridSize, canvasHeightCss)
    const startPxW = (element.config?.freeform?.w != null)
      ? Number(element.config.freeform.w)
      : gridToPixel(element.width, gridSize, canvasWidthCss)
    const startPxH = (element.config?.freeform?.h != null)
      ? Number(element.config.freeform.h)
      : gridToPixel(element.height, gridSize, canvasHeightCss)

    setResizeStartData({
      x: clientX,
      y: clientY,
      width: element.width,
      height: element.height,
      positionX: element.position_x,
      positionY: element.position_y,
      pxX: startPxX,
      pxY: startPxY,
      pxW: startPxW,
      pxH: startPxH,
      lockAspect: false
    })
    setDraggedElement(element)
  }

  return {
    draggedItem,
    draggedElement,
    isDragging,
    isResizing,
    resizeDirection,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleElementMouseDown,
    detectResizeDirection,
    getResizeCursor,
    startResize,
    gridToPixel,
    pixelToGrid,
    snapToGridValue
  }
}
