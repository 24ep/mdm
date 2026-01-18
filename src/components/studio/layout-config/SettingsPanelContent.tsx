'use client'

import React from 'react'
import { ComponentConfig } from './types'
import { UnifiedPage } from './types'
import { PlacedWidget } from './widgets'
import { SelectionTab } from './SelectionTab'
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
  setPermissionsGroupIds: React.Dispatch<React.SetStateAction<string[]>>
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
  setPermissionsGroupIds,
  setPermissionsDialogOpen,
  handlePageReorder,
  handleComponentConfigUpdate,
  setAllPages,
}: SettingsPanelContentProps) {

  return (
    <div className="w-full" style={{ pointerEvents: 'auto' }}>
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
    </div>
  )
}
