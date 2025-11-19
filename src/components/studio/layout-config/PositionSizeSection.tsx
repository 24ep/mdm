'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { PlacedWidget } from './widgets'

interface PositionSizeSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function PositionSizeSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: PositionSizeSectionProps) {
  return (
    <AccordionItem value="position">
      <AccordionTrigger className="text-xs font-semibold py-2">Position & Size</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 px-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">X Position</Label>
            <Input
              type="number"
              value={widget.x}
              onChange={(e) => {
                const newX = parseInt(e.target.value) || 0
                setPlacedWidgets(prev => prev.map(w => 
                  w.id === selectedWidgetId ? { ...w, x: newX } : w
                ))
              }}
              className="h-7 text-xs w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Y Position</Label>
            <Input
              type="number"
              value={widget.y}
              onChange={(e) => {
                const newY = parseInt(e.target.value) || 0
                setPlacedWidgets(prev => prev.map(w => 
                  w.id === selectedWidgetId ? { ...w, y: newY } : w
                ))
              }}
              className="h-7 text-xs w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              value={widget.width || 200}
              onChange={(e) => {
                const newWidth = parseInt(e.target.value) || 200
                setPlacedWidgets(prev => prev.map(w => 
                  w.id === selectedWidgetId ? { ...w, width: newWidth } : w
                ))
              }}
              className="h-7 text-xs w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              value={widget.height || 150}
              onChange={(e) => {
                const newHeight = parseInt(e.target.value) || 150
                setPlacedWidgets(prev => prev.map(w => 
                  w.id === selectedWidgetId ? { ...w, height: newHeight } : w
                ))
              }}
              className="h-7 text-xs w-32"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

