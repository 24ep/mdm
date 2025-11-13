'use client'

import React, { useState } from 'react'
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Copy,
  Trash2,
  Move,
  Type,
  Palette,
  Layers,
  MoreHorizontal,
  ChevronDown,
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  Minus,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Expand,
  SlidersHorizontal
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HexColorPicker } from 'react-colorful'
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker'
import { DashboardElement } from '../hooks/useDashboardState'
import { MultiSideInput } from '@/components/shared/MultiSideInput'

interface SelectionToolbarProps {
  selectedElement: DashboardElement | null
  selectedElements?: DashboardElement[]
  onUpdateElement?: (elementId: string, updates: Partial<DashboardElement>) => void
  onBulkUpdate: (updates: Partial<DashboardElement>) => void
  onDelete?: () => void
  onDuplicate?: () => void
  zoom: number
  pan: { x: number; y: number }
  selectedRect?: { x: number; y: number; w: number }
}

export function SelectionToolbar({
  selectedElement,
  selectedElements,
  onUpdateElement,
  onBulkUpdate,
  onDelete,
  onDuplicate,
  zoom,
  pan,
  selectedRect
}: SelectionToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [pendingBgColor, setPendingBgColor] = useState<string | null>(null)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showFontColorPicker, setShowFontColorPicker] = useState(false)
  const [pendingFontColor, setPendingFontColor] = useState<string | null>(null)
  const [originalBgColor, setOriginalBgColor] = useState<string | null>(null)
  const [livePreviewBg, setLivePreviewBg] = useState<boolean>(false)
  const [originalFontColor, setOriginalFontColor] = useState<string | null>(null)
  const [livePreviewFont, setLivePreviewFont] = useState<boolean>(false)
  
  // Separate state for border color picker
  const [showBorderColorPicker, setShowBorderColorPicker] = useState(false)
  const [pendingBorderColor, setPendingBorderColor] = useState<string | null>(null)
  const [originalBorderColor, setOriginalBorderColor] = useState<string | null>(null)
  const [livePreviewBorder, setLivePreviewBorder] = useState<boolean>(false)
  const [editingBorderSide, setEditingBorderSide] = useState<string | null>(null)
  const [livePreviewEffects, setLivePreviewEffects] = useState<boolean>(false)
  const [originalShadow, setOriginalShadow] = useState<any>(null)
  const [originalFilter, setOriginalFilter] = useState<any>(null)
  const [pendingShadow, setPendingShadow] = useState<any>({})
  const [pendingFilter, setPendingFilter] = useState<any>({})
  const ensureGoogleFontLoaded = (cssStack: string) => {
    if (typeof window === 'undefined') return
    const primary = (cssStack.split(',')[0] || '').trim().replace(/^['"]|['"]$/g, '')
    if (!primary) return
    const googleFamilies: Record<string, string> = {
      'Roboto': 'Roboto:wght@100;300;400;500;700',
      'Inter': 'Inter:wght@100;300;400;500;700',
      'Open Sans': 'Open+Sans:wght@300;400;600;700',
      'Lato': 'Lato:wght@300;400;700',
      'Montserrat': 'Montserrat:wght@300;400;600;700',
      'Poppins': 'Poppins:wght@300;400;600;700',
      'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600;700',
      'Noto Sans': 'Noto+Sans:wght@300;400;600;700'
    }
    const fam = googleFamilies[primary]
    if (!fam) return
    const id = `gf-${primary.replace(/\s+/g, '-')}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${fam}&display=swap`
    document.head.appendChild(link)
  }

  const isMultiSelect = (selectedElements?.length ?? 0) > 1
  const elements = isMultiSelect ? (selectedElements ?? []) : (selectedElement ? [selectedElement] : [])

  if (elements.length === 0) return null

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (isMultiSelect) {
      onBulkUpdate({ 
        style: { 
          ...elements[0].style, 
          textAlign: alignment 
        } 
      })
    } else if (selectedElement) {
      onUpdateElement?.(selectedElement.id, {
        style: {
          ...selectedElement.style,
          textAlign: alignment
        }
      })
    }
  }

  // Removed vertical align handler pending icon availability

  const handleRotate = (direction: 'cw' | 'ccw') => {
    const currentRotation = selectedElement?.style?.rotation || 0
    const newRotation = direction === 'cw' ? currentRotation + 90 : currentRotation - 90
    
    if (isMultiSelect) {
      onBulkUpdate({ 
        style: { 
          ...elements[0].style, 
          rotation: newRotation 
        } 
      })
    } else if (selectedElement) {
      onUpdateElement?.(selectedElement.id, {
        style: {
          ...selectedElement.style,
          rotation: newRotation
        }
      })
    }
  }

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (isMultiSelect) {
      onBulkUpdate({ 
        style: { 
          ...elements[0].style, 
          [`flip${direction.charAt(0).toUpperCase() + direction.slice(1)}`]: true
        } 
      })
    } else if (selectedElement) {
      onUpdateElement?.(selectedElement.id, {
        style: {
          ...selectedElement.style,
          [`flip${direction.charAt(0).toUpperCase() + direction.slice(1)}`]: true
        }
      })
    }
  }

  const handleLayerAction = (action: 'bringToFront' | 'bringForward' | 'sendBackward' | 'sendToBack') => {
    // Implementation for layer management
    console.log('Layer action:', action)
  }

  const getShapeIcon = (type: string) => {
    switch (type) {
      case 'RECTANGLE': return <Square className="w-4 h-4" />
      case 'CIRCLE': return <Circle className="w-4 h-4" />
      case 'ELLIPSE': return <Circle className="w-4 h-4" />
      case 'ROUNDED_RECT': return <Square className="w-4 h-4" />
      case 'LINE': return <Minus className="w-4 h-4" />
      case 'ARROW': return <ArrowRight className="w-4 h-4" />
      case 'TRIANGLE': return <Triangle className="w-4 h-4" />
      case 'STAR': return <Star className="w-4 h-4" />
      case 'HEXAGON': return <Hexagon className="w-4 h-4" />
      default: return <Square className="w-4 h-4" />
    }
  }

  return (
    <div 
      className="absolute bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-1 z-50"
      style={{
        left: '50%',
        top: 12,
        transform: `translate(-50%, 0) scale(${zoom / 100})`,
        transformOrigin: 'top center',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      {/* Position & Size moved to Properties Panel */}

      {/* Rotation & Opacity moved to Properties Panel */}
      

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
              const e0 = elements[0]
              const style = e0?.style || {}
              const updateStyle = (partial: any) => {
                if (isMultiSelect) {
                  elements.forEach(el => onUpdateElement?.(el.id, { style: { ...(el.style||{}), ...partial } }))
                } else if (selectedElement) {
                  onUpdateElement?.(selectedElement.id, { style: { ...(selectedElement.style||{}), ...partial } })
                }
              }
              return (
                <div className="p-3 space-y-3">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Font Family</div>
                    <select
                      className="w-full h-7 border border-border rounded px-1 text-xs"
                      value={String(style.fontFamily || 'Roboto, sans-serif')}
                      onChange={(e)=>{ ensureGoogleFontLoaded(e.target.value); updateStyle({ fontFamily: e.target.value }) }}
                    >
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Inter, system-ui, Avenir, Helvetica, Arial, sans-serif">Inter</option>
                      <option value="'Open Sans', sans-serif">Open Sans</option>
                      <option value="Lato, sans-serif">Lato</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                      <option value="'Noto Sans', sans-serif">Noto Sans</option>
                      <option value="Arial, Helvetica, sans-serif">Arial</option>
                      <option value="Georgia, 'Times New Roman', serif">Georgia</option>
                      <option value="'Times New Roman', Times, serif">Times New Roman</option>
                      <option value="Courier, 'Courier New', monospace">Courier</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Size</div>
                      <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={Number(style.fontSize ?? 14)} onChange={(e)=>updateStyle({ fontSize: Number(e.target.value)||14 })} />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Weight</div>
                      <select className="w-full h-7 border border-border rounded px-1 text-xs" value={String(style.fontWeight || 'normal')} onChange={(e)=>updateStyle({ fontWeight: e.target.value })}>
                        <option value="lighter">Light</option>
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Align</div>
                      <select className="w-full h-7 border border-border rounded px-1 text-xs" value={String(style.textAlign || 'left')} onChange={(e)=>updateStyle({ textAlign: e.target.value })}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                        <option value="justify">Justify</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <EnhancedColorPicker
                      value={style.color || '#111827'}
                      onChange={(color) => updateStyle({ color })}
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
              const e0 = elements[0]
              const pad = e0?.style?.padding
              const toSides = (p:any) => typeof p === 'object' ? p : { top: Number(p||0), right: Number(p||0), bottom: Number(p||0), left: Number(p||0) }
              const current = toSides(pad)
              const updatePad = (side:'top'|'right'|'bottom'|'left', value:number) => {
                const newPad = { ...current, [side]: value }
                if (isMultiSelect) {
                  elements.forEach(el => onUpdateElement?.(el.id, { style: { ...(el.style||{}), padding: newPad } }))
                } else if (selectedElement) {
                  onUpdateElement?.(selectedElement.id, { style: { ...(selectedElement.style||{}), padding: newPad } })
                }
              }
              return (
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Top</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" value={Number(current.top||0)} onChange={(e)=>updatePad('top', Number(e.target.value)||0)} />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Right</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" value={Number(current.right||0)} onChange={(e)=>updatePad('right', Number(e.target.value)||0)} />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Bottom</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" value={Number(current.bottom||0)} onChange={(e)=>updatePad('bottom', Number(e.target.value)||0)} />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Left</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" value={Number(current.left||0)} onChange={(e)=>updatePad('left', Number(e.target.value)||0)} />
                  </div>
                </div>
              )
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Shadow Group */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Effects">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="ml-1 text-xs">Effects</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Shadow</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(() => {
              const e0 = elements[0]
              const shadow = e0?.style?.boxShadow || {}
              const getNum = (v:any)=> typeof v === 'number' ? v : Number(v||0)
              const updateShadow = (partial:any) => {
                const next = { ...shadow, ...partial }
                if (isMultiSelect) {
                  elements.forEach(el => onUpdateElement?.(el.id, { style: { ...(el.style||{}), boxShadow: next } }))
                } else if (selectedElement) {
                  onUpdateElement?.(selectedElement.id, { style: { ...(selectedElement.style||{}), boxShadow: next } })
                }
              }
              return (
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Offset X</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" value={getNum(shadow.offsetX)} onChange={(e)=>updateShadow({ offsetX: Number(e.target.value)||0 })} />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Offset Y</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" value={getNum(shadow.offsetY)} onChange={(e)=>updateShadow({ offsetY: Number(e.target.value)||0 })} />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Blur</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" value={getNum(shadow.blur)} onChange={(e)=>updateShadow({ blur: Number(e.target.value)||0 })} />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">Spread</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" value={getNum(shadow.spread)} onChange={(e)=>updateShadow({ spread: Number(e.target.value)||0 })} />
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] text-muted-foreground mb-1">Color</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" value={shadow.color || '#000000'} onChange={(e)=>updateShadow({ color: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] text-muted-foreground mb-1">Opacity (%)</div>
                    <input className="w-full h-7 border border-gray-300 rounded px-1 text-xs" type="number" min={0} max={100} value={Math.round(Number((shadow.opacity ?? 0.25) * 100))} onChange={(e)=>{
                      const v = Math.max(0, Math.min(100, Number(e.target.value)||0))
                      updateShadow({ opacity: v/100 })
                    }} />
                  </div>
                  <div className="col-span-2 border-t pt-2 mt-1">
                    <div className="text-[11px] text-muted-foreground mb-2">Optical (Filters)</div>
                    {(() => {
                      const fc = e0?.style?.filterConfig || {}
                      const updateFilter = (partial:any) => {
                        const next = { ...fc, ...partial }
                        if (isMultiSelect) {
                          elements.forEach(el => onUpdateElement?.(el.id, { style: { ...(el.style||{}), filterConfig: next } }))
                        } else if (selectedElement) {
                          onUpdateElement?.(selectedElement.id, { style: { ...(selectedElement.style||{}), filterConfig: next } })
                        }
                      }
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Blur (px)</div>
                            <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={Number(fc.blur ?? 0)} onChange={(e)=>updateFilter({ blur: Number(e.target.value)||0 })} />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Backdrop Blur (px)</div>
                            <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={Number(fc.backdropBlur ?? 0)} onChange={(e)=>updateFilter({ backdropBlur: Number(e.target.value)||0 })} />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Brightness (%)</div>
                            <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={Number(fc.brightness ?? 100)} onChange={(e)=>updateFilter({ brightness: Number(e.target.value)||100 })} />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Contrast (%)</div>
                            <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={Number(fc.contrast ?? 100)} onChange={(e)=>updateFilter({ contrast: Number(e.target.value)||100 })} />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Saturate (%)</div>
                            <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={Number(fc.saturate ?? 100)} onChange={(e)=>updateFilter({ saturate: Number(e.target.value)||100 })} />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Grayscale (%)</div>
                            <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={Number(fc.grayscale ?? 0)} onChange={(e)=>updateFilter({ grayscale: Number(e.target.value)||0 })} />
                          </div>
                          <div className="col-span-2">
                            <div className="text-[11px] text-muted-foreground mb-1">Hue Rotate (deg)</div>
                            <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={Number(fc.hueRotate ?? 0)} onChange={(e)=>updateFilter({ hueRotate: Number(e.target.value)||0 })} />
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Vertical Alignment Group temporarily removed to avoid undefined icons */}

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
                value={elements[0]?.style?.backgroundColor || '#ffffff'}
                onChange={(color) => {
                  if (isMultiSelect) {
                    onBulkUpdate({ style: { ...elements[0].style, backgroundColor: color } })
                  } else if (selectedElement) {
                    onUpdateElement?.(selectedElement.id, { style: { ...selectedElement.style, backgroundColor: color } })
                  }
                }}
                label="Background Color"
                className="text-xs"
              />
            </div>

            <DropdownMenuSeparator />

            {/* Font Settings */}
            <div className="p-3">
              <Label className="text-xs font-medium text-foreground mb-2 block">Font Settings</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Size:</Label>
                  <Input 
                    type="number"
                    value={elements[0]?.style?.fontSize || 14}
                    onChange={(e) => {
                      const fontSize = parseInt(e.target.value) || 14
                      if (isMultiSelect) {
                        onBulkUpdate({ style: { ...elements[0].style, fontSize } })
                      } else if (selectedElement) {
                        onUpdateElement?.(selectedElement.id, { style: { ...selectedElement.style, fontSize } })
                      }
                    }}
                    className="h-6 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Weight:</Label>
                  <select 
                    value={elements[0]?.style?.fontWeight || 'normal'}
                    onChange={(e) => {
                      const fontWeight = e.target.value
                      if (isMultiSelect) {
                        onBulkUpdate({ style: { ...elements[0].style, fontWeight } })
                      } else if (selectedElement) {
                        onUpdateElement?.(selectedElement.id, { style: { ...selectedElement.style, fontWeight } })
                      }
                    }}
                    className="h-6 text-xs border border-border rounded px-1"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Color:</Label>
                  <div 
                    className="w-6 h-6 border border-border rounded cursor-pointer"
                    style={{ backgroundColor: elements[0]?.style?.color || '#000000' }}
                  />
                  <Input 
                    value={elements[0]?.style?.color || '#000000'}
                    onChange={(e) => {
                      const color = e.target.value
                      if (isMultiSelect) {
                        onBulkUpdate({ style: { ...elements[0].style, color } })
                      } else if (selectedElement) {
                        onUpdateElement?.(selectedElement.id, { style: { ...selectedElement.style, color } })
                      }
                    }}
                    className="h-6 text-xs"
                  />
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Border Settings */}
            <div className="p-3">
              <Label className="text-xs font-medium text-foreground mb-2 block">Border</Label>
              <div className="space-y-3">
                <MultiSideInput
                  label="Border Width"
                  baseKey="borderWidth"
                  type="sides"
                  defaultValue={0}
                  inputClassName="h-6 text-xs"
                  getValue={(side: string) => {
                    const key = `borderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                    const baseValue = elements[0]?.style?.borderWidth || 0
                    const sideValue = elements[0]?.style?.[key]
                    return sideValue !== undefined ? sideValue : baseValue
                  }}
                  setValue={(updates) => {
                    const currentStyle = elements[0]?.style || {}
                    const newStyle = { ...currentStyle }
                    Object.keys(updates).forEach(key => {
                      const value = updates[key]
                      if (typeof value === 'string' && value.endsWith('px')) {
                        const numValue = parseInt(value.replace('px', '')) || 0
                        newStyle[key] = numValue
                      } else {
                        newStyle[key] = value
                      }
                    })
                    if (isMultiSelect) {
                      onBulkUpdate({ style: newStyle })
                    } else if (selectedElement) {
                      onUpdateElement?.(selectedElement.id, { style: newStyle })
                    }
                  }}
                />
                <MultiSideInput
                  label="Border Radius"
                  baseKey="borderRadius"
                  type="corners"
                  defaultValue={0}
                  inputClassName="h-6 text-xs"
                  getValue={(side: string) => {
                    const br = elements[0]?.style?.borderRadius
                    if (typeof br === 'number') return br
                    if (typeof br === 'object' && br !== null) {
                      const obj = br as any
                      const corner = obj[side]
                      return corner?.value ?? 0
                    }
                    return 0
                  }}
                  setValue={(updates) => {
                    const currentStyle = elements[0]?.style || {}
                    const currentBr = currentStyle.borderRadius
                    
                    let brObj: any = typeof currentBr === 'number' 
                      ? {
                          topLeft: { value: currentBr, unit: 'px' },
                          topRight: { value: currentBr, unit: 'px' },
                          bottomRight: { value: currentBr, unit: 'px' },
                          bottomLeft: { value: currentBr, unit: 'px' }
                        }
                      : (currentBr || {
                          topLeft: { value: 0, unit: 'px' },
                          topRight: { value: 0, unit: 'px' },
                          bottomRight: { value: 0, unit: 'px' },
                          bottomLeft: { value: 0, unit: 'px' }
                        })
                    
                    Object.keys(updates).forEach(key => {
                      if (key === 'borderRadius') {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          brObj = {
                            topLeft: { value: numValue, unit: 'px' },
                            topRight: { value: numValue, unit: 'px' },
                            bottomRight: { value: numValue, unit: 'px' },
                            bottomLeft: { value: numValue, unit: 'px' }
                          }
                        }
                      } else if (key.startsWith('borderRadius')) {
                        const corner = key.replace('borderRadius', '').charAt(0).toLowerCase() + key.replace('borderRadius', '').slice(1)
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          brObj[corner] = { value: numValue, unit: 'px' }
                        }
                      }
                    })
                    
                    const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                   brObj.topRight.value === brObj.bottomRight.value &&
                                   brObj.bottomRight.value === brObj.bottomLeft.value &&
                                   brObj.topLeft.unit === brObj.topRight.unit &&
                                   brObj.topRight.unit === brObj.bottomRight.unit &&
                                   brObj.bottomRight.unit === brObj.bottomLeft.unit
                    
                    const newStyle = { ...currentStyle, borderRadius: allSame ? brObj.topLeft.value : brObj }
                    if (isMultiSelect) {
                      onBulkUpdate({ style: newStyle })
                    } else if (selectedElement) {
                      onUpdateElement?.(selectedElement.id, { style: newStyle })
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Color:</Label>
                  <div 
                    className="w-6 h-6 border border-border rounded cursor-pointer"
                    style={{ backgroundColor: elements[0]?.style?.borderColor || '#000000' }}
                  />
                  <Input 
                    value={elements[0]?.style?.borderColor || '#000000'}
                    onChange={(e) => {
                      const color = e.target.value
                      if (isMultiSelect) {
                        onBulkUpdate({ style: { ...elements[0].style, borderColor: color } })
                      } else if (selectedElement) {
                        onUpdateElement?.(selectedElement.id, { style: { ...selectedElement.style, borderColor: color } })
                      }
                    }}
                    className="h-6 text-xs"
                  />
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stroke (Border) Group - per side like Figma */}
      <div className="flex items-center border-r border-border pr-2 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Stroke">
              <Square className="w-4 h-4" />
              <span className="ml-1 text-xs">Stroke</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Stroke</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(() => {
              const e0 = elements[0]
              const bw = e0?.style?.borderWidth || {}
              const bc = e0?.style?.borderColor || '#000000'
              const getNum = (v:any)=> typeof v === 'number' ? v : Number(v||0)
              const getColor = (side: 'top'|'right'|'bottom'|'left') => (typeof bc === 'object' ? (bc as any)[side] : '') || ''
              const updateWidth = (side: 'top'|'right'|'bottom'|'left', value: number) => {
                if (isMultiSelect) {
                  elements.forEach(el => onUpdateElement?.(el.id, { style: { ...(el.style||{}), borderWidth: { ...(el.style?.borderWidth||{}), [side]: value } } }))
                } else if (selectedElement) {
                  onUpdateElement?.(selectedElement.id, { style: { ...(selectedElement.style||{}), borderWidth: { ...(selectedElement.style?.borderWidth||{}), [side]: value } } })
                }
              }
              const updateColor = (side: 'top'|'right'|'bottom'|'left', value: string) => {
                if (isMultiSelect) {
                  elements.forEach(el => onUpdateElement?.(el.id, { style: { ...(el.style||{}), borderColor: { ...(typeof el.style?.borderColor==='object'? el.style.borderColor:{}), [side]: value } } }))
                } else if (selectedElement) {
                  onUpdateElement?.(selectedElement.id, { style: { ...(selectedElement.style||{}), borderColor: { ...(typeof selectedElement.style?.borderColor==='object'? selectedElement.style.borderColor:{}), [side]: value } } })
                }
              }
              const updateAllColor = (value: string) => {
                if (isMultiSelect) {
                  elements.forEach(el => onUpdateElement?.(el.id, { style: { ...(el.style||{}), borderColor: value } }))
                } else if (selectedElement) {
                  onUpdateElement?.(selectedElement.id, { style: { ...(selectedElement.style||{}), borderColor: value } })
                }
              }
              return (
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Top Width</div>
                      <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={getNum((bw as any).top)} onChange={(e)=>updateWidth('top', Number(e.target.value)||0)} />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Right Width</div>
                      <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={getNum((bw as any).right)} onChange={(e)=>updateWidth('right', Number(e.target.value)||0)} />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Bottom Width</div>
                      <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={getNum((bw as any).bottom)} onChange={(e)=>updateWidth('bottom', Number(e.target.value)||0)} />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Left Width</div>
                      <input className="w-full h-7 border border-border rounded px-1 text-xs" type="number" value={getNum((bw as any).left)} onChange={(e)=>updateWidth('left', Number(e.target.value)||0)} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <EnhancedColorPicker
                          value={getColor('top') || '#000000'}
                          onChange={(color) => updateColor('top', color)}
                          label="Top Color"
                          className="text-xs"
                          showApplyCancel={false}
                        />
                      </div>
                      <div>
                        <EnhancedColorPicker
                          value={getColor('right') || '#000000'}
                          onChange={(color) => updateColor('right', color)}
                          label="Right Color"
                          className="text-xs"
                          showApplyCancel={false}
                        />
                      </div>
                      <div>
                        <EnhancedColorPicker
                          value={getColor('bottom') || '#000000'}
                          onChange={(color) => updateColor('bottom', color)}
                          label="Bottom Color"
                          className="text-xs"
                          showApplyCancel={false}
                        />
                      </div>
                      <div>
                        <EnhancedColorPicker
                          value={getColor('left') || '#000000'}
                          onChange={(color) => updateColor('left', color)}
                          label="Left Color"
                          className="text-xs"
                          showApplyCancel={false}
                        />
                      </div>
                    </div>
                    <div>
                      <EnhancedColorPicker
                        value={typeof bc === 'string' ? bc : '#000000'}
                        onChange={(color) => updateAllColor(color)}
                        label="All Sides Color"
                        className="text-xs"
                        showApplyCancel={false}
                      />
                    </div>
                  </div>
                </div>
              )
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Layer Group */}
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
            <DropdownMenuItem onClick={() => handleLayerAction('bringToFront')}>
              <Layers className="w-4 h-4 mr-2" />
              Bring to Front
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLayerAction('bringForward')}>
              <Layers className="w-4 h-4 mr-2" />
              Bring Forward
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLayerAction('sendBackward')}>
              <Layers className="w-4 h-4 mr-2" />
              Send Backward
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLayerAction('sendToBack')}>
              <Layers className="w-4 h-4 mr-2" />
              Send to Back
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Actions Group */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => onDuplicate?.()}
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete?.()}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Element Type Indicator */}
      {elements.length === 1 && (
        <div className="flex items-center border-l border-gray-200 pl-2 ml-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {getShapeIcon(elements[0].type)}
            <span className="capitalize">{elements[0].type.toLowerCase().replace('_', ' ')}</span>
          </div>
        </div>
      )}

      {/* Multi-select indicator */}
      {isMultiSelect && (
        <div className="flex items-center border-l border-gray-200 pl-2 ml-2">
          <div className="text-xs text-gray-600 font-medium">
            {selectedElements?.length ?? 0} selected
          </div>
        </div>
      )}
    </div>
  )
}
