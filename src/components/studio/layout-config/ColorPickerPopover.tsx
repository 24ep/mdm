'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, Video, Image, Grid3x3, Play, Droplet, Sliders, Layers, Plus, Trash2, Move, Minus, GripVertical, Hash, Sparkles, Circle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ColorPickerPopoverProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
  allowImageVideo?: boolean // Only show Image/Video tabs for background/fill
}

export function ColorPickerPopover({
  value,
  onChange,
  children,
  disabled,
  allowImageVideo = false,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false)
  
  // Pattern definitions with icons and CSS
  const patterns = [
    {
      id: 'dots',
      name: 'Dots',
      icon: Circle,
      css: 'radial-gradient(circle, #000 1px, transparent 1px)',
      size: '20px 20px'
    },
    {
      id: 'diagonal-lines',
      name: 'Diagonal Lines',
      icon: Sliders,
      css: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)',
      size: '20px 20px'
    },
    {
      id: 'horizontal-stripes',
      name: 'Horizontal Stripes',
      icon: Minus,
      css: 'repeating-linear-gradient(0deg, transparent, transparent 10px, #000 10px, #000 20px)',
      size: '20px 20px'
    },
    {
      id: 'vertical-stripes',
      name: 'Vertical Stripes',
      icon: GripVertical,
      css: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #000 10px, #000 20px)',
      size: '20px 20px'
    },
    {
      id: 'grid',
      name: 'Grid',
      icon: Grid3x3,
      css: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
      size: '20px 20px'
    },
    {
      id: 'checkerboard',
      name: 'Checkerboard',
      icon: Hash,
      css: 'conic-gradient(#000 25%, transparent 0%, transparent 50%, #000 0%, #000 75%, transparent 0%)',
      size: '20px 20px'
    },
    {
      id: 'crosshatch',
      name: 'Crosshatch',
      icon: Layers,
      css: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px), repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)',
      size: '20px 20px'
    }
  ]
  
  // Parse value to determine type and extract the actual value
  const parseValue = (val: string) => {
    if (!val) return { type: 'solid', extracted: '#ffffff' }
    
    if (val.startsWith('#') || /^rgb|^rgba/.test(val)) {
      return { type: 'solid', extracted: val }
    } else if (val.startsWith('linear-gradient') || val.startsWith('radial-gradient')) {
      return { type: 'gradient', extracted: val }
    } else if (val.startsWith('pattern(')) {
      const match = val.match(/pattern\(([^)]+)\)/)
      return { type: 'pattern', extracted: match ? match[1] : 'dots' }
    } else if (val.startsWith('url(')) {
      const urlMatch = val.match(/url\(['"]?([^'"]+)['"]?\)/)
      return { type: 'image', extracted: urlMatch ? urlMatch[1] : '' }
    } else if (val.startsWith('video(')) {
      const videoMatch = val.match(/video\(['"]?([^'"]+)['"]?\)/)
      return { type: 'video', extracted: videoMatch ? videoMatch[1] : '' }
    } else if (val.startsWith('http') && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(val)) {
      return { type: 'image', extracted: val }
    } else if (val.startsWith('http') && /\.(mp4|webm|ogg)$/i.test(val)) {
      return { type: 'video', extracted: val }
    }
    return { type: 'solid', extracted: val }
  }

  const parsed = parseValue(value)
  // If image/video is not allowed but value is image/video, default to solid
  const initialType = parsed.type
  const safeType = (!allowImageVideo && (initialType === 'image' || initialType === 'video')) ? 'solid' : initialType
  const [colorType, setColorType] = useState<'solid' | 'gradient' | 'pattern' | 'image' | 'video'>(safeType as any)
  const [solidColor, setSolidColor] = useState(parsed.type === 'solid' ? parsed.extracted : '#ffffff')
  
  // Parse gradient into editable structure
  const parseGradient = (gradStr: string) => {
    if (!gradStr) return { type: 'linear', angle: 0, stops: [{ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 }] }
    
    const isLinear = gradStr.includes('linear-gradient')
    const isRadial = gradStr.includes('radial-gradient')
    
    // Extract angle/direction
    let angle = 0
    if (isLinear) {
      const angleMatch = gradStr.match(/(\d+)deg/)
      if (angleMatch) angle = parseInt(angleMatch[1])
      else if (gradStr.includes('to top')) angle = 0
      else if (gradStr.includes('to right')) angle = 90
      else if (gradStr.includes('to bottom')) angle = 180
      else if (gradStr.includes('to left')) angle = 270
    }
    
    // Extract color stops
    const stopsMatch = gradStr.match(/\(([^)]+)\)/)
    const stops: Array<{ color: string; position: number }> = []
    if (stopsMatch) {
      const parts = stopsMatch[1].split(',').map(s => s.trim())
      parts.forEach(part => {
        const colorMatch = part.match(/(#[0-9a-fA-F]{6}|rgb\([^)]+\)|rgba\([^)]+\)|[a-z]+)/i)
        const posMatch = part.match(/(\d+)%/)
        if (colorMatch) {
          stops.push({
            color: colorMatch[1],
            position: posMatch ? parseInt(posMatch[1]) : stops.length === 0 ? 0 : 100
          })
        }
      })
    }
    
    if (stops.length === 0) {
      stops.push({ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 })
    }
    
    return {
      type: isRadial ? 'radial' : 'linear',
      angle,
      stops
    }
  }
  
  const [gradientConfig, setGradientConfig] = useState(() => parseGradient(parsed.type === 'gradient' ? parsed.extracted : ''))
  const [patternValue, setPatternValue] = useState(parsed.type === 'pattern' ? parsed.extracted : '')
  
  // Get current pattern from value
  const getCurrentPattern = () => {
    if (!patternValue) return patterns[0]
    return patterns.find((p: typeof patterns[0]) => {
      // Try to match by name or id
      return patternValue.toLowerCase().includes(p.id) || patternValue.toLowerCase().includes(p.name.toLowerCase())
    }) || patterns[0]
  }
  
  const currentPattern = getCurrentPattern()
  
  // Generate CSS pattern string
  const getPatternCSS = (pattern: typeof patterns[0]) => {
    return pattern.css
  }
  
  // Generate full background pattern style
  const getPatternStyle = (pattern: typeof patterns[0]) => {
    return {
      backgroundImage: getPatternCSS(pattern),
      backgroundSize: pattern.size
    }
  }
  const [imageUrl, setImageUrl] = useState(parsed.type === 'image' ? parsed.extracted : '')
  const [videoUrl, setVideoUrl] = useState(parsed.type === 'video' ? parsed.extracted : '')
  const isInternalUpdateRef = React.useRef(false)
  
  // Build gradient string from config
  const buildGradientString = (config: typeof gradientConfig) => {
    const stopsStr = config.stops.map(s => `${s.color} ${s.position}%`).join(', ')
    if (config.type === 'radial') {
      return `radial-gradient(circle, ${stopsStr})`
    }
    return `linear-gradient(${config.angle}deg, ${stopsStr})`
  }
  
  const gradientValue = buildGradientString(gradientConfig)

  // Update state when value changes externally
  React.useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }
    
    const parsed = parseValue(value)
    // If image/video is not allowed but value is image/video, default to solid
    const safeType = (!allowImageVideo && (parsed.type === 'image' || parsed.type === 'video')) ? 'solid' : parsed.type
    setColorType(safeType as any)
    if (parsed.type === 'solid' || (!allowImageVideo && (parsed.type === 'image' || parsed.type === 'video'))) {
      // If image/video is not allowed, convert to solid color
      if (!allowImageVideo && (parsed.type === 'image' || parsed.type === 'video')) {
        setSolidColor('#ffffff')
      } else {
        setSolidColor(parsed.extracted)
      }
    }
    if (parsed.type === 'gradient') setGradientConfig(parseGradient(parsed.extracted))
    if (parsed.type === 'pattern') setPatternValue(parsed.extracted)
    if (allowImageVideo) {
      if (parsed.type === 'image') setImageUrl(parsed.extracted)
      if (parsed.type === 'video') setVideoUrl(parsed.extracted)
    }
  }, [value, allowImageVideo])

  const handleSolidColorChange = (color: string) => {
    isInternalUpdateRef.current = true
    setSolidColor(color)
    onChange(color)
  }

  const handleGradientChange = (config: typeof gradientConfig) => {
    isInternalUpdateRef.current = true
    setGradientConfig(config)
    onChange(buildGradientString(config))
  }
  
  const addGradientStop = () => {
    const newConfig = {
      ...gradientConfig,
      stops: [...gradientConfig.stops, { color: '#000000', position: 50 }]
    }
    handleGradientChange(newConfig)
  }
  
  const removeGradientStop = (index: number) => {
    if (gradientConfig.stops.length <= 2) return // Keep at least 2 stops
    const newConfig = {
      ...gradientConfig,
      stops: gradientConfig.stops.filter((_, i) => i !== index)
    }
    handleGradientChange(newConfig)
  }
  
  const updateGradientStop = (index: number, updates: Partial<{ color: string; position: number }>) => {
    const newConfig = {
      ...gradientConfig,
      stops: gradientConfig.stops.map((stop, i) => i === index ? { ...stop, ...updates } : stop)
    }
    handleGradientChange(newConfig)
  }

  const handlePatternChange = (patternId: string) => {
    isInternalUpdateRef.current = true
    const selectedPattern = patterns.find((p: typeof patterns[0]) => p.id === patternId) || patterns[0]
    setPatternValue(selectedPattern.id)
    // Store the pattern ID, parent can use it to generate the CSS
    onChange(`pattern(${selectedPattern.id})`)
  }

  const handleImageChange = (url: string) => {
    isInternalUpdateRef.current = true
    setImageUrl(url)
    const finalUrl = url.startsWith('http') || url.startsWith('data:') ? `url(${url})` : url
    onChange(finalUrl)
  }

  const handleVideoChange = (url: string) => {
    isInternalUpdateRef.current = true
    setVideoUrl(url)
    const finalUrl = url.startsWith('http') || url.startsWith('data:') ? `video(${url})` : url
    onChange(finalUrl)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        handleImageChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        handleVideoChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled} onClick={(e) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}
      >
        <Tabs value={colorType} onValueChange={(v) => setColorType(v as any)} className="w-full">
          <TabsList className={`w-full grid h-8 ${allowImageVideo ? 'grid-cols-5' : 'grid-cols-3'}`}>
            <TabsTrigger value="solid" className="text-xs px-2 flex items-center justify-center" title="Solid">
              <Droplet className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="gradient" className="text-xs px-2 flex items-center justify-center" title="Gradient">
              <Sliders className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="pattern" className="text-xs px-2 flex items-center justify-center" title="Pattern">
              <Grid3x3 className="h-4 w-4" />
            </TabsTrigger>
            {allowImageVideo && (
              <>
                <TabsTrigger value="image" className="text-xs px-2 flex items-center justify-center" title="Image">
                  <Image className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="video" className="text-xs px-2 flex items-center justify-center" title="Video">
                  <Play className="h-4 w-4" />
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="solid" className="p-4 space-y-2 mt-0">
            {/* Color Swatch Grid */}
            <div className="space-y-1">
              <Label className="text-xs">Quick Colors</Label>
              <div className="grid grid-cols-8 gap-1.5">
                {[
                  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
                  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
                  '#d946ef', '#ec4899', '#f43f5e', '#6b7280', '#64748b', '#71717a', '#737373', '#78716c',
                  '#1e40af', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#ea580c', '#0891b2', '#be123c'
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSolidColorChange(color)}
                    className={`h-6 w-6 rounded border-2 transition-all hover:scale-110 ${
                      solidColor.toLowerCase() === color.toLowerCase()
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {solidColor.toLowerCase() === color.toLowerCase() && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Input */}
            <div className="space-y-1">
              <Label className="text-xs">Custom Color</Label>
              <div className="relative">
                <Input
                  type="color"
                  value={solidColor}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none z-10"
                  style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
                />
                <Input
                  type="text"
                  value={solidColor}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  className="h-8 text-xs pl-7"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gradient" className="p-4 space-y-2 mt-0">
            <div className="space-y-2">
              {/* Gradient Type */}
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select 
                  value={gradientConfig.type} 
                  onValueChange={(value: 'linear' | 'radial') => handleGradientChange({ ...gradientConfig, type: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <div className="flex items-center gap-2">
                      {gradientConfig.type === 'linear' ? (
                        <Move className="h-3.5 w-3.5" />
                      ) : (
                        <Circle className="h-3.5 w-3.5" />
                      )}
                      <SelectValue>{gradientConfig.type === 'linear' ? 'Linear' : 'Radial'}</SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">
                      <div className="flex items-center gap-2">
                        <Move className="h-3.5 w-3.5" />
                        <span>Linear</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="radial">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3.5 w-3.5" />
                        <span>Radial</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Angle for linear gradients */}
              {gradientConfig.type === 'linear' && (
                <div className="space-y-1">
                  <Label className="text-xs">Angle</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={gradientConfig.angle}
                      onChange={(e) => handleGradientChange({ ...gradientConfig, angle: parseInt(e.target.value) || 0 })}
                      className="h-8 text-xs flex-1"
                      min={0}
                      max={360}
                      step={1}
                    />
                    <div className="text-xs text-muted-foreground">deg</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradientConfig.angle}
                    onChange={(e) => handleGradientChange({ ...gradientConfig, angle: parseInt(e.target.value) })}
                    className="w-full h-2"
                  />
                </div>
              )}

              {/* Preview */}
              <div className="space-y-1">
                <Label className="text-xs">Preview</Label>
                <div 
                  className="w-full h-12 rounded border pointer-events-none"
                  style={{ background: gradientValue }}
                />
              </div>

              {/* Color Stops */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Color Stops</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={addGradientStop}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {gradientConfig.stops.map((stop, index) => (
                  <div key={`stop-${index}-${stop.color}-${stop.position}`} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="color"
                        value={stop.color}
                        onChange={(e) => updateGradientStop(index, { color: e.target.value })}
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none z-10"
                        style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
                      />
                      <Input
                        type="text"
                        value={stop.color}
                        onChange={(e) => updateGradientStop(index, { color: e.target.value })}
                        className="h-7 text-xs pl-7 flex-1"
                      />
                    </div>
                    <Input
                      type="number"
                      value={stop.position}
                      onChange={(e) => updateGradientStop(index, { position: parseInt(e.target.value) || 0 })}
                      className="h-7 text-xs w-16"
                      min={0}
                      max={100}
                    />
                    <div className="text-xs text-muted-foreground">%</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => removeGradientStop(index)}
                      disabled={gradientConfig.stops.length <= 2}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Generated CSS */}
              <div className="space-y-1">
                <Label className="text-xs">CSS</Label>
                <Input
                  type="text"
                  value={gradientValue}
                  readOnly
                  className="h-8 text-xs bg-gray-50 font-mono"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pattern" className="p-4 space-y-2 mt-0">
            <div className="space-y-2">
              <Label className="text-xs">Pattern</Label>
              <Select value={currentPattern.id} onValueChange={handlePatternChange}>
                <SelectTrigger className="h-8 text-xs">
                  <div className="flex items-center gap-2">
                    {React.createElement(currentPattern.icon, { className: "h-3.5 w-3.5" })}
                    <SelectValue>{currentPattern.name}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {patterns.map((pattern: typeof patterns[0]) => {
                    const Icon = pattern.icon
                    return (
                      <SelectItem key={pattern.id} value={pattern.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{pattern.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              
              {/* Pattern Preview */}
              <div className="space-y-1">
                <Label className="text-xs">Preview</Label>
                <div 
                  className="w-full h-16 rounded border bg-white"
                  style={getPatternStyle(currentPattern)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="p-4 space-y-2 mt-0">
            <div className="space-y-2">
              <Input
                type="text"
                value={imageUrl.replace(/^url\(|\)$/g, '')}
                onChange={(e) => handleImageChange(e.target.value)}
                className="h-8 text-xs"
                placeholder="Image URL or upload"
              />
              <label className="block">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => {
                    const input = document.getElementById(`image-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLInputElement
                    input?.click()
                  }}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload Image
                </Button>
                <input
                  id={`image-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              {imageUrl && (
                <div className="w-full h-24 rounded border overflow-hidden">
                  <img src={imageUrl.replace(/^url\(|\)$/g, '')} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="video" className="p-4 space-y-2 mt-0">
            <div className="space-y-2">
              <Input
                type="text"
                value={videoUrl.replace(/^video\(|\)$/g, '')}
                onChange={(e) => handleVideoChange(e.target.value)}
                className="h-8 text-xs"
                placeholder="Video URL or upload"
              />
              <label className="block">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => {
                    const input = document.getElementById(`video-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLInputElement
                    input?.click()
                  }}
                >
                  <Video className="h-3.5 w-3.5 mr-1.5" />
                  Upload Video
                </Button>
                <input
                  id={`video-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
              </label>
              {videoUrl && (
                <div className="w-full h-24 rounded border overflow-hidden">
                  <video src={videoUrl.replace(/^video\(|\)$/g, '')} className="w-full h-full object-cover" controls={false} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

