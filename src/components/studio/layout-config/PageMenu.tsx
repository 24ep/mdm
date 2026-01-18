'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, EyeOff, Trash, Shield, Palette, Layout } from 'lucide-react'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { UnifiedPage } from './types'

interface PageMenuProps {
  page: UnifiedPage
  customPage: SpacesEditorPage | undefined
  isBuiltIn: boolean
  isMobileViewport: boolean
  spaceId: string
  // Sidebar visibility functions removed - pages now use secondary platform sidebar
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
  setSelectedPageForPermissions: React.Dispatch<React.SetStateAction<SpacesEditorPage | null>>
  setPermissionsRoles: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsGroupIds: React.Dispatch<React.SetStateAction<string[]>>
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
  setPages,
  setAllPages,
  setSelectedPageForPermissions,
  setPermissionsRoles,
  setPermissionsUserIds,
  setPermissionsGroupIds,
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
          {/* Sidebar visibility menu items removed - pages now use secondary platform sidebar */}
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
        {/* Sidebar visibility menu items removed - pages now use secondary platform sidebar */}
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
            setPermissionsGroupIds(customPage.permissions?.groupIds || [])
            setPermissionsDialogOpen(true)
          }}
          className="cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4" />
          <span>Permissions</span>
        </DropdownMenuItem>
        {/* Sidebar Position menu item removed - pages now use secondary platform sidebar */}
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

