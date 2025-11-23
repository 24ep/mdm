'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette, Save, Loader2, Download } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { defaultBrandingConfig } from '@/config/branding'
import { BrandingConfig } from '../types'
import { applyBrandingColors, applyGlobalStyling, applyComponentStyling } from '@/lib/branding'
import { getComponentStyling as getComponentStylingUtil, updateComponentStyling as updateComponentStylingUtil } from './branding/brandingUtils'

// Imported Tab Components
import { ApplicationLogoTab } from './branding/ApplicationLogoTab'
import { LoginBackgroundTab } from './branding/LoginBackgroundTab'
import { TypographyTab } from './branding/TypographyTab'
import { TopMenuBarTab } from './branding/TopMenuBarTab'
import { VerticalTabMenuTab } from './branding/VerticalTabMenuTab'
import { PlatformSidebarTab } from './branding/PlatformSidebarTab'
import { ComponentStylingTab } from './branding/ComponentStylingTab'

// UI Component Definitions
import {
  Palette as PaletteIcon,
  Image as ImageIcon,
  LogIn,
  Type,
  Menu,
  PanelLeft,
  LayoutList,
  Type as TypeIcon,
  List,
  CheckSquare,
  Square,
  Radio,
  ToggleLeft,
  AlignLeft,
  MousePointerClick,
  CreditCard
} from 'lucide-react'

const ELEMENTS = [
  { id: 'application-logo', label: 'Application Logo', icon: ImageIcon, description: 'Application logo and branding' },
  { id: 'login-background', label: 'Login Background', icon: LogIn, description: 'Login page background configuration' },
  { id: 'typography', label: 'Typography', icon: Type, description: 'Global font and typography settings' },
  { id: 'top-menu-bar', label: 'Top Menu Bar', icon: Menu, description: 'Top navigation menu bar styling' },
  { id: 'platform-sidebar', label: 'Platform Sidebar', icon: PanelLeft, description: 'Platform sidebar styling (primary, secondary, and menu items)' },
  { id: 'vertical-tab-menu', label: 'Vertical Tab Menu', icon: LayoutList, description: 'Vertical tab menu items (TabsTrigger with vertical orientation)' },
] as const

const COMPONENTS = [
  { id: 'text-input', label: 'Text Input', icon: TypeIcon, description: 'Single-line text input fields' },
  { id: 'select', label: 'Select', icon: List, description: 'Dropdown selection menus' },
  { id: 'multi-select', label: 'Multi-Select', icon: CheckSquare, description: 'Multiple selection dropdowns' },
  { id: 'textarea', label: 'Textarea', icon: AlignLeft, description: 'Multi-line text input' },
  { id: 'button', label: 'Button', icon: MousePointerClick, description: 'Clickable button elements' },
  { id: 'card', label: 'Card', icon: CreditCard, description: 'Card container components' },
  { id: 'checkbox', label: 'Checkbox', icon: Square, description: 'Checkbox input elements' },
  { id: 'radio', label: 'Radio', icon: Radio, description: 'Radio button inputs' },
  { id: 'switch', label: 'Switch', icon: ToggleLeft, description: 'Toggle switch components' },
] as const

const UI_COMPONENTS = [...ELEMENTS, ...COMPONENTS] as const

export function ThemeBranding() {
  const [activeComponent, setActiveComponent] = useState<string>('application-logo')
  const [activeTab, setActiveTab] = useState<string>('elements')

  // Handle tab change - reset to first item in the selected tab
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Reset to first item in the selected tab
    if (value === 'elements') {
      setActiveComponent(ELEMENTS[0].id)
    } else if (value === 'components') {
      setActiveComponent(COMPONENTS[0].id)
    }
  }

  // Handle component selection - only allow items from current tab
  const handleComponentSelect = (componentId: string) => {
    if (activeTab === 'elements') {
      // Only allow if it's in ELEMENTS
      if (ELEMENTS.some(el => el.id === componentId)) {
        setActiveComponent(componentId)
      }
    } else if (activeTab === 'components') {
      // Only allow if it's in COMPONENTS
      if (COMPONENTS.some(comp => comp.id === componentId)) {
        setActiveComponent(componentId)
      }
    }
  }

  // Ensure activeComponent is valid for current tab - run immediately on tab change
  useEffect(() => {
    if (activeTab === 'elements') {
      const isValid = ELEMENTS.some(el => el.id === activeComponent)
      if (!isValid) {
        setActiveComponent(ELEMENTS[0].id)
      }
    } else if (activeTab === 'components') {
      const isValid = COMPONENTS.some(comp => comp.id === activeComponent)
      if (!isValid) {
        setActiveComponent(COMPONENTS[0].id)
      }
      // Explicitly prevent platform-sidebar and top-menu-bar from being selected
      if (activeComponent === 'platform-sidebar' || activeComponent === 'top-menu-bar') {
        setActiveComponent(COMPONENTS[0].id)
      }
    }
  }, [activeTab, activeComponent])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [googleFonts, setGoogleFonts] = useState<string[]>([])
  const isInitialLoad = useRef(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [branding, setBranding] = useState<BrandingConfig>(defaultBrandingConfig)

  // Load branding on mount
  useEffect(() => {
    loadBranding().then(() => {
      setTimeout(() => {
        isInitialLoad.current = false
      }, 500)
    })
  }, [])

  // Load Google Fonts when API key changes
  useEffect(() => {
    if (branding.googleFontsApiKey) {
      fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${branding.googleFontsApiKey}&sort=popularity`)
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            setGoogleFonts(data.items.map((item: any) => item.family))
          }
        })
        .catch(err => console.error('Failed to fetch Google Fonts', err))
    }
  }, [branding.googleFontsApiKey])

  // Apply branding colors when they change
  useEffect(() => {
    if (isInitialLoad.current) return

    const isDark = isDarkMode ||
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    applyBrandingColors(branding, isDark)
  }, [branding.lightMode, branding.darkMode, isDarkMode])

  // Apply component styling when it changes
  useEffect(() => {
    if (isInitialLoad.current) return

    if (branding && branding.componentStyling && Object.keys(branding.componentStyling).length > 0) {
      const isDark = isDarkMode ||
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      applyComponentStyling(branding, isDark)
    }
  }, [branding, branding.componentStyling, isDarkMode])

  // Apply all branding when mode changes
  useEffect(() => {
    if (isInitialLoad.current) return

    const isDark = isDarkMode ||
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    applyBrandingColors(branding, isDark)
    applyGlobalStyling(branding)
    applyComponentStyling(branding, isDark)

    if (branding.drawerOverlay) {
      const root = document.documentElement
      root.style.setProperty('--drawer-overlay-color', branding.drawerOverlay.color)
      root.style.setProperty('--drawer-overlay-opacity', String(branding.drawerOverlay.opacity))
      root.style.setProperty('--drawer-overlay-blur', `${branding.drawerOverlay.blur}px`)
    }
  }, [isDarkMode, branding, branding.drawerOverlay])

  const loadBranding = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/branding')
      if (response.ok) {
        const data = await response.json()
        if (data.branding) {
          const loadedBranding: BrandingConfig = {
            ...defaultBrandingConfig,
            ...data.branding,
            lightMode: { ...defaultBrandingConfig.lightMode, ...data.branding.lightMode },
            darkMode: { ...defaultBrandingConfig.darkMode, ...data.branding.darkMode },
            loginBackground: { ...defaultBrandingConfig.loginBackground, ...data.branding.loginBackground },
            globalStyling: { ...defaultBrandingConfig.globalStyling, ...data.branding.globalStyling },
            drawerOverlay: { ...defaultBrandingConfig.drawerOverlay, ...data.branding.drawerOverlay },
            componentStyling: { ...defaultBrandingConfig.componentStyling },
          }

          if (data.branding.componentStyling) {
            Object.keys(data.branding.componentStyling).forEach(key => {
              if (loadedBranding.componentStyling[key]) {
                loadedBranding.componentStyling[key] = {
                  light: { ...loadedBranding.componentStyling[key].light, ...data.branding.componentStyling[key].light },
                  dark: { ...loadedBranding.componentStyling[key].dark, ...data.branding.componentStyling[key].dark },
                }
              } else {
                loadedBranding.componentStyling[key] = data.branding.componentStyling[key]
              }
            })
          }

          setBranding(loadedBranding)

          const isDark = isDarkMode ||
            document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches

          applyBrandingColors(loadedBranding, isDark)
          applyGlobalStyling(loadedBranding)
          applyComponentStyling(loadedBranding, isDark)
        }
      }
    } catch (error) {
      console.error('Error loading branding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(branding, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "branding-config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Configuration exported successfully')
  }

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedConfig = JSON.parse(event.target?.result as string)
        setBranding(importedConfig)
        toast.success('Configuration imported successfully. Click Save to persist.')

        const isDark = isDarkMode ||
          document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches
        applyBrandingColors(importedConfig, isDark)
        applyGlobalStyling(importedConfig)
        applyComponentStyling(importedConfig, isDark)
      } catch (error) {
        console.error('Error parsing imported config:', error)
        toast.error('Failed to import configuration. Invalid JSON.')
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const saveBranding = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        toast.success('Branding settings saved successfully')
        handleApplyBrandingColors()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save branding settings')
      }
    } catch (error) {
      console.error('Error saving branding:', error)
      toast.error('Failed to save branding settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyBrandingColors = () => {
    const isDark = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    applyBrandingColors(branding, isDark)
    applyGlobalStyling(branding)
    applyComponentStyling(branding, isDark)
    toast.success('Branding applied successfully')
  }

  // Helper functions that wrap the utils with branding state
  const getComponentStyling = (componentId: string) => {
    return getComponentStylingUtil(branding, componentId)
  }

  const updateComponentStyling = (componentId: string, mode: 'light' | 'dark', field: string, value: string) => {
    updateComponentStylingUtil(branding, setBranding, componentId, mode, field, value)
  }

  // Render appropriate configuration panel based on active component
  const renderComponentConfig = () => {
    const component = UI_COMPONENTS.find((c) => c.id === activeComponent)

    // Ensure platform-sidebar and top-menu-bar are handled correctly
    // These should only appear in Elements tab, never in Components tab
    if (activeComponent === 'platform-sidebar') {
      return (
        <PlatformSidebarTab
          branding={branding}
          setBranding={setBranding}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          handleApplyBrandingColors={handleApplyBrandingColors}
          getComponentStyling={getComponentStyling}
          updateComponentStyling={updateComponentStyling}
        />
      )
    }

    if (activeComponent === 'top-menu-bar') {
      return (
        <TopMenuBarTab
          branding={branding}
          setBranding={setBranding}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          handleApplyBrandingColors={handleApplyBrandingColors}
          getComponentStyling={getComponentStyling}
          updateComponentStyling={updateComponentStyling}
        />
      )
    }

    switch (activeComponent) {
      case 'application-logo':
        return (
          <ApplicationLogoTab
            branding={branding}
            setBranding={setBranding}
            handleApplyBrandingColors={handleApplyBrandingColors}
          />
        )

      case 'login-background':
        return (
          <LoginBackgroundTab
            branding={branding}
            setBranding={setBranding}
            handleApplyBrandingColors={handleApplyBrandingColors}
          />
        )

      case 'typography':
        return (
          <TypographyTab
            branding={branding}
            setBranding={setBranding}
            handleApplyBrandingColors={handleApplyBrandingColors}
            googleFonts={googleFonts}
          />
        )

      case 'vertical-tab-menu':
        return (
          <VerticalTabMenuTab
            branding={branding}
            setBranding={setBranding}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            handleApplyBrandingColors={handleApplyBrandingColors}
            getComponentStyling={getComponentStyling}
            updateComponentStyling={updateComponentStyling}
          />
        )

      default:
        // General component styling - only for components in COMPONENTS array
        // Ensure we don't show ComponentStylingTab for elements
        if (ELEMENTS.some(el => el.id === activeComponent)) {
          // This shouldn't happen, but if it does, show a message
          return (
            <div className="p-8 text-center text-muted-foreground">
              <p>Configuration for {component?.label || activeComponent} is not available in this view.</p>
              <p className="text-sm mt-2">Please select this item from the Elements tab.</p>
            </div>
          )
        }
        
        // Only show ComponentStylingTab for actual components
        return (
          <ComponentStylingTab
            branding={branding}
            setBranding={setBranding}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            activeComponent={activeComponent}
            handleApplyBrandingColors={handleApplyBrandingColors}
            getComponentStyling={getComponentStyling}
            updateComponentStyling={updateComponentStyling}
            componentLabel={component?.label}
            componentDescription={component?.description}
          />
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Theme & Branding</h2>
          <p className="text-muted-foreground">Customize the look and feel of your application.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportConfig}
            accept=".json"
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Download className="h-4 w-4 mr-2 rotate-180" />
            Import Config
          </Button>
          <Button variant="outline" onClick={handleExportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button onClick={saveBranding} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar - Component List */}
        <div className="w-64 border-r bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              System Preference
            </h2>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
                <TabsTrigger value="components" className="text-xs">Components</TabsTrigger>
              </TabsList>

              <TabsContent value="elements" className="mt-0">
                <div className="space-y-1">
                  {ELEMENTS.map((comp) => {
                    const Icon = comp.icon
                    return (
                      <div
                        key={comp.id}
                        onClick={() => handleComponentSelect(comp.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer',
                          activeComponent === comp.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-left">{comp.label}</span>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="components" className="mt-0">
                <div className="space-y-1">
                  {COMPONENTS.map((comp) => {
                    const Icon = comp.icon
                    return (
                      <div
                        key={comp.id}
                        onClick={() => handleComponentSelect(comp.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer',
                          activeComponent === comp.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-left">{comp.label}</span>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Side - Configuration Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className={cn(isDarkMode && 'dark')}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {UI_COMPONENTS.find(c => c.id === activeComponent)?.label || 'Component Configuration'}
                  </CardTitle>
                  <CardDescription>
                    {UI_COMPONENTS.find(c => c.id === activeComponent)?.description || 'Configure styling options'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderComponentConfig()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
