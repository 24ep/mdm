'use client'

import React, { RefObject, useState } from 'react'
import { Square, Lock } from 'lucide-react'
import { widgetsPalette, PlacedWidget } from './widgets'
import { WidgetRenderer } from './WidgetRenderer'
import { ResizeHandles } from './ResizeHandles'
import { WidgetContextMenu } from './WidgetContextMenu'
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface CanvasWidgetProps {
  widget: PlacedWidget
  isMobile: boolean
  isSelected: boolean
  isMultiSelected?: boolean
  isDraggingWidget: boolean
  canvasRef: RefObject<HTMLDivElement>
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedWidgetIds?: React.Dispatch<React.SetStateAction<Set<string>>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setIsDraggingWidget: React.Dispatch<React.SetStateAction<boolean>>
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>
  dragStateRef: React.MutableRefObject<{
    isDragging: boolean
    widgetId: string | null
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    initialX: number
    initialY: number
  }>
  resizeStateRef: React.MutableRefObject<{
    isResizing: boolean
    widgetId: string | null
    handle: string | null
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    startLeft: number
    startTop: number
  }>
  placedWidgets: PlacedWidget[]
  clipboardWidget?: PlacedWidget | null
  clipboardWidgets?: PlacedWidget[]
  onCopy?: () => void
  onCut?: () => void
  onPaste?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onLock?: () => void
  onUnlock?: () => void
  onHide?: () => void
  onShow?: () => void
  onBringToFront?: () => void
  onSendToBack?: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
  spaceId?: string
}

export function CanvasWidget({
  widget,
  isMobile,
  isSelected,
  isMultiSelected = false,
  isDraggingWidget,
  canvasRef,
  setPlacedWidgets,
  setSelectedWidgetId,
  setSelectedWidgetIds,
  setSelectedComponent,
  setIsDraggingWidget,
  setDragOffset,
  setIsResizing,
  dragStateRef,
  resizeStateRef,
  placedWidgets,
  clipboardWidget,
  clipboardWidgets,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDuplicate,
  onLock,
  onUnlock,
  onHide,
  onShow,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  spaceId,
}: CanvasWidgetProps) {
  const widgetDef = widgetsPalette.find(wd => wd.type === widget.type)
  const Icon = widgetDef?.icon || Square
  const isFilter = widget.type.includes('filter')
  const isLocked = widget.properties?.locked === true
  const isHidden = widget.properties?.hidden === true
  const [contextMenuOpen, setContextMenuOpen] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return
    }

    // Prevent drag if locked
    if (isLocked && e.button === 0) {
      return
    }

    if (e.button === 0 && canvasRef.current) {
      e.preventDefault()
      e.stopPropagation()
      
      setSelectedWidgetId(widget.id)
      setSelectedComponent(null)
      
      const rect = canvasRef.current.getBoundingClientRect()
      const widgetRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      
      const offset = {
        x: e.clientX - widgetRect.left,
        y: e.clientY - widgetRect.top
      }
      
      dragStateRef.current = {
        isDragging: true,
        widgetId: widget.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
        initialX: widget.x,
        initialY: widget.y,
      }
      
      setIsDraggingWidget(true)
      setDragOffset(offset)
      
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
      e.currentTarget.style.cursor = 'grabbing'
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id) {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      e.currentTarget.style.cursor = 'grab'
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!dragStateRef.current.isDragging) {
      e.currentTarget.style.cursor = 'grab'
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasDragging = dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id
    setTimeout(() => {
      if (!dragStateRef.current.isDragging && !wasDragging) {
        if (e.shiftKey && setSelectedWidgetIds) {
          // Shift+Click: Multi-select
          setSelectedWidgetIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(widget.id)) {
              newSet.delete(widget.id)
              // If removing primary selection, set new primary
              if (isSelected && newSet.size > 0) {
                setSelectedWidgetId(Array.from(newSet)[0])
              } else if (newSet.size === 0) {
                setSelectedWidgetId(null)
              }
            } else {
              newSet.add(widget.id)
              setSelectedWidgetId(widget.id)
            }
            return newSet
          })
        } else {
          // Regular click: Single select
          setSelectedWidgetId(widget.id)
          if (setSelectedWidgetIds) {
            setSelectedWidgetIds(new Set([widget.id]))
          }
        }
        setSelectedComponent(null)
      }
    }, 10)
  }

  return (
    <div
      className={`absolute select-none ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : isMultiSelected ? 'ring-2 ring-blue-300 ring-offset-2 z-10' : 'z-0'} ${isDraggingWidget && isSelected ? 'opacity-80 shadow-2xl' : 'opacity-100'} ${isDraggingWidget && isSelected ? 'scale-105' : 'scale-100'}`}
      data-widget-id={widget.id}
      draggable={false}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        left: `${widget.x}px`,
        top: `${widget.y}px`,
        width: `${widget.width || 200}px`,
        height: `${widget.height || 150}px`,
        cursor: dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id ? 'grabbing' : 'grab',
        transition: 'none',
        willChange: dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id ? 'transform, opacity' : 'auto',
        transform: dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id ? 'scale(1.02)' : 'scale(1)',
        zIndex: dragStateRef.current.isDragging && dragStateRef.current.widgetId === widget.id ? 50 : (isSelected ? 10 : 0),
        opacity: isHidden ? 0.3 : (isDraggingWidget && isSelected ? 0.8 : 1),
        pointerEvents: isHidden ? 'none' : 'auto',
      }}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedWidgetId(widget.id)
        if (setSelectedWidgetIds) {
          setSelectedWidgetIds(new Set([widget.id]))
        }
        setContextMenuOpen(true)
      }}
      onDragStart={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-1 right-1 z-50 bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-1">
          <Lock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
        </div>
      )}
      
      <WidgetContextMenu
        widget={widget}
        isLocked={isLocked}
        isHidden={isHidden}
        open={contextMenuOpen}
        onOpenChange={setContextMenuOpen}
        onCopy={() => {
          setSelectedWidgetId(widget.id)
          if (setSelectedWidgetIds) {
            setSelectedWidgetIds(new Set([widget.id]))
          }
          onCopy?.()
        }}
        onCut={() => {
          setSelectedWidgetId(widget.id)
          if (setSelectedWidgetIds) {
            setSelectedWidgetIds(new Set([widget.id]))
          }
          onCut?.()
        }}
        onPaste={clipboardWidget || (clipboardWidgets && clipboardWidgets.length > 0) ? onPaste : undefined}
        onDelete={() => {
          onDelete?.()
        }}
        onDuplicate={() => {
          onDuplicate?.()
        }}
        onLock={() => {
          onLock?.()
        }}
        onUnlock={() => {
          onUnlock?.()
        }}
        onHide={() => {
          onHide?.()
        }}
        onShow={() => {
          onShow?.()
        }}
        onBringToFront={onBringToFront}
        onSendToBack={onSendToBack}
        onBringForward={onBringForward}
        onSendBackward={onSendBackward}
      >
        <DropdownMenuTrigger asChild onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}>
          <div className="absolute inset-0 pointer-events-none" />
        </DropdownMenuTrigger>
      </WidgetContextMenu>

      {isFilter ? (
        <>
          {isSelected && !isLocked && (
            <ResizeHandles
              widget={widget}
              setIsResizing={setIsResizing}
              resizeStateRef={resizeStateRef}
            />
          )}
          <div className="w-full h-full flex items-center">
            <WidgetRenderer widget={widget} isMobile={isMobile} spaceId={spaceId} />
          </div>
        </>
      ) : (
        <div className={`w-full h-full ${isSelected ? 'border-2 border-blue-500 dark:border-blue-400' : ''} rounded-lg shadow-lg overflow-hidden flex flex-col relative`} style={{
          backgroundColor: widget.properties?.backgroundColor || undefined,
        }}>
          {isSelected && !isLocked && (
            <ResizeHandles
              widget={widget}
              setIsResizing={setIsResizing}
              resizeStateRef={resizeStateRef}
            />
          )}
          {!['spacer', 'divider', 'rectangle', 'circle', 'triangle', 'hexagon'].includes(widget.type) && 
           widget.properties?.showTitle !== false && (
            <div className={`${isMobile ? 'px-2 py-1' : 'px-3 py-2'} bg-muted border-b flex items-center gap-2`}>
              <Icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-foreground flex-1 truncate`}>
                {widgetDef?.label || widget.type}
              </span>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </div>
          )}
          <div className="flex-1 overflow-hidden" style={{
            borderRadius: widget.properties?.borderRadius ? `${widget.properties.borderRadius}px` : undefined,
          }}>
            <WidgetRenderer widget={widget} isMobile={isMobile} spaceId={spaceId} />
          </div>
        </div>
      )}
    </div>
  )
}

