'use client'

import React, { useState, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronRight, Box } from 'lucide-react'
import { widgetsPalette } from '../widgets'
import { WidgetItem } from './WidgetItem'
import { useDragHandler } from './useDragHandler'

interface WidgetsTabProps {
  searchQuery: string
  onClose: () => void
}

export function WidgetsTab({ searchQuery, onClose }: WidgetsTabProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const { handleDragStart, handleDragEnd } = useDragHandler(onClose)
  
  const categories = Array.from(new Set(widgetsPalette.map(w => w.category)))
  
  // Get category icon (first widget icon from that category)
  const getCategoryIcon = (category: string) => {
    const firstWidget = widgetsPalette.find(w => w.category === category)
    return firstWidget?.icon || Box
  }
  
  const getCategoryWidgets = (category: string) => {
    return widgetsPalette.filter(w => w.category === category)
  }
  
  // Filter widgets based on search
  const filteredWidgetsByCategory = useMemo(() => {
    const result: Record<string, Array<typeof widgetsPalette[number]>> = {}
    
    categories.forEach(category => {
      let widgets = getCategoryWidgets(category)
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        widgets = widgets.filter(w => 
          w.label.toLowerCase().includes(query) || 
          w.type.toLowerCase().includes(query) ||
          w.category.toLowerCase().includes(query)
        )
      }
      
      if (widgets.length > 0) {
        result[category] = widgets
      }
    })
    
    return result
  }, [searchQuery, categories])
  
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {Object.entries(filteredWidgetsByCategory).map(([category, widgets]) => {
          const CategoryIcon = getCategoryIcon(category)
          const isCollapsed = collapsedCategories.has(category)
          
          return (
            <div key={category} className="border rounded-lg">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{category}</span>
                  <span className="text-xs text-muted-foreground">
                    ({widgets.length})
                  </span>
                </div>
              </button>
              
              {/* Widgets Grid */}
              {!isCollapsed && (
                <div className="p-3">
                  <div className="grid grid-cols-3 gap-2">
                    {widgets.map(w => (
                      <WidgetItem
                        key={w.type}
                        widget={w}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {Object.keys(filteredWidgetsByCategory).length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No widgets found matching "{searchQuery}"
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

