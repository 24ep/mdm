'use client'

import React, { useRef, useCallback } from 'react'
import { RefObject } from 'react'
import { PlacedWidget } from './widgets'

interface UseCanvasDragProps {
  canvasRef: RefObject<HTMLDivElement>
  placedWidgets: PlacedWidget[]
  canvasMode: 'freeform' | 'grid'
  gridSize: number
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setIsDraggingWidget: React.Dispatch<React.SetStateAction<boolean>>
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
}

export function useCanvasDrag({
  canvasRef,
  placedWidgets,
  canvasMode,
  gridSize,
  setPlacedWidgets,
  setIsDraggingWidget,
  setDragOffset,
}: UseCanvasDragProps) {
  const dragStateRef = useRef<{
    isDragging: boolean
    widgetId: string | null
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    initialX: number
    initialY: number
  }>({
    isDragging: false,
    widgetId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    initialX: 0,
    initialY: 0,
  })

  const animationFrameRef = useRef<number | null>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.widgetId || !canvasRef.current) {
      return
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const rect = canvasRef.current!.getBoundingClientRect()
      let newX = e.clientX - rect.left - dragStateRef.current.offsetX
      let newY = e.clientY - rect.top - dragStateRef.current.offsetY

      const draggedWidget = placedWidgets.find(w => w.id === dragStateRef.current.widgetId)
      if (draggedWidget) {
        const width = draggedWidget.width || 200
        const height = draggedWidget.height || 150

        if (canvasMode === 'grid') {
          newX = Math.round(newX / gridSize) * gridSize
          newY = Math.round(newY / gridSize) * gridSize
        }

        const boundedX = Math.max(0, Math.min(newX, rect.width - width))
        const boundedY = Math.max(0, Math.min(newY, rect.height - height))

        setPlacedWidgets(prev => prev.map(widget =>
          widget.id === dragStateRef.current.widgetId
            ? { ...widget, x: boundedX, y: boundedY }
            : widget
        ))
      }
    })
  }, [placedWidgets, canvasRef, setPlacedWidgets, canvasMode, gridSize])

  const handleMouseUp = useCallback(() => {
    if (dragStateRef.current.isDragging) {
      if (canvasMode === 'grid' && dragStateRef.current.widgetId && canvasRef.current) {
        const widget = placedWidgets.find(w => w.id === dragStateRef.current.widgetId)
        if (widget) {
          const snappedX = Math.round(widget.x / gridSize) * gridSize
          const snappedY = Math.round(widget.y / gridSize) * gridSize
          setPlacedWidgets(prev => prev.map(w =>
            w.id === dragStateRef.current.widgetId
              ? { ...w, x: snappedX, y: snappedY }
              : w
          ))
        }
      }
      
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      
      dragStateRef.current.isDragging = false
      dragStateRef.current.widgetId = null
      
      setIsDraggingWidget(false)
      setDragOffset({ x: 0, y: 0 })
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [setIsDraggingWidget, setDragOffset, canvasMode, gridSize, placedWidgets, setPlacedWidgets, canvasRef])

  return {
    dragStateRef,
    handleMouseMove,
    handleMouseUp,
  }
}

