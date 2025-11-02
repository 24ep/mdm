'use client'

import React, { useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Search, Box } from 'lucide-react'
import { WidgetsTab } from './widget-selection/WidgetsTab'

interface WidgetSelectionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WidgetSelectionDrawer({
  open,
  onOpenChange,
}: WidgetSelectionDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent widthClassName="w-[600px]">
        <DrawerHeader>
          <DrawerTitle>Select Widget</DrawerTitle>
          <DrawerDescription>
            Drag widgets to the canvas to add them
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Search Bar */}
          <div className="p-4 border-b flex-shrink-0">
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
          
          {/* Widgets List */}
          <div className="flex-1 overflow-hidden">
            <WidgetsTab 
              searchQuery={searchQuery} 
              onClose={() => onOpenChange(false)} 
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
