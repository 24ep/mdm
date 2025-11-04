'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, FileIcon, Minus, Tag, Type, Heading, Image, Badge } from 'lucide-react'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { UnifiedPage } from './types'
import { ComponentSettingsDialog } from './ComponentSettingsDialog'
import { ComponentConfig } from './types'
import { SeparatorItem } from './SeparatorItem'
import { LabelItem } from './LabelItem'
import { TextItem } from './TextItem'
import { HeaderItem } from './HeaderItem'
import { ImageItem } from './ImageItem'
import { BadgeItem } from './BadgeItem'
import { PageListItem } from './PageListItem'
import { SortablePageItem } from './SortablePageItem'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface PagesTabProps {
  spaceId: string
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  selectedPageId: string | null
  allIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  reactIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
  setSelectedPageId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedPageForPermissions: React.Dispatch<React.SetStateAction<SpacesEditorPage | null>>
  setPermissionsRoles: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  isPageVisibleInSidebar: (pageId: string, pageType: 'built-in' | 'custom') => boolean
  updateSidebarMenuItem: (key: string | number | symbol, value: boolean) => void
  updateCustomPageSidebarVisibility: (pageId: string, visible: boolean) => void
  componentConfigs: Record<string, ComponentConfig>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
}

export function PagesTab({
  spaceId,
  isMobileViewport,
  allPages,
  pages,
  selectedPageId,
  allIcons,
  reactIcons,
  setPages,
  setAllPages,
  setSelectedPageId,
  setSelectedComponent,
  setSelectedPageForPermissions,
  setPermissionsRoles,
  setPermissionsUserIds,
  setPermissionsDialogOpen,
  handlePageReorder,
  isPageVisibleInSidebar,
  updateSidebarMenuItem,
  updateCustomPageSidebarVisibility,
  componentConfigs,
  handleComponentConfigUpdate,
}: PagesTabProps) {
  const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null)
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null)
  const [componentSettingsOpen, setComponentSettingsOpen] = useState(false)
  const [sidebarPositionOpen, setSidebarPositionOpen] = useState<string | null>(null)

  const handleIconUpdate = useCallback(async (pageId: string, icon: string) => {
    try {
      await SpacesEditorManager.updatePage(spaceId, pageId, { icon })
      setPages((prev) => prev.map((x) => x.id === pageId ? { ...x, icon } : x))
    } catch (err) {
      throw err // Let IconPicker handle the error toast
    }
  }, [spaceId, setPages])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = allPages.findIndex((page) => page.id === active.id)
    const newIndex = allPages.findIndex((page) => page.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Use the handlePageReorder callback which handles state updates and persistence
    await handlePageReorder(oldIndex, newIndex, allPages, pages)
  }, [allPages, pages, handlePageReorder])

  return (
    <div className="mb-4 px-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`${isMobileViewport ? 'text-base' : 'text-sm'} font-semibold`}>Pages</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size={isMobileViewport ? "default" : "sm"} variant="outline">
              <Plus className={`${isMobileViewport ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} /> Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={async () => {
              try {
                const newPage = await SpacesEditorManager.createPage(spaceId, { name: `page-${Date.now()}`, displayName: 'New Page' })
                setPages((prev) => [newPage, ...prev])
                // Add new page to the end of allPages to maintain order
                setAllPages((prev) => {
                  const updated = [...prev, {
                    id: newPage.id,
                    name: newPage.displayName || newPage.name,
                    type: 'custom',
                    page: newPage,
                  }]
                  return updated
                })
                setSelectedComponent('canvas')
                setSelectedPageId(newPage.id)
                toast.success('Page created')
              } catch (e) { 
                toast.error('Failed to create page')
                console.error(e) 
              }
            }}>
              <FileIcon className="mr-2 h-4 w-4" />
              <span>Page</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const newSeparator: UnifiedPage = {
                id: `separator-${Date.now()}`,
                name: 'Separator',
                type: 'separator',
              }
              setAllPages((prev) => [...prev, newSeparator])
              toast.success('Separator added')
            }}>
              <Minus className="mr-2 h-4 w-4" />
              <span>Separator</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const newLabel: UnifiedPage = {
                id: `label-${Date.now()}`,
                name: 'Label',
                type: 'label',
                label: 'New Label',
              }
              setAllPages((prev) => [...prev, newLabel])
              toast.success('Label added')
            }}>
              <Tag className="mr-2 h-4 w-4" />
              <span>Label</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const newText: UnifiedPage = {
                id: `text-${Date.now()}`,
                name: 'Text',
                type: 'text',
                text: 'Text',
              }
              setAllPages((prev) => [...prev, newText])
              toast.success('Text added')
            }}>
              <Type className="mr-2 h-4 w-4" />
              <span>Text</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const newHeader: UnifiedPage = {
                id: `header-${Date.now()}`,
                name: 'Header',
                type: 'header',
                headerText: 'Header',
              }
              setAllPages((prev) => [...prev, newHeader])
              toast.success('Header added')
            }}>
              <Heading className="mr-2 h-4 w-4" />
              <span>Header</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const newImage: UnifiedPage = {
                id: `image-${Date.now()}`,
                name: 'Logo',
                type: 'image',
                imageUrl: '',
                imageAlt: 'Logo',
              }
              setAllPages((prev) => [...prev, newImage])
              toast.success('Image added')
            }}>
              <Image className="mr-2 h-4 w-4" />
              <span>Image Logo</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const newBadge: UnifiedPage = {
                id: `badge-${Date.now()}`,
                name: 'Badge',
                type: 'badge',
                badgeText: 'New',
                badgeColor: '#ef4444',
              }
              setAllPages((prev) => [...prev, newBadge])
              toast.success('Badge added')
            }}>
              <Badge className="mr-2 h-4 w-4" />
              <span>Badge</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Unified Pages List with Drag & Drop */}
      {allPages.length === 0 ? (
        <div className={`${isMobileViewport ? 'text-sm' : 'text-xs'} text-muted-foreground`}>No pages</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allPages.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={`${isMobileViewport ? 'space-y-2' : 'space-y-1'}`}>
              {allPages.map((page, idx) => {
                const isSeparator = page.type === 'separator'
                const isLabel = page.type === 'label'
                const isText = page.type === 'text'
                const isHeader = page.type === 'header'
                const isImage = page.type === 'image'
                const isBadge = page.type === 'badge'
                
                // Render separator
                if (isSeparator) {
                  return (
                    <SortablePageItem key={page.id} page={page} index={idx}>
                      <SeparatorItem
                        page={page}
                        index={idx}
                        isMobileViewport={isMobileViewport}
                        allPages={allPages}
                        pages={pages}
                        handlePageReorder={handlePageReorder}
                        setAllPages={setAllPages}
                      />
                    </SortablePageItem>
                  )
                }
                
                // Render label
                if (isLabel) {
                  return (
                    <SortablePageItem key={page.id} page={page} index={idx}>
                      <LabelItem
                        page={page}
                        index={idx}
                        isMobileViewport={isMobileViewport}
                        allPages={allPages}
                        pages={pages}
                        handlePageReorder={handlePageReorder}
                        setAllPages={setAllPages}
                      />
                    </SortablePageItem>
                  )
                }
                
                // Render text
                if (isText) {
                  return (
                    <SortablePageItem key={page.id} page={page} index={idx}>
                      <TextItem
                        page={page}
                        index={idx}
                        isMobileViewport={isMobileViewport}
                        allPages={allPages}
                        pages={pages}
                        handlePageReorder={handlePageReorder}
                        setAllPages={setAllPages}
                      />
                    </SortablePageItem>
                  )
                }
                
                // Render header
                if (isHeader) {
                  return (
                    <SortablePageItem key={page.id} page={page} index={idx}>
                      <HeaderItem
                        page={page}
                        index={idx}
                        isMobileViewport={isMobileViewport}
                        allPages={allPages}
                        pages={pages}
                        handlePageReorder={handlePageReorder}
                        setAllPages={setAllPages}
                      />
                    </SortablePageItem>
                  )
                }
                
                // Render image
                if (isImage) {
                  return (
                    <SortablePageItem key={page.id} page={page} index={idx}>
                      <ImageItem
                        page={page}
                        index={idx}
                        isMobileViewport={isMobileViewport}
                        allPages={allPages}
                        pages={pages}
                        handlePageReorder={handlePageReorder}
                        setAllPages={setAllPages}
                      />
                    </SortablePageItem>
                  )
                }
                
                // Render badge
                if (isBadge) {
                  return (
                    <SortablePageItem key={page.id} page={page} index={idx}>
                      <BadgeItem
                        page={page}
                        index={idx}
                        isMobileViewport={isMobileViewport}
                        allPages={allPages}
                        pages={pages}
                        handlePageReorder={handlePageReorder}
                        setAllPages={setAllPages}
                      />
                    </SortablePageItem>
                  )
                }
                
                // Render regular pages (built-in or custom)
                return (
                  <SortablePageItem key={page.id} page={page} index={idx}>
                    <PageListItem
                      page={page}
                      index={idx}
                      isMobileViewport={isMobileViewport}
                      spaceId={spaceId}
                      selectedPageId={selectedPageId}
                      allPages={allPages}
                      pages={pages}
                      allIcons={allIcons}
                      reactIcons={reactIcons}
                      iconPickerOpen={iconPickerOpen}
                      colorPickerOpen={colorPickerOpen}
                      sidebarPositionOpen={sidebarPositionOpen}
                      handlePageReorder={handlePageReorder}
                      handleIconUpdate={handleIconUpdate}
                      isPageVisibleInSidebar={isPageVisibleInSidebar}
                      updateSidebarMenuItem={updateSidebarMenuItem}
                      updateCustomPageSidebarVisibility={updateCustomPageSidebarVisibility}
                      setPages={setPages}
                      setAllPages={setAllPages}
                      setSelectedPageId={setSelectedPageId}
                      setSelectedComponent={setSelectedComponent}
                      setSelectedPageForPermissions={setSelectedPageForPermissions}
                      setPermissionsRoles={setPermissionsRoles}
                      setPermissionsUserIds={setPermissionsUserIds}
                      setPermissionsDialogOpen={setPermissionsDialogOpen}
                      setComponentSettingsOpen={setComponentSettingsOpen}
                      setIconPickerOpen={setIconPickerOpen}
                      setColorPickerOpen={setColorPickerOpen}
                      setSidebarPositionOpen={setSidebarPositionOpen}
                    />
                  </SortablePageItem>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      {/* Component Settings Dialog */}
      <ComponentSettingsDialog
        open={componentSettingsOpen}
        onOpenChange={setComponentSettingsOpen}
        isMobileViewport={isMobileViewport}
        componentConfigs={componentConfigs}
        handleComponentConfigUpdate={handleComponentConfigUpdate}
      />
    </div>
  )
}

