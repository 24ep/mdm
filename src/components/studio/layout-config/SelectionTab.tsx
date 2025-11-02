'use client'

import React from 'react'
import { FileIcon } from 'lucide-react'
import { ComponentConfig, GlobalStyleConfig } from './types'
import { PlacedWidget } from './widgets'
import { WidgetProperties } from './WidgetProperties'
import { ComponentProperties } from './ComponentProperties'

interface SelectionTabProps {
  selectedWidgetId: string | null
  selectedComponent: string | null
  placedWidgets: PlacedWidget[]
  componentConfigs: Record<string, ComponentConfig>
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
  spaceId?: string
}

export function SelectionTab({
  selectedWidgetId,
  selectedComponent,
  placedWidgets,
  componentConfigs,
  setPlacedWidgets,
  setSelectedWidgetId,
  handleComponentConfigUpdate,
  spaceId,
}: SelectionTabProps) {
  React.useEffect(() => {
    // Add data attribute for properties panel detection
    const element = document.querySelector('[data-selection-tab]')
    if (!element) {
      // Add it to the component wrapper
      const wrapper = document.querySelector('.selection-tab-wrapper')
      if (wrapper) {
        wrapper.setAttribute('data-properties-panel', 'true')
        wrapper.setAttribute('data-selection-tab', 'true')
      }
    }
  }, [])
  // Return null if nothing is selected
  if (!selectedWidgetId && !selectedComponent) {
    return null
  }

  const globalStyle = componentConfigs.global as any as GlobalStyleConfig | undefined

  if (selectedWidgetId) {
    const widget = placedWidgets.find(w => w.id === selectedWidgetId)
    
    if (!widget) {
      return null
    }

    return (
      <WidgetProperties
        widget={widget}
        selectedWidgetId={selectedWidgetId}
        setPlacedWidgets={setPlacedWidgets}
        setSelectedWidgetId={setSelectedWidgetId}
        globalStyle={globalStyle}
        spaceId={spaceId}
      />
    )
  }

  if (selectedComponent) {
    const config = componentConfigs[selectedComponent]
    if (!config) {
      return null
    }

    return (
      <ComponentProperties
        config={config}
        selectedComponent={selectedComponent}
        handleComponentConfigUpdate={handleComponentConfigUpdate}
      />
    )
  }

  return null
}
