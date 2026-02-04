'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  Layout, 
  Type, 
  MousePointer, 
  Check, 
  Sparkles,
  Smartphone,
  Monitor
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BrandingConfig } from '../../types'
import { THEME_PRESETS, ThemePreset } from '@/lib/branding/themes'
import { applyBrandingColors, applyComponentStyling } from '@/lib/branding'
import { cn } from '@/lib/utils'

// Import Tab Components
import { ApplicationLogoTab } from './branding/ApplicationLogoTab'
import { LoginBackgroundTab } from './branding/LoginBackgroundTab'
import { TypographyTab } from './branding/TypographyTab'
import { TopMenuBarTab } from './branding/TopMenuBarTab'
import { VerticalTabMenuTab } from './branding/VerticalTabMenuTab'
import { ComponentStylingTab } from './branding/ComponentStylingTab'
import { PlatformSidebarTab } from './branding/PlatformSidebarTab'
import { getComponentStyling as getStyling, updateComponentStyling as updateStyling } from './branding/brandingUtils'

export function ThemeBranding() {
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('presets')
  const [activeComponent, setActiveComponent] = useState('button')

  const fetchBranding = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/branding')
      if (response.ok) {
        const data = await response.json()
        if (data.branding) {
          setBranding(data.branding)
        }
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
      toast.error('Failed to load branding configuration')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  const handleSave = async () => {
    if (!branding) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding })
      })

      if (response.ok) {
        toast.success('Branding saved successfully')
        // Apply changes immediately
        applyBrandingColors(branding)
        applyComponentStyling(branding)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save branding')
      }
    } catch (error) {
      console.error('Error saving branding:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const applyPreset = (preset: ThemePreset) => {
    if (!branding) return
    const newBranding = { ...branding, ...preset.config }
    setBranding(newBranding)
    applyBrandingColors(newBranding)
    applyComponentStyling(newBranding)
    toast.success(`Theme "${preset.name}" applied (save to persist)`)
  }

  const handleApplyNow = () => {
    if (branding) {
      applyBrandingColors(branding)
      applyComponentStyling(branding)
      toast.success('Branding applied to session')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!branding) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Failed to load branding configuration.</p>
        <Button onClick={fetchBranding} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme & Branding
          </h1>
          <p className="text-sm text-muted-foreground">Customize your application's visual identity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleApplyNow}>
            <Sparkles className="h-4 w-4 mr-2" />
            Live Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Tabs */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mb-6 w-fit h-10 p-1 bg-muted/50 border">
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Presets
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex items-center gap-2">
                <Layout className="h-4 w-4" /> Logo & Name
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type className="h-4 w-4" /> Typography
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" /> Components
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-0 flex-1 h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                {THEME_PRESETS.map((preset) => (
                  <Card 
                    key={preset.id} 
                    className={cn(
                      "cursor-pointer hover:border-primary transition-all border-2",
                      // simplistic check if matches
                      branding.primaryColor === preset.config.primaryColor ? "border-primary" : "border-transparent"
                    )}
                    onClick={() => applyPreset(preset)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        {branding.primaryColor === preset.config.primaryColor && (
                          <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <CardDescription className="text-xs">{preset.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-24 rounded-md border flex overflow-hidden shadow-sm">
                        {/* Sidebar Mock */}
                        <div 
                          className="w-8 border-r"
                          style={{ backgroundColor: preset.config.platformSidebarBackgroundColor }}
                        />
                        {/* Content Mock */}
                        <div className="flex-1 p-2 space-y-2" style={{ backgroundColor: preset.config.bodyBackgroundColor }}>
                          <div className="h-2 w-3/4 rounded bg-muted" />
                          <div className="h-8 w-full rounded flex items-center justify-center text-[10px]" style={{ backgroundColor: preset.config.primaryColor, color: '#fff' }}>
                            Button
                          </div>
                          <div className="h-2 w-1/2 rounded bg-muted" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="logo" className="mt-0">
               <ApplicationLogoTab 
                  branding={branding} 
                  setBranding={setBranding} 
               />
            </TabsContent>

            <TabsContent value="typography" className="mt-0">
               <TypographyTab 
                  branding={branding} 
                  setBranding={setBranding} 
               />
            </TabsContent>

            <TabsContent value="components" className="mt-0 h-full flex gap-6">
                <div className="w-64 flex-shrink-0 border rounded-lg bg-muted/30 overflow-hidden flex flex-col">
                   <div className="p-3 border-b bg-muted/50 font-medium text-xs uppercase tracking-wider">Components</div>
                   <div className="overflow-auto flex-1">
                      {[
                        { id: 'button', label: 'Primary Button' },
                        { id: 'button-secondary', label: 'Secondary Button' },
                        { id: 'button-destructive', label: 'Destructive Button' },
                        { id: 'text-input', label: 'Text Input' },
                        { id: 'card', label: 'Card' },
                        { id: 'platform-sidebar-primary', label: 'Sidebar (Primary)' },
                        { id: 'top-menu', label: 'Top Menu Bar' }
                      ].map(item => (
                        <button
                          key={item.id}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors border-l-2",
                            activeComponent === item.id 
                              ? "bg-background border-primary font-medium text-foreground shadow-sm"
                              : "border-transparent text-muted-foreground hover:bg-muted/50"
                          )}
                          onClick={() => setActiveComponent(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="flex-1 card border rounded-lg p-6 bg-background">
                    <ComponentStylingTab 
                        branding={branding}
                        setBranding={setBranding}
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        activeComponent={activeComponent}
                        handleApplyBrandingColors={handleApplyNow}
                        getComponentStyling={(id) => getStyling(branding, id)}
                        updateComponentStyling={(id, mode, field, value) => updateStyling(branding, setBranding, id, mode, field, value)}
                        componentLabel={activeComponent}
                    />
                </div>
            </TabsContent>
            
            {/* Add more tabs for Colors, etc. if needed */}
          </Tabs>
        </div>

        {/* Live Preview Sidebar (Optional but recommended) */}
        {/* ... */}
      </div>
    </div>
  )
}
