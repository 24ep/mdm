'use client'

import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { widgetsPalette } from './widgets'

interface WidgetsToolbarProps {
  isMobileViewport: boolean
  selectedPageId: string | null
}

export function WidgetsToolbar({
  isMobileViewport,
  selectedPageId,
}: WidgetsToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredWidgets = useMemo(() => {
    if (!searchQuery.trim()) {
      return widgetsPalette
    }
    
    const query = searchQuery.toLowerCase().trim()
    return widgetsPalette.filter(w => 
      w.label.toLowerCase().includes(query) || 
      w.type.toLowerCase().includes(query) ||
      w.category.toLowerCase().includes(query)
    )
  }, [searchQuery])
  
  if (!selectedPageId) return null

  return (
    <div className="border-b bg-background">
      <div className={`${isMobileViewport ? 'px-3 py-2' : 'px-4 py-2'} flex ${isMobileViewport ? 'flex-col' : 'items-center'} gap-3`}>
        {/* Search/Filter Input */}
        <div className={`${isMobileViewport ? 'w-full' : 'w-48'} relative flex-shrink-0`}>
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${isMobileViewport ? 'h-9 pl-8 pr-8' : 'h-8 pl-8 pr-8'} text-xs`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        
        {/* Horizontal scrollable toolbar with filtered widgets */}
        <div className="flex-1 overflow-x-auto w-full">
          {filteredWidgets.length === 0 ? (
            <div className="flex items-center justify-center px-4 py-2 text-xs text-muted-foreground">
              No widgets found matching "{searchQuery}"
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2">
              {filteredWidgets.map(w => {
                const Icon = w.icon
                return (
                  <div
                    key={w.type}
                    className={`flex flex-col items-center gap-1 ${isMobileViewport ? 'px-2 py-1.5 min-w-[60px]' : 'px-2 py-1 min-w-[50px]'} bg-background border rounded-md cursor-move hover:bg-primary/10 hover:border-primary/30 transition-colors flex-shrink-0`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', w.type)
                      e.dataTransfer.setData('widgetType', w.type)
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    title={w.label}
                  >
                    <Icon className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
                    <span className={`${isMobileViewport ? 'text-[10px]' : 'text-[9px]'} text-foreground text-center truncate w-full`}>
                      {w.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

