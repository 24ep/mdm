'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash, Sliders, Database } from 'lucide-react'
import { widgetsPalette, PlacedWidget } from './widgets'
import { GlobalStyleConfig, ComponentStyle } from './types'
import { getWidgetComponentType } from './globalStyleUtils'
import { PositionSection } from './PositionSection'
import { LayoutSection } from './LayoutSection'
import { AppearanceSection } from './AppearanceSection'
import { FillSection } from './FillSection'
import { StrokeSection } from './StrokeSection'
import { EffectsSection } from './EffectsSection'
import { DataSourceSection } from './DataSourceSection'
import { WidgetSpecificSection } from './WidgetSpecificSection'
import { OtherPropertiesSection } from './OtherPropertiesSection'

interface WidgetPropertiesProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  globalStyle?: GlobalStyleConfig
  spaceId?: string
}

export function WidgetProperties({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  setSelectedWidgetId,
  globalStyle,
  spaceId,
}: WidgetPropertiesProps) {
  const widgetDef = widgetsPalette.find(wd => wd.type === widget.type)
  
  if (!widgetDef) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Widget not found
      </div>
    )
  }

  // Get the component style type for this widget
  const componentType = getWidgetComponentType(widget.type)
  const componentStyle = componentType ? globalStyle?.components?.[componentType] : undefined

  // Determine if widget needs data source (charts, tables, etc.)
  const needsDataSource = widget.type.includes('chart') || 
                          widget.type.includes('table') || 
                          widget.type === 'scorecard' ||
                          widget.type === 'time-series' ||
                          widget.type === 'pivot-table'

  return (
    <div className="space-y-3">
      <div className="px-4 border-b pb-2">
        <div className="flex items-center gap-2 mb-1">
          {widgetDef.icon && <widgetDef.icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="font-semibold text-sm">{widgetDef.label}</h3>
        </div>
        <p className="text-xs text-muted-foreground">Widget Properties</p>
      </div>

      <Tabs defaultValue="properties" className="w-full">
        <TabsList className={`grid ${needsDataSource ? 'grid-cols-2' : 'grid-cols-1'} h-8 border-0 bg-transparent gap-1 px-4`}>
          <TabsTrigger value="properties" className="text-xs px-3 data-[state=active]:bg-gray-200 data-[state=active]:border-0 data-[state=active]:border-b-0">
            <Sliders className="h-3.5 w-3.5 mr-1.5" />
            Properties
          </TabsTrigger>
          {needsDataSource && (
            <TabsTrigger value="datasource" className="text-xs px-3 data-[state=active]:bg-gray-200 data-[state=active]:border-0 data-[state=active]:border-b-0">
              <Database className="h-3.5 w-3.5 mr-1.5" />
              Data Source
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="properties" className="mt-0">
          <Accordion type="multiple" defaultValue={['position', 'style']} className="w-full">
            <AccordionItem value="position" className="border-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4">Properties</AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <PositionSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                  />
                  
                  <LayoutSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                  />
                  
                  <AppearanceSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    globalStyle={componentStyle}
                  />
                  
                  <FillSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    globalStyle={componentStyle}
                  />
                  
                  <StrokeSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    globalStyle={componentStyle}
                  />
                  
                  <EffectsSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    globalStyle={componentStyle}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <WidgetSpecificSection
              widget={widget}
              selectedWidgetId={selectedWidgetId}
              setPlacedWidgets={setPlacedWidgets}
            />
            
            <OtherPropertiesSection
              widget={widget}
              selectedWidgetId={selectedWidgetId}
              setPlacedWidgets={setPlacedWidgets}
            />
          </Accordion>
        </TabsContent>

        {needsDataSource && (
          <TabsContent value="datasource" className="mt-0 overflow-visible">
            <Accordion type="multiple" defaultValue={['datasource']} className="w-full overflow-visible">
              <DataSourceSection
                widget={widget}
                selectedWidgetId={selectedWidgetId}
                setPlacedWidgets={setPlacedWidgets}
                spaceId={spaceId}
              />
            </Accordion>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Widget */}
      <div className="px-4 pt-2 border-t">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => {
            setPlacedWidgets(prev => prev.filter(w => w.id !== selectedWidgetId))
            setSelectedWidgetId(null)
          }}
        >
          <Trash className="h-3.5 w-3.5 mr-1" />
          Delete Widget
        </Button>
      </div>
    </div>
  )
}
