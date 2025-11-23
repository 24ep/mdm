'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Box, Plus, X } from 'lucide-react'
import { widgetsPalette } from '../widgets'

interface WidgetItemProps {
  widget: typeof widgetsPalette[number]
  showGroupActions?: boolean
  groupId?: string
  isInGroup?: boolean
  onDragStart: (e: React.DragEvent, widgetType: string) => void
  onDragEnd: (e: React.DragEvent) => void
  onAddToGroup?: (widgetType: string, groupId: string) => void
  onRemoveFromGroup?: (widgetType: string, groupId: string) => void
}

export function WidgetItem({
  widget,
  showGroupActions = false,
  groupId,
  isInGroup = false,
  onDragStart,
  onDragEnd,
  onAddToGroup,
  onRemoveFromGroup,
}: WidgetItemProps) {
  const Icon = widget.icon || Box
  
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 px-2 py-3 bg-background border rounded-md cursor-move hover:bg-primary/10 hover:border-primary/30 transition-colors relative"
      draggable={true}
      onDragStart={(e) => onDragStart(e, widget.type)}
      onDragEnd={onDragEnd}
      title={widget.label}
      style={{ touchAction: 'none' }}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-[10px] text-foreground text-center truncate w-full">
        {widget.label}
      </span>
      {showGroupActions && groupId && (
        <div className="absolute top-1 right-1">
          {isInGroup ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveFromGroup?.(widget.type, groupId)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onAddToGroup?.(widget.type, groupId)
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

