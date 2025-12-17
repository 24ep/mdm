'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WidgetSelectionDrawer } from './WidgetSelectionDrawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Monitor, Smartphone, Tablet, Save, Box, Grid3x3, Move, Eye, EyeOff, History, Database, MoreVertical, ChevronRight, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ComponentConfig } from './types'
import { LayoutTitle } from './LayoutTitle'
import { widgetsPalette } from './widgets'
import { Z_INDEX } from '@/lib/z-index'

interface LayoutToolbarProps {
  isMobileViewport: boolean
  deviceMode: 'desktop' | 'tablet' | 'mobile'
  componentConfigs: Record<string, ComponentConfig>
  setDeviceMode: (mode: 'desktop' | 'tablet' | 'mobile') => void
  setPreviewScale: (scale: number) => void
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
  setSelectedComponent: (component: string | null) => void
  handleSave: () => Promise<void>
  layoutName: string
  setLayoutName: (name: string) => void
  onSaveLayoutName: (newName: string) => Promise<void>
  canvasMode: 'freeform' | 'grid'
  setCanvasMode: (mode: 'freeform' | 'grid') => void
  showGrid: boolean
  setShowGrid: (show: boolean) => void
  gridSize: number
  setGridSize: (size: number) => void
  onOpenVersions?: () => void
  showDataModelPanel?: boolean
  onToggleDataModelPanel?: () => void
  spaceId?: string
  onExportMobile?: () => void
}

export function LayoutToolbar({
  isMobileViewport,
  deviceMode,
  componentConfigs,
  setDeviceMode,
  setPreviewScale,
  handleComponentConfigUpdate,
  setSelectedComponent,
  handleSave,
  layoutName,
  setLayoutName,
  onSaveLayoutName,
  canvasMode,
  setCanvasMode,
  showGrid,
  setShowGrid,
  gridSize,
  setGridSize,
  onOpenVersions,
  showDataModelPanel,
  onToggleDataModelPanel,
  spaceId,
  onExportMobile,
}: LayoutToolbarProps) {
  const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false)
  const [configPopoverOpen, setConfigPopoverOpen] = useState(false)
  
  return (
    <div 
      className={`${isMobileViewport ? 'p-3' : 'p-2'} flex ${isMobileViewport ? 'flex-col gap-3' : 'items-center justify-between'} border-b bg-background w-full`} 
      style={{ position: 'relative', zIndex: Z_INDEX.canvasElementSelected }}
    >
      <div className={`flex ${isMobileViewport ? 'flex-wrap gap-2' : 'items-center gap-2'} flex-1`}>
        {!isMobileViewport && (
          <div className="mr-2">
            <LayoutTitle 
              name={layoutName} 
              onChange={setLayoutName}
              onSave={onSaveLayoutName}
            />
          </div>
        )}
      </div>
      
      {/* Right Side Groups */}
      <div className={`flex ${isMobileViewport ? 'flex-wrap gap-2 w-full' : 'items-center gap-0'}`}>
        {/* Device Mode Group */}
        <div
          role="radiogroup"
          className={cn(
            "flex items-center gap-0",
            isMobileViewport ? 'justify-center w-full' : '',
            !isMobileViewport ? 'border-l border-border' : ''
          )}
        >
          <label
            htmlFor="device-desktop"
            className={cn(
              "inline-flex items-center justify-center cursor-pointer transition-colors duration-150",
              isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3',
              "border-0 rounded-none",
              deviceMode === 'desktop' 
                ? '!bg-muted !text-foreground font-medium' 
                : 'bg-background hover:bg-muted hover:text-foreground text-muted-foreground'
            )}
          >
            <input
              type="radio"
              id="device-desktop"
              name="device-mode"
              value="desktop"
              defaultChecked={deviceMode === 'desktop' || !deviceMode}
              checked={deviceMode === 'desktop'}
              onChange={() => {
                setDeviceMode('desktop')
                setPreviewScale(1)
              }}
              className="sr-only"
            />
            <Monitor 
              className={cn(
                isMobileViewport ? "h-5 w-5" : "h-4 w-4",
                "transition-colors",
                deviceMode === 'desktop' ? 'text-foreground' : 'text-muted-foreground'
              )} 
            />
            <span className="sr-only">Desktop</span>
          </label>
          <label
            htmlFor="device-tablet"
            className={cn(
              "inline-flex items-center justify-center cursor-pointer transition-colors duration-150",
              isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3',
              "border-0 rounded-none border-l border-border",
              deviceMode === 'tablet' 
                ? '!bg-muted !text-foreground font-medium' 
                : 'bg-background hover:bg-muted hover:text-foreground text-muted-foreground'
            )}
          >
            <input
              type="radio"
              id="device-tablet"
              name="device-mode"
              value="tablet"
              checked={deviceMode === 'tablet'}
              onChange={() => {
                setDeviceMode('tablet')
                setPreviewScale(0.75)
              }}
              className="sr-only"
            />
            <Tablet 
              className={cn(
                isMobileViewport ? "h-5 w-5" : "h-4 w-4",
                "transition-colors",
                deviceMode === 'tablet' ? 'text-foreground' : 'text-muted-foreground'
              )} 
            />
            <span className="sr-only">Tablet</span>
          </label>
          <label
            htmlFor="device-mobile"
            className={cn(
              "inline-flex items-center justify-center cursor-pointer transition-colors duration-150",
              isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3',
              "border-0 rounded-none border-l border-border",
              deviceMode === 'mobile' 
                ? '!bg-muted !text-foreground font-medium' 
                : 'bg-background hover:bg-muted hover:text-foreground text-muted-foreground'
            )}
          >
            <input
              type="radio"
              id="device-mobile"
              name="device-mode"
              value="mobile"
              checked={deviceMode === 'mobile'}
              onChange={() => {
                setDeviceMode('mobile')
                setPreviewScale(0.5)
              }}
              className="sr-only"
            />
            <Smartphone 
              className={cn(
                isMobileViewport ? "h-5 w-5" : "h-4 w-4",
                "transition-colors",
                deviceMode === 'mobile' ? 'text-foreground' : 'text-muted-foreground'
              )} 
            />
            <span className="sr-only">Mobile</span>
          </label>
        </div>
      </div>
      {!isMobileViewport && (
        <div className="flex items-center gap-2 ml-2">
          <Button 
            size="sm" 
            onClick={handleSave}
            className="h-8 px-3"
          >
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
          <Popover open={configPopoverOpen} onOpenChange={setConfigPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Configuration"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-56 p-1.5 bg-card border border-border shadow-lg" 
              align="end" 
            >
              <div className="space-y-1">
                {/* Canvas Mode */}
                <div className="flex items-center justify-between px-1.5 py-1">
                  <span className="text-xs text-foreground">Canvas mode</span>
                  <Select value={canvasMode} onValueChange={(value: string) => setCanvasMode(value as 'freeform' | 'grid')}>
                    <SelectTrigger className="h-6 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freeform">Freeform</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Model Panel Toggle */}
                {onToggleDataModelPanel && (
                  <div className="flex items-center justify-between px-1.5 py-1">
                    <span className="text-xs text-foreground">Data model panel</span>
                    <Switch
                      checked={showDataModelPanel || false}
                      onCheckedChange={() => onToggleDataModelPanel()}
                    />
                  </div>
                )}

                {/* View Grid */}
                <div className="flex items-center justify-between px-1.5 py-1">
                  <span className="text-xs text-foreground">View grid</span>
                  <Switch
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>

                {/* Grid Size - Only show when View Grid is on */}
                {showGrid && (
                  <div className="flex items-center justify-between px-1.5 py-1">
                    <span className="text-xs text-foreground">Grid size</span>
                    <Select
                      value={gridSize.toString()}
                      onValueChange={(value) => setGridSize(parseInt(value))}
                    >
                      <SelectTrigger className="h-6 w-12 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5px</SelectItem>
                        <SelectItem value="10">10px</SelectItem>
                        <SelectItem value="15">15px</SelectItem>
                        <SelectItem value="20">20px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* See Versions Button */}
                {onOpenVersions && (
                  <>
                    <div className="border-t border-border/50 my-2" />
                    <div
                      className="w-full cursor-pointer rounded px-1.5 py-1 hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setConfigPopoverOpen(false)
                        onOpenVersions()
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <History className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-foreground">See versions</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </>
                )}

                {/* Export for Mobile Button */}
                {onExportMobile && (
                  <>
                    <div className="border-t border-border/50 my-2" />
                    <div
                      className="w-full cursor-pointer rounded px-1.5 py-1 hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setConfigPopoverOpen(false)
                        onExportMobile()
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-foreground">Export for Mobile</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      {isMobileViewport && (
        <>
          <div className="w-full">
            <LayoutTitle 
              name={layoutName} 
              onChange={setLayoutName}
              onSave={onSaveLayoutName}
            />
          </div>
          <Button 
            size="default" 
            onClick={handleSave}
            className="h-10 w-full"
          >
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </>
      )}
    </div>
  )
}

