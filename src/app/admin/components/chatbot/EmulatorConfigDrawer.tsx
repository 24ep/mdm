'use client'

import { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Upload, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmulatorConfig {
  backgroundColor?: string
  backgroundImage?: string
  text?: string
  description?: string
  [key: string]: any
}

interface EmulatorConfigDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: EmulatorConfig
  onConfigChange: (config: EmulatorConfig) => void
}

export function EmulatorConfigDrawer({
  open,
  onOpenChange,
  config,
  onConfigChange
}: EmulatorConfigDrawerProps) {
  const [localConfig, setLocalConfig] = useState<EmulatorConfig>(config)
  const [isUploading, setIsUploading] = useState(false)

  // Sync local config with prop config when drawer opens
  useEffect(() => {
    if (open) {
      setLocalConfig(config)
    }
  }, [open, config])

  const handleChange = (key: string, value: any) => {
    const updated = { ...localConfig, [key]: value }
    setLocalConfig(updated)
    onConfigChange(updated)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload/emulator-background', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      if (data.success && data.url) {
        handleChange('backgroundImage', data.url)
        toast.success('Image uploaded successfully')
      } else {
        throw new Error('Upload failed: No URL returned')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const removeBackgroundImage = () => {
    handleChange('backgroundImage', '')
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent widthClassName="w-[500px]">
        <DrawerHeader>
          <DrawerTitle>Emulator Configuration</DrawerTitle>
          <DrawerDescription>
            Configure the emulator appearance and settings
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Background Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Background Settings</h4>
            
            <div className="space-y-2">
              <Label>Background Color</Label>
              <ColorInput
                value={localConfig.backgroundColor || '#ffffff'}
                onChange={(color) => handleChange('backgroundColor', color)}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-10 text-xs pl-7 w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Background Image</Label>
              {localConfig.backgroundImage ? (
                <div className="relative">
                  <div className="relative w-full h-32 rounded-md overflow-hidden border">
                    <img
                      src={localConfig.backgroundImage}
                      alt="Background"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={removeBackgroundImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-4">
                  <label className={`cursor-pointer flex flex-col items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload or paste URL</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              )}
              <Input
                value={localConfig.backgroundImage || ''}
                onChange={(e) => handleChange('backgroundImage', e.target.value)}
                placeholder="Or enter image URL"
                className="mt-2"
              />
            </div>
          </div>

          {/* Text Settings */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold">Text Settings</h4>
            
            <div className="space-y-2">
              <Label>Title / Text</Label>
              <Input
                value={localConfig.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Enter title or text"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={localConfig.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter description"
                rows={4}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

