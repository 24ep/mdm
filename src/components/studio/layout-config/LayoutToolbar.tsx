'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WidgetSelectionDrawer } from './WidgetSelectionDrawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Label } from '@/components/ui/label'
import { Monitor, Smartphone, Tablet, Save, Box, Grid3x3, Move, Eye, EyeOff, History, Database } from 'lucide-react'
import { ComponentConfig } from './types'
import { LayoutTitle } from './LayoutTitle'
import { widgetsPalette } from './widgets'

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
}: LayoutToolbarProps) {
  const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false)
  
  return (
    <div 
      className={`${isMobileViewport ? 'p-3' : 'p-2'} flex ${isMobileViewport ? 'flex-col gap-3' : 'items-center justify-between'} border-b bg-background w-full`} 
      style={{ position: 'relative', zIndex: 10 }}
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
      <div className={`flex ${isMobileViewport ? 'flex-wrap gap-2 w-full' : 'items-center gap-2'}`}>
        {/* Version Control Button */}
        {onOpenVersions && (
          <Button
            variant="outline"
            size={isMobileViewport ? "default" : "sm"}
            onClick={onOpenVersions}
            className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} flex items-center gap-2`}
          >
            <History className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
            <span className={isMobileViewport ? "text-sm" : "text-xs"}>Versions</span>
          </Button>
        )}
        
        
        {/* Data Model Panel Toggle Button */}
        {onToggleDataModelPanel && (
          <Button
            variant="outline"
            size={isMobileViewport ? "default" : "sm"}
            onClick={onToggleDataModelPanel}
            className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} flex items-center gap-2 ${
              showDataModelPanel ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' : ''
            }`}
          >
            <Database className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
            <span className={isMobileViewport ? "text-sm" : "text-xs"}>Data Models</span>
          </Button>
        )}
        
        {/* Widgets Button */}
        <Button
          variant="outline"
          size={isMobileViewport ? "default" : "sm"}
          onClick={() => setWidgetDrawerOpen(true)}
          className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} flex items-center gap-2`}
        >
          <Box className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
          <span className={isMobileViewport ? "text-sm" : "text-xs"}>Widgets</span>
        </Button>
        
        {/* Widget Selection Drawer */}
        <WidgetSelectionDrawer
          open={widgetDrawerOpen}
          onOpenChange={setWidgetDrawerOpen}
        />
        
        {/* Canvas Mode Group */}
        <div className={`flex ${isMobileViewport ? 'flex-col gap-2 w-full' : 'items-center gap-2'} ${isMobileViewport ? 'mt-2' : ''}`}>
          {/* Canvas Mode Dropdown */}
          <div className={`flex ${isMobileViewport ? 'flex-col' : 'items-center'} gap-2`}>
            <span className={`${isMobileViewport ? 'text-sm' : 'text-xs'} whitespace-nowrap font-medium`}>Canvas Mode</span>
            <Select value={canvasMode} onValueChange={(value: 'freeform' | 'grid') => setCanvasMode(value)}>
              <SelectTrigger className={isMobileViewport ? "h-10 w-full" : "h-8 w-32"}>
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

          {/* View Grid Dropdown */}
          <Select value={showGrid ? 'on' : 'off'} onValueChange={(value) => setShowGrid(value === 'on')}>
            <SelectTrigger className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} ${showGrid ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' : ''}`}>
              <div className="flex items-center gap-2">
                {showGrid ? (
                  <Eye className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
                ) : (
                  <EyeOff className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
                )}
                <span className={isMobileViewport ? "text-sm" : "text-xs"}>View Grid</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>On</span>
                </div>
              </SelectItem>
              <SelectItem value="off">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  <span>Off</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Grid Size Dropdown */}
          <Select 
            value={gridSize.toString()} 
            onValueChange={(value) => setGridSize(parseInt(value))}
          >
            <SelectTrigger className={`${isMobileViewport ? 'h-10 w-full' : 'h-8 px-3'} flex items-center gap-2`}>
              <Grid3x3 className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
              <span className={isMobileViewport ? "text-sm" : "text-xs"}>{gridSize}px</span>
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Device Mode Group */}
        <div className={`flex items-center ${isMobileViewport ? 'justify-center w-full' : 'gap-0'} border rounded-md overflow-hidden ${isMobileViewport ? 'mt-2' : ''}`}>
          <Button 
            variant="ghost" 
            size={isMobileViewport ? "default" : "sm"} 
            aria-label="Desktop" 
            onClick={() => { setDeviceMode('desktop'); setPreviewScale(1) }}
            className={`${isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3'} rounded-none border-r ${deviceMode === 'desktop' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' : 'bg-background hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <Monitor className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
          <Button 
            variant="ghost" 
            size={isMobileViewport ? "default" : "sm"} 
            aria-label="Tablet" 
            onClick={() => { setDeviceMode('tablet'); setPreviewScale(0.75) }}
            className={`${isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3'} rounded-none border-r ${deviceMode === 'tablet' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' : 'bg-background hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <Tablet className={isMobileViewport ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
          <Button 
            variant="ghost" 
            size={isMobileViewport ? "default" : "sm"} 
            aria-label="Mobile" 
            onClick={() => { setDeviceMode('mobile'); setPreviewScale(0.5) }}
            className={`${isMobileViewport ? 'h-10 flex-1' : 'h-8 px-3'} rounded-none ${deviceMode === 'mobile' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' : 'bg-background hover:bg-gray-50 dark:hover:bg-gray-800'}`}
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

