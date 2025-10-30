'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ChevronDown, ChevronUp, Monitor, Smartphone, Tablet, ArrowLeft, Save, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { SpacesEditorManager } from '@/lib/space-studio-manager'

type ComponentType = 'sidebar' | 'top' | 'footer'

type ComponentConfig = {
  type: ComponentType
  visible: boolean
  position?: 'left' | 'right' | 'top' | 'bottom' | 'topOfSidebar'
  width?: number
  height?: number
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
  fontSize?: number
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold'
  opacity?: number
  zIndex?: number
  shadow?: boolean
  sticky?: boolean
  menuItems?: Record<'dashboard' | 'assignment' | 'spaceSettings' | 'workflows' | 'bulkAction', boolean>
}

export default function LayoutConfig({ spaceId }: { spaceId: string }) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>('sidebar')
  const [layoutName, setLayoutName] = useState<string>('Layout')
  const [componentConfigs, setComponentConfigs] = useState<Record<string, ComponentConfig>>({
    sidebar: {
      type: 'sidebar', visible: true, position: 'left', width: 250,
      backgroundColor: '#ffffff', textColor: '#374151', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 0,
      padding: 16, margin: 0, fontSize: 14, fontWeight: 'normal', opacity: 100, zIndex: 1, shadow: false, sticky: false,
      menuItems: { dashboard: true, assignment: true, spaceSettings: true, workflows: true, bulkAction: true }
    },
    top: {
      type: 'top', visible: true, position: 'top', height: 64, width: 220,
      backgroundColor: '#ffffff', textColor: '#374151', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 0,
      padding: 16, margin: 0, fontSize: 14, fontWeight: 'normal', opacity: 100, zIndex: 2, shadow: false, sticky: true
    },
    footer: {
      type: 'footer', visible: false, position: 'bottom', height: 60,
      backgroundColor: '#f9fafb', textColor: '#6b7280', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 0,
      padding: 16, margin: 0, fontSize: 14, fontWeight: 'normal', opacity: 100, zIndex: 1, shadow: false, sticky: false
    }
  })

  // Load saved layout on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const saved = await SpacesEditorManager.getLayoutConfig(spaceId)
        if (saved && mounted) {
          setComponentConfigs((prev) => ({ ...prev, ...saved }))
          const name = (saved && (saved.name || saved.title || saved.meta?.name)) || null
          if (name) setLayoutName(name as string)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [spaceId])

  const handleSave = useCallback(async () => {
    try {
      await SpacesEditorManager.saveLayoutConfig(spaceId, { ...componentConfigs, name: layoutName })
      toast.success('Layout saved')
    } catch (e) {
      toast.error('Failed to save layout')
    }
  }, [componentConfigs, layoutName, spaceId])

  const handleComponentConfigUpdate = useCallback((type: string, updates: Partial<ComponentConfig>) => {
    setComponentConfigs((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }))
  }, []);

  const updateSidebarMenuItem = useCallback(
    (key: keyof NonNullable<ComponentConfig['menuItems']>, value: boolean) => {
      const base = { dashboard: false, assignment: false, spaceSettings: false, workflows: false, bulkAction: false }
      const current = { ...base, ...(componentConfigs.sidebar.menuItems || {}) }
      current[key] = value
      handleComponentConfigUpdate('sidebar', { menuItems: current as any })
    },
    [componentConfigs.sidebar.menuItems, handleComponentConfigUpdate]
  )

  return (
    <div className="space-y-0">
      {/* Top Menu - Current Layout */}
      <div className="p-4 grid grid-cols-[1fr_auto] items-center sticky  border-b">
        <div className="space-y-0.5">
          <LayoutTitle name={layoutName} onChange={setLayoutName} />
          <p className="text-sm text-muted-foreground">Turn components on/off and configure them. Preview updates live.</p>
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <Button
            variant="outline"
            onClick={() => {
              try {
                window.location.href = `/${spaceId}/settings?tab=space-studio`
              } catch {
                window.history.back()
              }
            }}
            aria-label="Back to layout list"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Layouts
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${selectedComponent ? 'lg:grid-cols-[240px_1fr]' : 'lg:grid-cols-[240px_1fr_48%]'} border overflow-hidden h-[calc(100vh-120px)] min-h-0`}>
        {/* Left: Components menu */}
        <div className="h-full overflow-auto p-3 min-h-0">
          <div className="text-sm font-semibold mb-2">Components</div>
          <div className="space-y-2">
            {([
              { key: 'top', label: 'Header' },
              { key: 'sidebar', label: 'Sidebar' },
              { key: 'footer', label: 'Footer' },
            ] as Array<{ key: keyof typeof componentConfigs; label: string }>).map(item => (
              <button
                key={item.key as string}
                className={`w-full flex items-center justify-between rounded-md border p-3 text-left hover:bg-gray-50 ${selectedComponent === item.key ? 'ring-2 ring-offset-0 ring-gray-300' : ''}`}
                onClick={() => setSelectedComponent(item.key as string)}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <Switch
                  checked={componentConfigs[item.key].visible}
                  onCheckedChange={(v) => handleComponentConfigUpdate(item.key as string, { visible: v })}
                  onClick={(e) => e.stopPropagation()}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Component Settings (hide when Sidebar is selected) */}
        {selectedComponent ? null : (
        <div className="border-l space-y-0 h-full overflow-auto p-3 min-h-0">
          <div className="text-sm font-semibold">{selectedComponent ? `${selectedComponent === 'top' ? 'Header' : selectedComponent === 'sidebar' ? 'Sidebar' : 'Footer'} Settings` : 'Select a component'}</div>
            {/* Sidebar settings moved to the right of preview */}

            {selectedComponent === 'top' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Position</Label>
                  <Select value={componentConfigs.top.position || 'top'} onValueChange={(value) => handleComponentConfigUpdate('top', { position: value as any })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top of Body</SelectItem>
                      <SelectItem value="topOfSidebar">Top of Sidebar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Height (px)</Label>
                  <Input type="number" className="h-8" value={componentConfigs.top.height || 64} onChange={(e) => handleComponentConfigUpdate('top', { height: parseInt(e.target.value) || 64 })} />
                </div>
                <div>
                  <Label className="text-xs">Background</Label>
                  <Input type="color" className="h-8" value={componentConfigs.top.backgroundColor || '#ffffff'} onChange={(e) => handleComponentConfigUpdate('top', { backgroundColor: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Text</Label>
                  <Input type="color" className="h-8" value={componentConfigs.top.textColor || '#374151'} onChange={(e) => handleComponentConfigUpdate('top', { textColor: e.target.value })} />
                </div>
              </div>
            )}

            {selectedComponent === 'footer' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Height (px)</Label>
                  <Input type="number" className="h-8" value={componentConfigs.footer.height || 60} onChange={(e) => handleComponentConfigUpdate('footer', { height: parseInt(e.target.value) || 60 })} />
                </div>
                <div>
                  <Label className="text-xs">Background</Label>
                  <Input type="color" className="h-8" value={componentConfigs.footer.backgroundColor || '#f9fafb'} onChange={(e) => handleComponentConfigUpdate('footer', { backgroundColor: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Text</Label>
                  <Input type="color" className="h-8" value={componentConfigs.footer.textColor || '#6b7280'} onChange={(e) => handleComponentConfigUpdate('footer', { textColor: e.target.value })} />
                </div>
              </div>
            )}
        </div>
        )}

        {/* Right: Preview column with settings panel */}
        <div className="border-l overflow-hidden h-full flex flex-col min-h-0">
          <div className=" p-2 flex items-center justify-between border-b">
            <div className="text-sm font-semibold">Preview</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" aria-label="Desktop"><Monitor className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" aria-label="Tablet"><Tablet className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" aria-label="Mobile"><Smartphone className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex w-full flex-1 min-h-0">
            {/* Preview area */}
            <div className="p-6 flex-1 bg-gray-50 relative overflow-auto min-h-0">
              {componentConfigs.top?.visible && componentConfigs.top.position === 'top' && (
                <div
                  className={`w-full ${componentConfigs.top.sticky ? 'sticky top-0' : ''}`}
                  style={{
                    height: `${componentConfigs.top.height || 64}px`,
                    backgroundColor: componentConfigs.top.backgroundColor,
                    color: componentConfigs.top.textColor,
                    borderColor: componentConfigs.top.borderColor,
                    borderWidth: `${componentConfigs.top.borderWidth || 1}px`,
                    borderStyle: 'solid',
                    borderBottomWidth: `${componentConfigs.top.borderWidth || 1}px`,
                    padding: `${componentConfigs.top.padding || 16}px`,
                    fontSize: `${componentConfigs.top.fontSize || 14}px`,
                    fontWeight: componentConfigs.top.fontWeight || 'normal',
                    opacity: `${(componentConfigs.top.opacity || 100) / 100}`,
                    zIndex: componentConfigs.top.zIndex || 2,
                    boxShadow: componentConfigs.top.shadow ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                  }}
                >Header</div>
              )}

              <div className="flex w-full" style={{
                height: `calc(100% - ${
                  (componentConfigs.top?.visible && componentConfigs.top.position === 'top' ? (componentConfigs.top.height || 64) : 0) +
                  (componentConfigs.footer?.visible ? (componentConfigs.footer.height || 60) : 0)
                }px)`
              }}>
                <div style={{ width: `${componentConfigs.sidebar?.visible ? (componentConfigs.sidebar.width || 250) : 0}px` }} className="flex flex-col">
                  {componentConfigs.top?.visible && componentConfigs.top.position === 'topOfSidebar' && (
                    <div
                      className={`${componentConfigs.top.sticky ? 'sticky top-0' : ''}`}
                      style={{
                        height: `${componentConfigs.top.height || 56}px`,
                        backgroundColor: componentConfigs.top.backgroundColor,
                        color: componentConfigs.top.textColor,
                        borderColor: componentConfigs.top.borderColor,
                        borderWidth: `${componentConfigs.top.borderWidth || 1}px`,
                        borderStyle: 'solid',
                        borderBottomWidth: `${componentConfigs.top.borderWidth || 1}px`,
                        padding: `${componentConfigs.top.padding || 16}px`,
                        fontSize: `${componentConfigs.top.fontSize || 14}px`,
                        fontWeight: componentConfigs.top.fontWeight || 'normal',
                        opacity: `${(componentConfigs.top.opacity || 100) / 100}`,
                        zIndex: componentConfigs.top.zIndex || 2,
                        boxShadow: componentConfigs.top.shadow ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >Header</div>
                  )}

                  {componentConfigs.sidebar?.visible && (
                    <div
                      className={`flex-1 ${componentConfigs.sidebar.sticky ? 'sticky top-0' : ''}`}
                      style={{
                        backgroundColor: componentConfigs.sidebar.backgroundColor,
                        color: componentConfigs.sidebar.textColor,
                        borderColor: componentConfigs.sidebar.borderColor,
                        borderWidth: `${componentConfigs.sidebar.borderWidth || 1}px`,
                        borderStyle: 'solid',
                        borderRightWidth: `${componentConfigs.sidebar.borderWidth || 1}px`,
                        padding: `${componentConfigs.sidebar.padding || 16}px`,
                        opacity: `${(componentConfigs.sidebar.opacity || 100) / 100}`,
                        boxShadow: componentConfigs.sidebar.shadow ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <div className="space-y-2">
                        {(() => {
                          const items: Array<{ key: keyof NonNullable<ComponentConfig['menuItems']>; label: string }>= [
                            { key: 'dashboard', label: 'Dashboard' },
                            { key: 'assignment', label: 'Assignment' },
                            { key: 'spaceSettings', label: 'Space Settings' },
                            { key: 'workflows', label: 'Workflows' },
                            { key: 'bulkAction', label: 'Bulk Action' },
                          ]
                          return items
                            .filter(i => componentConfigs.sidebar.menuItems?.[i.key])
                            .map(i => (
                              <div key={i.key as string} className="h-10 bg-gray-100 rounded flex items-center px-3 text-sm">
                                {i.label}
                              </div>
                            ))
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-white p-6">
                  <div className="max-w-3xl space-y-4">
                    <h3 className="text-xl font-semibold">Main Content</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-24 bg-gray-100 rounded" />
                      <div className="h-24 bg-gray-100 rounded" />
                      <div className="h-24 bg-gray-100 rounded col-span-2" />
                    </div>
                  </div>
                </div>
              </div>

              {componentConfigs.footer?.visible && (
                <div
                  className={`${componentConfigs.footer.sticky ? 'sticky bottom-0' : ''}`}
                  style={{
                    height: `${componentConfigs.footer.height || 60}px`,
                    backgroundColor: componentConfigs.footer.backgroundColor,
                    color: componentConfigs.footer.textColor,
                    borderColor: componentConfigs.footer.borderColor,
                    borderWidth: `${componentConfigs.footer.borderWidth || 1}px`,
                    borderStyle: 'solid',
                    borderTopWidth: `${componentConfigs.footer.borderWidth || 1}px`,
                    padding: `${componentConfigs.footer.padding || 16}px`,
                    opacity: `${(componentConfigs.footer.opacity || 100) / 100}`,
                    boxShadow: componentConfigs.footer.shadow ? '0 -4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                  }}
                >Footer</div>
              )}
            </div>

            {/* Settings panel on the right of preview for selected component */}
            {selectedComponent && (
              <div className="w-[320px] border-l p-3 overflow-auto min-h-0">
                <div className="text-sm font-semibold mb-2">{selectedComponent === 'top' ? 'Header' : selectedComponent === 'footer' ? 'Footer' : 'Sidebar'} Settings</div>
                {selectedComponent === 'sidebar' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Position</Label>
                      <Select value={componentConfigs.sidebar.position || 'left'} onValueChange={(value) => handleComponentConfigUpdate('sidebar', { position: value as any })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Width (px)</Label>
                      <Input type="number" className="h-8" value={componentConfigs.sidebar.width || 250} onChange={(e) => handleComponentConfigUpdate('sidebar', { width: parseInt(e.target.value) || 250 })} />
                    </div>
                    <div>
                      <Label className="text-xs">Background</Label>
                      <Input type="color" className="h-8" value={componentConfigs.sidebar.backgroundColor || '#ffffff'} onChange={(e) => handleComponentConfigUpdate('sidebar', { backgroundColor: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Text</Label>
                      <Input type="color" className="h-8" value={componentConfigs.sidebar.textColor || '#374151'} onChange={(e) => handleComponentConfigUpdate('sidebar', { textColor: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Menu Items</Label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {([
                          { key: 'dashboard', label: 'Dashboard' },
                          { key: 'assignment', label: 'Assignment' },
                          { key: 'spaceSettings', label: 'Space Settings' },
                          { key: 'workflows', label: 'Workflows' },
                          { key: 'bulkAction', label: 'Bulk Action' },
                        ] as Array<{ key: keyof NonNullable<ComponentConfig['menuItems']>; label: string }>).map(item => (
                          <label key={item.key as string} className="flex items-center justify-between rounded-md border p-2 text-sm">
                            <span>{item.label}</span>
                            <Switch
                              checked={!!componentConfigs.sidebar.menuItems?.[item.key]}
                              onCheckedChange={(v) => updateSidebarMenuItem(item.key, v)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {selectedComponent === 'top' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Position</Label>
                      <Select value={componentConfigs.top.position || 'top'} onValueChange={(value) => handleComponentConfigUpdate('top', { position: value as any })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top of Body</SelectItem>
                          <SelectItem value="topOfSidebar">Top of Sidebar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Height (px)</Label>
                      <Input type="number" className="h-8" value={componentConfigs.top.height || 64} onChange={(e) => handleComponentConfigUpdate('top', { height: parseInt(e.target.value) || 64 })} />
                    </div>
                    <div>
                      <Label className="text-xs">Background</Label>
                      <Input type="color" className="h-8" value={componentConfigs.top.backgroundColor || '#ffffff'} onChange={(e) => handleComponentConfigUpdate('top', { backgroundColor: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Text</Label>
                      <Input type="color" className="h-8" value={componentConfigs.top.textColor || '#374151'} onChange={(e) => handleComponentConfigUpdate('top', { textColor: e.target.value })} />
                    </div>
                  </div>
                )}
                {selectedComponent === 'footer' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Height (px)</Label>
                      <Input type="number" className="h-8" value={componentConfigs.footer.height || 60} onChange={(e) => handleComponentConfigUpdate('footer', { height: parseInt(e.target.value) || 60 })} />
                    </div>
                    <div>
                      <Label className="text-xs">Background</Label>
                      <Input type="color" className="h-8" value={componentConfigs.footer.backgroundColor || '#f9fafb'} onChange={(e) => handleComponentConfigUpdate('footer', { backgroundColor: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Text</Label>
                      <Input type="color" className="h-8" value={componentConfigs.footer.textColor || '#6b7280'} onChange={(e) => handleComponentConfigUpdate('footer', { textColor: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LayoutTitle({ name, onChange }: { name: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  useEffect(() => { setValue(name) }, [name])

  const commit = useCallback(() => {
    onChange(value.trim() || 'Layout')
    setEditing(false)
  }, [onChange, value])

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
          className="h-8"
          autoFocus
        />
        <Button size="sm" variant="outline" onClick={commit}><Save className="h-4 w-4" /></Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold">{name}</h2>
      <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit name">
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  )
}


