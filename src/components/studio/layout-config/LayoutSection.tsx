'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'lucide-react'
import { PlacedWidget } from './widgets'

interface LayoutSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function LayoutSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: LayoutSectionProps) {
  const [aspectRatioLocked, setAspectRatioLocked] = React.useState(false)

  return (
    <div className="space-y-2 py-4 border-b ">
      <Label className="text-xs font-semibold px-4">Layout</Label>
      
      {/* Width/Height */}
      <div className="grid grid-cols-2 gap-2 px-4">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">W</span>
          <Input
            type="number"
            value={widget.width || 200}
            onChange={(e) => {
              const newWidth = parseInt(e.target.value) || 200
              setPlacedWidgets(prev => prev.map(w => 
                w.id === selectedWidgetId ? { ...w, width: newWidth } : w
              ))
            }}
            className="h-7 text-xs pl-6"
          />
        </div>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">H</span>
          <div className="flex gap-1">
            <Input
              type="number"
              value={widget.height || 150}
              onChange={(e) => {
                const newHeight = parseInt(e.target.value) || 150
                setPlacedWidgets(prev => prev.map(w => 
                  w.id === selectedWidgetId ? { ...w, height: newHeight } : w
                ))
              }}
              className="h-7 text-xs flex-1 pl-6"
            />
            <div 
              className={`flex items-center justify-center w-7 h-7 border rounded cursor-pointer hover:bg-muted ${aspectRatioLocked ? 'bg-muted' : ''}`}
              onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
            >
              <Link className={`h-3.5 w-3.5 ${aspectRatioLocked ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

