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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, PanelLeft, Shapes, SlidersHorizontal, Image } from 'lucide-react'
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
  const [category, setCategory] = useState<'all' | 'dashboard' | 'ui' | 'filters' | 'shapes' | 'media' | 'charts' | 'tables' | 'utilities'>('all')
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        widthClassName="w-[600px]"
        style={{ 
          backgroundColor: 'hsl(var(--background))',
          zIndex: Z_INDEX.drawer + 100 
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
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="flex flex-col bg-background" style={{ height: 'calc(100vh - 120px)', backgroundColor: 'hsl(var(--background))' }}>
          {/* Search Bar */}
          <div className="p-4 border-b flex-shrink-0 bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
        {/* Widgets List with category tabs */}
          <div className="flex-1 overflow-hidden flex flex-col bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
            <div className="px-4 pt-3 bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
              <div className="w-full">
                <Tabs value={category} onValueChange={(v: any) => setCategory(v)}>
                  <TabsList className="grid grid-cols-8 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="dashboard"><LayoutGrid className="h-3.5 w-3.5 mr-1" />Dashboard</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="tables">Tables</TabsTrigger>
                  <TabsTrigger value="ui"><PanelLeft className="h-3.5 w-3.5 mr-1" />UI</TabsTrigger>
                  <TabsTrigger value="filters"><SlidersHorizontal className="h-3.5 w-3.5 mr-1" />Filters</TabsTrigger>
                  <TabsTrigger value="media"><Image className="h-3.5 w-3.5 mr-1" />Media</TabsTrigger>
                  <TabsTrigger value="shapes"><Shapes className="h-3.5 w-3.5 mr-1" />Shapes</TabsTrigger>
                </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <WidgetsTab 
                searchQuery={searchQuery} 
                onClose={() => onOpenChange(false)} 
                categoryFilter={category}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
