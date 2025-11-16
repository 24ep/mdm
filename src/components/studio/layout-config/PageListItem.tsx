'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileIcon, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { UnifiedPage } from './types'
import { IconPicker } from './IconPicker'
import { resolvePageIcon, IconResolution } from './iconUtils'
import { PageMenu } from './PageMenu'
import { BackgroundColorPicker } from './BackgroundColorPicker'
import { SidebarPositionPicker } from './SidebarPositionPicker'
import { getMenuItemKey } from './utils'

interface PageListItemProps {
  page: UnifiedPage
  index: number
  isMobileViewport: boolean
  spaceId: string
  selectedPageId: string | null
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  allIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  reactIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  iconPickerOpen: string | null
  colorPickerOpen: string | null
  sidebarPositionOpen: string | null
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  handleIconUpdate: (pageId: string, icon: string) => Promise<void>
  isPageVisibleInSidebar: (pageId: string, pageType: 'built-in' | 'custom') => boolean
  updateSidebarMenuItem: (key: string | number | symbol, value: boolean) => void
  updateCustomPageSidebarVisibility: (pageId: string, visible: boolean) => void
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
  setSelectedPageId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedPageForPermissions: React.Dispatch<React.SetStateAction<SpacesEditorPage | null>>
  setPermissionsRoles: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setComponentSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIconPickerOpen: React.Dispatch<React.SetStateAction<string | null>>
  setColorPickerOpen: React.Dispatch<React.SetStateAction<string | null>>
  setSidebarPositionOpen: React.Dispatch<React.SetStateAction<string | null>>
}

export function PageListItem({
  page,
  index,
  isMobileViewport,
  spaceId,
  selectedPageId,
  allPages,
  pages,
  allIcons,
  reactIcons,
  iconPickerOpen,
  colorPickerOpen,
  sidebarPositionOpen,
  handlePageReorder,
  handleIconUpdate,
  isPageVisibleInSidebar,
  updateSidebarMenuItem,
  updateCustomPageSidebarVisibility,
  setPages,
  setAllPages,
  setSelectedPageId,
  setSelectedComponent,
  setSelectedPageForPermissions,
  setPermissionsRoles,
  setPermissionsUserIds,
  setPermissionsDialogOpen,
  setComponentSettingsOpen,
  setIconPickerOpen,
  setColorPickerOpen,
  setSidebarPositionOpen,
}: PageListItemProps) {
  const isBuiltInPage = page.type === 'built-in'
  const customPageForRender = page.page
  const sidebarPositionTriggerRef = useRef<HTMLButtonElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Position sidebar position trigger when popover opens
  useEffect(() => {
    if (sidebarPositionOpen === page.id && sidebarPositionTriggerRef.current) {
      const menuButton = sidebarPositionTriggerRef.current.parentElement?.querySelector('[aria-label="Page actions"]') as HTMLElement
      if (menuButton) {
        const rect = menuButton.getBoundingClientRect()
        sidebarPositionTriggerRef.current.style.position = 'fixed'
        sidebarPositionTriggerRef.current.style.left = `${rect.right}px`
        sidebarPositionTriggerRef.current.style.top = `${rect.top}px`
        sidebarPositionTriggerRef.current.style.width = '1px'
        sidebarPositionTriggerRef.current.style.height = '1px'
        sidebarPositionTriggerRef.current.style.opacity = '0'
        sidebarPositionTriggerRef.current.style.pointerEvents = 'none'
        sidebarPositionTriggerRef.current.style.zIndex = '-1'
      }
    }
  }, [sidebarPositionOpen, page.id])

  // Resolve icon for custom pages
  let iconResolution: IconResolution
  if (isBuiltInPage) {
    iconResolution = { Icon: page.icon || FileIcon, displayContent: null, displayColor: null }
  } else if (customPageForRender) {
    iconResolution = resolvePageIcon(customPageForRender, allIcons, reactIcons)
  } else {
    iconResolution = { Icon: FileIcon, displayContent: null, displayColor: null }
  }

  const { Icon, displayContent, displayColor } = iconResolution

  const isVisibleInSidebar = isPageVisibleInSidebar(
    isBuiltInPage ? page.id : (customPageForRender?.id || ''),
    isBuiltInPage ? 'built-in' : 'custom'
  )

  // Get available parent pages (exclude current page and built-in pages)
  const availableParentPages = allPages.filter(p => (
    p.type === 'custom' && 
    p.page && 
    p.id !== page.id &&
    (p.page as any).id !== (customPageForRender as any)?.parentPageId
  ))

  const currentParentPage = customPageForRender 
    ? allPages.find(p => p.type === 'custom' && p.page && (p.page as any).id === (customPageForRender as any)?.parentPageId)
    : null

  return (
    <div
      className={`rounded-[10px] border ${
        selectedPageId === page.id ? 'ring-2 ring-border' : ''
      } ${
        isBuiltInPage 
          ? 'bg-muted hover:bg-muted/80' 
          : customPageForRender?.hidden 
            ? 'bg-muted text-muted-foreground hover:bg-muted/80' 
            : 'hover:bg-muted'
      } select-none`}
    >
      <div className={`flex items-center justify-between gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-4 py-1.5'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Icon Picker - Only for custom pages */}
          {!isBuiltInPage && customPageForRender ? (
          <IconPicker
            spaceId={spaceId}
            page={customPageForRender}
            allIcons={allIcons}
            reactIcons={reactIcons}
            isMobileViewport={isMobileViewport}
            onUpdate={handleIconUpdate}
            open={iconPickerOpen === page.id}
            onOpenChange={(open) => {
              setIconPickerOpen(open ? page.id : null)
            }}
            trigger={
              <button
                type="button"
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation()
                  setIconPickerOpen(iconPickerOpen === page.id ? null : page.id)
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`flex items-center justify-center ${isMobileViewport ? 'h-8 w-8' : 'h-7 w-7'} rounded-md border border-border hover:bg-muted transition-colors cursor-pointer`}
              >
                {displayColor ? (
                  <div 
                    className="w-full h-full rounded" 
                    style={{ backgroundColor: displayColor }}
                  />
                ) : displayContent ? (
                  <span className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} font-semibold text-foreground`}>
                    {displayContent}
                  </span>
                ) : Icon ? (
                  <Icon className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
                ) : (
                  <FileIcon className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
                )}
              </button>
            }
          />
          ) : (
            <div className={`flex items-center justify-center ${isMobileViewport ? 'h-8 w-8' : 'h-7 w-7'} rounded-md`}>
              {Icon && (
                <Icon className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} ${isBuiltInPage ? 'text-foreground' : 'text-muted-foreground'}`} />
              )}
            </div>
          )}
          
          {isBuiltInPage ? (
          <span className={`${isMobileViewport ? 'text-sm' : 'text-xs'} text-foreground pointer-events-none`}>{page.name}</span>
        ) : (
          <input
            className={`${isMobileViewport ? 'text-sm' : 'text-xs'} bg-transparent outline-none border-b border-transparent focus:border-border flex-1 min-w-0`}
            draggable={false}
            value={page.name || ''}
            onChange={(e) => {
              const val = e.target.value
              if (customPageForRender) {
                setPages((prev) => prev.map((x) => x.id === customPageForRender.id ? { ...x, displayName: val } : x))
              }
            }}
            onBlur={async (e) => {
              const val = e.target.value
              if (customPageForRender && val && val !== (customPageForRender.displayName || customPageForRender.name)) {
                try {
                  await SpacesEditorManager.updatePage(spaceId, customPageForRender.id, { displayName: val })
                  toast.success('Page renamed')
                } catch (err) {
                  toast.error('Failed to rename page')
                  console.error(err)
                }
              }
            }}
            onFocus={() => { 
              setSelectedComponent(null)
              if (customPageForRender) setSelectedPageId(customPageForRender.id) 
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
          )}
        </div>

        {/* Expand/Collapse button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className={`flex items-center justify-center ${isMobileViewport ? 'h-6 w-6' : 'h-5 w-5'} rounded hover:bg-muted transition-colors`}
          title={isExpanded ? 'Collapse' : 'Expand settings'}
        >
          {isExpanded ? (
            <ChevronUp className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
          ) : (
            <ChevronDown className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
          )}
        </button>
        
        <PageMenu
          page={page}
          customPage={customPageForRender}
          isBuiltIn={isBuiltInPage}
          isMobileViewport={isMobileViewport}
          spaceId={spaceId}
          isPageVisibleInSidebar={isPageVisibleInSidebar}
          updateSidebarMenuItem={updateSidebarMenuItem}
          updateCustomPageSidebarVisibility={updateCustomPageSidebarVisibility}
          setPages={setPages}
          setAllPages={setAllPages}
          setSelectedPageForPermissions={setSelectedPageForPermissions}
          setPermissionsRoles={setPermissionsRoles}
          setPermissionsUserIds={setPermissionsUserIds}
          setPermissionsDialogOpen={setPermissionsDialogOpen}
          setComponentSettingsOpen={setComponentSettingsOpen}
          setColorPickerOpen={setColorPickerOpen}
          setSidebarPositionOpen={setSidebarPositionOpen}
        />
      </div>
      
      {/* Background Color Picker Popover */}
      {!isBuiltInPage && customPageForRender && (
        <BackgroundColorPicker
          spaceId={spaceId}
          page={customPageForRender}
          isOpen={colorPickerOpen === page.id}
          onOpenChange={(open) => setColorPickerOpen(open ? page.id : null)}
          setPages={setPages}
        />
      )}
      
      {/* Sidebar Position Popover */}
      {!isBuiltInPage && customPageForRender && (
        <>
          <button
            ref={sidebarPositionTriggerRef}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            aria-hidden="true"
            tabIndex={-1}
          />
          <SidebarPositionPicker
            spaceId={spaceId}
            page={page}
            customPage={customPageForRender}
            isOpen={sidebarPositionOpen === page.id}
            onOpenChange={(open) => setSidebarPositionOpen(open ? page.id : null)}
            setAllPages={setAllPages}
            triggerRef={sidebarPositionTriggerRef as React.RefObject<HTMLButtonElement>}
          />
        </>
      )}

      {/* Expanded Settings Section */}
      {isExpanded && (
        <div className={`border-t ${isMobileViewport ? 'p-3' : 'p-2'} space-y-3 bg-background/50`}>
          {/* Hide from Sidebar Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isVisibleInSidebar ? (
                  <Eye className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
                ) : (
                  <EyeOff className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
                )}
                <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>
                  Hide from Sidebar
                </Label>
              </div>
              <Switch
                checked={!isVisibleInSidebar}
                onCheckedChange={(checked) => {
                  if (isBuiltInPage) {
                    const menuKey = getMenuItemKey(page.id)
                    if (menuKey) {
                      updateSidebarMenuItem(menuKey, !checked)
                      toast.success(checked ? 'Hidden from sidebar' : 'Shown in sidebar')
                    }
                  } else if (customPageForRender) {
                    updateCustomPageSidebarVisibility(customPageForRender.id, !checked)
                    toast.success(checked ? 'Hidden from sidebar' : 'Shown in sidebar')
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <p className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} text-muted-foreground`}>
              {isVisibleInSidebar 
                ? 'This page is visible in the sidebar' 
                : 'This page is hidden from the sidebar'}
            </p>
          </div>

          {/* Sub Page Section - Only for custom pages */}
          {!isBuiltInPage && customPageForRender && (
            <div className="space-y-2">
              <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>
                Sub Page
              </Label>
              <Select
                value={currentParentPage?.id || 'none'}
                onValueChange={async (value) => {
                  if (value === 'none') {
                    // Remove parent page
                    try {
                      await SpacesEditorManager.updatePage(spaceId, customPageForRender.id, { parentPageId: null } as any)
                      setPages((prev) => prev.map((x) => x.id === customPageForRender.id ? { ...x, parentPageId: undefined } as any : x))
                      toast.success('Parent page removed')
                    } catch (err) {
                      toast.error('Failed to update parent page')
                      console.error(err)
                    }
                  } else {
                    // Set parent page
                    const parentPage = availableParentPages.find(p => p.id === value)
                    if (parentPage && parentPage.page) {
                      try {
                        await SpacesEditorManager.updatePage(spaceId, customPageForRender.id, { parentPageId: (parentPage.page as any).id } as any)
                        setPages((prev) => prev.map((x) => x.id === customPageForRender.id ? { ...x, parentPageId: (parentPage.page as any).id } as any : x))
                        toast.success('Parent page set')
                      } catch (err) {
                        toast.error('Failed to update parent page')
                        console.error(err)
                      }
                    }
                  }
                }}
              >
                <SelectTrigger className={`${isMobileViewport ? 'h-9' : 'h-8'} text-xs`} onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder="Select parent page" />
                </SelectTrigger>
                <SelectContent onClick={(e) => e.stopPropagation()}>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {availableParentPages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-[10px]'} text-muted-foreground`}>
                {currentParentPage 
                  ? `This page is a sub-page of "${currentParentPage.name}"` 
                  : 'Make this page a sub-page of another page'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

