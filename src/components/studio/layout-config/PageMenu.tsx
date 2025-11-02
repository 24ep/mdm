'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, EyeOff, Trash, Shield, Palette, Layout } from 'lucide-react'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { UnifiedPage } from './types'
import { getMenuItemKey } from './utils'

interface PageMenuProps {
  page: UnifiedPage
  customPage: SpacesEditorPage | undefined
  isBuiltIn: boolean
  isMobileViewport: boolean
  spaceId: string
  isPageVisibleInSidebar: (pageId: string, pageType: 'built-in' | 'custom') => boolean
  updateSidebarMenuItem: (key: string | number | symbol, value: boolean) => void
  updateCustomPageSidebarVisibility: (pageId: string, visible: boolean) => void
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
  setSelectedPageForPermissions: React.Dispatch<React.SetStateAction<SpacesEditorPage | null>>
  setPermissionsRoles: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setComponentSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setColorPickerOpen: React.Dispatch<React.SetStateAction<string | null>>
  setSidebarPositionOpen: React.Dispatch<React.SetStateAction<string | null>>
}

export function PageMenu({
  page,
  customPage,
  isBuiltIn,
  isMobileViewport,
  spaceId,
  isPageVisibleInSidebar,
  updateSidebarMenuItem,
  updateCustomPageSidebarVisibility,
  setPages,
  setAllPages,
  setSelectedPageForPermissions,
  setPermissionsRoles,
  setPermissionsUserIds,
  setPermissionsDialogOpen,
  setComponentSettingsOpen,
  setColorPickerOpen,
  setSidebarPositionOpen,
}: PageMenuProps) {
  if (isBuiltIn) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size="icon" 
            variant="ghost" 
            className={isMobileViewport ? "h-8 w-8" : "h-6 w-6"}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Page actions"
          >
            <MoreVertical className={isMobileViewport ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              const menuKey = getMenuItemKey(page.id)
              if (menuKey) {
                const currentVisible = isPageVisibleInSidebar(page.id, 'built-in')
                updateSidebarMenuItem(menuKey, !currentVisible)
                toast.success(!currentVisible ? 'Show in sidebar' : 'Hide from sidebar')
              }
            }}
            className="cursor-pointer"
          >
            {isPageVisibleInSidebar(page.id, 'built-in') ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                <span>Hide from Sidebar</span>
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                <span>Show in Sidebar</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setComponentSettingsOpen(true)
            }}
            className="cursor-pointer"
          >
            <Layout className="mr-2 h-4 w-4" />
            <span>Component Settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (!customPage) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="icon" 
          variant="ghost" 
          className={isMobileViewport ? "h-8 w-8" : "h-6 w-6"}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Page actions"
        >
          <MoreVertical className={isMobileViewport ? "h-4 w-4" : "h-3.5 w-3.5"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            const currentVisible = isPageVisibleInSidebar(customPage.id, 'custom')
            updateCustomPageSidebarVisibility(customPage.id, !currentVisible)
            toast.success(!currentVisible ? 'Show in sidebar' : 'Hide from sidebar')
          }}
          className="cursor-pointer"
        >
          {isPageVisibleInSidebar(customPage.id, 'custom') ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              <span>Hide from Sidebar</span>
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              <span>Show in Sidebar</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            const newHidden = !customPage.hidden
            setPages((prev) => prev.map((x) => x.id === customPage.id ? { ...x, hidden: newHidden } : x))
            try {
              await SpacesEditorManager.updatePage(spaceId, customPage.id, { hidden: newHidden })
              toast.success(newHidden ? 'Page hidden' : 'Page shown')
            } catch (err) {
              toast.error('Failed to update page')
              setPages((prev) => prev.map((x) => x.id === customPage.id ? { ...x, hidden: !newHidden } : x))
              console.error(err)
            }
          }}
          className="cursor-pointer"
        >
          {customPage.hidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              <span>Show Page</span>
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              <span>Hide Page</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            setSelectedPageForPermissions(customPage)
            setPermissionsRoles(customPage.permissions?.roles || [])
            setPermissionsUserIds(customPage.permissions?.userIds || [])
            setPermissionsDialogOpen(true)
          }}
          className="cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4" />
          <span>Permissions</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            setSidebarPositionOpen(page.id)
          }}
          className="cursor-pointer"
        >
          <Layout className="mr-2 h-4 w-4" />
          <span>Sidebar Position</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            setComponentSettingsOpen(true)
          }}
          className="cursor-pointer"
        >
          <Layout className="mr-2 h-4 w-4" />
          <span>Component Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            setColorPickerOpen(page.id)
          }}
          className="cursor-pointer"
        >
          <Palette className="mr-2 h-4 w-4" />
          <span className="flex-1">Background Color</span>
          <div 
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: (customPage as any)?.backgroundColor || '#ffffff' }}
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            if (!confirm('Delete this page?')) return
            setPages((prev) => prev.filter((x) => x.id !== customPage.id))
            setAllPages((prev) => prev.filter((x) => x.id !== page.id))
            try {
              await SpacesEditorManager.deletePage(spaceId, customPage.id)
              toast.success('Page deleted')
            } catch (err) {
              toast.error('Failed to delete page')
              setPages((prev) => [...prev, customPage].sort((a, b) => (a.order || 0) - (b.order || 0)))
              console.error(err)
            }
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

