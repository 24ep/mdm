import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Palette, 
  Download, 
  Upload, 
  RotateCcw, 
  Save,
  Eye,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Layers,
  Type,
  Grid3X3
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'

interface Theme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    accent: string
    success: string
    warning: string
    error: string
  }
  typography: {
    fontFamily: string
    fontSize: number
    fontWeight: number
    lineHeight: number
  }
  spacing: {
    base: number
    small: number
    medium: number
    large: number
  }
  borderRadius: {
    small: number
    medium: number
    large: number
  }
  shadows: {
    small: string
    medium: string
    large: string
  }
}

interface AdvancedStylingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
  onThemeSave: (theme: Theme) => void
  onThemeReset: () => void
  onThemeExport: (theme: Theme) => void
  onThemeImport: (theme: Theme) => void
}

const PRESET_THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Light Theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5
    },
    spacing: {
      base: 8,
      small: 4,
      medium: 16,
      large: 24
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12
    },
    shadows: {
      small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      large: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
    }
  },
  {
    id: 'dark',
    name: 'Dark Theme',
    colors: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      accent: '#fbbf24',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171'
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5
    },
    spacing: {
      base: 8,
      small: 4,
      medium: 16,
      large: 24
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12
    },
    shadows: {
      small: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
      large: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
    }
  },
  {
    id: 'corporate',
    name: 'Corporate Theme',
    colors: {
      primary: '#1e40af',
      secondary: '#475569',
      background: '#ffffff',
      surface: '#f1f5f9',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#cbd5e1',
      accent: '#dc2626',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    },
    typography: {
      fontFamily: 'Roboto',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.6
    },
    spacing: {
      base: 8,
      small: 4,
      medium: 16,
      large: 24
    },
    borderRadius: {
      small: 2,
      medium: 4,
      large: 8
    },
    shadows: {
      small: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      large: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
    }
  }
]

export function AdvancedStylingDialog({
  open,
  onOpenChange,
  currentTheme,
  onThemeChange,
  onThemeSave,
  onThemeReset,
  onThemeExport,
  onThemeImport
}: AdvancedStylingDialogProps) {
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const [activeTab, setActiveTab] = useState('colors')

  const handleColorChange = (colorKey: keyof Theme['colors'], value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }))
  }

  const handleTypographyChange = (key: keyof Theme['typography'], value: any) => {
    setTheme(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value
      }
    }))
  }

  const handleSpacingChange = (key: keyof Theme['spacing'], value: number) => {
    setTheme(prev => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        [key]: value
      }
    }))
  }

  const handleBorderRadiusChange = (key: keyof Theme['borderRadius'], value: number) => {
    setTheme(prev => ({
      ...prev,
      borderRadius: {
        ...prev.borderRadius,
        [key]: value
      }
    }))
  }

  const applyPresetTheme = (presetTheme: Theme) => {
    setTheme(presetTheme)
    onThemeChange(presetTheme)
    toast.success(`Applied ${presetTheme.name}`)
  }

  const handleSave = () => {
    onThemeSave(theme)
    onOpenChange(false)
    toast.success('Theme saved successfully')
  }

  const handleReset = () => {
    onThemeReset()
    setTheme(currentTheme)
    toast.success('Theme reset to default')
  }

  const handleExport = () => {
    onThemeExport(theme)
    toast.success('Theme exported successfully')
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedTheme = JSON.parse(e.target?.result as string)
          setTheme(importedTheme)
          onThemeImport(importedTheme)
          toast.success('Theme imported successfully')
        } catch (error) {
          toast.error('Invalid theme file')
        }
      }
      reader.readAsText(file)
    }
  }

  const ColorInputField = ({ label, colorKey, value }: { label: string; colorKey: keyof Theme['colors']; value: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <ColorInput
        value={value}
        onChange={(color) => handleColorChange(colorKey, color)}
        allowImageVideo={false}
        className="relative"
        placeholder="#000000"
        inputClassName="flex-1 font-mono text-sm pl-7"
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Styling</DialogTitle>
          <DialogDescription>
            Customize the appearance of your dashboard with themes, colors, typography, and layout settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preset Themes */}
          <div>
            <h3 className="text-lg font-medium mb-4">Preset Themes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRESET_THEMES.map((presetTheme) => (
                <Card 
                  key={presetTheme.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    theme.id === presetTheme.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => applyPresetTheme(presetTheme)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      {presetTheme.id === 'light' && <Sun className="h-4 w-4" />}
                      {presetTheme.id === 'dark' && <Moon className="h-4 w-4" />}
                      {presetTheme.id === 'corporate' && <Monitor className="h-4 w-4" />}
                      <CardTitle className="text-base">{presetTheme.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex space-x-1">
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: presetTheme.colors.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: presetTheme.colors.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: presetTheme.colors.accent }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: presetTheme.colors.success }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {presetTheme.typography.fontFamily} • {presetTheme.colors.background === '#ffffff' ? 'Light' : 'Dark'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="spacing">Spacing</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="colors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Primary Colors</h4>
                  <ColorInputField label="Primary" colorKey="primary" value={theme.colors.primary} />
                  <ColorInputField label="Secondary" colorKey="secondary" value={theme.colors.secondary} />
                  <ColorInputField label="Accent" colorKey="accent" value={theme.colors.accent} />
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Background Colors</h4>
                  <ColorInputField label="Background" colorKey="background" value={theme.colors.background} />
                  <ColorInputField label="Surface" colorKey="surface" value={theme.colors.surface} />
                  <ColorInputField label="Border" colorKey="border" value={theme.colors.border} />
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Text Colors</h4>
                  <ColorInputField label="Text" colorKey="text" value={theme.colors.text} />
                  <ColorInputField label="Text Secondary" colorKey="textSecondary" value={theme.colors.textSecondary} />
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Status Colors</h4>
                  <ColorInputField label="Success" colorKey="success" value={theme.colors.success} />
                  <ColorInputField label="Warning" colorKey="warning" value={theme.colors.warning} />
                  <ColorInputField label="Error" colorKey="error" value={theme.colors.error} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="typography" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Font Family</Label>
                    <Select
                      value={theme.typography.fontFamily}
                      onValueChange={(value) => handleTypographyChange('fontFamily', value)}
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
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Font Size: {theme.typography.fontSize}px</Label>
                    <Slider
                      value={[theme.typography.fontSize]}
                      onValueChange={([value]) => handleTypographyChange('fontSize', value)}
                      min={10}
                      max={24}
                      step={1}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Font Weight: {theme.typography.fontWeight}</Label>
                    <Slider
                      value={[theme.typography.fontWeight]}
                      onValueChange={([value]) => handleTypographyChange('fontWeight', value)}
                      min={300}
                      max={700}
                      step={100}
                    />
                  </div>
                  <div>
                    <Label>Line Height: {theme.typography.lineHeight}</Label>
                    <Slider
                      value={[theme.typography.lineHeight]}
                      onValueChange={([value]) => handleTypographyChange('lineHeight', value)}
                      min={1}
                      max={2}
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="spacing" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Base Spacing: {theme.spacing.base}px</Label>
                    <Slider
                      value={[theme.spacing.base]}
                      onValueChange={([value]) => handleSpacingChange('base', value)}
                      min={4}
                      max={16}
                      step={2}
                    />
                  </div>
                  <div>
                    <Label>Small Spacing: {theme.spacing.small}px</Label>
                    <Slider
                      value={[theme.spacing.small]}
                      onValueChange={([value]) => handleSpacingChange('small', value)}
                      min={2}
                      max={8}
                      step={1}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Medium Spacing: {theme.spacing.medium}px</Label>
                    <Slider
                      value={[theme.spacing.medium]}
                      onValueChange={([value]) => handleSpacingChange('medium', value)}
                      min={8}
                      max={32}
                      step={2}
                    />
                  </div>
                  <div>
                    <Label>Large Spacing: {theme.spacing.large}px</Label>
                    <Slider
                      value={[theme.spacing.large]}
                      onValueChange={([value]) => handleSpacingChange('large', value)}
                      min={16}
                      max={48}
                      step={4}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="effects" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Border Radius</h4>
                  <div>
                    <Label>Small: {theme.borderRadius.small}px</Label>
                    <Slider
                      value={[theme.borderRadius.small]}
                      onValueChange={([value]) => handleBorderRadiusChange('small', value)}
                      min={0}
                      max={12}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label>Medium: {theme.borderRadius.medium}px</Label>
                    <Slider
                      value={[theme.borderRadius.medium]}
                      onValueChange={([value]) => handleBorderRadiusChange('medium', value)}
                      min={0}
                      max={16}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label>Large: {theme.borderRadius.large}px</Label>
                    <Slider
                      value={[theme.borderRadius.large]}
                      onValueChange={([value]) => handleBorderRadiusChange('large', value)}
                      min={0}
                      max={24}
                      step={1}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Shadows</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded" style={{ boxShadow: theme.shadows.small }}>
                      <div className="text-sm font-medium">Small Shadow</div>
                      <div className="text-xs text-muted-foreground">Subtle elevation</div>
                    </div>
                    <div className="p-3 border rounded" style={{ boxShadow: theme.shadows.medium }}>
                      <div className="text-sm font-medium">Medium Shadow</div>
                      <div className="text-xs text-muted-foreground">Moderate elevation</div>
                    </div>
                    <div className="p-3 border rounded" style={{ boxShadow: theme.shadows.large }}>
                      <div className="text-sm font-medium">Large Shadow</div>
                      <div className="text-xs text-muted-foreground">High elevation</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <label>
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Theme
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
