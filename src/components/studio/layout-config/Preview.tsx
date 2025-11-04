'use client'

import React, { RefObject, useMemo } from 'react'
import { File as FileIcon, LayoutDashboard, ClipboardList, Workflow, Layers, Settings } from 'lucide-react'
import { ComponentConfig, UnifiedPage } from './types'
import { builtInPagesMap } from './constants'
import { Canvas } from './Canvas'
import { getMenuItemKey } from './utils'

interface PreviewProps {
  isMobileViewport: boolean
  deviceMode: 'desktop' | 'tablet' | 'mobile'
  previewScale: number
  componentConfigs: Record<string, ComponentConfig>
  selectedComponent: string | null
  allPages: UnifiedPage[]
  selectedPageId: string | null
  canvasRef: RefObject<HTMLDivElement>
  isDraggingWidget: boolean
  selectedWidgetId: string | null
  selectedWidgetIds?: Set<string>
  placedWidgets: any[]
  dragOffset: { x: number; y: number }
  canvasMode: 'freeform' | 'grid'
  showGrid: boolean
  gridSize: number
  setSelectedComponent: (component: string | null) => void
  setSelectedPageId: (pageId: string | null) => void
  setPlacedWidgets: React.Dispatch<React.SetStateAction<any[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedWidgetIds?: React.Dispatch<React.SetStateAction<Set<string>>>
  setIsDraggingWidget: React.Dispatch<React.SetStateAction<boolean>>
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  clipboardWidget?: any
  clipboardWidgets?: any[]
  spaceId?: string
}

export function Preview({
  isMobileViewport,
  deviceMode,
  previewScale,
  componentConfigs,
  selectedComponent,
  allPages,
  selectedPageId,
  canvasRef,
  isDraggingWidget,
  selectedWidgetId,
  selectedWidgetIds,
  placedWidgets,
  dragOffset,
  canvasMode,
  showGrid,
  gridSize,
  setSelectedComponent,
  setSelectedPageId,
  setPlacedWidgets,
  setSelectedWidgetId,
  setSelectedWidgetIds,
  setIsDraggingWidget,
  setDragOffset,
  clipboardWidget,
  clipboardWidgets,
  spaceId,
}: PreviewProps) {
  
  // Resolve icon for custom pages
  const resolvePageIcon = useMemo(() => {
    const iconCache = new Map<string, React.ComponentType<{ className?: string }> | null>()
    
    return (page: UnifiedPage): React.ComponentType<{ className?: string }> | null => {
      if (iconCache.has(page.id)) {
        return iconCache.get(page.id)!
      }
      
      const isBuiltIn = page.type === 'built-in'
      let Icon: React.ComponentType<{ className?: string }> | null = null
      
      if (isBuiltIn) {
        Icon = page.icon || FileIcon
      } else if (page.page?.icon) {
        const customPage = page.page
        // Check if it's a letter, number, roman, or color
        if (customPage.icon.startsWith('letter-') || 
            customPage.icon.startsWith('number-') || 
            customPage.icon.startsWith('roman-') || 
            customPage.icon.startsWith('color-')) {
          // These are rendered as text/color, not icons
          Icon = null
        } else if (customPage.icon.startsWith('lucide-')) {
          // Lucide icon with prefix
          const iconName = customPage.icon.replace('lucide-', '')
          const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
            'LayoutDashboard': LayoutDashboard,
            'ClipboardList': ClipboardList,
            'Workflow': Workflow,
            'Layers': Layers,
            'File': FileIcon,
            'Settings': Settings,
            'FileText': FileIcon,
          }
          Icon = iconMap[iconName] || null
          
          // Try to load from lucide-react dynamically
          if (!Icon) {
            import('lucide-react').then((icons) => {
              const LucideIcon = (icons as any)[iconName]
              if (LucideIcon) {
                iconCache.set(page.id, LucideIcon)
              }
            }).catch(() => {})
          }
        } else if (customPage.icon.includes('-')) {
          // React Icon (format: fa-*, md-*, etc.)
          const [prefix, ...rest] = customPage.icon.split('-')
          const iconName = rest.join('-')
          
          // Try to load from react-icons dynamically
          // Use Function constructor to prevent Next.js build-time analysis
          try {
            const createDynamicImport = (path: string) => {
              // Use eval-style dynamic import that Next.js can't analyze
              return new Function('return import("' + path + '")')()
            }
            
            // Only load the specific library needed
            // @ts-ignore - react-icons may not be installed, errors are handled gracefully
            createDynamicImport(`react-icons/${prefix}`).then((icons: any) => {
              const IconComp = icons?.[iconName]
              if (IconComp) {
                iconCache.set(page.id, IconComp)
              }
            }).catch(() => {
              // react-icons not available
            })
          } catch (e) {
            // react-icons not available
          }
        } else {
          // Legacy lucide icon name (without prefix)
          const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
            'LayoutDashboard': LayoutDashboard,
            'ClipboardList': ClipboardList,
            'Workflow': Workflow,
            'Layers': Layers,
            'File': FileIcon,
            'Settings': Settings,
            'FileText': FileIcon,
          }
          Icon = iconMap[customPage.icon] || null
        }
      }
      
      if (!Icon) {
        Icon = FileIcon
      }
      
      iconCache.set(page.id, Icon)
      return Icon
    }
  }, [allPages])
  const deviceDimensions = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
  const dims = deviceDimensions[deviceMode]
  const isMobile = deviceMode === 'mobile'
  const isTablet = deviceMode === 'tablet'

  const topVisible = !!componentConfigs.top?.visible
  const topHeight = isMobile ? 56 : (componentConfigs.top?.height || 64)
  const topPos = componentConfigs.top?.position || 'top'
  const footerVisible = !!componentConfigs.footer?.visible
  const footerHeight = isMobile ? 48 : (componentConfigs.footer?.height || 60)
  const sidebarVisible = !!componentConfigs.sidebar?.visible
  const sidebarWidth = isTablet ? 200 : (componentConfigs.sidebar?.width || 250)
  const canvasTopOffset = topVisible && topPos === 'top' ? topHeight : 0
  const canvasBottomOffset = footerVisible ? footerHeight : 0
  const canvasHeight = dims.height - canvasTopOffset - canvasBottomOffset

  return (
    <div className="flex-1 bg-muted/30 relative overflow-auto min-h-0" style={{ zIndex: 1 }}>
      <div className={`w-full h-full flex items-start justify-center ${isMobileViewport ? 'p-2' : 'p-6'}`} style={{ position: 'relative', zIndex: 1 }}>
        <div className={`bg-background border relative`} style={{ width: `${dims.width}px`, height: `${dims.height}px`, transform: `scale(${previewScale})`, transformOrigin: 'center top', margin: '0 auto' }}>
          <div className="absolute inset-0">
            {/* Global header (top of body) */}
            {topVisible && topPos === 'top' && (
              <div
                style={{
                  height: `${topHeight}px`,
                  backgroundColor: componentConfigs.top?.backgroundColor,
                  color: componentConfigs.top?.textColor,
                  borderBottom: '1px solid rgba(0,0,0,0.08)'
                }}
                className={`w-full flex items-center justify-between ${isMobile ? 'px-3' : 'px-6'} cursor-pointer ${selectedComponent === 'top' ? 'ring-2 ring-blue-500 ring-offset-2' : ''} shadow-sm`}
                onClick={() => setSelectedComponent('top')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">MD</span>
                  </div>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>My Workspace</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">U</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            {footerVisible && (
              <div
                style={{
                  height: `${footerHeight}px`,
                  backgroundColor: componentConfigs.footer?.backgroundColor,
                  color: componentConfigs.footer?.textColor,
                  borderTop: '1px solid rgba(0,0,0,0.08)'
                }}
                className={`w-full absolute bottom-0 left-0 flex items-center justify-between ${isMobile ? 'px-3' : 'px-6'} cursor-pointer ${selectedComponent === 'footer' ? 'ring-2 ring-blue-500 ring-offset-2' : ''} shadow-sm`}
                onClick={() => setSelectedComponent('footer')}
              >
                <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                  © 2024 My Workspace. All rights reserved.
                </span>
                <div className="flex items-center gap-4">
                  <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 hover:text-gray-700 cursor-pointer`}>Privacy</span>
                  <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 hover:text-gray-700 cursor-pointer`}>Terms</span>
                  <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 hover:text-gray-700 cursor-pointer`}>Help</span>
                </div>
              </div>
            )}

            {/* Body area */}
            <div
              className="absolute left-0"
              style={{ top: `${canvasTopOffset}px`, height: `${canvasHeight}px`, width: '100%' }}
            >
              <div className={`w-full h-full ${isMobile ? 'flex-col' : 'flex'}`}>
                {/* Sidebar column - hidden on mobile */}
                {sidebarVisible && (
                  <div
                    style={{
                      width: `${sidebarWidth}px`,
                      backgroundColor: componentConfigs.sidebar?.backgroundColor,
                      color: componentConfigs.sidebar?.textColor,
                      borderRight: '1px solid rgba(0,0,0,0.08)'
                    }}
                    className={`${isMobile ? 'w-full h-auto border-r-0 border-b' : 'h-full'} cursor-pointer ${selectedComponent === 'sidebar' ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    onClick={() => setSelectedComponent('sidebar')}
                  >
                    {/* Header at top of sidebar (if configured) */}
                    {topVisible && topPos === 'topOfSidebar' && (
                      <div
                        style={{
                          height: `${topHeight}px`,
                          backgroundColor: componentConfigs.top?.backgroundColor,
                          color: componentConfigs.top?.textColor,
                          borderBottom: '1px solid rgba(0,0,0,0.08)'
                        }}
                        className={`w-full flex items-center ${isMobile ? 'px-2' : 'px-4'} cursor-pointer ${selectedComponent === 'top' ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedComponent('top') }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">MD</span>
                          </div>
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>Workspace</span>
                        </div>
                      </div>
                    )}
                    <div className={`${isMobile ? 'p-2' : 'p-4'} space-y-1`}>
                      {(() => {
                        const sidebarItems: Array<{ 
                          type: 'page' | 'separator' | 'badge'
                          label?: string
                          id: string
                          icon?: React.ComponentType<{ className?: string }>
                          badgeText?: string
                          badgeColor?: string
                        }> = []
                        const menuItems = componentConfigs.sidebar.menuItems || {}
                        
                        // Build sidebar items including separators and badges
                        allPages.forEach(unifiedPage => {
                          // Always include separators
                          if (unifiedPage.type === 'separator') {
                            sidebarItems.push({
                              type: 'separator',
                              id: unifiedPage.id
                            })
                            return
                          }
                          
                          // Always include badges
                          if (unifiedPage.type === 'badge') {
                            sidebarItems.push({
                              type: 'badge',
                              id: unifiedPage.id,
                              badgeText: unifiedPage.badgeText,
                              badgeColor: unifiedPage.badgeColor
                            })
                            return
                          }
                          
                          // For pages, check visibility
                          const isBuiltIn = unifiedPage.type === 'built-in'
                          const menuKey = isBuiltIn ? getMenuItemKey(unifiedPage.id) : unifiedPage.id
                          
                          if (menuKey) {
                            const isVisible = isBuiltIn 
                              ? (menuItems[menuKey] ?? false)
                              : (menuItems[menuKey] !== false)
                            
                            if (isVisible) {
                              // Resolve icon for custom pages
                              let pageIcon: React.ComponentType<{ className?: string }> = FileIcon
                              if (isBuiltIn) {
                                pageIcon = builtInPagesMap[unifiedPage.id]?.icon || FileIcon
                              } else {
                                const resolvedIcon = resolvePageIcon(unifiedPage)
                                if (resolvedIcon) {
                                  pageIcon = resolvedIcon
                                }
                              }
                              
                              sidebarItems.push({
                                type: 'page',
                                label: isBuiltIn 
                                  ? builtInPagesMap[unifiedPage.id]?.name || unifiedPage.name
                                  : (unifiedPage.page?.displayName || unifiedPage.page?.name || unifiedPage.name || 'Untitled Page'),
                                id: unifiedPage.id,
                                icon: pageIcon
                              })
                            }
                          }
                        })
                        
                        // Filter out separators at the start/end and consecutive separators
                        // Only keep separators that are between visible pages
                        // Badges are always shown
                        const filteredItems = sidebarItems.filter((item, idx) => {
                          // Badges are always shown
                          if (item.type === 'badge') {
                            return true
                          }
                          
                          if (item.type === 'separator') {
                            // Don't show separator if it's the first or last item
                            if (idx === 0 || idx === sidebarItems.length - 1) {
                              return false
                            }
                            // Don't show separator if previous or next item is also a separator
                            const prevItem = sidebarItems[idx - 1]
                            const nextItem = sidebarItems[idx + 1]
                            if (prevItem?.type === 'separator' || nextItem?.type === 'separator') {
                              return false
                            }
                            // Only show separator if there's a visible page before and after it
                            if (prevItem?.type === 'page' && nextItem?.type === 'page') {
                              return true
                            }
                            return false
                          }
                          return true
                        })
                        
                        if (filteredItems.length === 0) {
                          return (
                            <div className={`${isMobile ? 'py-3' : 'py-4'} text-center`}>
                              <div className={`text-xs text-gray-400 italic`}>
                                No menu items
                              </div>
                            </div>
                          )
                        }
                        
                        return filteredItems.map((item, idx) => {
                          // Render separator as actual line
                          if (item.type === 'separator') {
                            return (
                              <div 
                                key={item.id}
                                className="my-2"
                              >
                                <div className="h-px bg-border" />
                              </div>
                            )
                          }
                          
                          // Render badge
                          if (item.type === 'badge') {
                            return (
                              <div 
                                key={item.id}
                                className="flex items-center justify-center my-2"
                              >
                                <div
                                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: item.badgeColor || '#ef4444' }}
                                >
                                  {item.badgeText || 'New'}
                                </div>
                              </div>
                            )
                          }
                          
                          // Render page item
                          const Icon = item.icon || FileIcon
                          const isActive = selectedPageId === item.id || (selectedPageId === null && idx === 0)
                          return (
                            <div 
                              key={item.id} 
                              className={`flex items-center gap-3 ${isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-2.5 text-sm'} rounded-md transition-colors cursor-pointer ${
                                isActive 
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                                  : 'text-foreground hover:bg-muted'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPageId(item.id)
                                setSelectedComponent(null)
                              }}
                            >
                              <Icon className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
                              <span className="flex-1">{item.label}</span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div className={`${isMobile ? 'w-full' : 'flex-1'} h-full relative overflow-auto bg-muted/30`}>
                  <Canvas
                    canvasRef={canvasRef}
                    isMobile={isMobile}
                    isDraggingWidget={isDraggingWidget}
                    selectedComponent={selectedComponent}
                    selectedWidgetId={selectedWidgetId}
                    selectedWidgetIds={selectedWidgetIds}
                    selectedPageId={selectedPageId}
                    placedWidgets={placedWidgets.filter(w => w.pageId === selectedPageId || (!selectedPageId && placedWidgets.length > 0 && w.pageId === placedWidgets[0].pageId))}
                    dragOffset={dragOffset}
                    canvasMode={canvasMode}
                    showGrid={showGrid}
                    gridSize={gridSize}
                    setPlacedWidgets={setPlacedWidgets}
                    setSelectedWidgetId={setSelectedWidgetId}
                    setSelectedWidgetIds={setSelectedWidgetIds}
                    setSelectedComponent={setSelectedComponent}
                    setIsDraggingWidget={setIsDraggingWidget}
                    setDragOffset={setDragOffset}
                    clipboardWidget={clipboardWidget}
                    clipboardWidgets={clipboardWidgets}
                    spaceId={spaceId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

