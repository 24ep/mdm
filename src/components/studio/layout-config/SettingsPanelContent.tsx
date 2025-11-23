'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileIcon, FileText } from 'lucide-react'
import { ComponentConfig } from './types'
import { UnifiedPage } from './types'
import { PlacedWidget } from './widgets'
import { SelectionTab } from './SelectionTab'
import { useIconLoader } from './useIconLoader'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

interface SettingsPanelContentProps {
  spaceId: string
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  selectedPageId: string | null
  selectedWidgetId: string | null
  selectedComponent: string | null
  placedWidgets: PlacedWidget[]
  componentConfigs: Record<string, ComponentConfig>
  expandedComponent: string | null
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedPageId: React.Dispatch<React.SetStateAction<string | null>>
  setExpandedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedPageForPermissions: React.Dispatch<React.SetStateAction<SpacesEditorPage | null>>
  setPermissionsRoles: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
  // Sidebar visibility functions removed - pages now use secondary platform sidebar
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
}

export function SettingsPanelContent({
  spaceId,
  isMobileViewport,
  allPages,
  pages,
  selectedPageId,
  selectedWidgetId,
  selectedComponent,
  placedWidgets,
  componentConfigs,
  expandedComponent,
  setPlacedWidgets,
  setSelectedWidgetId,
  setPages,
  setSelectedComponent,
  setSelectedPageId,
  setExpandedComponent,
  setSelectedPageForPermissions,
  setPermissionsRoles,
  setPermissionsUserIds,
  setPermissionsDialogOpen,
  handlePageReorder,
  handleComponentConfigUpdate,
  setAllPages,
}: SettingsPanelContentProps) {
  const [activeTab, setActiveTab] = useState('selection')
  const { allIcons, reactIcons } = useIconLoader()
  const prevSelectionRef = useRef<string | null>(null)
  const userManualTabChangeRef = useRef(false)

  const hasSelection = selectedWidgetId || selectedComponent
  const currentSelection = selectedWidgetId || selectedComponent

  // Check if the selection is valid (widget exists or component config exists)
  const isValidSelection = React.useMemo(() => {
    if (selectedWidgetId) {
      return placedWidgets.some(w => w.id === selectedWidgetId)
    }
    if (selectedComponent) {
      return componentConfigs[selectedComponent] !== undefined
    }
    return false
  }, [selectedWidgetId, selectedComponent, placedWidgets, componentConfigs])

  // Only show selection tab if we have a valid selection
  const shouldShowSelectionTab = hasSelection && isValidSelection

  // Auto-switch to selection tab only when a NEW selection is made (not when user manually switches tabs)
  useEffect(() => {
    const prevSelection = prevSelectionRef.current
    
    // Only auto-switch if:
    // 1. A new selection was made (from null to something, or different selection)
    // 2. User hasn't manually changed tabs recently
    if (currentSelection && currentSelection !== prevSelection && !userManualTabChangeRef.current) {
      // Only switch to selection tab if the selection is valid
      if (shouldShowSelectionTab) {
        setActiveTab('selection')
      }
    } else if (!currentSelection || !isValidSelection) {
      // Keep on selection tab even if nothing is selected (Pages tab removed)
      // User can still see the empty state
    }
    
    // Reset manual tab change flag after a delay
    if (userManualTabChangeRef.current) {
      const timeout = setTimeout(() => {
        userManualTabChangeRef.current = false
      }, 100)
      return () => clearTimeout(timeout)
    }
    
    prevSelectionRef.current = currentSelection
  }, [selectedWidgetId, selectedComponent, activeTab, currentSelection, shouldShowSelectionTab, isValidSelection])

  const handleTabChange = (value: string) => {
    // Prevent switching to selection tab if nothing is selected or selection is invalid
    if (value === 'selection' && !shouldShowSelectionTab) {
      return
    }
    userManualTabChangeRef.current = true
    setActiveTab(value)
  }

  // Ensure activeTab is valid
  const validActiveTab = activeTab

  return (
    <div className="w-full" style={{ pointerEvents: 'auto' }}>
      <div className="w-full">
      <Tabs value={validActiveTab} onValueChange={handleTabChange}>
        <TabsList className={`${isMobileViewport ? 'w-full' : 'w-full'} mb-3 justify-start`}>
          <TabsTrigger 
            value="selection" 
            className="flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <FileIcon className="h-3.5 w-3.5" />
            Elements
          </TabsTrigger>
        </TabsList>

        {/* Selection Tab - Shows properties of selected widget or component */}
        <TabsContent value="selection" className="mt-0 flex-1 overflow-visible" data-properties-panel="true">
          <div className="h-full overflow-y-auto overflow-x-visible selection-tab-wrapper" data-selection-tab="true">
            <SelectionTab
              selectedWidgetId={selectedWidgetId}
              selectedComponent={selectedComponent}
              placedWidgets={placedWidgets}
              componentConfigs={componentConfigs}
              setPlacedWidgets={setPlacedWidgets}
              setSelectedWidgetId={setSelectedWidgetId}
              setSelectedComponent={setSelectedComponent}
              handleComponentConfigUpdate={handleComponentConfigUpdate}
              spaceId={spaceId}
            />
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
