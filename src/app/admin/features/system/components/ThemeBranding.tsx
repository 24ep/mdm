'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { 
  Palette, 
  Save,
  Sun,
  Moon,
  Image as ImageIcon,
  Upload,
  LogIn,
  Type,
  RefreshCw,
  Settings,
  Type as TypeIcon,
  List,
  CheckSquare,
  Square,
  Menu,
  Radio,
  ToggleLeft,
  FileText,
  CreditCard,
  MousePointerClick,
  AlignLeft,
  PanelLeft,
  LayoutList,
  Pencil,
  Image as ImageIcon2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BrandingConfig } from '../types'
import { cn } from '@/lib/utils'
import { ThemeToggleSegmented } from '@/components/ui/theme-toggle-segmented'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { IconPicker } from '@/components/ui/icon-picker'
import { applyBrandingColors, applyGlobalStyling, applyComponentStyling } from '@/lib/branding'
import * as LucideIcons from 'lucide-react'

// Elements for styling
const ELEMENTS = [
  { id: 'application-logo', label: 'Application Logo', icon: ImageIcon, description: 'Application logo and branding' },
  { id: 'login-background', label: 'Login Background', icon: LogIn, description: 'Login page background configuration' },
  { id: 'top-menu-bar', label: 'Top Menu Bar', icon: Menu, description: 'Top navigation menu bar styling' },
  { id: 'platform-sidebar', label: 'Platform Sidebar', icon: PanelLeft, description: 'Platform sidebar styling (primary, secondary, and menu items)' },
  { id: 'vertical-tab-menu', label: 'Vertical Tab Menu', icon: LayoutList, description: 'Vertical tab menu items (TabsTrigger with vertical orientation)' },
] as const

// Components for styling
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

// Combined list for finding components
const UI_COMPONENTS = [...ELEMENTS, ...COMPONENTS] as const

export function ThemeBranding() {
  const [activeComponent, setActiveComponent] = useState<string>('application-logo')
  const [activeTab, setActiveTab] = useState<string>('elements')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const isInitialLoad = useRef(true)
  
  const [branding, setBranding] = useState<BrandingConfig>({
    applicationName: '',
    applicationLogo: '',
    applicationLogoType: 'image',
    applicationLogoIcon: '',
    applicationLogoIconColor: '#000000',
    applicationLogoBackgroundColor: '#ffffff',
    lightMode: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      warningColor: '#f59e0b',
      dangerColor: '#ef4444',
      topMenuBackgroundColor: '#ffffff',
      platformSidebarBackgroundColor: '#ffffff',
      secondarySidebarBackgroundColor: '#f8f9fa',
      topMenuTextColor: '#1f2937',
      platformSidebarTextColor: '#1f2937',
      secondarySidebarTextColor: '#4b5563',
      bodyBackgroundColor: '#f9fafb',
    },
    darkMode: {
      primaryColor: '#60a5fa',
      secondaryColor: '#94a3b8',
      warningColor: '#fbbf24',
      dangerColor: '#f87171',
      topMenuBackgroundColor: '#0f172a',
      platformSidebarBackgroundColor: '#0f172a',
      secondarySidebarBackgroundColor: '#1e293b',
      topMenuTextColor: '#f1f5f9',
      platformSidebarTextColor: '#f1f5f9',
      secondarySidebarTextColor: '#cbd5e1',
      bodyBackgroundColor: '#0f172a',
    },
    loginBackground: {
      type: 'gradient',
      gradient: {
        from: '#3b82f6',
        to: '#1e40af',
        angle: 135,
      },
    },
    globalStyling: {
      borderRadius: '8px',
      borderColor: '#e2e8f0',
      borderWidth: '1px',
      buttonBorderRadius: '8px',
      buttonBorderWidth: '1px',
      inputBorderRadius: '4px',
      inputBorderWidth: '1px',
      selectBorderRadius: '4px',
      selectBorderWidth: '1px',
      textareaBorderRadius: '4px',
      textareaBorderWidth: '1px',
    },
    componentStyling: {
      // Top Menu Bar
      'top-menu-bar': {
        light: {},
        dark: {},
      },
      // Platform Sidebar - Primary and Secondary
      'platform-sidebar-primary': {
        light: {},
        dark: {},
      },
      'platform-sidebar-secondary': {
        light: {},
        dark: {},
      },
      // Platform Sidebar Menu - Default: no border
      'platform-sidebar-menu-normal': {
        light: {
          borderWidth: '0px',
        },
        dark: {
          borderWidth: '0px',
        },
      },
      'platform-sidebar-menu-hover': {
        light: {
          borderWidth: '0px',
        },
        dark: {
          borderWidth: '0px',
        },
      },
      'platform-sidebar-menu-active': {
        light: {
          borderWidth: '0px',
        },
        dark: {
          borderWidth: '0px',
        },
      },
      // Vertical Tab Menu - Default: no border
      'vertical-tab-menu-normal': {
        light: {
          borderWidth: '0px',
        },
        dark: {
          borderWidth: '0px',
        },
      },
      'vertical-tab-menu-hover': {
        light: {
          borderWidth: '0px',
        },
        dark: {
          borderWidth: '0px',
        },
      },
      'vertical-tab-menu-active': {
        light: {
          borderWidth: '0px',
        },
        dark: {
          borderWidth: '0px',
        },
      },
      // Text Input - Default: light gray background
      'text-input': {
        light: {
          backgroundColor: '#f7f7f7',
        },
        dark: {
          backgroundColor: '#f7f7f7',
        },
      },
      // Select - Default: light gray background
      'select': {
        light: {
          backgroundColor: '#f7f7f7',
          textColor: '#f1f5f9', // Light text
        },
        dark: {
          backgroundColor: '#f7f7f7',
          textColor: '#f1f5f9', // Light text
        },
      },
      // Multi-Select - Default: light gray background
      'multi-select': {
        light: {
          backgroundColor: '#f7f7f7',
          textColor: '#f1f5f9', // Light text
        },
        dark: {
          backgroundColor: '#f7f7f7',
          textColor: '#f1f5f9', // Light text
        },
      },
      // Textarea - Default: light gray background
      'textarea': {
        light: {
          backgroundColor: '#f7f7f7',
        },
        dark: {
          backgroundColor: '#f7f7f7',
        },
      },
    },
  })

  // Debounce removed - changes apply instantly, user must click Save to persist

  useEffect(() => {
    loadBranding().then(() => {
      // Mark initial load as complete after loading
      setTimeout(() => {
        isInitialLoad.current = false
      }, 500)
    })
  }, [])

  // Apply branding colors when colors change (lightMode/darkMode)
  useEffect(() => {
    if (isInitialLoad.current) return // Skip on initial load
    
    const isDark = isDarkMode || 
                   document.documentElement.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches
    applyBrandingColors(branding, isDark)
  }, [branding.lightMode, branding.darkMode, isDarkMode])

  // Apply component styling when componentStyling changes or mode changes
  useEffect(() => {
    if (isInitialLoad.current) return // Skip on initial load (handled in loadBranding)
    
    if (branding && branding.componentStyling && Object.keys(branding.componentStyling).length > 0) {
      const isDark = isDarkMode || 
                     document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches
      // Apply component styling immediately when it changes
      applyComponentStyling(branding, isDark)
    }
  }, [branding, branding.componentStyling, isDarkMode])

  // Apply all branding when mode changes
  useEffect(() => {
    if (isInitialLoad.current) return // Skip on initial load (handled in loadBranding)
    
    const isDark = isDarkMode || 
                   document.documentElement.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches
    applyBrandingColors(branding, isDark)
    applyGlobalStyling(branding)
    applyComponentStyling(branding, isDark)
  }, [isDarkMode, branding])

  // Auto-save disabled - user must click Save button to persist changes
  // useEffect removed - changes apply instantly but are not saved until user clicks Save

  const loadBranding = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/branding')
      if (response.ok) {
        const data = await response.json()
        if (data.branding) {
          // Construct the loaded branding object once
          const loadedBranding: BrandingConfig = {
            applicationName: data.branding.applicationName || '',
            applicationLogo: data.branding.applicationLogo || '',
            applicationLogoType: data.branding.applicationLogoType || 'image',
            applicationLogoIcon: data.branding.applicationLogoIcon || '',
            applicationLogoIconColor: data.branding.applicationLogoIconColor || '#000000',
            applicationLogoBackgroundColor: data.branding.applicationLogoBackgroundColor || '#ffffff',
            lightMode: {
              primaryColor: data.branding.lightMode?.primaryColor || '#3b82f6',
              secondaryColor: data.branding.lightMode?.secondaryColor || '#64748b',
              warningColor: data.branding.lightMode?.warningColor || '#f59e0b',
              dangerColor: data.branding.lightMode?.dangerColor || '#ef4444',
              topMenuBackgroundColor: data.branding.lightMode?.topMenuBackgroundColor || '#ffffff',
              platformSidebarBackgroundColor: data.branding.lightMode?.platformSidebarBackgroundColor || '#ffffff',
              secondarySidebarBackgroundColor: data.branding.lightMode?.secondarySidebarBackgroundColor || '#f8f9fa',
              topMenuTextColor: data.branding.lightMode?.topMenuTextColor || '#1f2937',
              platformSidebarTextColor: data.branding.lightMode?.platformSidebarTextColor || '#1f2937',
              secondarySidebarTextColor: data.branding.lightMode?.secondarySidebarTextColor || '#4b5563',
              bodyBackgroundColor: data.branding.lightMode?.bodyBackgroundColor || '#f9fafb',
            },
            darkMode: {
              primaryColor: data.branding.darkMode?.primaryColor || '#60a5fa',
              secondaryColor: data.branding.darkMode?.secondaryColor || '#94a3b8',
              warningColor: data.branding.darkMode?.warningColor || '#fbbf24',
              dangerColor: data.branding.darkMode?.dangerColor || '#f87171',
              topMenuBackgroundColor: data.branding.darkMode?.topMenuBackgroundColor || '#0f172a',
              platformSidebarBackgroundColor: data.branding.darkMode?.platformSidebarBackgroundColor || '#0f172a',
              secondarySidebarBackgroundColor: data.branding.darkMode?.secondarySidebarBackgroundColor || '#1e293b',
              topMenuTextColor: data.branding.darkMode?.topMenuTextColor || '#f1f5f9',
              platformSidebarTextColor: data.branding.darkMode?.platformSidebarTextColor || '#f1f5f9',
              secondarySidebarTextColor: data.branding.darkMode?.secondarySidebarTextColor || '#cbd5e1',
              bodyBackgroundColor: data.branding.darkMode?.bodyBackgroundColor || '#0f172a',
            },
            loginBackground: data.branding.loginBackground || {
              type: 'gradient',
              gradient: {
                from: '#3b82f6',
                to: '#1e40af',
                angle: 135,
              },
            },
            globalStyling: data.branding.globalStyling || {
              borderRadius: '8px',
              borderColor: '#e2e8f0',
              borderWidth: '1px',
              buttonBorderRadius: '8px',
              buttonBorderWidth: '1px',
              inputBorderRadius: '4px',
              inputBorderWidth: '1px',
              selectBorderRadius: '4px',
              selectBorderWidth: '1px',
              textareaBorderRadius: '4px',
              textareaBorderWidth: '1px',
            },
            componentStyling: (() => {
              // Default component styling with no borders for menu items
              const defaults: BrandingConfig['componentStyling'] = {
                'top-menu-bar': {
                  light: {},
                  dark: {},
                },
                'platform-sidebar-primary': {
                  light: {},
                  dark: {},
                },
                'platform-sidebar-secondary': {
                  light: {},
                  dark: {},
                },
                'platform-sidebar-menu-normal': {
                  light: { borderWidth: '0px' },
                  dark: { borderWidth: '0px' },
                },
                'platform-sidebar-menu-hover': {
                  light: { borderWidth: '0px' },
                  dark: { borderWidth: '0px' },
                },
                'platform-sidebar-menu-active': {
                  light: { borderWidth: '0px' },
                  dark: { borderWidth: '0px' },
                },
                'vertical-tab-menu-normal': {
                  light: { borderWidth: '0px' },
                  dark: { borderWidth: '0px' },
                },
                'vertical-tab-menu-hover': {
                  light: { borderWidth: '0px' },
                  dark: { borderWidth: '0px' },
                },
                'vertical-tab-menu-active': {
                  light: { borderWidth: '0px' },
                  dark: { borderWidth: '0px' },
                },
                // Text Input - Default: light gray background
                'text-input': {
                  light: {
                    backgroundColor: '#f7f7f7',
                  },
                  dark: {
                    backgroundColor: '#f7f7f7',
                  },
                },
                // Select - Default: light gray background
                'select': {
                  light: {
                    backgroundColor: '#f7f7f7',
                    textColor: '#f1f5f9',
                  },
                  dark: {
                    backgroundColor: '#f7f7f7',
                    textColor: '#f1f5f9',
                  },
                },
                // Multi-Select - Default: light gray background
                'multi-select': {
                  light: {
                    backgroundColor: '#f7f7f7',
                    textColor: '#f1f5f9',
                  },
                  dark: {
                    backgroundColor: '#f7f7f7',
                    textColor: '#f1f5f9',
                  },
                },
                // Textarea - Default: light gray background
                'textarea': {
                  light: {
                    backgroundColor: '#f7f7f7',
                  },
                  dark: {
                    backgroundColor: '#f7f7f7',
                  },
                },
              }
              
              // Merge loaded component styling with defaults
              const loaded = data.branding.componentStyling || {}
              const merged: BrandingConfig['componentStyling'] = { ...defaults }
              
              Object.keys(loaded).forEach(componentId => {
                merged[componentId] = {
                  light: {
                    ...(defaults[componentId]?.light || {}),
                    ...(loaded[componentId]?.light || {}),
                  },
                  dark: {
                    ...(defaults[componentId]?.dark || {}),
                    ...(loaded[componentId]?.dark || {}),
                  },
                }
              })
              
              return merged
            })(),
          }
          
          // Set the branding state
          setBranding(loadedBranding)
          
          // Apply branding immediately after loading with the loaded data
          const isDark = isDarkMode || 
                         document.documentElement.classList.contains('dark') ||
                         window.matchMedia('(prefers-color-scheme: dark)').matches
          
          // Apply branding with loaded data
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
        // Apply colors to platform
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
    toast.success('Branding colors, global styling, and component styling applied to platform')
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In a real implementation, upload to your storage service
    // For now, create a data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setBranding({ 
        ...branding, 
        applicationLogo: reader.result as string,
        applicationLogoType: 'image',
        applicationLogoIcon: '', // Clear icon when using image
      })
    }
    reader.readAsDataURL(file)
  }

  const renderBrandingTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="application-name" className="text-sm font-medium">
            Application Name
          </Label>
          <Input
            id="application-name"
            value={branding.applicationName}
            onChange={(e) => setBranding({ ...branding, applicationName: e.target.value })}
            placeholder="Enter application name"
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Application Logo</Label>
          <div className="mt-2 space-y-4">
            {branding.applicationLogo && (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                <img
                  src={branding.applicationLogo}
                  alt="Application logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {branding.applicationLogo ? 'Change Logo' : 'Upload Logo'}
              </Button>
              {branding.applicationLogo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBranding({ ...branding, applicationLogo: '' })}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLightModeTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Primary Color</Label>
          <ColorInput
            value={branding.lightMode.primaryColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, primaryColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#3b82f6"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Secondary Color</Label>
          <ColorInput
            value={branding.lightMode.secondaryColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, secondaryColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#64748b"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Warning Color</Label>
          <ColorInput
            value={branding.lightMode.warningColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, warningColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#f59e0b"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Danger/Error Color</Label>
          <ColorInput
            value={branding.lightMode.dangerColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, dangerColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#ef4444"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Top Menu Background</Label>
          <ColorInput
            value={branding.lightMode.topMenuBackgroundColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, topMenuBackgroundColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#ffffff"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Platform Sidebar Background</Label>
          <ColorInput
            value={branding.lightMode.platformSidebarBackgroundColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, platformSidebarBackgroundColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#ffffff"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Secondary Sidebar Background</Label>
          <ColorInput
            value={branding.lightMode.secondarySidebarBackgroundColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, secondarySidebarBackgroundColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#f8f9fa"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Top Menu Text Color</Label>
          <ColorInput
            value={branding.lightMode.topMenuTextColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, topMenuTextColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#1f2937"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Platform Sidebar Text Color</Label>
          <ColorInput
            value={branding.lightMode.platformSidebarTextColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, platformSidebarTextColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#1f2937"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Secondary Sidebar Text Color</Label>
          <ColorInput
            value={branding.lightMode.secondarySidebarTextColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, secondarySidebarTextColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#4b5563"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Body Background Color</Label>
          <ColorInput
            value={branding.lightMode.bodyBackgroundColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                lightMode: { ...branding.lightMode, bodyBackgroundColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#f9fafb"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          These colors will be applied when users are in light mode.
        </p>
      </div>
    </div>
  )

  const renderDarkModeTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Primary Color</Label>
          <ColorInput
            value={branding.darkMode.primaryColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, primaryColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#60a5fa"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Secondary Color</Label>
          <ColorInput
            value={branding.darkMode.secondaryColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, secondaryColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#94a3b8"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Warning Color</Label>
          <ColorInput
            value={branding.darkMode.warningColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, warningColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#fbbf24"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Danger/Error Color</Label>
          <ColorInput
            value={branding.darkMode.dangerColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, dangerColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#f87171"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Top Menu Background</Label>
          <ColorInput
            value={branding.darkMode.topMenuBackgroundColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, topMenuBackgroundColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#0f172a"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Platform Sidebar Background</Label>
          <ColorInput
            value={branding.darkMode.platformSidebarBackgroundColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, platformSidebarBackgroundColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#0f172a"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Secondary Sidebar Background</Label>
          <ColorInput
            value={branding.darkMode.secondarySidebarBackgroundColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, secondarySidebarBackgroundColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#1e293b"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Top Menu Text Color</Label>
          <ColorInput
            value={branding.darkMode.topMenuTextColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, topMenuTextColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#f1f5f9"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Platform Sidebar Text Color</Label>
          <ColorInput
            value={branding.darkMode.platformSidebarTextColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, platformSidebarTextColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#f1f5f9"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Secondary Sidebar Text Color</Label>
          <ColorInput
            value={branding.darkMode.secondarySidebarTextColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, secondarySidebarTextColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#cbd5e1"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Body Background Color</Label>
          <ColorInput
            value={branding.darkMode.bodyBackgroundColor}
            onChange={(color) =>
              setBranding({
                ...branding,
                darkMode: { ...branding.darkMode, bodyBackgroundColor: color },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#0f172a"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          These colors will be applied when users are in dark mode.
        </p>
      </div>
    </div>
  )

  const renderLoginTab = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Background Type</Label>
        <Select
          value={branding.loginBackground.type}
          onValueChange={(value) =>
            setBranding({
              ...branding,
              loginBackground: {
                ...branding.loginBackground,
                type: value as 'color' | 'gradient' | 'image',
              },
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">Solid Color</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {branding.loginBackground.type === 'color' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Background Color</Label>
          <ColorInput
            value={branding.loginBackground.color || '#1e40af'}
            onChange={(color) =>
              setBranding({
                ...branding,
                loginBackground: {
                  ...branding.loginBackground,
                  color,
                },
              })
            }
            allowImageVideo={false}
            className="relative"
            placeholder="#1e40af"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
        </div>
      )}

      {branding.loginBackground.type === 'gradient' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">From Color</Label>
              <ColorInput
                value={branding.loginBackground.gradient?.from || '#3b82f6'}
                onChange={(color) =>
                  setBranding({
                    ...branding,
                    loginBackground: {
                      ...branding.loginBackground,
                      gradient: {
                        ...branding.loginBackground.gradient!,
                        from: color,
                      },
                    },
                  })
                }
                allowImageVideo={false}
                className="w-full"
                placeholder="#3b82f6"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">To Color</Label>
              <ColorInput
                value={branding.loginBackground.gradient?.to || '#1e40af'}
                onChange={(color) =>
                  setBranding({
                    ...branding,
                    loginBackground: {
                      ...branding.loginBackground,
                      gradient: {
                        ...branding.loginBackground.gradient!,
                        to: color,
                      },
                    },
                  })
                }
                allowImageVideo={false}
                className="w-full"
                placeholder="#1e40af"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Angle (degrees)</Label>
            <Input
              type="number"
              value={branding.loginBackground.gradient?.angle || 135}
              onChange={(e) =>
                setBranding({
                  ...branding,
                  loginBackground: {
                    ...branding.loginBackground,
                    gradient: {
                      ...branding.loginBackground.gradient!,
                      angle: parseInt(e.target.value) || 135,
                    },
                  },
                })
              }
              min={0}
              max={360}
              className="w-full"
            />
          </div>
        </div>
      )}

      {branding.loginBackground.type === 'image' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Background Image URL</Label>
            <Input
              value={branding.loginBackground.image || ''}
              onChange={(e) =>
                setBranding({
                  ...branding,
                  loginBackground: {
                    ...branding.loginBackground,
                    image: e.target.value,
                  },
                })
              }
              placeholder="https://example.com/image.jpg"
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onloadend = () => {
                  setBranding({
                    ...branding,
                    loginBackground: {
                      ...branding.loginBackground,
                      image: reader.result as string,
                    },
                  })
                }
                reader.readAsDataURL(file)
              }}
              className="hidden"
              id="bg-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('bg-image-upload')?.click()}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Upload Image
            </Button>
          </div>
          {branding.loginBackground.image && (
            <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
              <img
                src={branding.loginBackground.image}
                alt="Login background"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderGlobalStylingTab = () => (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          These styles apply globally to buttons, inputs, selects, and textareas throughout the platform (excluding space modules).
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Global Border Radius</Label>
            <Input
              value={branding.globalStyling.borderRadius}
              onChange={(e) =>
                setBranding({
                  ...branding,
                  globalStyling: { ...branding.globalStyling, borderRadius: e.target.value },
                })
              }
              placeholder="0.5rem"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Border Color</Label>
            <ColorInput
              value={branding.globalStyling.borderColor}
              onChange={(color) =>
                setBranding({
                  ...branding,
                  globalStyling: { ...branding.globalStyling, borderColor: color },
                })
              }
            allowImageVideo={false}
            className="relative"
            placeholder="#e2e8f0"
            inputClassName="h-7 text-xs pl-7 w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Border Width</Label>
            <Input
              value={branding.globalStyling.borderWidth}
              onChange={(e) =>
                setBranding({
                  ...branding,
                  globalStyling: { ...branding.globalStyling, borderWidth: e.target.value },
                })
              }
              placeholder="1px"
              className="w-full"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-xs font-semibold mb-4">Button Styling</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Button Border Radius</Label>
              <Input
                value={branding.globalStyling.buttonBorderRadius}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    globalStyling: { ...branding.globalStyling, buttonBorderRadius: e.target.value },
                  })
                }
                placeholder="0.5rem"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Button Border Width</Label>
              <Input
                value={branding.globalStyling.buttonBorderWidth}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    globalStyling: { ...branding.globalStyling, buttonBorderWidth: e.target.value },
                  })
                }
                placeholder="1px"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-xs font-semibold mb-4">Input Styling</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Input Border Radius</Label>
              <Input
                value={branding.globalStyling.inputBorderRadius}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    globalStyling: { ...branding.globalStyling, inputBorderRadius: e.target.value },
                  })
                }
                  placeholder="4px"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Input Border Width</Label>
              <Input
                value={branding.globalStyling.inputBorderWidth}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    globalStyling: { ...branding.globalStyling, inputBorderWidth: e.target.value },
                  })
                }
                placeholder="1px"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-xs font-semibold mb-4">Select Styling</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Border Radius</Label>
              <Input
                value={branding.globalStyling.selectBorderRadius}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    globalStyling: { ...branding.globalStyling, selectBorderRadius: e.target.value },
                  })
                }
                  placeholder="4px"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Border Width</Label>
              <Input
                value={branding.globalStyling.selectBorderWidth}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    globalStyling: { ...branding.globalStyling, selectBorderWidth: e.target.value },
                  })
                }
                placeholder="1px"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-xs font-semibold mb-4">Textarea Styling</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Textarea Border Radius</Label>
              <Input
                value={branding.globalStyling.textareaBorderRadius}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    globalStyling: { ...branding.globalStyling, textareaBorderRadius: e.target.value },
                  })
                }
                  placeholder="4px"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Textarea Border Width</Label>
              <Input
                value={branding.globalStyling.textareaBorderWidth}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    globalStyling: { ...branding.globalStyling, textareaBorderWidth: e.target.value },
                  })
                }
                placeholder="1px"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Get or initialize component styling
  const getComponentStyling = (componentId: string) => {
    // Input and selection components default background color
    const inputSelectionComponents = ['text-input', 'select', 'multi-select', 'textarea']
    const defaultBackgroundColor = inputSelectionComponents.includes(componentId) ? '#f7f7f7' : ''
    
    if (!branding.componentStyling[componentId]) {
      return {
        light: {
          backgroundColor: defaultBackgroundColor,
          textColor: '',
          borderColor: '',
          borderRadius: '',
          borderWidth: '',
          padding: '',
          fontSize: '',
          fontWeight: '',
        },
        dark: {
          backgroundColor: defaultBackgroundColor,
          textColor: '',
          borderColor: '',
          borderRadius: '',
          borderWidth: '',
          padding: '',
          fontSize: '',
          fontWeight: '',
        },
      }
    }
    
    // Ensure input/selection components have default background if empty
    const styling = branding.componentStyling[componentId]
    if (inputSelectionComponents.includes(componentId)) {
      return {
        light: {
          ...styling.light,
          backgroundColor: styling.light?.backgroundColor || defaultBackgroundColor,
        },
        dark: {
          ...styling.dark,
          backgroundColor: styling.dark?.backgroundColor || defaultBackgroundColor,
        },
      }
    }
    
    return styling
  }

  // Update component styling
  const updateComponentStyling = (
    componentId: string,
    mode: 'light' | 'dark',
    field: string,
    value: string
  ) => {
    const current = getComponentStyling(componentId)
    setBranding({
      ...branding,
      componentStyling: {
        ...branding.componentStyling,
        [componentId]: {
          ...current,
          [mode]: {
            ...current[mode],
            [field]: value,
          },
        },
      },
    })
  }

  // Render component configuration
  const renderComponentConfig = () => {
    const component = UI_COMPONENTS.find((c) => c.id === activeComponent)
    
    // Special handling for Application Logo
    if (activeComponent === 'application-logo') {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="application-name" className="text-sm font-medium">
                Application Name
              </Label>
              <Input
                id="application-name"
                value={branding.applicationName}
                onChange={(e) => setBranding({ ...branding, applicationName: e.target.value })}
                placeholder="Enter application name"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Application Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                {/* Logo Preview */}
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {branding.applicationLogoType === 'icon' && branding.applicationLogoIcon ? (
                    (() => {
                      const IconComponent = (LucideIcons as any)[branding.applicationLogoIcon]
                      return IconComponent ? (
                        <IconComponent 
                          className="h-16 w-16" 
                          style={{ 
                            color: branding.applicationLogoIconColor || '#000000',
                            backgroundColor: branding.applicationLogoBackgroundColor || '#ffffff'
                          }}
                        />
                      ) : (
                        <div className="text-muted-foreground text-sm">No icon</div>
                      )
                    })()
                  ) : branding.applicationLogo ? (
                    <img
                      src={branding.applicationLogo}
                      alt="Application logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm text-center px-2">No logo</div>
                  )}
                </div>

                {/* Pen Icon Button with Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="start">
                    <Tabs defaultValue={branding.applicationLogoType || 'image'}>
                      <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                        <TabsTrigger value="image" className="text-xs">Upload Image</TabsTrigger>
                        <TabsTrigger value="icon" className="text-xs">Use Icon</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="image" className="p-4 space-y-4 mt-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Upload Logo Image</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="cursor-pointer"
                          />
                          {branding.applicationLogo && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => setBranding({ 
                                ...branding, 
                                applicationLogo: '',
                                applicationLogoType: 'image'
                              })}
                            >
                              Remove Image
                            </Button>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="icon" className="p-4 space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Select Icon</Label>
                            <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                              <IconPicker
                                value={branding.applicationLogoIcon || ''}
                                onChange={(iconName) => {
                                  setBranding({
                                    ...branding,
                                    applicationLogoType: 'icon',
                                    applicationLogoIcon: iconName,
                                    applicationLogo: '' // Clear image when using icon
                                  })
                                }}
                                placeholder="Search icons..."
                                grouped={true}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Icon Color</Label>
                              <ColorInput
                                value={branding.applicationLogoIconColor || '#000000'}
                                onChange={(color) => {
                                  setBranding({
                                    ...branding,
                                    applicationLogoIconColor: color
                                  })
                                }}
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Background Color</Label>
                              <ColorInput
                                value={branding.applicationLogoBackgroundColor || '#ffffff'}
                                onChange={(color) => {
                                  setBranding({
                                    ...branding,
                                    applicationLogoBackgroundColor: color
                                  })
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleApplyBrandingColors}
              variant="default"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Config
            </Button>
          </div>
        </div>
      )
    }

    // Special handling for Top Menu Bar
    if (activeComponent === 'top-menu-bar') {
      const currentMode = isDarkMode ? 'dark' : 'light'
      const colors = branding[currentMode === 'light' ? 'lightMode' : 'darkMode']
      const styling = getComponentStyling('top-menu-bar')
      const currentStyling = styling[currentMode]
      
      return (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <ThemeToggleSegmented
            isDarkMode={isDarkMode}
            onLightMode={() => setIsDarkMode(false)}
            onDarkMode={() => setIsDarkMode(true)}
            align="right"
          />

          {/* Top Menu Bar Configuration */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-xs font-semibold">Top Menu Bar Styling</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <ColorInput
                  value={colors.topMenuBackgroundColor}
                  onChange={(color) =>
                    setBranding({
                      ...branding,
                      [currentMode === 'light' ? 'lightMode' : 'darkMode']: {
                        ...colors,
                        topMenuBackgroundColor: color,
                      },
                    })
                  }
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <ColorInput
                  value={colors.topMenuTextColor}
                  onChange={(color) =>
                    setBranding({
                      ...branding,
                      [currentMode === 'light' ? 'lightMode' : 'darkMode']: {
                        ...colors,
                        topMenuTextColor: color,
                      },
                    })
                  }
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#1f2937"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Color</Label>
                <ColorInput
                  value={currentStyling.borderColor || ''}
                  onChange={(color) => updateComponentStyling('top-menu-bar', currentMode, 'borderColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e2e8f0"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Radius</Label>
                <Input
                  value={currentStyling.borderRadius || ''}
                  onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'borderRadius', e.target.value)}
                  placeholder="0px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Width</Label>
                <Input
                  value={currentStyling.borderWidth || ''}
                  onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'borderWidth', e.target.value)}
                  placeholder="1px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Padding</Label>
                <Input
                  value={currentStyling.padding || ''}
                  onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'padding', e.target.value)}
                  placeholder="8px 16px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Size</Label>
                <Input
                  value={currentStyling.fontSize || ''}
                  onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'fontSize', e.target.value)}
                  placeholder="0.875rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Weight</Label>
                <Input
                  value={currentStyling.fontWeight || ''}
                  onChange={(e) => updateComponentStyling('top-menu-bar', currentMode, 'fontWeight', e.target.value)}
                  placeholder="400"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleApplyBrandingColors}
              variant="default"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Config
            </Button>
          </div>
        </div>
      )
    }

    // Special handling for Vertical Tab Menu
    if (activeComponent === 'vertical-tab-menu') {
      const currentMode = isDarkMode ? 'dark' : 'light'
      const normalStyling = getComponentStyling('vertical-tab-menu-normal')
      const activeStyling = getComponentStyling('vertical-tab-menu-active')
      const hoverStyling = getComponentStyling('vertical-tab-menu-hover')
      
      const currentNormal = normalStyling[currentMode]
      const currentActive = activeStyling[currentMode]
      const currentHover = hoverStyling[currentMode]

      return (
        <div className="space-y-6">
          <ThemeToggleSegmented
            isDarkMode={isDarkMode}
            onLightMode={() => setIsDarkMode(false)}
            onDarkMode={() => setIsDarkMode(true)}
            align="right"
          />

          {/* Normal Tab State */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-xs font-semibold">Normal Tab</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <ColorInput
                  value={currentNormal.backgroundColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'backgroundColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="transparent"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <ColorInput
                  value={currentNormal.textColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'textColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#6b7280"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Radius</Label>
                <Input
                  value={currentNormal.borderRadius || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'borderRadius', e.target.value)}
                  placeholder="8px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Padding</Label>
                <Input
                  value={currentNormal.padding || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'padding', e.target.value)}
                  placeholder="0.75rem 1rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Size</Label>
                <Input
                  value={currentNormal.fontSize || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'fontSize', e.target.value)}
                  placeholder="0.875rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Weight</Label>
                <Input
                  value={currentNormal.fontWeight || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'fontWeight', e.target.value)}
                  placeholder="500"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Color</Label>
                <ColorInput
                  value={currentNormal.borderColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'borderColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="transparent"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Width</Label>
                <Input
                  value={currentNormal.borderWidth || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-normal', currentMode, 'borderWidth', e.target.value)}
                  placeholder="0px"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Hover Tab State */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-xs font-semibold">Hover Tab</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <ColorInput
                  value={currentHover.backgroundColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'backgroundColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="hsl(var(--muted))"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <ColorInput
                  value={currentHover.textColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'textColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="hsl(var(--foreground))"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Radius</Label>
                <Input
                  value={currentHover.borderRadius || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'borderRadius', e.target.value)}
                  placeholder="8px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Padding</Label>
                <Input
                  value={currentHover.padding || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'padding', e.target.value)}
                  placeholder="0.75rem 1rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Size</Label>
                <Input
                  value={currentHover.fontSize || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'fontSize', e.target.value)}
                  placeholder="0.875rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Weight</Label>
                <Input
                  value={currentHover.fontWeight || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'fontWeight', e.target.value)}
                  placeholder="500"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Color</Label>
                <ColorInput
                  value={currentHover.borderColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'borderColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="transparent"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Width</Label>
                <Input
                  value={currentHover.borderWidth || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-hover', currentMode, 'borderWidth', e.target.value)}
                  placeholder="0px"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Active Tab State */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-xs font-semibold">Active Tab</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <ColorInput
                  value={currentActive.backgroundColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'backgroundColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="hsl(var(--primary))"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <ColorInput
                  value={currentActive.textColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'textColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="hsl(var(--primary-foreground))"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Radius</Label>
                <Input
                  value={currentActive.borderRadius || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'borderRadius', e.target.value)}
                  placeholder="8px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Color (for border indicator)</Label>
                <ColorInput
                  value={currentActive.borderColor || ''}
                  onChange={(color) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'borderColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="hsl(var(--primary))"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Padding</Label>
                <Input
                  value={currentActive.padding || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'padding', e.target.value)}
                  placeholder="0.75rem 1rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Size</Label>
                <Input
                  value={currentActive.fontSize || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'fontSize', e.target.value)}
                  placeholder="0.875rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Weight</Label>
                <Input
                  value={currentActive.fontWeight || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'fontWeight', e.target.value)}
                  placeholder="500"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Width</Label>
                <Input
                  value={currentActive.borderWidth || ''}
                  onChange={(e) => updateComponentStyling('vertical-tab-menu-active', currentMode, 'borderWidth', e.target.value)}
                  placeholder="0px"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Configure styling for Vertical Tab Menu items in <strong>{currentMode === 'light' ? 'Light' : 'Dark'}</strong> mode.
              Normal state applies to default tabs, hover state applies on mouse hover, and active state applies to selected tabs.
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleApplyBrandingColors}
              variant="default"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Config
            </Button>
          </div>
        </div>
      )
    }

    // Special handling for Platform Sidebar
    if (activeComponent === 'platform-sidebar') {
      const currentMode = isDarkMode ? 'dark' : 'light'
      const colors = branding[currentMode === 'light' ? 'lightMode' : 'darkMode']
      
      return (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <ThemeToggleSegmented
            isDarkMode={isDarkMode}
            onLightMode={() => setIsDarkMode(false)}
            onDarkMode={() => setIsDarkMode(true)}
            align="right"
          />

          {/* Primary Sidebar Configuration */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-xs font-semibold">Primary Sidebar</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <ColorInput
                  value={colors.platformSidebarBackgroundColor}
                  onChange={(color) =>
                    setBranding({
                      ...branding,
                      [currentMode === 'light' ? 'lightMode' : 'darkMode']: {
                        ...colors,
                        platformSidebarBackgroundColor: color,
                      },
                    })
                  }
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <ColorInput
                  value={colors.platformSidebarTextColor}
                  onChange={(color) =>
                    setBranding({
                      ...branding,
                      [currentMode === 'light' ? 'lightMode' : 'darkMode']: {
                        ...colors,
                        platformSidebarTextColor: color,
                      },
                    })
                  }
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#1f2937"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Color</Label>
                <ColorInput
                  value={getComponentStyling('platform-sidebar-primary')[currentMode].borderColor || ''}
                  onChange={(color) => updateComponentStyling('platform-sidebar-primary', currentMode, 'borderColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e2e8f0"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Radius</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-primary')[currentMode].borderRadius || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-primary', currentMode, 'borderRadius', e.target.value)}
                  placeholder="0px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Width</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-primary')[currentMode].borderWidth || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-primary', currentMode, 'borderWidth', e.target.value)}
                  placeholder="1px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Padding</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-primary')[currentMode].padding || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-primary', currentMode, 'padding', e.target.value)}
                  placeholder="8px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Size</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-primary')[currentMode].fontSize || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-primary', currentMode, 'fontSize', e.target.value)}
                  placeholder="0.875rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Weight</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-primary')[currentMode].fontWeight || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-primary', currentMode, 'fontWeight', e.target.value)}
                  placeholder="400"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Secondary Sidebar Configuration */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-xs font-semibold">Secondary Sidebar</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <ColorInput
                  value={colors.secondarySidebarBackgroundColor}
                  onChange={(color) =>
                    setBranding({
                      ...branding,
                      [currentMode === 'light' ? 'lightMode' : 'darkMode']: {
                        ...colors,
                        secondarySidebarBackgroundColor: color,
                      },
                    })
                  }
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#f8f9fa"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <ColorInput
                  value={colors.secondarySidebarTextColor}
                  onChange={(color) =>
                    setBranding({
                      ...branding,
                      [currentMode === 'light' ? 'lightMode' : 'darkMode']: {
                        ...colors,
                        secondarySidebarTextColor: color,
                      },
                    })
                  }
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#4b5563"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Color</Label>
                <ColorInput
                  value={getComponentStyling('platform-sidebar-secondary')[currentMode].borderColor || ''}
                  onChange={(color) => updateComponentStyling('platform-sidebar-secondary', currentMode, 'borderColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e2e8f0"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Radius</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-secondary')[currentMode].borderRadius || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-secondary', currentMode, 'borderRadius', e.target.value)}
                  placeholder="0px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Width</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-secondary')[currentMode].borderWidth || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-secondary', currentMode, 'borderWidth', e.target.value)}
                  placeholder="1px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Padding</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-secondary')[currentMode].padding || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-secondary', currentMode, 'padding', e.target.value)}
                  placeholder="8px"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Size</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-secondary')[currentMode].fontSize || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-secondary', currentMode, 'fontSize', e.target.value)}
                  placeholder="0.875rem"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Weight</Label>
                <Input
                  value={getComponentStyling('platform-sidebar-secondary')[currentMode].fontWeight || ''}
                  onChange={(e) => updateComponentStyling('platform-sidebar-secondary', currentMode, 'fontWeight', e.target.value)}
                  placeholder="400"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Menu Items Configuration */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-xs font-semibold">Menu Items</h3>
            
            {/* Normal Menu Item State */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h4 className="text-xs font-semibold text-muted-foreground">Normal Menu Item</h4>
              {(() => {
                const normalStyling = getComponentStyling('platform-sidebar-menu-normal')
                const currentNormal = normalStyling[currentMode]
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Background Color</Label>
                      <ColorInput
                        value={currentNormal.backgroundColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'backgroundColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="transparent"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Text Color</Label>
                      <ColorInput
                        value={currentNormal.textColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'textColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#6b7280"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Radius</Label>
                      <Input
                        value={currentNormal.borderRadius || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'borderRadius', e.target.value)}
                        placeholder="0px"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Padding</Label>
                      <Input
                        value={currentNormal.padding || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'padding', e.target.value)}
                        placeholder="0.5rem 1rem"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Size</Label>
                      <Input
                        value={currentNormal.fontSize || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'fontSize', e.target.value)}
                        placeholder="0.875rem"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Weight</Label>
                      <Input
                        value={currentNormal.fontWeight || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'fontWeight', e.target.value)}
                        placeholder="400"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Color</Label>
                      <ColorInput
                        value={currentNormal.borderColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'borderColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="transparent"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Width</Label>
                      <Input
                        value={currentNormal.borderWidth || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-normal', currentMode, 'borderWidth', e.target.value)}
                        placeholder="0px"
                        className="w-full"
                      />
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Hover Menu Item State */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h4 className="text-xs font-semibold text-muted-foreground">Hover Menu Item</h4>
              {(() => {
                const hoverStyling = getComponentStyling('platform-sidebar-menu-hover')
                const currentHover = hoverStyling[currentMode]
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Background Color</Label>
                      <ColorInput
                        value={currentHover.backgroundColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'backgroundColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="hsl(var(--muted))"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Text Color</Label>
                      <ColorInput
                        value={currentHover.textColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'textColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="hsl(var(--foreground))"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Radius</Label>
                      <Input
                        value={currentHover.borderRadius || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'borderRadius', e.target.value)}
                        placeholder="0px"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Padding</Label>
                      <Input
                        value={currentHover.padding || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'padding', e.target.value)}
                        placeholder="0.5rem 1rem"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Size</Label>
                      <Input
                        value={currentHover.fontSize || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'fontSize', e.target.value)}
                        placeholder="0.875rem"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Weight</Label>
                      <Input
                        value={currentHover.fontWeight || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'fontWeight', e.target.value)}
                        placeholder="400"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Color</Label>
                      <ColorInput
                        value={currentHover.borderColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'borderColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="transparent"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Width</Label>
                      <Input
                        value={currentHover.borderWidth || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-hover', currentMode, 'borderWidth', e.target.value)}
                        placeholder="0px"
                        className="w-full"
                      />
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Active Menu Item State */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h4 className="text-xs font-semibold text-muted-foreground">Active Menu Item</h4>
              {(() => {
                const activeStyling = getComponentStyling('platform-sidebar-menu-active')
                const currentActive = activeStyling[currentMode]
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Background Color</Label>
                      <ColorInput
                        value={currentActive.backgroundColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'backgroundColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="hsl(var(--muted))"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Text Color</Label>
                      <ColorInput
                        value={currentActive.textColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'textColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="hsl(var(--foreground))"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Radius</Label>
                      <Input
                        value={currentActive.borderRadius || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'borderRadius', e.target.value)}
                        placeholder="4px"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Padding</Label>
                      <Input
                        value={currentActive.padding || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'padding', e.target.value)}
                        placeholder="0.5rem 1rem"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Size</Label>
                      <Input
                        value={currentActive.fontSize || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'fontSize', e.target.value)}
                        placeholder="0.875rem"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Weight</Label>
                      <Input
                        value={currentActive.fontWeight || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'fontWeight', e.target.value)}
                        placeholder="400"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Color</Label>
                      <ColorInput
                        value={currentActive.borderColor || ''}
                        onChange={(color) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'borderColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="transparent"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Border Width</Label>
                      <Input
                        value={currentActive.borderWidth || ''}
                        onChange={(e) => updateComponentStyling('platform-sidebar-menu-active', currentMode, 'borderWidth', e.target.value)}
                        placeholder="0px"
                        className="w-full"
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Configure styling for Platform Sidebar in <strong>{currentMode === 'light' ? 'Light' : 'Dark'}</strong> mode.
              Primary sidebar is the main navigation sidebar, secondary sidebar shows additional navigation options, and menu items control the styling of navigation links within the sidebar.
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleApplyBrandingColors}
              variant="default"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Config
            </Button>
          </div>
        </div>
      )
    }

    // Special handling for Login Background
    if (activeComponent === 'login-background') {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Background Type</Label>
            <Select
              value={branding.loginBackground.type}
              onValueChange={(value) =>
                setBranding({
                  ...branding,
                  loginBackground: {
                    ...branding.loginBackground,
                    type: value as 'color' | 'gradient' | 'image',
                  },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {branding.loginBackground.type === 'color' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Background Color</Label>
              <ColorInput
                value={branding.loginBackground.color || '#1e40af'}
                onChange={(color) =>
                  setBranding({
                    ...branding,
                    loginBackground: { ...branding.loginBackground, color },
                  })
                }
                allowImageVideo={false}
                className="relative"
                placeholder="#1e40af"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
          )}

          {branding.loginBackground.type === 'gradient' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gradient From Color</Label>
                <ColorInput
                  value={branding.loginBackground.gradient?.from || '#3b82f6'}
                  onChange={(color) =>
                    setBranding({
                      ...branding,
                      loginBackground: {
                        ...branding.loginBackground,
                        gradient: {
                          ...branding.loginBackground.gradient!,
                          from: color,
                        },
                      },
                    })
                  }
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#3b82f6"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gradient To Color</Label>
                <ColorInput
                  value={branding.loginBackground.gradient?.to || '#1e40af'}
                  onChange={(color) =>
                    setBranding({
                      ...branding,
                      loginBackground: {
                        ...branding.loginBackground,
                        gradient: {
                          ...branding.loginBackground.gradient!,
                          to: color,
                        },
                      },
                    })
                  }
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#1e40af"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gradient Angle</Label>
                <Input
                  type="number"
                  value={branding.loginBackground.gradient?.angle || 135}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      loginBackground: {
                        ...branding.loginBackground,
                        gradient: {
                          ...branding.loginBackground.gradient!,
                          angle: parseInt(e.target.value) || 135,
                        },
                      },
                    })
                  }
                  placeholder="135"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {branding.loginBackground.type === 'image' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Background Image URL</Label>
              <Input
                value={branding.loginBackground.image || ''}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    loginBackground: { ...branding.loginBackground, image: e.target.value },
                  })
                }
                placeholder="https://example.com/image.jpg"
                className="w-full"
              />
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleApplyBrandingColors}
              variant="default"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Config
            </Button>
          </div>
        </div>
      )
    }

    // Regular component styling configuration
    const styling = getComponentStyling(activeComponent)
    const currentMode = isDarkMode ? 'dark' : 'light'
    const currentStyling = styling[currentMode]

    return (
      <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex items-center justify-end">
          <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setIsDarkMode(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                !isDarkMode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className={cn('h-4 w-4', !isDarkMode ? 'text-amber-500' : 'text-muted-foreground')} />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                isDarkMode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className={cn('h-4 w-4', isDarkMode ? 'text-blue-500' : 'text-muted-foreground')} />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Configuration Fields */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Background Color</Label>
            <ColorInput
              value={currentStyling.backgroundColor || ''}
              onChange={(color) => updateComponentStyling(activeComponent, currentMode, 'backgroundColor', color)}
              allowImageVideo={false}
              className="relative"
              placeholder="#ffffff"
              inputClassName="h-7 text-xs pl-7 w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Text Color</Label>
            <ColorInput
              value={currentStyling.textColor || ''}
              onChange={(color) => updateComponentStyling(activeComponent, currentMode, 'textColor', color)}
              allowImageVideo={false}
              className="relative"
              placeholder="#000000"
              inputClassName="h-7 text-xs pl-7 w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Border Color</Label>
            <ColorInput
              value={currentStyling.borderColor || ''}
              onChange={(color) => updateComponentStyling(activeComponent, currentMode, 'borderColor', color)}
              allowImageVideo={false}
              className="relative"
              placeholder="#e2e8f0"
              inputClassName="h-7 text-xs pl-7 w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Border Radius</Label>
            <Input
              value={currentStyling.borderRadius || ''}
              onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'borderRadius', e.target.value)}
                  placeholder="4px"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Border Width</Label>
            <Input
              value={currentStyling.borderWidth || ''}
              onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'borderWidth', e.target.value)}
              placeholder="1px"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Padding</Label>
            <Input
              value={currentStyling.padding || ''}
              onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'padding', e.target.value)}
              placeholder="0.5rem"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Font Size</Label>
            <Input
              value={currentStyling.fontSize || ''}
              onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'fontSize', e.target.value)}
              placeholder="0.875rem"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Font Weight</Label>
            <Input
              value={currentStyling.fontWeight || ''}
              onChange={(e) => updateComponentStyling(activeComponent, currentMode, 'fontWeight', e.target.value)}
              placeholder="400"
              className="w-full"
            />
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Configure styling for <strong>{component?.label}</strong> in <strong>{currentMode === 'light' ? 'Light' : 'Dark'}</strong> mode.
            {component?.description && ` ${component.description}`}
          </p>
        </div>
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleApplyBrandingColors}
            variant="default"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Apply Config
          </Button>
        </div>
      </div>
    )
  }

  const component = UI_COMPONENTS.find((c) => c.id === activeComponent)

  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar - UI Components */}
      <div className="w-64 border-r bg-muted/30">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            System Preference
          </h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                      onClick={() => setActiveComponent(comp.id)}
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
                      onClick={() => setActiveComponent(comp.id)}
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {component?.label || 'Component Configuration'}
                    </CardTitle>
                    <CardDescription>
                      {component?.description || 'Configure styling options for this component'}
                    </CardDescription>
                  </div>
                   <div className="flex items-center gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={loadBranding}
                       disabled={isLoading}
                     >
                       <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                       Refresh
                     </Button>
                     {lastSaved && !isSaving && (
                       <span className="text-xs text-muted-foreground">
                         Saved {lastSaved.toLocaleTimeString()}
                       </span>
                     )}
                     <Button
                       onClick={saveBranding}
                       disabled={isSaving}
                       variant="default"
                       size="sm"
                     >
                       {isSaving ? (
                         <>
                           <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                           Saving...
                         </>
                       ) : (
                         <>
                           <Save className="h-4 w-4 mr-2" />
                           Save to Database
                         </>
                       )}
                     </Button>
                   </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderComponentConfig()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
