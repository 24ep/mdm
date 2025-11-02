'use client'

import React from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { PlacedWidget } from './widgets'
import { ChartDataSourceConfig } from './ChartDataSourceConfig'

interface DataSourceSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  spaceId?: string
}

export function DataSourceSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  spaceId,
}: DataSourceSectionProps) {
  return (
    <AccordionItem value="datasource" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4">Data Source</AccordionTrigger>
      <AccordionContent className="px-0 py-0 overflow-visible">
        <ChartDataSourceConfig
          widget={widget}
          setPlacedWidgets={setPlacedWidgets}
          spaceId={spaceId}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
