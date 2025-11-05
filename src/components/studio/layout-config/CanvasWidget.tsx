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
      className={`absolute select-none ${isSelected ? 'z-10' : isMultiSelected ? 'z-10' : 'z-0'} ${isDraggingWidget && isSelected ? 'opacity-80 shadow-2xl' : 'opacity-100'} ${isDraggingWidget && isSelected ? 'scale-105' : 'scale-100'}`}
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
        <div className={`w-full h-full ${isSelected ? 'border border-blue-500/70 dark:border-blue-400/70' : ''} rounded-lg shadow-lg overflow-hidden flex flex-col relative`} style={{
          backgroundColor: widget.properties?.backgroundColor || undefined,
        }}>
          {isSelected && !isLocked && (
            <ResizeHandles
              widget={widget}
              setIsResizing={setIsResizing}
              resizeStateRef={resizeStateRef}
            />
          )}
          {/* Removed legacy canvas header bar to avoid duplicate headers; element header is now configurable via properties and rendered by the widget itself */}
          <div className="flex-1 overflow-hidden" style={{
            borderRadius: widget.properties?.borderRadius ? `${widget.properties.borderRadius}px` : undefined,
          }}>
            {widget.type === 'text' ? (
              <div className="w-full h-full flex items-center p-2" onMouseDown={(e) => e.stopPropagation()}>
                {/* Optional text icon */}
                {widget.properties?.textIconEnabled && (() => {
                  const size = Number(widget.properties?.textFontSize ?? widget.properties?.fontSize ?? 14)
                  const color = String(widget.properties?.textIconColor || '#111827')
                  const iconName = String(widget.properties?.textIcon || 'star')
                  const map: Record<string, React.ReactNode> = {
                    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}><path d="M12 .587l3.668 7.431L24 9.748l-6 5.847L19.335 24 12 19.897 4.665 24 6 15.595 0 9.748l8.332-1.73z"/></svg>,
                    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}><path d="M12 3l10 9h-3v9h-6v-6H11v6H5v-9H2z"/></svg>,
                    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}><path d="M19.14,12.94a7.14,7.14,0,1,1-7.14-7.14A7.14,7.14,0,0,1,19.14,12.94Z"/></svg>,
                    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5v3h18v-3C21 16.5 17 14 12 14z"/></svg>,
                    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}><path d="M12 24a2.4 2.4 0 0 0 2.4-2.4H9.6A2.4 2.4 0 0 0 12 24zm6-6v-5.4a6 6 0 1 0-12 0V18L4 19.2V20.4H20V19.2z"/></svg>,
                  }
                  return <div className="mr-2 flex items-center" aria-hidden>{map[iconName] || map.star}</div>
                })()}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full outline-none"
                  style={{
                    fontFamily: String(widget.properties?.textFontFamily || widget.properties?.fontFamily || 'inherit'),
                    fontSize: widget.properties?.textFontSize
                      ? `${widget.properties.textFontSize}px`
                      : (widget.properties?.fontSize ? `${widget.properties.fontSize}px` : undefined),
                    fontWeight: String(widget.properties?.textFontWeight || widget.properties?.fontWeight || 'normal') as any,
                    fontStyle: String(widget.properties?.textFontStyle || widget.properties?.fontStyle || 'normal') as any,
                    color: String(widget.properties?.textColor || '#000000'),
                    textAlign: String(widget.properties?.textAlign || 'left') as any,
                    width: '100%'
                  }}
                  onInput={(e) => {
                    const value = (e.currentTarget.textContent || '').replace(/\u00A0/g, ' ').trim()
                    setPlacedWidgets(prev => prev.map(w => 
                      w.id === widget.id
                        ? { ...w, properties: { ...w.properties, text: value } }
                        : w
                    ))
                  }}
                  onKeyDown={(e) => {
                    // Prevent canvas shortcuts while editing
                    e.stopPropagation()
                  }}
                >
                  {String(widget.properties?.text || 'Text')}
                </div>
              </div>
            ) : (
              <WidgetRenderer widget={widget} isMobile={isMobile} spaceId={spaceId} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

