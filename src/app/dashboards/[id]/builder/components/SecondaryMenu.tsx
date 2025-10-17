'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Layout, 
  History, 
  Palette, 
  Eye, 
  Settings, 
  Play,
  ChevronRight,
  X
} from 'lucide-react'

interface SecondaryMenuProps {
  isOpen: boolean
  activeTab: string
  onClose: () => void
  onTabChange: (tab: string) => void
  onPreview: () => void
  hasUnsavedChanges?: boolean
  activeFiltersCount?: number
}

const MENU_ITEMS = [
  {
    id: 'charts',
    label: 'Charts',
    icon: BarChart3,
    description: 'Manage chart elements and data'
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: Layout,
    description: 'Dashboard templates and layouts'
  },
  {
    id: 'versions',
    label: 'Versions',
    icon: History,
    description: 'Version control and history'
  },
  {
    id: 'styling',
    label: 'Styling',
    icon: Palette,
    description: 'Themes and visual customization'
  },
  {
    id: 'data',
    label: 'Data Preview',
    icon: Eye,
    description: 'Preview and validate data sources'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Dashboard configuration'
  }
]

export function SecondaryMenu({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
  onPreview,
  hasUnsavedChanges = false,
  activeFiltersCount = 0
}: SecondaryMenuProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex">
      <div className="bg-white w-80 h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dashboard Tools</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="mt-2 text-orange-600 border-orange-200">
              Unsaved Changes
            </Badge>
          )}
          {activeFiltersCount > 0 && (
            <Badge variant="outline" className="mt-2 text-blue-600 border-blue-200">
              {activeFiltersCount} Active Filter{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-auto p-3 mb-1 ${
                    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            onClick={onPreview}
            className="w-full"
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Preview Dashboard
          </Button>
          <div className="text-xs text-muted-foreground text-center">
            Use these tools to enhance your dashboard
          </div>
        </div>
      </div>

      {/* Overlay to close menu */}
      <div className="flex-1" onClick={onClose} />
    </div>
  )
}
