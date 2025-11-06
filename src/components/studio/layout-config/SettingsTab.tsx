'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Upload, X, LogIn, Save } from 'lucide-react'
import { ComponentConfig, GlobalStyleConfig } from './types'
import { GlobalComponentStyles } from './GlobalComponentStyles'
import { SpacesEditorManager, LoginPageConfig, SpacesEditorPage } from '@/lib/space-studio-manager'
import toast from 'react-hot-toast'
import { Separator } from '@/components/ui/separator'

interface SettingsTabProps {
  spaceId: string
  isMobileViewport: boolean
  componentConfigs: Record<string, ComponentConfig>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
  pages: SpacesEditorPage[]
}

export function SettingsTab({
  spaceId,
  isMobileViewport,
  componentConfigs,
  handleComponentConfigUpdate,
  pages,
}: SettingsTabProps) {
  const globalStyle = componentConfigs.global as any as GlobalStyleConfig | undefined
  const [loginPageConfig, setLoginPageConfig] = useState<LoginPageConfig | null>(null)
  const [postAuthRedirectPageId, setPostAuthRedirectPageId] = useState<string>('')
  const [isSavingLoginConfig, setIsSavingLoginConfig] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)
        if (config) {
          // Use config values or provide defaults
          setLoginPageConfig(config.loginPageConfig || {
            backgroundType: 'gradient',
            backgroundColor: '#1e40af',
            gradient: {
              from: '#1e40af',
              to: '#3b82f6',
              angle: 135
            },
            leftPanelWidth: '70%',
            rightPanelWidth: '30%',
            cardStyle: {
              backgroundColor: '#ffffff',
              textColor: '#1f2937',
              borderColor: '#e5e7eb',
              borderRadius: 8,
              shadow: true
            },
            title: 'Sign in',
            description: 'Access this workspace',
            showLogo: false
          })
          setPostAuthRedirectPageId(config.postAuthRedirectPageId || '')
        } else {
          // Initialize with defaults if no config exists
          setLoginPageConfig({
            backgroundType: 'gradient',
            backgroundColor: '#1e40af',
            gradient: {
              from: '#1e40af',
              to: '#3b82f6',
              angle: 135
            },
            leftPanelWidth: '70%',
            rightPanelWidth: '30%',
            cardStyle: {
              backgroundColor: '#ffffff',
              textColor: '#1f2937',
              borderColor: '#e5e7eb',
              borderRadius: 8,
              shadow: true
            },
            title: 'Sign in',
            description: 'Access this workspace',
            showLogo: false
          })
        }
      } catch (error) {
        console.error('Error loading login config:', error)
        // Initialize with defaults on error
        setLoginPageConfig({
          backgroundType: 'gradient',
          backgroundColor: '#1e40af',
          gradient: {
            from: '#1e40af',
            to: '#3b82f6',
            angle: 135
          },
          leftPanelWidth: '70%',
          rightPanelWidth: '30%',
          cardStyle: {
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            borderColor: '#e5e7eb',
            borderRadius: 8,
            shadow: true
          },
          title: 'Sign in',
          description: 'Access this workspace',
          showLogo: false
        })
      }
    }
    loadConfig()
  }, [spaceId])

  const handleGlobalStyleUpdate = (updates: Partial<GlobalStyleConfig>) => {
    handleComponentConfigUpdate('global' as any, updates as any)
  }

  const handleSaveLoginConfig = async () => {
    setIsSavingLoginConfig(true)
    try {
      const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId) || await SpacesEditorManager.createDefaultConfig(spaceId)
      
      // Create default login config if none exists and user has made changes
      const finalLoginConfig = loginPageConfig || {
        backgroundType: 'gradient' as const,
        backgroundColor: '#1e40af',
        gradient: {
          from: '#1e40af',
          to: '#3b82f6',
          angle: 135
        },
        leftPanelWidth: '70%',
        rightPanelWidth: '30%',
        cardStyle: {
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          borderColor: '#e5e7eb',
          borderRadius: 8,
          shadow: true
        },
        title: 'Sign in',
        description: 'Access this workspace',
        showLogo: false
      }
      
      const updatedConfig = {
        ...config,
        loginPageConfig: finalLoginConfig,
        postAuthRedirectPageId: postAuthRedirectPageId || undefined,
        updatedAt: new Date().toISOString()
      }
      await SpacesEditorManager.saveSpacesEditorConfig(updatedConfig)
      setLoginPageConfig(finalLoginConfig) // Update local state
      toast.success('Login page configuration saved')
    } catch (error) {
      console.error('Error saving login config:', error)
      toast.error('Failed to save login page configuration')
    } finally {
      setIsSavingLoginConfig(false)
    }
  }

  const availablePages = pages.filter(p => p.isActive && !p.hidden)
  
  // Ensure we always have a config object for the form
  const currentLoginConfig = loginPageConfig || {
    backgroundType: 'gradient' as const,
    backgroundColor: '#1e40af',
    gradient: {
      from: '#1e40af',
      to: '#3b82f6',
      angle: 135
    },
    leftPanelWidth: '70%',
    rightPanelWidth: '30%',
    cardStyle: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderColor: '#e5e7eb',
      borderRadius: 8,
      shadow: true
    },
    title: 'Sign in',
    description: 'Access this workspace',
    showLogo: false
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

      {/* Login Page Configuration */}
      <Separator className="my-4" />
      <div className="pb-3 border-b">
        <div className={`${isMobileViewport ? 'text-base' : 'text-sm'} font-semibold mb-2 px-4 flex items-center gap-2`}>
          <LogIn className="h-4 w-4" />
          Login Page Configuration
        </div>
        
        <div className={`${isMobileViewport ? 'px-3 py-3' : 'px-4 py-2'} space-y-3`}>
           {/* Title */}
           <div>
             <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Login Title</Label>
             <Input
               type="text"
               className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1 text-xs"}
               value={currentLoginConfig.title || 'Sign in'}
               onChange={(e) => setLoginPageConfig({ ...currentLoginConfig, title: e.target.value } as LoginPageConfig)}
               placeholder="Sign in"
             />
           </div>

           {/* Description */}
           <div>
             <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Description</Label>
             <Input
               type="text"
               className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1 text-xs"}
               value={currentLoginConfig.description || 'Access this workspace'}
               onChange={(e) => setLoginPageConfig({ ...currentLoginConfig, description: e.target.value } as LoginPageConfig)}
               placeholder="Access this workspace"
             />
           </div>

           {/* Background Type */}
           <div>
             <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Background Type</Label>
             <Select
               value={currentLoginConfig.backgroundType || 'gradient'}
               onValueChange={(value: 'color' | 'image' | 'gradient') => {
                 setLoginPageConfig({ ...currentLoginConfig, backgroundType: value } as LoginPageConfig)
               }}
             >
              <SelectTrigger className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

           {/* Background Color */}
           {currentLoginConfig.backgroundType === 'color' && (
             <div>
               <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Background Color</Label>
               <div className="flex items-center gap-2 mt-1">
                 <Input
                   type="color"
                   className={isMobileViewport ? "h-10 w-20" : "h-8 w-16"}
                   value={currentLoginConfig.backgroundColor || '#1e40af'}
                   onChange={(e) => setLoginPageConfig({ ...currentLoginConfig, backgroundColor: e.target.value } as LoginPageConfig)}
                 />
                 <Input
                   type="text"
                   className={isMobileViewport ? "h-10 flex-1" : "h-8 flex-1 text-xs"}
                   value={currentLoginConfig.backgroundColor || '#1e40af'}
                   onChange={(e) => setLoginPageConfig({ ...currentLoginConfig, backgroundColor: e.target.value } as LoginPageConfig)}
                   placeholder="#1e40af"
                 />
               </div>
             </div>
           )}

           {/* Gradient */}
           {currentLoginConfig.backgroundType === 'gradient' && (
             <>
               <div>
                 <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Gradient From</Label>
                 <div className="flex items-center gap-2 mt-1">
                   <Input
                     type="color"
                     className={isMobileViewport ? "h-10 w-20" : "h-8 w-16"}
                     value={currentLoginConfig.gradient?.from || '#1e40af'}
                     onChange={(e) => setLoginPageConfig({
                       ...currentLoginConfig,
                       gradient: { ...currentLoginConfig.gradient, from: e.target.value, to: currentLoginConfig.gradient?.to || '#3b82f6', angle: currentLoginConfig.gradient?.angle || 135 }
                     } as LoginPageConfig)}
                   />
                   <Input
                     type="text"
                     className={isMobileViewport ? "h-10 flex-1" : "h-8 flex-1 text-xs"}
                     value={currentLoginConfig.gradient?.from || '#1e40af'}
                     onChange={(e) => setLoginPageConfig({
                       ...currentLoginConfig,
                       gradient: { ...currentLoginConfig.gradient, from: e.target.value, to: currentLoginConfig.gradient?.to || '#3b82f6', angle: currentLoginConfig.gradient?.angle || 135 }
                     } as LoginPageConfig)}
                   />
                 </div>
               </div>
               <div>
                 <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Gradient To</Label>
                 <div className="flex items-center gap-2 mt-1">
                   <Input
                     type="color"
                     className={isMobileViewport ? "h-10 w-20" : "h-8 w-16"}
                     value={currentLoginConfig.gradient?.to || '#3b82f6'}
                     onChange={(e) => setLoginPageConfig({
                       ...currentLoginConfig,
                       gradient: { ...currentLoginConfig.gradient, from: currentLoginConfig.gradient?.from || '#1e40af', to: e.target.value, angle: currentLoginConfig.gradient?.angle || 135 }
                     } as LoginPageConfig)}
                   />
                   <Input
                     type="text"
                     className={isMobileViewport ? "h-10 flex-1" : "h-8 flex-1 text-xs"}
                     value={currentLoginConfig.gradient?.to || '#3b82f6'}
                     onChange={(e) => setLoginPageConfig({
                       ...currentLoginConfig,
                       gradient: { ...currentLoginConfig.gradient, from: currentLoginConfig.gradient?.from || '#1e40af', to: e.target.value, angle: currentLoginConfig.gradient?.angle || 135 }
                     } as LoginPageConfig)}
                   />
                 </div>
               </div>
               <div>
                 <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Gradient Angle</Label>
                 <Input
                   type="number"
                   className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1 text-xs"}
                   value={currentLoginConfig.gradient?.angle || 135}
                   onChange={(e) => setLoginPageConfig({
                     ...currentLoginConfig,
                     gradient: { ...currentLoginConfig.gradient, from: currentLoginConfig.gradient?.from || '#1e40af', to: currentLoginConfig.gradient?.to || '#3b82f6', angle: parseInt(e.target.value) || 135 }
                   } as LoginPageConfig)}
                   placeholder="135"
                   min="0"
                   max="360"
                 />
               </div>
             </>
           )}

           {/* Background Image */}
           {currentLoginConfig.backgroundType === 'image' && (
             <div>
               <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Background Image URL</Label>
               <Input
                 type="text"
                 className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1 text-xs"}
                 value={currentLoginConfig.backgroundImage || ''}
                 onChange={(e) => setLoginPageConfig({ ...currentLoginConfig, backgroundImage: e.target.value } as LoginPageConfig)}
                 placeholder="https://example.com/image.jpg"
               />
             </div>
           )}

           {/* Panel Widths */}
           <div className="grid grid-cols-2 gap-2">
             <div>
               <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Left Panel Width</Label>
               <Input
                 type="text"
                 className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1 text-xs"}
                 value={currentLoginConfig.leftPanelWidth || '70%'}
                 onChange={(e) => setLoginPageConfig({ ...currentLoginConfig, leftPanelWidth: e.target.value } as LoginPageConfig)}
                 placeholder="70%"
               />
             </div>
             <div>
               <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Right Panel Width</Label>
               <Input
                 type="text"
                 className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1 text-xs"}
                 value={currentLoginConfig.rightPanelWidth || '30%'}
                 onChange={(e) => setLoginPageConfig({ ...currentLoginConfig, rightPanelWidth: e.target.value } as LoginPageConfig)}
                 placeholder="30%"
               />
             </div>
           </div>

           {/* Card Style */}
           <div className="space-y-2 pt-2 border-t">
             <Label className={isMobileViewport ? "text-sm" : "text-xs"}>{isMobileViewport ? "Card Style" : "Card Style"}</Label>
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <Label className={isMobileViewport ? "text-xs" : "text-[10px]"}>{isMobileViewport ? "Card Background" : "Card BG"}</Label>
                 <Input
                   type="color"
                   className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1"}
                   value={currentLoginConfig.cardStyle?.backgroundColor || '#ffffff'}
                   onChange={(e) => setLoginPageConfig({
                     ...currentLoginConfig,
                     cardStyle: { ...currentLoginConfig.cardStyle, backgroundColor: e.target.value }
                   } as LoginPageConfig)}
                 />
               </div>
               <div>
                 <Label className={isMobileViewport ? "text-xs" : "text-[10px]"}>{isMobileViewport ? "Card Text" : "Text"}</Label>
                 <Input
                   type="color"
                   className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1"}
                   value={currentLoginConfig.cardStyle?.textColor || '#1f2937'}
                   onChange={(e) => setLoginPageConfig({
                     ...currentLoginConfig,
                     cardStyle: { ...currentLoginConfig.cardStyle, textColor: e.target.value }
                   } as LoginPageConfig)}
                 />
               </div>
             </div>
             <div>
               <Label className={isMobileViewport ? "text-xs" : "text-[10px]"}>Border Radius</Label>
               <Input
                 type="number"
                 className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1 text-xs"}
                 value={currentLoginConfig.cardStyle?.borderRadius || 8}
                 onChange={(e) => setLoginPageConfig({
                   ...currentLoginConfig,
                   cardStyle: { ...currentLoginConfig.cardStyle, borderRadius: parseInt(e.target.value) || 8 }
                 } as LoginPageConfig)}
                 placeholder="8"
                 min="0"
               />
             </div>
             <div className="flex items-center space-x-2">
               <Switch
                 id="card-shadow"
                 checked={currentLoginConfig.cardStyle?.shadow !== false}
                 onCheckedChange={(checked) => setLoginPageConfig({
                   ...currentLoginConfig,
                   cardStyle: { ...currentLoginConfig.cardStyle, shadow: checked }
                 } as LoginPageConfig)}
               />
               <Label htmlFor="card-shadow" className={isMobileViewport ? "text-xs" : "text-[10px]"}>Enable Shadow</Label>
             </div>
           </div>

          {/* Post-Auth Redirect Page */}
          <div className="pt-2 border-t">
            <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Post-Authentication Redirect Page</Label>
            <Select
              value={postAuthRedirectPageId || ''}
              onValueChange={setPostAuthRedirectPageId}
            >
              <SelectTrigger className={isMobileViewport ? "h-10 mt-1" : "h-8 mt-1"}>
                <SelectValue placeholder="Select page (default: first page)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Use First Page (Default)</SelectItem>
                {availablePages.map(page => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.displayName || page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} text-muted-foreground mt-1`}>
              Select which page users should be redirected to after successful login
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveLoginConfig}
            disabled={isSavingLoginConfig}
            className={`w-full ${isMobileViewport ? 'h-10' : 'h-8'}`}
          >
            {isSavingLoginConfig ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Login Page Config
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

