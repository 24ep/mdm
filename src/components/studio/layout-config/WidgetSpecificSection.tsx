'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ChevronDown } from 'lucide-react'
import { PlacedWidget } from './widgets'

interface WidgetSpecificSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function WidgetSpecificSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: WidgetSpecificSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  const hasWidgetSpecificSettings = widget.type.includes('chart') || 
    widget.type.includes('table') || 
    widget.type === 'text' || 
    widget.type === 'image' || 
    widget.type === 'video' || 
    widget.type === 'iframe' || 
    widget.type === 'link' || 
    widget.type === 'button'

  if (!hasWidgetSpecificSettings) {
    return null
  }

  const getSectionTitle = () => {
    if (widget.type.includes('chart')) return 'Chart Settings'
    if (widget.type.includes('table')) return 'Table Settings'
    if (widget.type === 'text') return 'Text Settings'
    if (widget.type === 'image') return 'Image Settings'
    if (widget.type === 'video') return 'Video Settings'
    if (widget.type === 'iframe') return 'Iframe Settings'
    if (widget.type === 'link') return 'Link Settings'
    if (widget.type === 'button') return 'Button Settings'
    return 'Widget Settings'
  }

  // Determine if this is chart, UI element, or filter group
  const isChart = widget.type.includes('chart')
  const isUIElement = widget.type.includes('table') || widget.type === 'text' || widget.type === 'image' || widget.type === 'video' || widget.type === 'iframe' || widget.type === 'link' || widget.type === 'button' || widget.type === 'card' || widget.type === 'scorecard' || widget.type === 'time-series' || widget.type === 'pivot-table'
  const isFilterGroup = widget.type.includes('filter')
  
  const shouldUseSpecialStyle = isChart || isUIElement || isFilterGroup

  return (
    <AccordionItem value="widget-specific" className={shouldUseSpecialStyle ? "border-0" : "border-0"}>
      <div className={shouldUseSpecialStyle ? "border-l border-gray-300" : ""}>
        <AccordionTrigger 
          className={`text-xs font-semibold py-2 px-4 ${shouldUseSpecialStyle ? 'bg-transparent hover:bg-transparent border-0 no-underline' : ''}`}
          showCustomChevron={shouldUseSpecialStyle}
        >
          <span className="flex-1 text-left">{getSectionTitle()}</span>
          {shouldUseSpecialStyle && <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-auto" />}
        </AccordionTrigger>
        <AccordionContent className="px-4">
        <div className="space-y-3">
          {widget.type.includes('chart') && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={widget.properties?.title || ''}
                  onChange={(e) => updateProperty('title', e.target.value)}
                  placeholder="Chart Title"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chart Type</Label>
                <Select
                  value={widget.properties?.chartType || widget.type}
                  onValueChange={(value) => updateProperty('chartType', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="pie">Pie</SelectItem>
                    <SelectItem value="donut">Donut</SelectItem>
                    <SelectItem value="scatter">Scatter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Legend</Label>
                <Switch
                  checked={widget.properties?.showLegend ?? true}
                  onCheckedChange={(checked) => updateProperty('showLegend', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Grid</Label>
                <Switch
                  checked={widget.properties?.showGrid ?? true}
                  onCheckedChange={(checked) => updateProperty('showGrid', checked)}
                />
              </div>
            </>
          )}

          {widget.type.includes('table') && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Header</Label>
                <Switch
                  checked={widget.properties?.showHeader ?? true}
                  onCheckedChange={(checked) => updateProperty('showHeader', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Striped Rows</Label>
                <Switch
                  checked={widget.properties?.stripedRows ?? false}
                  onCheckedChange={(checked) => updateProperty('stripedRows', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pagination</Label>
                <Switch
                  checked={widget.properties?.pagination ?? false}
                  onCheckedChange={(checked) => updateProperty('pagination', checked)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rows Per Page</Label>
                <Input
                  type="number"
                  value={widget.properties?.rowsPerPage || 10}
                  onChange={(e) => updateProperty('rowsPerPage', parseInt(e.target.value) || 10)}
                  className="h-7 text-xs"
                />
              </div>
            </>
          )}

          {widget.type === 'text' && (
            <div className="space-y-1">
              <Label className="text-xs">Text Content</Label>
              <Input
                value={widget.properties?.text || ''}
                onChange={(e) => updateProperty('text', e.target.value)}
                placeholder="Enter text"
                className="h-7 text-xs"
              />
            </div>
          )}

          {widget.type === 'image' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Image URL</Label>
                <Input
                  value={widget.properties?.imageUrl || ''}
                  onChange={(e) => updateProperty('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alt Text</Label>
                <Input
                  value={widget.properties?.altText || ''}
                  onChange={(e) => updateProperty('altText', e.target.value)}
                  placeholder="Image description"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Object Fit</Label>
                <Select
                  value={widget.properties?.objectFit || 'contain'}
                  onValueChange={(value) => updateProperty('objectFit', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="scale-down">Scale Down</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {widget.type === 'video' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Video URL</Label>
                <Input
                  value={widget.properties?.videoUrl || ''}
                  onChange={(e) => updateProperty('videoUrl', e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Autoplay</Label>
                <Switch
                  checked={widget.properties?.autoplay ?? false}
                  onCheckedChange={(checked) => updateProperty('autoplay', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Controls</Label>
                <Switch
                  checked={widget.properties?.controls ?? true}
                  onCheckedChange={(checked) => updateProperty('controls', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Loop</Label>
                <Switch
                  checked={widget.properties?.loop ?? false}
                  onCheckedChange={(checked) => updateProperty('loop', checked)}
                />
              </div>
            </>
          )}

          {widget.type === 'iframe' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Iframe URL</Label>
                <Input
                  value={widget.properties?.iframeUrl || ''}
                  onChange={(e) => updateProperty('iframeUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Allow Fullscreen</Label>
                <Switch
                  checked={widget.properties?.allowFullscreen ?? false}
                  onCheckedChange={(checked) => updateProperty('allowFullscreen', checked)}
                />
              </div>
            </>
          )}

          {widget.type === 'link' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Link URL</Label>
                <Input
                  value={widget.properties?.linkUrl || ''}
                  onChange={(e) => updateProperty('linkUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Link Text</Label>
                <Input
                  value={widget.properties?.linkText || ''}
                  onChange={(e) => updateProperty('linkText', e.target.value)}
                  placeholder="Click here"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target</Label>
                <Select
                  value={widget.properties?.linkTarget || '_blank'}
                  onValueChange={(value) => updateProperty('linkTarget', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">Same Window</SelectItem>
                    <SelectItem value="_blank">New Window</SelectItem>
                    <SelectItem value="_parent">Parent Frame</SelectItem>
                    <SelectItem value="_top">Top Window</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {widget.type === 'button' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Button Text</Label>
                <Input
                  value={widget.properties?.buttonText || ''}
                  onChange={(e) => updateProperty('buttonText', e.target.value)}
                  placeholder="Click Me"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Action</Label>
                <Select
                  value={widget.properties?.buttonAction || 'none'}
                  onValueChange={(value) => updateProperty('buttonAction', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="submit">Submit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        </AccordionContent>
      </div>
    </AccordionItem>
  )
}

