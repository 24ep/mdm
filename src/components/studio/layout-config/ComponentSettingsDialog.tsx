'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronDown, PanelTop, PanelLeft, PanelBottom } from 'lucide-react'
import { ComponentConfig } from './types'

interface ComponentSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobileViewport: boolean
  componentConfigs: Record<string, ComponentConfig>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
}

export function ComponentSettingsDialog({
  open,
  onOpenChange,
  isMobileViewport,
  componentConfigs,
  handleComponentConfigUpdate,
}: ComponentSettingsDialogProps) {
  const [expandedComponent, setExpandedComponent] = useState<string | null>('top')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobileViewport ? 'w-[90vw] max-w-[90vw]' : 'w-[600px] max-w-[600px]'} max-h-[80vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>Component Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Header Settings */}
          <div className="rounded-md border bg-background overflow-hidden">
            <div
              className={`flex items-center justify-between gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-2 py-1.5'} ${
                expandedComponent === 'top' ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-muted'
              } cursor-pointer`}
              onClick={() => {
                setExpandedComponent(expandedComponent === 'top' ? null : 'top')
              }}
            >
              <div className="flex items-center gap-2">
                <ChevronDown className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground transition-transform ${expandedComponent === 'top' ? 'rotate-180' : ''}`} />
                <PanelTop className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-foreground`} />
                <span className={`${isMobileViewport ? 'text-sm' : 'text-xs'} text-foreground`}>Header Settings</span>
              </div>
              <Switch
                checked={componentConfigs.top?.visible ?? false}
                onCheckedChange={(checked) => {
                  handleComponentConfigUpdate('top', { visible: checked })
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {expandedComponent === 'top' && (
              <div className={`${isMobileViewport ? 'px-3 py-3' : 'px-2 py-2'} border-t bg-muted`}>
                <div className={`grid ${isMobileViewport ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-3'}`}>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Height (px)</Label>
                    <Input type="number" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.top?.height || 64} onChange={(e) => handleComponentConfigUpdate('top', { height: parseInt(e.target.value) || 64 })} />
                  </div>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Background</Label>
                    <Input type="color" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.top?.backgroundColor || '#ffffff'} onChange={(e) => handleComponentConfigUpdate('top', { backgroundColor: e.target.value })} />
                  </div>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Text Color</Label>
                    <Input type="color" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.top?.textColor || '#374151'} onChange={(e) => handleComponentConfigUpdate('top', { textColor: e.target.value })} />
                  </div>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Position</Label>
                    <Select value={componentConfigs.top?.position || 'top'} onValueChange={(value) => handleComponentConfigUpdate('top', { position: value as any })}>
                      <SelectTrigger className={isMobileViewport ? "h-10" : "h-8"}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="topOfSidebar">Top of Sidebar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Settings */}
          <div className="rounded-md border bg-background overflow-hidden">
            <div
              className={`flex items-center justify-between gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-2 py-1.5'} ${
                expandedComponent === 'sidebar' ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-muted'
              } cursor-pointer`}
              onClick={() => {
                setExpandedComponent(expandedComponent === 'sidebar' ? null : 'sidebar')
              }}
            >
              <div className="flex items-center gap-2">
                <ChevronDown className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground transition-transform ${expandedComponent === 'sidebar' ? 'rotate-180' : ''}`} />
                <PanelLeft className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-foreground`} />
                <span className={`${isMobileViewport ? 'text-sm' : 'text-xs'} text-foreground`}>Sidebar Settings</span>
              </div>
              <Switch
                checked={componentConfigs.sidebar?.visible ?? false}
                onCheckedChange={(checked) => {
                  handleComponentConfigUpdate('sidebar', { visible: checked })
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {expandedComponent === 'sidebar' && (
              <div className={`${isMobileViewport ? 'px-3 py-3' : 'px-2 py-2'} border-t bg-muted`}>
                <div className={`grid ${isMobileViewport ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-3'}`}>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Position</Label>
                    <Select value={componentConfigs.sidebar.position || 'left'} onValueChange={(value) => handleComponentConfigUpdate('sidebar', { position: value as any })}>
                      <SelectTrigger className={isMobileViewport ? "h-10" : "h-8"}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Width (px)</Label>
                    <Input type="number" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.sidebar.width || 250} onChange={(e) => handleComponentConfigUpdate('sidebar', { width: parseInt(e.target.value) || 250 })} />
                  </div>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Background</Label>
                    <Input type="color" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.sidebar.backgroundColor || '#ffffff'} onChange={(e) => handleComponentConfigUpdate('sidebar', { backgroundColor: e.target.value })} />
                  </div>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Text Color</Label>
                    <Input type="color" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.sidebar.textColor || '#374151'} onChange={(e) => handleComponentConfigUpdate('sidebar', { textColor: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Settings */}
          <div className="rounded-md border bg-background overflow-hidden">
            <div
              className={`flex items-center justify-between gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-2 py-1.5'} ${
                expandedComponent === 'footer' ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-muted'
              } cursor-pointer`}
              onClick={() => {
                setExpandedComponent(expandedComponent === 'footer' ? null : 'footer')
              }}
            >
              <div className="flex items-center gap-2">
                <ChevronDown className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground transition-transform ${expandedComponent === 'footer' ? 'rotate-180' : ''}`} />
                <PanelBottom className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-foreground`} />
                <span className={`${isMobileViewport ? 'text-sm' : 'text-xs'} text-foreground`}>Footer Settings</span>
              </div>
              <Switch
                checked={componentConfigs.footer?.visible ?? false}
                onCheckedChange={(checked) => {
                  handleComponentConfigUpdate('footer', { visible: checked })
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {expandedComponent === 'footer' && (
              <div className={`${isMobileViewport ? 'px-3 py-3' : 'px-2 py-2'} border-t bg-muted`}>
                <div className={`grid ${isMobileViewport ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-3'}`}>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Height (px)</Label>
                    <Input type="number" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.footer?.height || 60} onChange={(e) => handleComponentConfigUpdate('footer', { height: parseInt(e.target.value) || 60 })} />
                  </div>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Background</Label>
                    <Input type="color" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.footer?.backgroundColor || '#f9fafb'} onChange={(e) => handleComponentConfigUpdate('footer', { backgroundColor: e.target.value })} />
                  </div>
                  <div>
                    <Label className={isMobileViewport ? "text-sm" : "text-xs"}>Text Color</Label>
                    <Input type="color" className={isMobileViewport ? "h-10" : "h-8"} value={componentConfigs.footer?.textColor || '#6b7280'} onChange={(e) => handleComponentConfigUpdate('footer', { textColor: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

