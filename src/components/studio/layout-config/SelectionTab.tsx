'use client'

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { ComponentConfig } from './types'
import { PlacedWidget, widgetsPalette } from './widgets'
import { WidgetProperties } from './WidgetProperties'
import { ComponentProperties } from './ComponentProperties'

interface SelectionTabProps {
  selectedWidgetId: string | null
  selectedComponent: string | null
  placedWidgets: PlacedWidget[]
  componentConfigs: Record<string, ComponentConfig>
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
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
  setSelectedComponent,
  handleComponentConfigUpdate,
  spaceId,
}: SelectionTabProps) {
  // Group widgets by type
  const widgetsByType = useMemo(() => {
    const grouped: Record<string, PlacedWidget[]> = {}
    placedWidgets.forEach(widget => {
      const widgetDef = widgetsPalette.find(w => w.type === widget.type)
      const category = widgetDef?.category || 'Other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(widget)
    })
    return grouped
  }, [placedWidgets])

  const handleWidgetClick = (widgetId: string) => {
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null)
    } else {
      setSelectedWidgetId(widgetId)
      setSelectedComponent(null)
    }
  }

  const handleComponentClick = (componentType: string) => {
    if (selectedComponent === componentType) {
      setSelectedComponent(null)
    } else {
      setSelectedComponent(componentType)
      setSelectedWidgetId(null)
    }
  }

  const handleClearSelection = () => {
    setSelectedWidgetId(null)
    setSelectedComponent(null)
  }

  const hasSelection = selectedWidgetId || selectedComponent
  const hasItems = placedWidgets.length > 0 || Object.keys(componentConfigs).length > 0

  if (!hasItems) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No widgets or components available
      </div>
    )
  }

  // Show properties if something is selected
  if (selectedWidgetId) {
    const widget = placedWidgets.find(w => w.id === selectedWidgetId)
    if (widget) {
      return (
        <WidgetProperties
          widget={widget}
          selectedWidgetId={selectedWidgetId}
          setPlacedWidgets={setPlacedWidgets}
          setSelectedWidgetId={setSelectedWidgetId}
          spaceId={spaceId}
        />
      )
    }
  }

  if (selectedComponent) {
    const config = componentConfigs[selectedComponent]
    if (config) {
      return (
        <ComponentProperties
          config={config}
          selectedComponent={selectedComponent}
          handleComponentConfigUpdate={handleComponentConfigUpdate}
        />
      )
    }
  }

  // No selection - show only filter tags
  return (
    <div className="p-4 space-y-4">
      {/* Components */}
      {Object.keys(componentConfigs).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Components</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(componentConfigs).map(([type, config]) => (
              <Badge
                key={type}
                variant={selectedComponent === type ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80 capitalize m-0.5"
                onClick={() => handleComponentClick(type)}
              >
                {config.type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Widgets grouped by category */}
      {Object.keys(widgetsByType).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Widgets</h3>
          {Object.entries(widgetsByType).map(([category, widgets]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {widgets.map(widget => {
                  const widgetDef = widgetsPalette.find(w => w.type === widget.type)
                  const isSelected = selectedWidgetId === widget.id
                  return (
                    <Badge
                      key={widget.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/80 m-0.5"
                      onClick={() => handleWidgetClick(widget.id)}
                    >
                      {widgetDef?.label || widget.type}
                    </Badge>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
