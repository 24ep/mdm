'use client'

import React, { useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Box, X } from 'lucide-react'
import { WidgetsTab } from './widget-selection/WidgetsTab'
import { LayoutGrid, PanelLeft, Shapes, SlidersHorizontal, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Z_INDEX } from '@/lib/z-index'

interface WidgetSelectionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WidgetSelectionDrawer({
  open,
  onOpenChange,
}: WidgetSelectionDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['all']))
  
  const categories = [
    { id: 'all', label: 'All', icon: null },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'charts', label: 'Charts', icon: null },
    { id: 'tables', label: 'Tables', icon: null },
    { id: 'ui', label: 'UI', icon: PanelLeft },
    { id: 'filters', label: 'Filters', icon: SlidersHorizontal },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'shapes', label: 'Shapes', icon: Shapes },
  ]
  
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (categoryId === 'all') {
        // If "All" is clicked, toggle it and clear others
        if (newSet.has('all')) {
          newSet.clear()
          newSet.add('all')
        } else {
          newSet.clear()
          newSet.add('all')
        }
      } else {
        // Remove "all" if selecting specific category
        newSet.delete('all')
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId)
          // If no categories selected, select "all"
          if (newSet.size === 0) {
            newSet.add('all')
          }
        } else {
          newSet.add(categoryId)
        }
      }
      return newSet
    })
  }
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        widthClassName="w-[380px]"
        showOverlay={false}
        style={{ 
          backgroundColor: 'hsl(var(--background))',
          zIndex: Z_INDEX.drawer + 1
        }}
      >
        <DrawerHeader className="relative flex-shrink-0 border-b bg-background flex items-center justify-between" style={{ backgroundColor: 'hsl(var(--background))' }}>
          <div>
            <DrawerTitle>Select Widget</DrawerTitle>
            <DrawerDescription>
              Drag widgets to the canvas to add them
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-transparent hover:bg-transparent">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="flex flex-col bg-background" style={{ height: 'calc(100vh - 120px)', backgroundColor: 'hsl(var(--background))' }}>
          {/* Search Bar */}
          <div className="p-4 border-b flex-shrink-0 bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>
          
        {/* Widgets List with category badges */}
          <div className="flex-1 overflow-hidden flex flex-col bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
            <div className="px-4 pt-3 pb-2 bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  const isSelected = selectedCategories.has(category.id)
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 px-3 h-7 text-xs font-medium transition-colors",
                        "border !rounded-full whitespace-nowrap",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-primary border-border hover:bg-accent hover:text-accent-foreground"
                      )}
                      style={{ borderRadius: '9999px' }}
                    >
                      {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
                      <span>{category.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <WidgetsTab 
                searchQuery={searchQuery} 
                onClose={() => onOpenChange(false)} 
                selectedCategories={Array.from(selectedCategories)}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
