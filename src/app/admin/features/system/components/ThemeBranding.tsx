'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { 
  Palette, 
  Upload, 
  Download, 
  RefreshCw, 
  Settings, 
  Eye,
  Save,
  Undo,
  Redo,
  Copy,
  Trash2,
  Plus,
  Edit,
  Globe,
  Building2,
  Image,
  Type,
  Layout,
  Monitor,
  Smartphone,
  Tablet,
  Zap,
  Sun,
  Moon,
  Contrast
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Theme } from '../types'

interface Space {
  id: string
  name: string
  slug: string
  hasCustomTheme: boolean
  themeId?: string
}

export function ThemeBranding() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateTheme, setShowCreateTheme] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('system')
  const [selectedSpace, setSelectedSpace] = useState<string>('')

  const [newTheme, setNewTheme] = useState<{
    name: string
    type: 'system' | 'space'
    spaceId: string
    colors: any
    typography: any
    spacing: any
    borderRadius: any
    shadows: any
    animations: any
    customCSS?: string
  }>({
    name: '',
    type: 'system',
    spaceId: '',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f1f5f9',
      border: '#e2e8f0',
      input: '#ffffff',
      ring: '#3b82f6'
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    animations: {},
    customCSS: ''
  })

  useEffect(() => {
    loadThemes()
    loadSpaces()
  }, [])

  const loadThemes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/themes')
      if (response.ok) {
        const data = await response.json()
        setThemes(data.themes.map((theme: any) => ({
          ...theme,
          createdAt: new Date(theme.createdAt),
          updatedAt: new Date(theme.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Error loading themes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const createTheme = async () => {
    try {
      const response = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTheme,
          spaceId: newTheme.type === 'space' ? selectedSpace : undefined
        })
      })

      if (response.ok) {
        toast.success('Theme created successfully')
        setShowCreateTheme(false)
        setNewTheme({
          name: '',
          type: 'system',
          spaceId: '',
          animations: {},
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#f59e0b',
            background: '#ffffff',
            foreground: '#0f172a',
            muted: '#f1f5f9',
            border: '#e2e8f0',
            input: '#ffffff',
            ring: '#3b82f6'
          },
          typography: {
            fontFamily: 'Inter',
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem'
            },
            fontWeight: {
              normal: '400',
              medium: '500',
              semibold: '600',
              bold: '700'
            }
          },
          spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem'
          },
          borderRadius: {
            sm: '0.125rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem'
          },
          shadows: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
          },
          customCSS: ''
        })
        loadThemes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create theme')
      }
    } catch (error) {
      console.error('Error creating theme:', error)
      toast.error('Failed to create theme')
    }
  }

  const updateTheme = async (themeId: string, updates: Partial<Theme>) => {
    try {
      const response = await fetch(`/api/admin/themes/${themeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        toast.success('Theme updated successfully')
        loadThemes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update theme')
      }
    } catch (error) {
      console.error('Error updating theme:', error)
      toast.error('Failed to update theme')
    }
  }

  const deleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return

    try {
      const response = await fetch(`/api/admin/themes/${themeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Theme deleted successfully')
        loadThemes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete theme')
      }
    } catch (error) {
      console.error('Error deleting theme:', error)
      toast.error('Failed to delete theme')
    }
  }

  const activateTheme = async (themeId: string) => {
    try {
      const response = await fetch(`/api/admin/themes/${themeId}/activate`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Theme activated successfully')
        loadThemes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to activate theme')
      }
    } catch (error) {
      console.error('Error activating theme:', error)
      toast.error('Failed to activate theme')
    }
  }

  const duplicateTheme = async (theme: Theme) => {
    try {
      const response = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...theme,
          name: `${theme.name} (Copy)`,
          isActive: false,
          isDefault: false,
          id: undefined
        })
      })

      if (response.ok) {
        toast.success('Theme duplicated successfully')
        loadThemes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to duplicate theme')
      }
    } catch (error) {
      console.error('Error duplicating theme:', error)
      toast.error('Failed to duplicate theme')
    }
  }

  const systemThemes = themes.filter(theme => theme.type === 'system')
  const spaceThemes = themes.filter(theme => theme.type === 'space')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Theme & Branding
          </h2>
          <p className="text-muted-foreground">
            2-layer theming system: System-wide and Space-specific customization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadThemes} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateTheme} onOpenChange={setShowCreateTheme}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Theme
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Theme</DialogTitle>
                <DialogDescription>
                  Create a new theme for system-wide or space-specific customization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme-name">Theme Name</Label>
                    <Input
                      id="theme-name"
                      value={newTheme.name}
                      onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                      placeholder="Enter theme name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="theme-type">Theme Type</Label>
                    <Select value={newTheme.type} onValueChange={(value: any) => setNewTheme({ ...newTheme, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System Theme</SelectItem>
                        <SelectItem value="space">Space Theme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newTheme.type === 'space' && (
                  <div>
                    <Label htmlFor="space-select">Target Space</Label>
                    <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select space" />
                      </SelectTrigger>
                      <SelectContent>
                        {spaces.map(space => (
                          <SelectItem key={space.id} value={space.id}>
                            {space.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="w-full">
                <Tabs defaultValue="colors">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="typography">Typography</TabsTrigger>
                    <TabsTrigger value="spacing">Spacing</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="colors" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primary">Primary Color</Label>
                        <ColorInput
                          value={newTheme.colors.primary}
                          onChange={(color) => setNewTheme({
                            ...newTheme,
                            colors: { ...newTheme.colors, primary: color }
                          })}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#3b82f6"
                          inputClassName="h-10 text-xs pl-7"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondary">Secondary Color</Label>
                        <ColorInput
                          value={newTheme.colors.secondary}
                          onChange={(color) => setNewTheme({
                            ...newTheme,
                            colors: { ...newTheme.colors, secondary: color }
                          })}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#64748b"
                          inputClassName="h-10 text-xs pl-7"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="typography" className="space-y-4">
                    <div>
                      <Label htmlFor="font-family">Font Family</Label>
                      <Select value={newTheme.typography.fontFamily} onValueChange={(value) => setNewTheme({
                        ...newTheme,
                        typography: { ...newTheme.typography, fontFamily: value }
                      })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Lato">Lato</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="spacing" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="spacing-xs">Extra Small</Label>
                        <Input
                          id="spacing-xs"
                          value={newTheme.spacing.xs}
                          onChange={(e) => setNewTheme({
                            ...newTheme,
                            spacing: { ...newTheme.spacing, xs: e.target.value }
                          })}
                          placeholder="0.25rem"
                        />
                      </div>
                      <div>
                        <Label htmlFor="spacing-sm">Small</Label>
                        <Input
                          id="spacing-sm"
                          value={newTheme.spacing.sm}
                          onChange={(e) => setNewTheme({
                            ...newTheme,
                            spacing: { ...newTheme.spacing, sm: e.target.value }
                          })}
                          placeholder="0.5rem"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div>
                      <Label htmlFor="custom-css">Custom CSS</Label>
                      <Textarea
                        id="custom-css"
                        value={newTheme.customCSS}
                        onChange={(e) => setNewTheme({ ...newTheme, customCSS: e.target.value })}
                        placeholder="/* Custom CSS rules */"
                        rows={6}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateTheme(false)}>
                  Cancel
                </Button>
                <Button onClick={createTheme} disabled={!newTheme.name}>
                  Create Theme
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            System Themes
          </TabsTrigger>
          <TabsTrigger value="space" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Space Themes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System-Wide Themes</h3>
            <Badge variant="outline">{systemThemes.length} themes</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemThemes.map(theme => (
              <Card key={theme.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                    {theme.isActive && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {theme.isDefault ? 'Default theme' : 'Custom theme'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTheme(theme)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateTheme(theme)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    {!theme.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activateTheme(theme.id)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Activate
                      </Button>
                    )}
                    {!theme.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTheme(theme.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="space" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Space-Specific Themes</h3>
            <Badge variant="outline">{spaceThemes.length} themes</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaceThemes.map(theme => (
              <Card key={theme.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                    {theme.isActive && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {theme.spaceName} • {theme.isDefault ? 'Default' : 'Custom'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTheme(theme)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateTheme(theme)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    {!theme.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activateTheme(theme.id)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Activate
                      </Button>
                    )}
                    {!theme.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTheme(theme.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* Theme Editor Modal */}
      {selectedTheme && (
        <Dialog open={!!selectedTheme} onOpenChange={() => setSelectedTheme(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Edit Theme: {selectedTheme.name}
              </DialogTitle>
              <DialogDescription>
                Customize colors, typography, spacing, and advanced settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="w-full">
              <Tabs defaultValue="colors">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="typography">Typography</TabsTrigger>
                  <TabsTrigger value="spacing">Spacing</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedTheme.colors).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={key} className="capitalize">{key}</Label>
                        <ColorInput
                          value={value}
                          onChange={(color) => {
                            const updatedTheme = {
                              ...selectedTheme,
                              colors: { ...selectedTheme.colors, [key]: color }
                            }
                            setSelectedTheme(updatedTheme)
                          }}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#000000"
                          inputClassName="h-10 text-xs pl-7"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="typography" className="space-y-4">
                  <div>
                    <Label htmlFor="font-family">Font Family</Label>
                    <Select 
                      value={selectedTheme.typography?.fontFamily || 'Inter'} 
                      onValueChange={(value) => {
                        const updatedTheme = {
                          ...selectedTheme,
                          typography: { ...(selectedTheme.typography || {}), fontFamily: value }
                        } as Theme
                        setSelectedTheme(updatedTheme)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="spacing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedTheme.spacing || {}).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={`spacing-${key}`} className="capitalize">{key}</Label>
                        <Input
                          id={`spacing-${key}`}
                          value={value}
                          onChange={(e) => {
                            const updatedTheme = {
                              ...selectedTheme,
                              spacing: { ...(selectedTheme.spacing || {}), [key]: e.target.value }
                            } as Theme
                            setSelectedTheme(updatedTheme)
                          }}
                          placeholder="0.25rem"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div>
                    <Label htmlFor="custom-css">Custom CSS</Label>
                    <Textarea
                      id="custom-css"
                      value={selectedTheme.customCSS || ''}
                      onChange={(e) => {
                        const updatedTheme = {
                          ...selectedTheme,
                          customCSS: e.target.value
                        }
                        setSelectedTheme(updatedTheme)
                      }}
                      placeholder="/* Custom CSS rules */"
                      rows={6}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTheme(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                updateTheme(selectedTheme.id, selectedTheme)
                setSelectedTheme(null)
              }}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
