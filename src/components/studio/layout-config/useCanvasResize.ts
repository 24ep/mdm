'use client'

import React, { useRef, useCallback } from 'react'
import { RefObject } from 'react'
import { PlacedWidget } from './widgets'

interface UseCanvasResizeProps {
  canvasRef: RefObject<HTMLDivElement>
  placedWidgets: PlacedWidget[]
  canvasMode: 'freeform' | 'grid'
  gridSize: number
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function useCanvasResize({
  canvasRef,
  placedWidgets,
  canvasMode,
  gridSize,
  setPlacedWidgets,
}: UseCanvasResizeProps) {
  const [isResizing, setIsResizing] = React.useState(false)

  const resizeStateRef = useRef<{
    isResizing: boolean
    widgetId: string | null
    handle: string | null
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    startLeft: number
    startTop: number
  }>({
    isResizing: false,
    widgetId: null,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
  })

  const animationFrameRef = useRef<number | null>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (resizeStateRef.current.isResizing && resizeStateRef.current.widgetId && canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const rect = canvasRef.current!.getBoundingClientRect()
        const deltaX = e.clientX - resizeStateRef.current.startX
        const deltaY = e.clientY - resizeStateRef.current.startY
        const handle = resizeStateRef.current.handle!

        let newWidth = resizeStateRef.current.startWidth
        let newHeight = resizeStateRef.current.startHeight
        let newX = resizeStateRef.current.startLeft
        let newY = resizeStateRef.current.startTop

        if (handle.includes('e')) {
          newWidth = resizeStateRef.current.startWidth + deltaX
        }
        if (handle.includes('w')) {
          newWidth = resizeStateRef.current.startWidth - deltaX
          newX = resizeStateRef.current.startLeft + deltaX
        }
        if (handle.includes('s')) {
          newHeight = resizeStateRef.current.startHeight + deltaY
        }
        if (handle.includes('n')) {
          newHeight = resizeStateRef.current.startHeight - deltaY
          newY = resizeStateRef.current.startTop + deltaY
        }

        if (canvasMode === 'grid') {
          newWidth = Math.round(newWidth / gridSize) * gridSize
          newHeight = Math.round(newHeight / gridSize) * gridSize
          if (handle.includes('w')) {
            newX = Math.round(newX / gridSize) * gridSize
          }
          if (handle.includes('n')) {
            newY = Math.round(newY / gridSize) * gridSize
          }
        }

        const minWidth = 50
        const minHeight = 50
        newWidth = Math.max(minWidth, newWidth)
        newHeight = Math.max(minHeight, newHeight)

        const maxX = rect.width
        const maxY = rect.height
        
        if (newX < 0) {
          newWidth += newX
          newX = 0
        }
        if (newY < 0) {
          newHeight += newY
          newY = 0
        }
        if (newX + newWidth > maxX) {
          newWidth = maxX - newX
        }
        if (newY + newHeight > maxY) {
          newHeight = maxY - newY
        }

        setPlacedWidgets(prev => prev.map(widget =>
          widget.id === resizeStateRef.current.widgetId
            ? { 
                ...widget, 
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
              }
            : widget
        ))
      })
    }
  }, [canvasRef, placedWidgets, setPlacedWidgets, canvasMode, gridSize])

  const handleMouseUp = useCallback(() => {
    if (resizeStateRef.current.isResizing) {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      
      resizeStateRef.current.isResizing = false
      resizeStateRef.current.widgetId = null
      resizeStateRef.current.handle = null
      setIsResizing(false)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [setIsResizing])

  return {
    resizeStateRef,
    isResizing,
    setIsResizing,
    handleMouseMove,
    handleMouseUp,
  }
}

