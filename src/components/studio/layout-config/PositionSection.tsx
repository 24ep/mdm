'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react'
import { PlacedWidget } from './widgets'

interface PositionSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function PositionSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: PositionSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  return (
    <div className="space-y-2 pb-4 border-b ">
      <Label className="text-xs font-semibold px-4">Position</Label>
      
      {/* X/Y Coordinates */}
      <div className="grid grid-cols-2 gap-2 px-4">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">X</span>
          <Input
            type="number"
            value={widget.x}
            onChange={(e) => {
              const newX = parseInt(e.target.value) || 0
              setPlacedWidgets(prev => prev.map(w => 
                w.id === selectedWidgetId ? { ...w, x: newX } : w
              ))
            }}
            className="h-7 text-xs pl-6"
          />
        </div>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">Y</span>
          <Input
            type="number"
            value={widget.y}
            onChange={(e) => {
              const newY = parseInt(e.target.value) || 0
              setPlacedWidgets(prev => prev.map(w => 
                w.id === selectedWidgetId ? { ...w, y: newY } : w
              ))
            }}
            className="h-7 text-xs pl-6"
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1 px-4">
        <Label className="text-xs text-muted-foreground">Rotation</Label>
        <div className="flex gap-1">
          <div className="flex items-center justify-center w-7 h-7 border rounded cursor-pointer hover:bg-muted">
            <RotateCw className="h-3.5 w-3.5" />
          </div>
          <Input
            type="number"
            value={widget.properties?.rotation || 0}
            onChange={(e) => updateProperty('rotation', parseInt(e.target.value) || 0)}
            className="h-7 text-xs flex-1"
            placeholder="0°"
          />
        </div>
      </div>

      {/* Flip */}
      <div className="flex gap-1 px-4">
        <div 
          className="flex items-center justify-center w-7 h-7 border rounded cursor-pointer hover:bg-muted"
          onClick={() => updateProperty('flipX', !widget.properties?.flipX)}
        >
          <FlipHorizontal className="h-3.5 w-3.5" />
        </div>
        <div 
          className="flex items-center justify-center w-7 h-7 border rounded cursor-pointer hover:bg-muted"
          onClick={() => updateProperty('flipY', !widget.properties?.flipY)}
        >
          <FlipVertical className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  )
}

