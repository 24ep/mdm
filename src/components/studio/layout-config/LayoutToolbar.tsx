'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WidgetSelectionDrawer } from './WidgetSelectionDrawer'
import { GlobalStyleDrawer } from './GlobalStyleDrawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Monitor, Smartphone, Tablet, Save, Box, Grid3x3, Move, Eye, EyeOff, History, Database, MoreVertical, Palette } from 'lucide-react'
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
}: LayoutToolbarProps) {
  const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false)
  const [globalStyleDrawerOpen, setGlobalStyleDrawerOpen] = useState(false)
  
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
        {/* Version Control Button */}
        {onOpenVersions && (
          <Button
            variant="ghost"
            size={isMobileViewport ? "default" : "sm"}
            onClick={onOpenVersions}
            className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} flex items-center gap-2 border-0 rounded-none`}
          >
            <History className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
            <span className={isMobileViewport ? "text-sm" : "text-xs"}>See Versions</span>
          </Button>
        )}
        
        {/* Widgets Button */}
        <Button
          variant="ghost"
          size={isMobileViewport ? "default" : "sm"}
          onClick={() => setWidgetDrawerOpen(true)}
          className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} flex items-center gap-2 border-0 rounded-none ${onOpenVersions && !isMobileViewport ? 'border-l border-border' : ''}`}
        >
          <Box className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
          <span className={isMobileViewport ? "text-sm" : "text-xs"}>Widgets</span>
        </Button>
        
        {/* Widget Selection Drawer */}
        <WidgetSelectionDrawer
          open={widgetDrawerOpen}
          onOpenChange={setWidgetDrawerOpen}
        />
        
        {/* Global Style Button */}
        {spaceId && (
          <Button
            variant="ghost"
            size={isMobileViewport ? "default" : "sm"}
            onClick={() => setGlobalStyleDrawerOpen(true)}
            className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} flex items-center gap-2 border-0 rounded-none ${!isMobileViewport ? 'border-l border-border' : ''}`}
          >
            <Palette className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
            <span className={isMobileViewport ? "text-sm" : "text-xs"}>Global Style</span>
          </Button>
        )}
        
        {/* Global Style Drawer */}
        {spaceId && (
          <GlobalStyleDrawer
            open={globalStyleDrawerOpen}
            onOpenChange={setGlobalStyleDrawerOpen}
            spaceId={spaceId}
            isMobileViewport={isMobileViewport}
            componentConfigs={componentConfigs}
            handleComponentConfigUpdate={handleComponentConfigUpdate}
          />
        )}
        
        {/* More Menu Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size={isMobileViewport ? "default" : "sm"}
              className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} flex items-center gap-2 border-0 rounded-none ${!isMobileViewport ? 'border-l border-border' : ''}`}
            >
              <MoreVertical className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
              <span className={isMobileViewport ? "text-sm" : "text-xs"}>Configuration</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="end">
            <div className="space-y-2">
              {/* Canvas Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Canvas Mode</Label>
                  <Select value={canvasMode} onValueChange={(value: string) => setCanvasMode(value as 'freeform' | 'grid')}>
                    <SelectTrigger className="h-9 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freeform">
                        <Move className="h-3.5 w-3.5 mr-2 inline-block" />
                        Freeform
                      </SelectItem>
                      <SelectItem value="grid">
                        <Grid3x3 className="h-3.5 w-3.5 mr-2 inline-block" />
                        Grid
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border my-1" />

              {/* Data Model Panel Toggle */}
              {onToggleDataModelPanel && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Show data model panel</Label>
                      <Switch
                        checked={showDataModelPanel || false}
                        onCheckedChange={(checked) => {
                          if (checked !== (showDataModelPanel || false)) {
                            onToggleDataModelPanel()
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="border-t border-border my-1" />
                </>
              )}

              {/* View Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">View Grid</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showGrid}
                      onCheckedChange={setShowGrid}
                    />
                    {showGrid && (
                      <span className="text-xs font-medium text-foreground">
                        {gridSize}px
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid Size - Only show when View Grid is on */}
              {showGrid && (
                <>
                  <div className="border-t border-border my-1" />
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Grid Size</Label>
                  <RadioGroup
                    value={gridSize.toString()}
                    onValueChange={(value) => setGridSize(parseInt(value))}
                    className="flex flex-row gap-1 flex-wrap"
                  >
                    {[5, 10, 15, 20].map(size => {
                      const isSelected = gridSize === size
                      return (
                        <label
                          key={size}
                          htmlFor={`grid-size-${size}`}
                          className="flex flex-col items-center gap-0.5 cursor-pointer"
                        >
                          <div className="relative">
                            <RadioGroupItem
                              value={size.toString()}
                              id={`grid-size-${size}`}
                              className="sr-only"
                            />
                            <div
                              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                                isSelected
                                  ? 'bg-primary/10'
                                  : 'opacity-60 hover:opacity-80'
                              }`}
                            >
                              <Grid3x3 className={`h-3.5 w-3.5 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            </div>
                          </div>
                          <span className={`text-[9px] ${
                            isSelected ? 'text-primary font-medium' : 'text-muted-foreground'
                          }`}>
                            {size}
                          </span>
                        </label>
                      )
                    })}
                  </RadioGroup>
                </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Device Mode Group */}
        <div className={`flex items-center ${isMobileViewport ? 'justify-center w-full' : 'gap-0'} ${isMobileViewport ? 'mt-2' : ''} ${!isMobileViewport ? 'border-l border-border' : ''}`}>
          <Button 
            variant="ghost" 
            size={isMobileViewport ? "default" : "sm"} 
            aria-label="Desktop" 
            onClick={() => { setDeviceMode('desktop'); setPreviewScale(1) }}
            className={`${isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3'} border-0 rounded-none ${deviceMode === 'desktop' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-background hover:bg-muted'}`}
          >
            <Monitor className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
          <Button 
            variant="ghost" 
            size={isMobileViewport ? "default" : "sm"} 
            aria-label="Tablet" 
            onClick={() => { setDeviceMode('tablet'); setPreviewScale(0.75) }}
            className={`${isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3'} border-0 rounded-none border-l border-border ${deviceMode === 'tablet' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-background hover:bg-muted'}`}
          >
            <Tablet className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
          <Button 
            variant="ghost" 
            size={isMobileViewport ? "default" : "sm"} 
            aria-label="Mobile" 
            onClick={() => { setDeviceMode('mobile'); setPreviewScale(0.5) }}
            className={`${isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3'} border-0 rounded-none border-l border-border ${deviceMode === 'mobile' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-background hover:bg-muted'}`}
          >
            <Smartphone className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
        </div>
      </div>
      {!isMobileViewport && (
        <Button 
          size="sm" 
          onClick={handleSave}
          className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white ml-2"
        >
          <Save className="h-4 w-4 mr-2" /> Save
        </Button>
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
            className="h-10 w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </>
      )}
    </div>
  )
}

