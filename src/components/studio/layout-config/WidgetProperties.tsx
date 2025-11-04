'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash, Palette, Database, Settings, Square, Box, Layers, BarChart3 } from 'lucide-react'
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

      <Tabs defaultValue={needsDataSource ? "datasource" : "properties"} className="w-full">
        <TabsList className={`grid ${needsDataSource ? 'grid-cols-2' : 'grid-cols-1'} h-8 border-0 bg-transparent gap-1 px-4`}>
          {needsDataSource && (
            <TabsTrigger value="datasource" className="text-xs px-3 data-[state=active]:bg-gray-200 data-[state=active]:border-0 data-[state=active]:border-b-0">
              <Database className="h-3.5 w-3.5 mr-1.5" />
              Data Source
            </TabsTrigger>
          )}
          <TabsTrigger value="properties" className="text-xs px-3 data-[state=active]:bg-gray-200 data-[state=active]:border-0 data-[state=active]:border-b-0">
            <Palette className="h-3.5 w-3.5 mr-1.5" />
            Properties
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="properties" className="mt-0">
          <Accordion type="multiple" defaultValue={widget.type.includes('chart') ? ['chart-style', 'background', 'title'] : ['general', 'background', 'border']} className="w-full">
            {/* Chart Style - Only for charts (Chart type, Series, etc.) */}
            {widget.type.includes('chart') && (
              <WidgetSpecificSection
                widget={widget}
                selectedWidgetId={selectedWidgetId}
                setPlacedWidgets={setPlacedWidgets}
              />
            )}

            {/* General Properties - Position, Layout, etc. - Available for all widgets */}
            <AccordionItem value="general" className="border-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>General</span>
                </div>
              </AccordionTrigger>
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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Background - Looker Studio style */}
            <AccordionItem value="background" className="border-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Background</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <FillSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    globalStyle={componentStyle}
                  />
                  
                  <AppearanceSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    globalStyle={componentStyle}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Border - Looker Studio style */}
            <AccordionItem value="border" className="border-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Box className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Border</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <StrokeSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    globalStyle={componentStyle}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Effects - Looker Studio style (Shadows, etc.) */}
            <AccordionItem value="effects" className="border-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Effects</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <EffectsSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    globalStyle={componentStyle}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Other Widget Settings - For non-chart widgets */}
            {!widget.type.includes('chart') && (
              <WidgetSpecificSection
                widget={widget}
                selectedWidgetId={selectedWidgetId}
                setPlacedWidgets={setPlacedWidgets}
              />
            )}

            {/* Other Properties - Moved to bottom */}
            <AccordionItem value="other" className="border-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Other</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <OtherPropertiesSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
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
