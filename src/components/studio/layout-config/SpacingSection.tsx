'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronUp, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react'
import { PlacedWidget } from './widgets'

interface SpacingSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function SpacingSection({ widget, selectedWidgetId, setPlacedWidgets }: SpacingSectionProps) {
  const padding = ((): { top: number; right: number; bottom: number; left: number } => {
    const p = widget.properties?.padding
    if (!p) return { top: 0, right: 0, bottom: 0, left: 0 }
    if (typeof p === 'number') return { top: p, right: p, bottom: p, left: p }
    return {
      top: Number((p as any).top || 0),
      right: Number((p as any).right || 0),
      bottom: Number((p as any).bottom || 0),
      left: Number((p as any).left || 0),
    }
  })()

  const updatePadding = (next: Partial<typeof padding>) => {
    const merged = { ...padding, ...next }
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId
        ? { ...w, properties: { ...w.properties, padding: merged } }
        : w
    ))
  }

  return (
    <div className="px-4 pb-3 space-y-2">
      <Label className="text-xs font-medium">Padding</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <ChevronUp className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="number"
            value={padding.top}
            onChange={(e) => updatePadding({ top: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs pl-7"
            placeholder="0"
          />
        </div>
        <div className="relative">
          <ChevronRight className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="number"
            value={padding.right}
            onChange={(e) => updatePadding({ right: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs pl-7"
            placeholder="0"
          />
        </div>
        <div className="relative">
          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="number"
            value={padding.bottom}
            onChange={(e) => updatePadding({ bottom: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs pl-7"
            placeholder="0"
          />
        </div>
        <div className="relative">
          <ChevronLeft className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="number"
            value={padding.left}
            onChange={(e) => updatePadding({ left: parseInt(e.target.value) || 0 })}
            className="h-7 text-xs pl-7"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  )
}


