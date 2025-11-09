'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, Video, Image, Grid3x3, Play, Droplet, Sliders, Layers, Plus, Trash2, Move, Minus, GripVertical, Hash, Sparkles, Circle, Copy, Check, Eye, Star } from 'lucide-react'
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
  const [copied, setCopied] = useState(false)
  
  // Recent colors stored in localStorage
  const RECENT_COLORS_KEY = 'color-picker-recent-colors'
  const FAVORITE_COLORS_KEY = 'color-picker-favorite-colors'
  const MAX_RECENT_COLORS = 8
  
  const getRecentColors = (): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }
  
  const getFavoriteColors = (): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(FAVORITE_COLORS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }
  
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

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Helper to convert rgba to hex (ignoring alpha)
  const rgbaToHex = (rgba: string): string => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0')
      const g = parseInt(match[2]).toString(16).padStart(2, '0')
      const b = parseInt(match[3]).toString(16).padStart(2, '0')
      return `#${r}${g}${b}`
    }
    return rgba
  }

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Helper to convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  // Get color in different formats
  const getColorFormats = () => {
    const baseColor = extractBaseColor(solidColor)
    const rgb = hexToRgb(baseColor)
    if (!rgb) return { hex: baseColor, rgb: '', hsl: '' }
    
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const rgbStr = opacity < 1 
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity.toFixed(2)})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    const hslStr = opacity < 1
      ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${opacity.toFixed(2)})`
      : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    
    return {
      hex: opacity < 1 ? hexToRgba(baseColor, opacity) : baseColor,
      rgb: rgbStr,
      hsl: hslStr
    }
  }

  // Helper to extract opacity from rgba/rgb
  const extractOpacity = (color: string): number => {
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba\([^)]+,\s*([\d.]+)\)/)
      if (match) return parseFloat(match[1])
    }
    return 1 // Default to fully opaque
  }

  // Helper to extract base color (hex or rgb without alpha)
  const extractBaseColor = (color: string): string => {
    if (color.startsWith('rgba')) {
      return rgbaToHex(color)
    }
    if (color.startsWith('rgb')) {
      return rgbaToHex(color)
    }
    return color
  }

  const parsed = parseValue(value)
  
  // Recent colors functions (must be after extractBaseColor is defined)
  const addToRecentColors = (color: string) => {
    // Only add solid colors (hex/rgb) to recent colors, not gradients/patterns
    if (color.startsWith('#') || color.startsWith('rgb')) {
      const baseColor = extractBaseColor(color)
      // Use functional update to avoid stale closure
      setRecentColors((prevColors) => {
        const updated = [baseColor, ...prevColors.filter(c => c !== baseColor)].slice(0, MAX_RECENT_COLORS)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated))
          } catch {
            // Ignore localStorage errors
          }
        }
        return updated
      })
    }
  }
  
  const handleColorChange = (color: string) => {
    onChange(color)
    addToRecentColors(color)
  }
  
  const copyColorToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = value
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Ignore copy errors
      }
      document.body.removeChild(textArea)
    }
  }
  
  // Toggle favorite color
  const toggleFavorite = (color: string) => {
    const baseColor = extractBaseColor(color)
    const isFavorite = favoriteColors.includes(baseColor)
    const updated = isFavorite
      ? favoriteColors.filter(c => c !== baseColor)
      : [...favoriteColors, baseColor].slice(0, 12) // Max 12 favorites
    
    setFavoriteColors(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FAVORITE_COLORS_KEY, JSON.stringify(updated))
      } catch {
        // Ignore localStorage errors
      }
    }
  }
  
  const isFavorite = (color: string): boolean => {
    const baseColor = extractBaseColor(color)
    return favoriteColors.includes(baseColor)
  }
  
  // Eye dropper tool
  const startEyeDropper = async () => {
    if (!('EyeDropper' in window)) {
      // Fallback: show message or use alternative method
      alert('Eye dropper is not supported in your browser. Please use Chrome, Edge, or Safari 18+')
      return
    }
    
    try {
      setIsPickingColor(true)
      // @ts-ignore - EyeDropper API
      const eyeDropper = new EyeDropper()
      const result = await eyeDropper.open()
      if (result.sRGBHex) {
        handleSolidColorChange(result.sRGBHex)
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Eye dropper error:', err)
      }
    } finally {
      setIsPickingColor(false)
    }
  }
  // If image/video is not allowed but value is image/video, default to solid
  const initialType = parsed.type
  const safeType = (!allowImageVideo && (initialType === 'image' || initialType === 'video')) ? 'solid' : initialType
  const [colorType, setColorType] = useState<'solid' | 'gradient' | 'pattern' | 'image' | 'video'>(safeType as any)
  const baseSolidColor = parsed.type === 'solid' ? extractBaseColor(parsed.extracted) : '#ffffff'
  const [solidColor, setSolidColor] = useState(baseSolidColor)
  const [opacity, setOpacity] = useState(parsed.type === 'solid' ? extractOpacity(parsed.extracted) : 1)
  const [recentColors, setRecentColors] = useState<string[]>(getRecentColors())
  const [favoriteColors, setFavoriteColors] = useState<string[]>(getFavoriteColors())
  const [showColorFormats, setShowColorFormats] = useState(false)
  const [isPickingColor, setIsPickingColor] = useState(false)
  // Default to 'recent' if available, otherwise 'quick'
  const [selectedColorSet, setSelectedColorSet] = useState<string>(
    recentColors.length > 0 ? 'recent' : 'quick'
  )

  // Auto-switch to valid set if current becomes unavailable (only when selectedColorSet changes, not when colors are added)
  React.useEffect(() => {
    // Only auto-switch if the current set becomes unavailable
    // This effect only runs when selectedColorSet changes, not when recentColors/favoriteColors change
    // This prevents the color set from changing when you adjust a custom color
    if (selectedColorSet === 'recent' && recentColors.length === 0) {
      setSelectedColorSet('quick')
    } else if (selectedColorSet === 'favorites' && favoriteColors.length === 0) {
      setSelectedColorSet('quick')
    }
  }, [selectedColorSet]) // Only depend on selectedColorSet, not on recentColors/favoriteColors length
  
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
  
  // Preset color palettes
  const colorPalettes: Record<string, string[]> = {
    'Material Design': [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
      '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000', '#FFFFFF'
    ],
    'Tailwind': [
      '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
      '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
      '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
      '#EC4899', '#F43F5E', '#6B7280', '#64748B', '#000000', '#FFFFFF'
    ],
    'Pastel': [
      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
      '#E0BBE4', '#FEC8D8', '#FFDFD3', '#D5F4E6', '#F0E6FF',
      '#FFE5F1', '#E8F5E9', '#FFF3E0', '#E1F5FE', '#F3E5F5',
      '#FFE0B2', '#C5E1A5', '#B2EBF2', '#F8BBD0', '#FFFFFF'
    ],
    'Grayscale': [
      '#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666',
      '#808080', '#999999', '#B3B3B3', '#CCCCCC', '#E6E6E6',
      '#FFFFFF'
    ]
  }
  
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
        setOpacity(1)
      } else {
        const baseColor = extractBaseColor(parsed.extracted)
        setSolidColor(baseColor)
        setOpacity(extractOpacity(parsed.extracted))
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
    const baseColor = extractBaseColor(color)
    setSolidColor(baseColor)
    // Apply current opacity
    if (opacity < 1) {
      const rgbaColor = hexToRgba(baseColor, opacity)
      handleColorChange(rgbaColor)
    } else {
      handleColorChange(baseColor)
    }
  }

  const handleOpacityChange = (newOpacity: number) => {
    isInternalUpdateRef.current = true
    setOpacity(newOpacity)
    if (newOpacity < 1) {
      const rgbaColor = hexToRgba(solidColor, newOpacity)
      handleColorChange(rgbaColor)
    } else {
      handleColorChange(solidColor)
    }
  }

  const handleGradientChange = (config: typeof gradientConfig) => {
    isInternalUpdateRef.current = true
    setGradientConfig(config)
    handleColorChange(buildGradientString(config))
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
    handleColorChange(`pattern(${selectedPattern.id})`)
  }

  const handleImageChange = (url: string) => {
    isInternalUpdateRef.current = true
    setImageUrl(url)
    const finalUrl = url.startsWith('http') || url.startsWith('data:') ? `url(${url})` : url
    handleColorChange(finalUrl)
  }

  const handleVideoChange = (url: string) => {
    isInternalUpdateRef.current = true
    setVideoUrl(url)
    const finalUrl = url.startsWith('http') || url.startsWith('data:') ? `video(${url})` : url
    handleColorChange(finalUrl)
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
            {/* Color Set Selector */}
            <div className="space-y-1">
              <Label className="text-xs">Color Set</Label>
              <Select value={selectedColorSet} onValueChange={setSelectedColorSet}>
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick Colors</SelectItem>
                  {recentColors.length > 0 && <SelectItem value="recent">Recent Colors</SelectItem>}
                  {favoriteColors.length > 0 && <SelectItem value="favorites">Favorites</SelectItem>}
                  {Object.keys(colorPalettes).map((name) => (
                    <SelectItem key={name} value={name.toLowerCase().replace(/\s+/g, '-')}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quick Colors */}
              {selectedColorSet === 'quick' && (
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
              )}

              {/* Recent Colors */}
              {selectedColorSet === 'recent' && recentColors.length > 0 && (
                <div className="grid grid-cols-8 gap-1.5">
                  {recentColors.map((color, index) => (
                    <button
                      key={`recent-${color}-${index}`}
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
              )}

              {/* Favorite Colors */}
              {selectedColorSet === 'favorites' && favoriteColors.length > 0 && (
                <div className="grid grid-cols-8 gap-1.5">
                  {favoriteColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleSolidColorChange(color)}
                      className={`h-6 w-6 rounded border-2 transition-all hover:scale-110 relative ${
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
                      <Star className="absolute -top-1 -right-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Preset Palettes */}
              {Object.entries(colorPalettes).map(([name, colors]) => {
                const paletteKey = name.toLowerCase().replace(/\s+/g, '-')
                if (selectedColorSet === paletteKey) {
                  return (
                    <div key={name} className="grid grid-cols-10 gap-1">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleSolidColorChange(color)}
                          className={`h-5 w-5 rounded border transition-all hover:scale-110 ${
                            solidColor.toLowerCase() === color.toLowerCase()
                              ? 'border-blue-500 ring-1 ring-blue-500/50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  )
                }
                return null
              })}
            </div>

            {/* Custom Color Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Custom Color</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    onClick={startEyeDropper}
                    disabled={isPickingColor || !('EyeDropper' in window)}
                    title="Pick color from screen (Eye dropper)"
                  >
                    <Eye className={`h-3 w-3 ${isPickingColor ? 'animate-pulse' : ''}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    onClick={() => toggleFavorite(solidColor)}
                    title={isFavorite(solidColor) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`h-3 w-3 ${isFavorite(solidColor) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    onClick={() => setShowColorFormats(!showColorFormats)}
                    title="Show color formats"
                  >
                    {showColorFormats ? 'Hide' : 'Formats'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    onClick={copyColorToClipboard}
                    title="Copy color value"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
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
              
              {/* Color Format Display */}
              {showColorFormats && (
                <div className="space-y-1 pt-1 border-t">
                  {(() => {
                    const formats = getColorFormats()
                    return (
                      <>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">HEX:</span>
                          <code className="font-mono text-[10px]">{formats.hex}</code>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">RGB:</span>
                          <code className="font-mono text-[10px]">{formats.rgb}</code>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">HSL:</span>
                          <code className="font-mono text-[10px]">{formats.hsl}</code>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Opacity/Transparency Control */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs text-muted-foreground">{Math.round(opacity * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(opacity * 100)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    const clamped = Math.max(0, Math.min(100, val))
                    handleOpacityChange(clamped / 100)
                  }}
                  className="h-7 w-16 text-xs"
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

