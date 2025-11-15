'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ColorInput } from './layout-config/ColorInput'
import { 
  Palette, 
  Image, 
  Upload, 
  Trash2, 
  Eye, 
  RotateCcw,
  Move,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

interface CanvasBackground {
  type: 'color' | 'image'
  color: string
  image: string
  opacity: number
  blur: number
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size: 'cover' | 'contain' | 'auto' | '100%'
}

interface CanvasBackgroundConfigProps {
  background: CanvasBackground
  onUpdate: (background: CanvasBackground) => void
}

export function CanvasBackgroundConfig({ background, onUpdate }: CanvasBackgroundConfigProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        onUpdate({ ...background, image: imageUrl })
        setPreviewImage(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    onUpdate({ ...background, image: '', type: 'color' })
    setPreviewImage(null)
  }

  const handleReset = () => {
    onUpdate({
      type: 'color',
      color: '#f8fafc',
      image: '',
      opacity: 1,
      blur: 0,
      position: 'center',
      size: 'cover'
    })
    setPreviewImage(null)
  }

  const renderBackgroundPreview = () => {
    const style: React.CSSProperties = {
      width: '100%',
      height: '120px',
      borderRadius: '8px',
      border: '1px solid hsl(var(--border))',
      position: 'relative',
      overflow: 'hidden'
    }

    if (background.type === 'color') {
      style.backgroundColor = background.color
    } else if (background.type === 'image' && background.image) {
      style.backgroundImage = `url(${background.image})`
      style.backgroundPosition = background.position
      style.backgroundSize = background.size
      style.backgroundRepeat = 'no-repeat'
      style.opacity = background.opacity
      if (background.blur > 0) {
        style.filter = `blur(${background.blur}px)`
      }
    }

    return (
      <div style={style}>
        {background.type === 'image' && background.image && (
          <div 
            className="absolute inset-0 bg-black/20 flex items-center justify-center"
            style={{ opacity: 1 - background.opacity }}
          >
            <span className="text-white text-sm font-medium">Preview</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Canvas Background</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure the background appearance of your canvas
        </p>
      </div>

      {/* Background Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Background Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={background.type} 
            onValueChange={(value) => onUpdate({ ...background, type: value as 'color' | 'image' })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="color" id="color" />
              <label htmlFor="color" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>Color</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" />
              <label htmlFor="image" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center space-x-2">
                <Image className="h-4 w-4" />
                <span>Image</span>
              </label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Color Background Configuration */}
      {background.type === 'color' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Background Color</CardTitle>
          </CardHeader>
          <CardContent>
            <ColorInput
              value={background.color}
              onChange={(color) => onUpdate({ ...background, color })}
              allowImageVideo={false}
              className="relative"
              placeholder="#ffffff"
              inputClassName="h-8 text-xs pl-7"
            />
          </CardContent>
        </Card>
      )}

      {/* Image Background Configuration */}
      {background.type === 'image' && (
        <div className="space-y-4">
          {/* Image Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Background Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!background.image ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a background image
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="background-image-upload"
                  />
                  <Button asChild size="sm">
                    <label htmlFor="background-image-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </label>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {renderBackgroundPreview()}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => document.getElementById('background-image-upload')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleRemoveImage}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="background-image-upload"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Settings */}
          {background.image && (
            <div className="space-y-4">
              {/* Opacity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Transparency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="opacity">Opacity: {Math.round(background.opacity * 100)}%</Label>
                    <Input
                      id="opacity"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={background.opacity}
                      onChange={(e) => onUpdate({ ...background, opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Blur */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Blur Effect</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="blur">Blur: {background.blur}px</Label>
                    <Input
                      id="blur"
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={background.blur}
                      onChange={(e) => onUpdate({ ...background, blur: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Position */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={background.position} 
                    onValueChange={(value) => onUpdate({ ...background, position: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Size */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={background.size} 
                    onValueChange={(value) => onUpdate({ ...background, size: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover (Fill)</SelectItem>
                      <SelectItem value="contain">Contain (Fit)</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="100%">100% (Original)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderBackgroundPreview()}
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
      </div>
    </div>
  )
}
