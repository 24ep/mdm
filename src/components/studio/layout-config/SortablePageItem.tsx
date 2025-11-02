'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { UnifiedPage } from './types'

interface SortablePageItemProps {
  page: UnifiedPage
  index: number
  children: React.ReactNode
}

export function SortablePageItem({ page, index, children }: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: page.id,
    disabled: false,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 px-1 hover:bg-muted rounded"
        onMouseDown={(e) => {
          // Only allow drag from the handle
          e.stopPropagation()
        }}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      
      {/* Content with left padding for drag handle */}
      <div className="pl-6">
        {children}
      </div>
    </div>
  )
}

