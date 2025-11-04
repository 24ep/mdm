'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BarChart3 } from 'lucide-react'
import { PlacedWidget } from './widgets'
import { ChartConfigurationSection } from './ChartConfigurationSection'

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
    if (widget.type.includes('chart')) return 'Chart style'
    if (widget.type.includes('table')) return 'Table style'
    if (widget.type === 'text') return 'Text style'
    if (widget.type === 'image') return 'Image style'
    if (widget.type === 'video') return 'Video style'
    if (widget.type === 'iframe') return 'Iframe style'
    if (widget.type === 'link') return 'Link style'
    if (widget.type === 'button') return 'Button style'
    return 'Widget style'
  }

  if (widget.type.includes('chart')) {
    // For chart widgets, render the chart configuration sections directly
    return (
      <>
        <ChartConfigurationSection
          widget={widget}
          selectedWidgetId={selectedWidgetId}
          setPlacedWidgets={setPlacedWidgets}
        />
      </>
    )
  }

  return (
    <AccordionItem value="widget-specific" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{getSectionTitle()}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-0 pt-2">
        <div className="px-4 pb-3 space-y-3">
              {widget.type.includes('table') && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium">Show header</Label>
                      <p className="text-xs text-muted-foreground">Display table header row</p>
                    </div>
                    <Switch
                      checked={widget.properties?.showHeader ?? true}
                      onCheckedChange={(checked) => updateProperty('showHeader', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium">Striped rows</Label>
                      <p className="text-xs text-muted-foreground">Alternating row colors</p>
                    </div>
                    <Switch
                      checked={widget.properties?.stripedRows ?? false}
                      onCheckedChange={(checked) => updateProperty('stripedRows', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium">Pagination</Label>
                      <p className="text-xs text-muted-foreground">Enable pagination</p>
                    </div>
                    <Switch
                      checked={widget.properties?.pagination ?? false}
                      onCheckedChange={(checked) => updateProperty('pagination', checked)}
                    />
                  </div>
                  {widget.properties?.pagination && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Rows per page</Label>
                      <Input
                        type="number"
                        value={widget.properties?.rowsPerPage || 10}
                        onChange={(e) => updateProperty('rowsPerPage', parseInt(e.target.value) || 10)}
                        className="h-7 text-xs"
                        min="5"
                        max="100"
                      />
                    </div>
                  )}
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
    </AccordionItem>
  )
}

