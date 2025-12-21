import React, { useMemo, useState } from 'react'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

type Visibility = 'PRIVATE' | 'RESTRICTED' | 'PUBLIC'

interface ShareSettings {
  visibility: Visibility
  allowed_users: string[]
  embed_enabled: boolean
  public_link?: string
}

interface Theme {
  id: string
  name: string
  colors: Record<string, string>
  typography: { fontFamily: string; fontSize: number; fontWeight: number; lineHeight: number }
  spacing: { base: number; small: number; medium: number; large: number }
  borderRadius: { small: number; medium: number; large: number }
  shadows: { small: string; medium: string; large: string }
}

interface CombinedToolsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: 'share' | 'versions' | 'styling' | 'settings'

  // Share
  dashboardName: string
  shareSettings: ShareSettings
  onUpdateShareSettings: (settings: ShareSettings) => void

  // Versioning
  versions: Array<{ id: string; name: string; version: string; description?: string; is_current?: boolean }>
  onVersionSelect: (id: string) => void
  onVersionCreate: (name: string, version: string, description?: string) => void
  onVersionDelete: (id: string) => void

  // Styling
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
  onThemeSave: (theme: Theme) => void
  onThemeReset: () => void
  themePresets?: Theme[]
  onThemeExport?: (theme: Theme) => void
  onThemeImport?: (theme: Theme) => void

  // Settings
  dashboard: { id: string; name: string; description?: string }
  onSaveSettings: (updates: { name?: string; description?: string; fullpage_background?: boolean }) => void
  refreshIntervalMs?: number
  onSaveCanvasSettings?: (updates: { refresh_interval_ms?: number }) => void
  pageNavPlacement?: 'top' | 'left' | 'right' | 'button' | 'icon'
  onSavePageNavPlacement?: (placement: 'top' | 'left' | 'right' | 'button' | 'icon') => void
}

export function CombinedToolsDrawer({
  open,
  onOpenChange,
  initialTab = 'share',
  dashboardName,
  shareSettings,
  onUpdateShareSettings,
  versions,
  onVersionSelect,
  onVersionCreate,
  onVersionDelete,
  currentTheme,
  onThemeChange,
  onThemeSave,
  onThemeReset,
  themePresets = [],
  onThemeExport,
  onThemeImport,
  dashboard,
  onSaveSettings,
  refreshIntervalMs,
  onSaveCanvasSettings,
  pageNavPlacement = 'top',
  onSavePageNavPlacement,
}: CombinedToolsDrawerProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  // Local states for forms
  const [share, setShare] = useState<ShareSettings>(shareSettings)
  const [newVersion, setNewVersion] = useState({ name: '', version: '', description: '' })
  const [settingsName, setSettingsName] = useState(dashboard.name)
  const [settingsDesc, setSettingsDesc] = useState(dashboard.description || '')
  const [refreshInterval, setRefreshInterval] = useState<number>(refreshIntervalMs || 30000)

  const onSaveShare = () => onUpdateShareSettings(share)

  const presetThemes: Theme[] = useMemo(() => ([
    ...themePresets,
  ]), [themePresets])
  const [themeSource, setThemeSource] = useState<'custom' | 'preset'>('custom')
  const [selectedPresetId, setSelectedPresetId] = useState<string>(presetThemes[0]?.id || '')
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Tools"
      width="w-full md:w-[720px]"
    >
      <div className="px-4 pb-4">
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="share">Share</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="styling">Styling</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Share */}
            <TabsContent value="share" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Visibility</Label>
                <div className="flex gap-2 mt-2">
                  {(['PRIVATE', 'RESTRICTED', 'PUBLIC'] as Visibility[]).map(v => (
                    <Button key={v} variant={share.visibility === v ? 'default' : 'outline'} size="sm" onClick={() => setShare({ ...share, visibility: v })}>
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
              {share.visibility === 'RESTRICTED' && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Select users in full dialog</Badge>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch checked={share.embed_enabled} onCheckedChange={(v) => setShare({ ...share, embed_enabled: v })} />
                <Label>Enable embedding</Label>
              </div>
              <div className="flex justify-end">
                <Button onClick={onSaveShare}>Save Share</Button>
              </div>
            </TabsContent>

            {/* Versions */}
            <TabsContent value="versions" className="space-y-4">
              <div className="space-y-2">
                {versions.map(v => (
                  <div key={v.id} className="flex items-center justify-between border rounded p-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.is_current ? 'default' : 'outline'}>{v.version}</Badge>
                      <div className="font-medium">{v.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => onVersionSelect(v.id)}>Restore</Button>
                      <Button variant="outline" size="sm" onClick={() => onVersionDelete(v.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Name" value={newVersion.name} onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })} />
                <Input placeholder="Version" value={newVersion.version} onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })} />
                <Input placeholder="Description" value={newVersion.description} onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })} />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => onVersionCreate(newVersion.name, newVersion.version, newVersion.description)}>Create Version</Button>
              </div>
            </TabsContent>

            {/* Styling */}
            <TabsContent value="styling" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Theme Source</Label>
                <div className="flex gap-2">
                  <Button variant={themeSource === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setThemeSource('custom')}>Custom</Button>
                  <Button variant={themeSource === 'preset' ? 'default' : 'outline'} size="sm" onClick={() => setThemeSource('preset')}>Preset</Button>
                </div>
              </div>
              {themeSource === 'preset' && (
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Choose Preset</Label>
                    <select
                      className="w-full h-9 border rounded px-2"
                      value={selectedPresetId}
                      onChange={(e) => setSelectedPresetId(e.target.value)}
                    >
                      {presetThemes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      const preset = presetThemes.find(t => t.id === selectedPresetId)
                      if (preset) onThemeChange({ ...preset })
                    }}>Apply</Button>
                  </div>
                </div>
              )}
              {themeSource === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Theme Name</Label>
                    <Input value={currentTheme.name} onChange={(e) => onThemeChange({ ...currentTheme, name: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => onThemeSave(currentTheme)}>Save Theme</Button>
                    <Button variant="outline" onClick={onThemeReset}>Reset</Button>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onThemeExport && onThemeExport(currentTheme)}>Export JSON</Button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  try {
                    const theme = JSON.parse(text)
                    onThemeImport && onThemeImport(theme)
                  } catch { }
                }} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Import JSON</Button>
              </div>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dashboard Name</Label>
                <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea rows={3} value={settingsDesc} onChange={(e) => setSettingsDesc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Canvas Refresh Interval (ms)</Label>
                <Input type="number" value={refreshInterval} onChange={(e) => setRefreshInterval(parseInt(e.target.value || '0') || 0)} />
                <div className="text-xs text-muted-foreground">Applies to live data refresh for charts on this dashboard.</div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setRefreshInterval(30000)}>Reset to 30000</Button>
                  <Button onClick={() => onSaveCanvasSettings && onSaveCanvasSettings({ refresh_interval_ms: refreshInterval })}>Save Canvas Settings</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Canvas/Page Background</Label>
                <div className="flex items-center gap-2">
                  <Switch id="fullpage-bg" onCheckedChange={(v) => onSaveSettings({ fullpage_background: v })} />
                  <Label htmlFor="fullpage-bg">Use full page background (no canvas border)</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Page Navigation Placement</Label>
                <div className="flex flex-wrap gap-2">
                  {(['top', 'left', 'right', 'button', 'icon'] as const).map(p => (
                    <Button key={p} variant={pageNavPlacement === p ? 'default' : 'outline'} size="sm" onClick={() => onSavePageNavPlacement && onSavePageNavPlacement(p)}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => onSaveSettings({ name: settingsName, description: settingsDesc })}>Save Settings</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CentralizedDrawer>
  )
}


