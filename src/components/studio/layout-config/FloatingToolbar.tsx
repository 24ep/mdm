'use client'

import React, { useState, useMemo } from 'react'
import { 
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Layers,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Type,
  Palette,
  Expand,
  SlidersHorizontal,
  Square,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker'
import { PlacedWidget } from './widgets'
import { Z_INDEX } from '@/lib/z-index'

interface FloatingToolbarProps {
  selectedWidget: PlacedWidget | null
  selectedWidgets: PlacedWidget[]
  placedWidgets: PlacedWidget[]
  onUpdateWidget: (widgetId: string, updates: Partial<PlacedWidget>) => void
  onBulkUpdate: (updates: Partial<PlacedWidget>) => void
  onDelete: () => void
  onDuplicate: () => void
  onLock?: () => void
  onUnlock?: () => void
  onHide?: () => void
  onShow?: () => void
  onBringToFront?: () => void
  onSendToBack?: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
  selectedRect?: { x: number; y: number; width: number; height: number }
  zoom?: number
  onOpenProperties?: () => void
}

export function FloatingToolbar({
  selectedWidget,
  selectedWidgets,
  placedWidgets,
  onUpdateWidget,
  onBulkUpdate,
  onDelete,
  onDuplicate,
  onLock,
  onUnlock,
  onHide,
  onShow,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  selectedRect,
  zoom = 100,
  onOpenProperties,
}: FloatingToolbarProps) {
  const isMultiSelect = selectedWidgets.length > 1
  const widgets = isMultiSelect ? selectedWidgets : (selectedWidget ? [selectedWidget] : [])

  if (widgets.length === 0 || !selectedRect) return null

  const widget = widgets[0]

  const handleUpdateProperty = (path: string[], value: any) => {
    if (isMultiSelect) {
      const updates: Partial<PlacedWidget> = {}
      let current: any = updates
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = {}
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      
      // Apply to all selected widgets
      onBulkUpdate(updates)
    } else if (selectedWidget) {
      const updates: Partial<PlacedWidget> = {}
      let current: any = updates
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = {}
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      
      onUpdateWidget(selectedWidget.id, updates)
    }
  }

  const handleRotate = (direction: 'cw' | 'ccw') => {
    const currentRotation = (widget.properties?.rotation as number) || 0
    const newRotation = direction === 'cw' ? currentRotation + 90 : currentRotation - 90
    
    handleUpdateProperty(['properties', 'rotation'], newRotation)
  }

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    const key = direction === 'horizontal' ? 'flipHorizontal' : 'flipVertical'
    const current = (widget.properties?.[key] as boolean) || false
    handleUpdateProperty(['properties', key], !current)
  }

  const toolbarStyle = useMemo(() => {
    if (!selectedRect) return {}
    
    // Fixed at top center of canvas (relative to canvas container)
    return {
      position: 'absolute' as const,
      left: '50%',
      top: '12px',
      transform: `translateX(-50%) scale(${zoom / 100})`,
      transformOrigin: 'top center',
      zIndex: Z_INDEX.floatingToolbar,
    }
  }, [zoom])

  return (
    <div 
      className="bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-1 pointer-events-auto"
      style={toolbarStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Properties Button - Opens right panel */}
      {onOpenProperties && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onOpenProperties}
          title="Properties"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="ml-1 text-xs">Properties</span>
        </Button>
      )}

      {/* Typography Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Typography">
              <Type className="w-4 h-4" />
              <span className="ml-1 text-xs">Text</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Text</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(() => {
              const props = widget.properties || {}
              const style = props.style || {}
              
              return (
                <div className="p-3 space-y-3">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Font Size</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(style.fontSize ?? props.fontSize ?? 14)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'style', 'fontSize'], Number(e.target.value) || 14)} 
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Font Weight</div>
                    <select 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      value={String(style.fontWeight ?? props.fontWeight ?? 'normal')} 
                      onChange={(e) => handleUpdateProperty(['properties', 'style', 'fontWeight'], e.target.value)}
                    >
                      <option value="lighter">Light</option>
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <EnhancedColorPicker
                      value={style.color || props.textColor || '#111827'}
                      onChange={(color) => handleUpdateProperty(['properties', 'style', 'color'], color)}
                      label="Font Color"
                      className="text-xs"
                    />
                  </div>
                </div>
              )
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Style Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Style">
              <Palette className="w-4 h-4" />
              <span className="ml-1 text-xs">Style</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Style Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Background Color */}
            <div className="p-3">
              <EnhancedColorPicker
                value={widget.properties?.backgroundColor || widget.properties?.fillColor || '#ffffff'}
                onChange={(color) => handleUpdateProperty(['properties', 'backgroundColor'], color)}
                label="Background Color"
                className="text-xs"
              />
            </div>

            <DropdownMenuSeparator />

            {/* Border Settings */}
            <div className="p-3">
              <div className="text-xs font-medium text-foreground mb-2">Border</div>
              <div className="space-y-2">
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Width</div>
                  <input 
                    className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                    type="number" 
                    value={Number(widget.properties?.borderWidth ?? 0)} 
                    onChange={(e) => handleUpdateProperty(['properties', 'borderWidth'], Number(e.target.value) || 0)} 
                  />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Radius</div>
                  <input 
                    className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                    type="number" 
                    value={Number(widget.properties?.borderRadius ?? 0)} 
                    onChange={(e) => handleUpdateProperty(['properties', 'borderRadius'], Number(e.target.value) || 0)} 
                  />
                </div>
                <div>
                  <EnhancedColorPicker
                    value={widget.properties?.borderColor || '#000000'}
                    onChange={(color) => handleUpdateProperty(['properties', 'borderColor'], color)}
                    label="Border Color"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Padding Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Padding">
              <Expand className="w-4 h-4" />
              <span className="ml-1 text-xs">Padding</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Padding</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(() => {
              const pad = widget.properties?.padding || {}
              const toSides = (p: any) => typeof p === 'object' ? p : { top: Number(p || 0), right: Number(p || 0), bottom: Number(p || 0), left: Number(p || 0) }
              const current = toSides(pad)
              
              return (
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Top</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(current.top || 0)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'padding'], { ...current, top: Number(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Right</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(current.right || 0)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'padding'], { ...current, right: Number(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Bottom</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(current.bottom || 0)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'padding'], { ...current, bottom: Number(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Left</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(current.left || 0)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'padding'], { ...current, left: Number(e.target.value) || 0 })} 
                    />
                  </div>
                </div>
              )
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Effects Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Effects">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="ml-1 text-xs">Effects</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Shadow & Effects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(() => {
              const shadow = widget.properties?.shadow || {}
              
              return (
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Offset X</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(shadow.offsetX ?? 0)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'shadow'], { ...shadow, offsetX: Number(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Offset Y</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(shadow.offsetY ?? 0)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'shadow'], { ...shadow, offsetY: Number(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Blur</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(shadow.blur ?? 0)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'shadow'], { ...shadow, blur: Number(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Spread</div>
                    <input 
                      className="w-full h-7 border border-border rounded px-1 text-xs bg-background text-foreground" 
                      type="number" 
                      value={Number(shadow.spread ?? 0)} 
                      onChange={(e) => handleUpdateProperty(['properties', 'shadow'], { ...shadow, spread: Number(e.target.value) || 0 })} 
                    />
                  </div>
                  <div className="col-span-2">
                    <EnhancedColorPicker
                      value={shadow.color || '#000000'}
                      onChange={(color) => handleUpdateProperty(['properties', 'shadow'], { ...shadow, color })}
                      label="Shadow Color"
                      className="text-xs"
                    />
                  </div>
                </div>
              )
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transform Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <RotateCw className="w-4 h-4" />
              <span className="ml-1 text-xs">Transform</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Transform</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleRotate('cw')}>
              <RotateCw className="w-4 h-4 mr-2" />
              Rotate 90° Clockwise
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRotate('ccw')}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Rotate 90° Counter-clockwise
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleFlip('horizontal')}>
              <FlipHorizontal className="w-4 h-4 mr-2" />
              Flip Horizontal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFlip('vertical')}>
              <FlipVertical className="w-4 h-4 mr-2" />
              Flip Vertical
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Layer Group */}
      {(onBringToFront || onSendToBack || onBringForward || onSendBackward) && (
        <div className="flex items-center border-r border-border pr-2 mr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" title="Layer">
                <Layers className="w-4 h-4" />
                <span className="ml-1 text-xs">Layer</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Layer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onBringToFront && (
                <DropdownMenuItem onClick={onBringToFront}>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Bring to Front
                </DropdownMenuItem>
              )}
              {onBringForward && (
                <DropdownMenuItem onClick={onBringForward}>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Bring Forward
                </DropdownMenuItem>
              )}
              {onSendBackward && (
                <DropdownMenuItem onClick={onSendBackward}>
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Send Backward
                </DropdownMenuItem>
              )}
              {onSendToBack && (
                <DropdownMenuItem onClick={onSendToBack}>
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Send to Back
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Actions Group */}
      <div className="flex items-center gap-1">
        {onDuplicate && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={onDuplicate}
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
        
        {widget.properties?.locked ? (
          onUnlock && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onUnlock}
              title="Unlock"
            >
              <Unlock className="w-4 h-4" />
            </Button>
          )
        ) : (
          onLock && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onLock}
              title="Lock"
            >
              <Lock className="w-4 h-4" />
            </Button>
          )
        )}

        {widget.properties?.hidden ? (
          onShow && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onShow}
              title="Show"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )
        ) : (
          onHide && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onHide}
              title="Hide"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          )
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Element Type Indicator */}
      {widgets.length === 1 && (
        <div className="flex items-center border-l border-border pl-2 ml-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Square className="w-4 h-4" />
            <span className="capitalize">{widget.type.replace('-', ' ')}</span>
          </div>
        </div>
      )}

      {/* Multi-select indicator */}
      {isMultiSelect && (
        <div className="flex items-center border-l border-border pl-2 ml-2">
          <div className="text-xs text-muted-foreground font-medium">
            {selectedWidgets.length} selected
          </div>
        </div>
      )}
    </div>
  )
}

