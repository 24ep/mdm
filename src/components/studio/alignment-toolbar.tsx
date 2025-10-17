'use client'

import { Button } from '@/components/ui/button'
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignVerticalCenter, 
  AlignHorizontalCenter,
  AlignTop,
  AlignBottom,
  DistributeHorizontal,
  DistributeVertical,
  Group,
  Ungroup,
  Copy,
  Scissors,
  Clipboard,
  RotateCcw,
  RotateCw
} from 'lucide-react'

interface Component {
  id: string
  x: number
  y: number
  width: number
  height: number
}

interface AlignmentToolbarProps {
  selectedComponents: Component[]
  onAlign: (alignment: string) => void
  onDistribute: (distribution: string) => void
  onGroup: () => void
  onUngroup: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onDuplicate: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  canPaste: boolean
  hasSelection: boolean
  hasMultipleSelection: boolean
  hasGroup: boolean
}

export function AlignmentToolbar({
  selectedComponents,
  onAlign,
  onDistribute,
  onGroup,
  onUngroup,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  canPaste,
  hasSelection,
  hasMultipleSelection,
  hasGroup
}: AlignmentToolbarProps) {
  const selectedCount = selectedComponents.length

  return (
    <div className="flex items-center gap-1 p-2 bg-background border rounded-lg">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Copy/Paste */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCopy}
          disabled={!hasSelection}
          title="Copy (Ctrl+C)"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCut}
          disabled={!hasSelection}
          title="Cut (Ctrl+X)"
        >
          <Scissors className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onPaste}
          disabled={!canPaste}
          title="Paste (Ctrl+V)"
        >
          <Clipboard className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDuplicate}
          disabled={!hasSelection}
          title="Duplicate (Ctrl+D)"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r pr-2">
        <span className="text-xs text-muted-foreground mr-1">Align:</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAlign('left')}
          disabled={!hasMultipleSelection}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAlign('center')}
          disabled={!hasMultipleSelection}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAlign('right')}
          disabled={!hasMultipleSelection}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAlign('top')}
          disabled={!hasMultipleSelection}
          title="Align Top"
        >
          <AlignTop className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAlign('middle')}
          disabled={!hasMultipleSelection}
          title="Align Middle"
        >
          <AlignVerticalCenter className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAlign('bottom')}
          disabled={!hasMultipleSelection}
          title="Align Bottom"
        >
          <AlignBottom className="h-4 w-4" />
        </Button>
      </div>

      {/* Distribution */}
      <div className="flex items-center gap-1 border-r pr-2">
        <span className="text-xs text-muted-foreground mr-1">Distribute:</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDistribute('horizontal')}
          disabled={selectedCount < 3}
          title="Distribute Horizontally"
        >
          <DistributeHorizontal className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDistribute('vertical')}
          disabled={selectedCount < 3}
          title="Distribute Vertically"
        >
          <DistributeVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Grouping */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onGroup}
          disabled={!hasMultipleSelection}
          title="Group Components"
        >
          <Group className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onUngroup}
          disabled={!hasGroup}
          title="Ungroup Components"
        >
          <Ungroup className="h-4 w-4" />
        </Button>
      </div>

      {/* Selection Info */}
      {selectedCount > 0 && (
        <div className="ml-2 text-xs text-muted-foreground">
          {selectedCount} selected
        </div>
      )}
    </div>
  )
}
