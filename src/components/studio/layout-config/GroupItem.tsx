'use client'

import React, { useState } from 'react'
import { ChevronDown, MoreVertical, Trash, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDroppable } from '@dnd-kit/core'
import { UnifiedPage } from './types'
import { SortablePageItem } from './SortablePageItem'
import { PageListItem } from './PageListItem'
import { SpacesEditorPage } from '@/lib/space-studio-manager'
import { LabelItem } from './LabelItem'
import { TextItem } from './TextItem'
import { HeaderItem } from './HeaderItem'
import { ImageItem } from './ImageItem'
import { BadgeItem } from './BadgeItem'
import { SeparatorItem } from './SeparatorItem'

interface GroupItemProps {
  page: UnifiedPage & { type: 'group'; children?: UnifiedPage[] }
  index: number
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
  // Props for PageListItem
  spaceId: string
  selectedPageId: string | null
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

export function GroupItem(props: GroupItemProps) {
  const { page, isMobileViewport, allPages, setAllPages } = props
  const [open, setOpen] = useState(true)
  const { setNodeRef, isOver } = useDroppable({ id: `group-drop-${page.id}` })

  const children = (page.children || [])

  return (
    <div className="border rounded-md">
      {/* Group header */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-muted/40">
        <button className="flex items-center gap-1" onClick={() => setOpen(!open)}>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium`}>{page.name || 'Group'}</span>
          <span className="text-[10px] text-muted-foreground">({children.length})</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className={isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              // Quick add placeholder label into group
              const newChild: UnifiedPage = { id: `label-${Date.now()}`, type: 'label', name: 'Label', label: 'Label' }
              setAllPages(prev => prev.map(p => p.id === page.id ? { ...p, children: [ ...(p.children || []), newChild ] } as any : p))
            }}>
              <FolderPlus className="mr-2 h-4 w-4" /> Add item to group
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
              // Ungroup: move children to root above this group, then remove group
              const idx = allPages.findIndex(p => p.id === page.id)
              setAllPages(prev => {
                const before = prev.slice(0, idx)
                const after = prev.slice(idx + 1)
                return [...before, ...(page.children || []), ...after]
              })
            }}>
              <Trash className="mr-2 h-4 w-4" /> Ungroup
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Droppable area and children */}
      {open && (
        <div ref={setNodeRef} className={`p-2 ${isOver ? 'ring-1 ring-primary rounded-sm' : ''}`}>
          <div className="space-y-1">
            {children.length === 0 && (
              <div className="text-[11px] text-muted-foreground px-1 py-1">Drop pages here</div>
            )}
            {children.map((child, idx) => {
              const isSeparator = child.type === 'separator'
              const isLabel = child.type === 'label'
              const isText = child.type === 'text'
              const isHeader = child.type === 'header'
              const isImage = child.type === 'image'
              const isBadge = child.type === 'badge'

              if (isSeparator) {
                return (
                  <SeparatorItem key={child.id}
                    page={child}
                    index={idx}
                    isMobileViewport={props.isMobileViewport}
                    allPages={allPages}
                    pages={props.pages}
                    handlePageReorder={props.handlePageReorder}
                    setAllPages={setAllPages}
                  />
                )
              }
              if (isLabel) {
                return (
                  <LabelItem key={child.id}
                    page={child}
                    index={idx}
                    isMobileViewport={props.isMobileViewport}
                    allPages={allPages}
                    pages={props.pages}
                    handlePageReorder={props.handlePageReorder}
                    setAllPages={setAllPages}
                  />
                )
              }
              if (isText) {
                return (
                  <TextItem key={child.id}
                    page={child}
                    index={idx}
                    isMobileViewport={props.isMobileViewport}
                    allPages={allPages}
                    pages={props.pages}
                    handlePageReorder={props.handlePageReorder}
                    setAllPages={setAllPages}
                  />
                )
              }
              if (isHeader) {
                return (
                  <HeaderItem key={child.id}
                    page={child}
                    index={idx}
                    isMobileViewport={props.isMobileViewport}
                    allPages={allPages}
                    pages={props.pages}
                    handlePageReorder={props.handlePageReorder}
                    setAllPages={setAllPages}
                  />
                )
              }
              if (isImage) {
                return (
                  <ImageItem key={child.id}
                    page={child}
                    index={idx}
                    isMobileViewport={props.isMobileViewport}
                    allPages={allPages}
                    pages={props.pages}
                    handlePageReorder={props.handlePageReorder}
                    setAllPages={setAllPages}
                  />
                )
              }
              if (isBadge) {
                return (
                  <BadgeItem key={child.id}
                    page={child}
                    index={idx}
                    isMobileViewport={props.isMobileViewport}
                    allPages={allPages}
                    pages={props.pages}
                    handlePageReorder={props.handlePageReorder}
                    setAllPages={setAllPages}
                  />
                )
              }
              return (
                <SortablePageItem key={child.id} page={child} index={idx}>
                  <PageListItem
                    page={child}
                    index={idx}
                    isMobileViewport={props.isMobileViewport}
                    spaceId={props.spaceId}
                    selectedPageId={props.selectedPageId}
                    allPages={allPages}
                    pages={props.pages}
                    allIcons={props.allIcons}
                    reactIcons={props.reactIcons}
                    iconPickerOpen={props.iconPickerOpen}
                    colorPickerOpen={props.colorPickerOpen}
                    sidebarPositionOpen={props.sidebarPositionOpen}
                    handlePageReorder={props.handlePageReorder}
                    handleIconUpdate={props.handleIconUpdate}
                    isPageVisibleInSidebar={props.isPageVisibleInSidebar}
                    updateSidebarMenuItem={props.updateSidebarMenuItem}
                    updateCustomPageSidebarVisibility={props.updateCustomPageSidebarVisibility}
                    setPages={props.setPages}
                    setAllPages={setAllPages}
                    setSelectedPageId={props.setSelectedPageId}
                    setSelectedComponent={props.setSelectedComponent}
                    setSelectedPageForPermissions={props.setSelectedPageForPermissions}
                    setPermissionsRoles={props.setPermissionsRoles}
                    setPermissionsUserIds={props.setPermissionsUserIds}
                    setPermissionsDialogOpen={props.setPermissionsDialogOpen}
                    setComponentSettingsOpen={props.setComponentSettingsOpen}
                    setIconPickerOpen={props.setIconPickerOpen}
                    setColorPickerOpen={props.setColorPickerOpen}
                    setSidebarPositionOpen={props.setSidebarPositionOpen}
                  />
                </SortablePageItem>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}



