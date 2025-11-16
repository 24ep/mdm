'use client'

import React, { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { widgetsPalette } from '../widgets'
import { WidgetItem } from './WidgetItem'
import { useDragHandler } from './useDragHandler'

interface WidgetsTabProps {
  searchQuery: string
  onClose: () => void
  categoryFilter?: 'all' | 'dashboard' | 'ui' | 'filters' | 'shapes' | 'media' | 'charts' | 'tables' | 'utilities'
}

export function WidgetsTab({ searchQuery, onClose, categoryFilter = 'all' }: WidgetsTabProps) {
  const { handleDragStart, handleDragEnd } = useDragHandler(onClose)
  
  // Filter widgets based on search (flat list)
  const filteredWidgets = useMemo(() => {
    if (!searchQuery.trim()) return widgetsPalette
    const query = searchQuery.toLowerCase().trim()
    return widgetsPalette.filter(w =>
      w.label.toLowerCase().includes(query) ||
      w.type.toLowerCase().includes(query) ||
      (w.category || '').toLowerCase().includes(query)
    )
  }, [searchQuery])
  
  // Best-practice groups (no accordion; simple headers + grids)
  const groups: Array<{ title: string; items: typeof widgetsPalette }>= useMemo(() => {
    const items = filteredWidgets
    const match = (predicate: (t: string) => boolean) => (w: any) => predicate(String(w.type || '').toLowerCase())
    const by = (list: any[], pred: (w: any) => boolean) => list.filter(pred)
    const notBy = (list: any[], pred: (w: any) => boolean) => list.filter(w => !pred(w))

    const isChart = (t: string) => t.endsWith('-chart') || t === 'time-series'
    const isTable = (t: string) => t === 'table' || t === 'pivot-table'
    const isFilter = (t: string) => t.includes('-filter')
    const isMedia = (t: string) => t === 'image' || t === 'video' || t === 'html' || t === 'iframe' || t === 'embed'
    const isShape = (t: string) => ['rectangle', 'circle', 'triangle', 'hexagon', 'shape', 'star'].includes(t)
    const isUI = (t: string) => ['text', 'button', 'link', 'divider', 'spacer', 'card', 'container'].includes(t)
    const isOther = (t: string) => !isChart(t) && !isTable(t) && !isFilter(t) && !isMedia(t) && !isShape(t) && !isUI(t)

    // No "Common" section; use full filtered list for category grouping
    const remainingAfterCommon = [...items]

    const charts = by(remainingAfterCommon, match(isChart))
    const tables = by(remainingAfterCommon, match(isTable))
    const filters = by(remainingAfterCommon, match(isFilter))
    const media = by(remainingAfterCommon, match(isMedia))
    const shapes = by(remainingAfterCommon, match(isShape))
    const ui = by(remainingAfterCommon, match(isUI))
    const other = by(remainingAfterCommon, match(isOther))

    const result: Array<{ title: string; items: typeof widgetsPalette }>= []
    const push = (title: string, items: any[]) => { if (items.length) result.push({ title, items: items as unknown as typeof widgetsPalette }) }

    // Determine which groups to display based on categoryFilter
    const wants = (name: string) => categoryFilter === 'all' ||
      (categoryFilter === 'dashboard' && ['Charts', 'Tables', 'UI Elements'].includes(name)) ||
      (categoryFilter === 'charts' && name === 'Charts') ||
      (categoryFilter === 'tables' && name === 'Tables') ||
      (categoryFilter === 'filters' && name === 'Filters') ||
      (categoryFilter === 'media' && name === 'Media') ||
      (categoryFilter === 'ui' && name === 'UI Elements') ||
      (categoryFilter === 'shapes' && name === 'Shapes') ||
      (categoryFilter === 'utilities' && name === 'Utilities')

    if (charts.length && wants('Charts')) push('Charts', charts)
    if (tables.length && wants('Tables')) push('Tables', tables)
    if (filters.length && wants('Filters')) push('Filters', filters)
    if (media.length && wants('Media')) push('Media', media)
    if (ui.length && wants('UI Elements')) push('UI Elements', ui)
    if (shapes.length && wants('Shapes')) push('Shapes', shapes)
    if (other.length && wants('Utilities')) push('Utilities', other)
    return result
  }, [filteredWidgets, searchQuery, categoryFilter])
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {groups.map(group => (
          <div key={group.title} className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground px-1">{group.title}</div>
            <div className="grid grid-cols-3 gap-2">
              {group.items.map(w => (
                <WidgetItem
                  key={`${group.title}-${w.type}`}
                  widget={w}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No widgets found matching "{searchQuery}"
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

