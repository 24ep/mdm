'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Upload, X } from 'lucide-react'
import { ComponentConfig, GlobalStyleConfig } from './types'
import { GlobalComponentStyles } from './GlobalComponentStyles'
import toast from 'react-hot-toast'

interface SettingsTabProps {
  isMobileViewport: boolean
  componentConfigs: Record<string, ComponentConfig>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
}

export function SettingsTab({
  isMobileViewport,
  componentConfigs,
  handleComponentConfigUpdate,
}: SettingsTabProps) {
  const globalStyle = componentConfigs.global as any as GlobalStyleConfig | undefined

  const handleGlobalStyleUpdate = (updates: Partial<GlobalStyleConfig>) => {
    handleComponentConfigUpdate('global' as any, updates as any)
  }

  return (
    <div className="space-y-4">
      {/* Global Style Settings */}
      <div className="pb-3 border-b">
        <div className={`${isMobileViewport ? 'text-base' : 'text-sm'} font-semibold mb-2 px-4`}>Global Style</div>
        
        <div className={`${isMobileViewport ? 'px-3 py-3' : 'px-4 py-2'} space-y-3`}>
            {/* Application Logo */}
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"} htmlFor="logo-upload">Application Logo</Label>
              <div className="flex items-center gap-2 mt-1">
                {globalStyle?.logoUrl ? (
                  <>
                    <img 
                      src={globalStyle.logoUrl} 
                      alt="Logo" 
                      className={`${isMobileViewport ? 'h-12 w-12' : 'h-10 w-10'} object-contain rounded border`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleGlobalStyleUpdate({ logoUrl: '' })
                        toast.success('Logo removed')
                      }}
                      className={isMobileViewport ? "h-10" : "h-8"}
                    >
                      <X className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} mr-1`} />
                      Remove
                    </Button>
                  </>
                ) : (
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      className={`${isMobileViewport ? 'h-10' : 'h-8'} flex items-center gap-1`}
                    >
                      <Upload className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                      Upload Logo
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        if (!file.type.startsWith('image/')) {
                          toast.error('Please select a valid image file')
                          return
                        }
                        
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error('File size must be less than 2MB')
                          return
                        }
                        
                        try {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            const result = e.target?.result as string
                            handleGlobalStyleUpdate({ logoUrl: result })
                          }
                          reader.readAsDataURL(file)
                          
                          const formData = new FormData()
                          formData.append('logo', file)
                          
                          const response = await fetch('/api/upload/logo', {
                            method: 'POST',
                            body: formData,
                          })
                          
                          if (response.ok) {
                            const { url } = await response.json()
                            handleGlobalStyleUpdate({ logoUrl: url })
                            toast.success('Logo uploaded successfully')
                          } else {
                            reader.readAsDataURL(file)
                          }
                        } catch (error) {
                          console.error('Error uploading logo:', error)
                          toast.error('Failed to upload logo')
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} text-muted-foreground mt-1`}>
                PNG, JPG, SVG up to 2MB
              </p>
            </div>

            {/* Favicon */}
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"} htmlFor="favicon-upload">Favicon</Label>
              <div className="flex items-center gap-2 mt-1">
                {globalStyle?.faviconUrl ? (
                  <>
                    <img 
                      src={globalStyle.faviconUrl} 
                      alt="Favicon" 
                      className={`${isMobileViewport ? 'h-8 w-8' : 'h-6 w-6'} object-contain rounded border`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleGlobalStyleUpdate({ faviconUrl: '' })
                        toast.success('Favicon removed')
                      }}
                      className={isMobileViewport ? "h-10" : "h-8"}
                    >
                      <X className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} mr-1`} />
                      Remove
                    </Button>
                  </>
                ) : (
                  <label htmlFor="favicon-upload" className="cursor-pointer">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      className={`${isMobileViewport ? 'h-10' : 'h-8'} flex items-center gap-1`}
                    >
                      <Upload className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                      Upload Favicon
                    </Button>
                    <input
                      id="favicon-upload"
                      type="file"
                      accept="image/*,.ico"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', '.ico']
                        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.ico')) {
                          toast.error('Please select a valid favicon file (PNG, ICO, SVG)')
                          return
                        }
                        
                        if (file.size > 1024 * 1024) {
                          toast.error('File size must be less than 1MB')
                          return
                        }
                        
                        try {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            const result = e.target?.result as string
                            handleGlobalStyleUpdate({ faviconUrl: result })
                          }
                          reader.readAsDataURL(file)
                          
                          const formData = new FormData()
                          formData.append('favicon', file)
                          
                          const response = await fetch('/api/upload/favicon', {
                            method: 'POST',
                            body: formData,
                          })
                          
                          if (response.ok) {
                            const { url } = await response.json()
                            handleGlobalStyleUpdate({ faviconUrl: url })
                            toast.success('Favicon uploaded successfully')
                          } else {
                            reader.readAsDataURL(file)
                          }
                        } catch (error) {
                          console.error('Error uploading favicon:', error)
                          toast.error('Failed to upload favicon')
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} text-muted-foreground mt-1`}>
                ICO, PNG, SVG up to 1MB
              </p>
            </div>

            {/* Primary Color */}
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Primary Color</Label>
              <div className="relative mt-1">
                <Input 
                  type="color" 
                  className={`absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none`}
                  style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
                  value={globalStyle?.primaryColor || '#3b82f6'} 
                  onChange={(e) => handleGlobalStyleUpdate({ primaryColor: e.target.value })} 
                />
                <Input
                  type="text"
                  className={isMobileViewport ? "h-10 flex-1 pl-7" : "h-8 flex-1 text-xs pl-7"}
                  value={globalStyle?.primaryColor || '#3b82f6'}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^#[0-9A-F]{6}$/i.test(value) || value === '') {
                      handleGlobalStyleUpdate({ primaryColor: value || '#3b82f6' })
                    }
                  }}
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Theme</Label>
              <Select value={globalStyle?.theme || 'light'} onValueChange={(value) => handleGlobalStyleUpdate({ theme: value as 'light' | 'dark' | 'auto' })}>
                <SelectTrigger className={isMobileViewport ? "h-10" : "h-8"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Background Color</Label>
              <Input 
                type="color" 
                className={isMobileViewport ? "h-10" : "h-8"} 
                value={globalStyle?.backgroundColor || '#ffffff'} 
                onChange={(e) => handleGlobalStyleUpdate({ backgroundColor: e.target.value })} 
              />
            </div>
            
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Font Family</Label>
              <Select value={globalStyle?.fontFamily || 'system'} onValueChange={(value) => handleGlobalStyleUpdate({ fontFamily: value })}>
                <SelectTrigger className={isMobileViewport ? "h-10" : "h-8"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="open-sans">Open Sans</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Font Size (base)</Label>
              <Input 
                type="number" 
                className={isMobileViewport ? "h-10" : "h-8"} 
                value={globalStyle?.fontSize || 14} 
                onChange={(e) => handleGlobalStyleUpdate({ fontSize: parseInt(e.target.value) || 14 })} 
              />
            </div>
            
            <div>
              <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Border Radius</Label>
              <Select value={globalStyle?.borderRadius || 'medium'} onValueChange={(value) => handleGlobalStyleUpdate({ borderRadius: value })}>
                <SelectTrigger className={isMobileViewport ? "h-10" : "h-8"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </div>

      {/* Component Styles */}
      <GlobalComponentStyles
        globalStyle={globalStyle}
        onUpdate={handleGlobalStyleUpdate}
        isMobileViewport={isMobileViewport}
      />
    </div>
  )
}

