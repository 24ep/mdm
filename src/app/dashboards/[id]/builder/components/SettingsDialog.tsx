import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'

interface DashboardSettings {
  name: string
  description: string
  background_color: string
  font_family: string
  font_size: number
  grid_size: number
  auto_save: boolean
  snap_to_grid: boolean
  show_grid: boolean
  grid_opacity: number
  default_element_size: { width: number; height: number }
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboard: any
  onSaveSettings: (settings: Partial<DashboardSettings>) => void
}

export function SettingsDialog({ open, onOpenChange, dashboard, onSaveSettings }: SettingsDialogProps) {
  const [settings, setSettings] = useState<DashboardSettings>({
    name: dashboard?.name || '',
    description: dashboard?.description || '',
    background_color: dashboard?.background_color || '#ffffff',
    font_family: dashboard?.font_family || 'Inter',
    font_size: dashboard?.font_size || 14,
    grid_size: dashboard?.grid_size || 12,
    auto_save: true,
    snap_to_grid: true,
    show_grid: true,
    grid_opacity: 0.3,
    default_element_size: { width: 4, height: 3 }
  })

  const handleSave = () => {
    onSaveSettings(settings)
    onOpenChange(false)
    toast.success('Dashboard settings saved successfully')
  }

  const handleReset = () => {
    setSettings({
      name: dashboard?.name || '',
      description: dashboard?.description || '',
      background_color: '#ffffff',
      font_family: 'Inter',
      font_size: 14,
      grid_size: 12,
      auto_save: true,
      snap_to_grid: true,
      show_grid: true,
      grid_opacity: 0.3,
      default_element_size: { width: 4, height: 3 }
    })
    toast.success('Settings reset to defaults')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Configure your dashboard appearance and behavior
          </DialogDescription>
        </DialogHeader>
        
        <div className="w-full">
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div>
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Enter dashboard name"
              />
            </div>
            <div>
              <Label htmlFor="dashboard-description">Description</Label>
              <Input
                id="dashboard-description"
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                placeholder="Enter dashboard description"
              />
            </div>
            <div>
              <Label>Default Element Size</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Width (Grid Units)</Label>
                  <Input
                    type="number"
                    value={settings.default_element_size.width}
                    onChange={(e) => setSettings({
                      ...settings,
                      default_element_size: {
                        ...settings.default_element_size,
                        width: parseInt(e.target.value) || 4
                      }
                    })}
                    min={1}
                    max={12}
                  />
                </div>
                <div>
                  <Label className="text-sm">Height (Grid Units)</Label>
                  <Input
                    type="number"
                    value={settings.default_element_size.height}
                    onChange={(e) => setSettings({
                      ...settings,
                      default_element_size: {
                        ...settings.default_element_size,
                        height: parseInt(e.target.value) || 3
                      }
                    })}
                    min={1}
                    max={12}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <div>
              <Label>Background Color</Label>
              <ColorInput
                value={settings.background_color}
                onChange={(color) => setSettings({ ...settings, background_color: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-10 text-xs pl-7"
              />
            </div>
            <div>
              <Label>Font Family</Label>
              <Select
                value={settings.font_family}
                onValueChange={(value) => setSettings({ ...settings, font_family: value })}
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
              <Label>Font Size: {settings.font_size}px</Label>
              <Slider
                value={[settings.font_size]}
                onValueChange={([value]) => setSettings({ ...settings, font_size: value })}
                min={8}
                max={24}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <Label>Grid Size: {settings.grid_size}×{settings.grid_size}</Label>
              <Slider
                value={[settings.grid_size]}
                onValueChange={([value]) => setSettings({ ...settings, grid_size: value })}
                min={6}
                max={24}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="behavior" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch
                  checked={settings.auto_save}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_save: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Snap to Grid</Label>
                  <p className="text-sm text-muted-foreground">Snap elements to grid when moving</p>
                </div>
                <Switch
                  checked={settings.snap_to_grid}
                  onCheckedChange={(checked) => setSettings({ ...settings, snap_to_grid: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Grid</Label>
                  <p className="text-sm text-muted-foreground">Display grid overlay on canvas</p>
                </div>
                <Switch
                  checked={settings.show_grid}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_grid: checked })}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div>
              <Label>Grid Opacity: {Math.round(settings.grid_opacity * 100)}%</Label>
              <Slider
                value={[settings.grid_opacity]}
                onValueChange={([value]) => setSettings({ ...settings, grid_opacity: value })}
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Performance Settings</Label>
              <div className="text-sm text-muted-foreground">
                <p>• Enable hardware acceleration for better performance</p>
                <p>• Reduce animation quality for slower devices</p>
                <p>• Limit concurrent data requests</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Export Settings</Label>
              <div className="text-sm text-muted-foreground">
                <p>• Default export format: PNG</p>
                <p>• Export resolution: 1920×1080</p>
                <p>• Include metadata in exports</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
