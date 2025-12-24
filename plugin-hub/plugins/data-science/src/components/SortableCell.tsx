'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotebookCell, CellType } from './types'
import { CellRenderer } from './CellRenderer'

interface SortableCellProps {
  cell: NotebookCell
  index: number
  isActive: boolean
  isSelected: boolean
  onExecute: (cellId: string) => void
  onDelete: (cellId: string) => void
  onMove: (cellId: string, direction: 'up' | 'down') => void
  onContentChange: (cellId: string, content: string) => void
  onTypeChange: (cellId: string, type: CellType) => void
  onFocus: (cellId: string) => void
  onSelect: (cellId: string, selected: boolean) => void
  onVariableNameChange?: (cellId: string, variableName: string) => void
  onConnectionChange?: (cellId: string, connection: string) => void
  onCopy?: (cellId: string) => void
  onPaste?: (cellId: string) => void
  onCut?: (cellId: string) => void
  onMerge?: (cellId: string, direction: 'above' | 'below') => void
  onSplit?: (cellId: string) => void
  onAddComment?: (cellId: string) => void
  onAddTag?: (cellId: string) => void
  onSearch?: (cellId: string) => void
  onTitleChange?: (cellId: string, title: string) => void
  canEdit?: boolean
  canExecute?: boolean
}

export function SortableCell(props: SortableCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.cell.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative transition-all duration-200",
        isDragging && "opacity-50 z-50 shadow-lg scale-105"
      )}
    >
      {/* Drag Handle - Always visible for drag and drop */}
      {props.canEdit !== false && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "absolute left-0 top-0 w-8 h-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10",
            "opacity-40 group-hover:opacity-100 transition-opacity",
            "hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-[5px]"
          )}
          title="Drag to reorder cell"
        >
          <GripVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
      )}

      {/* Cell Content - with left margin for drag handle */}
      <div className={props.canEdit !== false ? "ml-8" : "ml-0"}>
        <CellRenderer {...props} canEdit={props.canEdit} canExecute={props.canExecute} />
      </div>
    </div>
  )
}
