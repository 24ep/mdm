'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, FileIcon, Minus, Tag, Type, Heading, Image, Badge, Folder } from 'lucide-react'
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
import { GroupItem } from './GroupItem'
import { LoginPageItem } from './LoginPageItem'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable } from '@dnd-kit/core'
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
  // Sidebar visibility functions removed - pages now use secondary platform sidebar
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

  // Droppable zones for top/bottom alignment switching
  const { setNodeRef: setTopZoneRef, isOver: isOverTop } = useDroppable({ id: 'zone-top' })
  const { setNodeRef: setBottomZoneRef, isOver: isOverBottom } = useDroppable({ id: 'zone-bottom' })

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

    // Move to alignment zones by dropping on zone containers
    if (over.id === 'zone-top' || over.id === 'zone-bottom') {
      const toBottom = over.id === 'zone-bottom'
      const draggedIndex = allPages.findIndex(p => p.id === active.id)
      if (draggedIndex !== -1) {
        const dragged = allPages[draggedIndex]
        // Persist the change to backend if it's a custom page
        if (dragged.type === 'custom' && dragged.page) {
          try {
            await SpacesEditorManager.updatePage(spaceId, dragged.page.id, { sidebarPosition: toBottom ? 'bottom' : undefined } as any)
          } catch (err) {
            console.error('Failed to update page sidebar position:', err)
            toast.error('Failed to update page alignment')
            return
          }
        }
        setAllPages(prev => {
          // Remove from any group children and root
          const stripFromGroups = (arr: UnifiedPage[]) => arr.map(p => {
            if ((p as any).type === 'group' && Array.isArray((p as any).children)) {
              return { ...p, children: (p as any).children.filter((c: any) => c.id !== dragged.id) } as any
            }
            return p
          })
          let next = stripFromGroups(prev)
          next = next.filter(p => p.id !== dragged.id)
          // Split zones and push item to end of destination zone
          const tops = next.filter((p: any) => p.sidebarPosition !== 'bottom')
          const bottoms = next.filter((p: any) => p.sidebarPosition === 'bottom')
          const updated: any = { ...dragged }
          if (toBottom) updated.sidebarPosition = 'bottom'; else delete updated.sidebarPosition
          if (toBottom) bottoms.push(updated); else tops.push(updated)
          return [...tops, ...bottoms]
        })
        toast.success(`Page moved to ${toBottom ? 'bottom' : 'top'} alignment`)
      }
      return
    }

    // Handle drop into group container
    if (String(over.id).startsWith('group-drop-')) {
      const groupId = String(over.id).replace('group-drop-', '')
      const draggedIndex = allPages.findIndex(p => p.id === active.id)
      if (draggedIndex === -1) return
      const draggedItem = allPages[draggedIndex]
      // Do not allow groups inside groups for now
      if ((draggedItem as any).type === 'group') return
      setAllPages(prev => {
        // Remove from any existing group children first
        const removeFromGroups = (pagesArr: UnifiedPage[]) => pagesArr.map(p => {
          if ((p as any).type === 'group' && Array.isArray((p as any).children)) {
            return { ...p, children: (p as any).children.filter((c: any) => c.id !== draggedItem.id) } as any
          }
          return p
        })
        let next = removeFromGroups(prev)
        // Remove from root list
        next = next.filter(p => p.id !== draggedItem.id)
        // Add to target group children
        next = next.map(p => {
          if (p.id === groupId) {
            const children = ([...((p as any).children || []), draggedItem]) as UnifiedPage[]
            return { ...p, children } as any
          }
          return p
        })
        return next
      })
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
        {/* Add menu for overall header -> targets top by default */}
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
                setAllPages((prev) => [...prev, { id: newPage.id, name: newPage.displayName || newPage.name, type: 'custom', page: newPage } as any])
                setSelectedComponent('canvas')
                setSelectedPageId(newPage.id)
                toast.success('Page created')
              } catch (e) { toast.error('Failed to create page'); console.error(e) }
            }}>
              <FileIcon className="mr-2 h-4 w-4" />
              <span>Page</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `separator-${Date.now()}`, name: 'Separator', type: 'separator' } as any]); toast.success('Separator added') }}>
              <Minus className="mr-2 h-4 w-4" />
              <span>Separator</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `label-${Date.now()}`, name: 'Label', type: 'label', label: 'New Label' } as any]); toast.success('Label added') }}>
              <Tag className="mr-2 h-4 w-4" />
              <span>Label</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `text-${Date.now()}`, name: 'Text', type: 'text', text: 'Text' } as any]); toast.success('Text added') }}>
              <Type className="mr-2 h-4 w-4" />
              <span>Text</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `header-${Date.now()}`, name: 'Header', type: 'header', headerText: 'Header' } as any]); toast.success('Header added') }}>
              <Heading className="mr-2 h-4 w-4" />
              <span>Header</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `image-${Date.now()}`, name: 'Logo', type: 'image', imageUrl: '', imageAlt: 'Logo' } as any]); toast.success('Image added') }}>
              <Image className="mr-2 h-4 w-4" />
              <span>Image Logo</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `badge-${Date.now()}`, name: 'Badge', type: 'badge', badgeText: 'New', badgeColor: '#ef4444' } as any]); toast.success('Badge added') }}>
              <Badge className="mr-2 h-4 w-4" />
              <span>Badge</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `group-${Date.now()}`, name: 'Group', type: 'group', children: [] } as any]); toast.success('Group added') }}>
              <Folder className="mr-2 h-4 w-4" />
              <span>Group</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Login Page - Always at the top */}
      <div className={`${isMobileViewport ? 'mb-4' : 'mb-3'}`}>
        <LoginPageItem
          page={{ id: 'login-page', name: 'Login Page', type: 'login' }}
          index={-1}
          isMobileViewport={isMobileViewport}
          spaceId={spaceId}
          selectedPageId={selectedPageId}
          setSelectedPageId={setSelectedPageId}
        />
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
          {/* Split into two alignment zones */}
          {(() => {
            const topItems = allPages.filter(p => (p as any).sidebarPosition !== 'bottom' && p.type !== 'login')
            const bottomItems = allPages.filter(p => (p as any).sidebarPosition === 'bottom' && p.type !== 'login')
            return (
              <div className="space-y-4">
                {/* Top alignment */}
                <div>
                  {/* Drop here to move to Top alignment */}
                  <div
                    ref={setTopZoneRef}
                    className={`min-h-[48px] mb-2 rounded-md flex items-center justify-center transition-colors ${isOverTop ? 'bg-primary/20 border-2 border-primary' : 'border-2 border-dashed border-transparent hover:border-muted-foreground/50 bg-muted/30'}`}
                    title="Drop here to move to Top alignment"
                  >
                    <span className={`text-xs text-muted-foreground ${isOverTop ? 'text-primary font-medium' : ''}`}>
                      {isOverTop ? 'Drop to move to top' : 'Drop here for top alignment'}
                    </span>
                  </div>
                  <div className={`${isMobileViewport ? 'text-xs' : 'text-[11px]'} font-semibold text-muted-foreground mb-1`}>Top alignment</div>
                  <SortableContext items={topItems.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <div className={`${isMobileViewport ? 'space-y-2' : 'space-y-1'}`}>
                      {topItems.map((page) => {
                        const idx = allPages.findIndex(ap => ap.id === page.id)
                const isSeparator = page.type === 'separator'
                const isLabel = page.type === 'label'
                const isText = page.type === 'text'
                const isHeader = page.type === 'header'
                const isImage = page.type === 'image'
                const isBadge = page.type === 'badge'
                const isGroup = (page as any).type === 'group'
                if (isGroup) {
                  return (
                    <GroupItem
                      key={page.id}
                      page={page as UnifiedPage & { type: 'group'; children?: UnifiedPage[] }}
                      index={idx}
                      isMobileViewport={isMobileViewport}
                      allPages={allPages}
                      pages={pages}
                      setAllPages={setAllPages}
                      setPages={setPages}
                      spaceId={spaceId}
                      selectedPageId={selectedPageId}
                      allIcons={allIcons}
                      reactIcons={reactIcons}
                      iconPickerOpen={iconPickerOpen}
                      colorPickerOpen={colorPickerOpen}
                      sidebarPositionOpen={sidebarPositionOpen}
                      handlePageReorder={handlePageReorder}
                      handleIconUpdate={handleIconUpdate}
                      // Sidebar visibility props removed - pages now use secondary platform sidebar
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
                  )
                }
                
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
                      // Sidebar visibility props removed - pages now use secondary platform sidebar
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
                </div>

                {/* Bottom alignment */}
                <div>
                  {/* Drop here to move to Bottom alignment */}
                  <div
                    ref={setBottomZoneRef}
                    className={`min-h-[48px] mb-2 rounded-md flex items-center justify-center transition-colors ${isOverBottom ? 'bg-primary/20 border-2 border-primary' : 'border-2 border-dashed border-transparent hover:border-muted-foreground/50 bg-muted/30'}`}
                    title="Drop here to move to Bottom alignment"
                  >
                    <span className={`text-xs text-muted-foreground ${isOverBottom ? 'text-primary font-medium' : ''}`}>
                      {isOverBottom ? 'Drop to move to bottom' : 'Drop here for bottom alignment'}
                    </span>
                  </div>
                  <div className={`${isMobileViewport ? 'text-xs' : 'text-[11px]'} font-semibold text-muted-foreground mb-1`}>Bottom alignment</div>
                  <SortableContext items={bottomItems.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <div className={`${isMobileViewport ? 'space-y-2' : 'space-y-1'}`}>
                      {bottomItems.map((page) => {
                        const idx = allPages.findIndex(ap => ap.id === page.id)
                        const isSeparator = page.type === 'separator'
                        const isLabel = page.type === 'label'
                        const isText = page.type === 'text'
                        const isHeader = page.type === 'header'
                        const isImage = page.type === 'image'
                        const isBadge = page.type === 'badge'
                        const isGroup = (page as any).type === 'group'
                        
                        if (isGroup) {
                          return (
                            <GroupItem
                              key={page.id}
                              page={page as UnifiedPage & { type: 'group'; children?: UnifiedPage[] }}
                              index={idx}
                              isMobileViewport={isMobileViewport}
                              allPages={allPages}
                              pages={pages}
                              setAllPages={setAllPages}
                              setPages={setPages}
                              spaceId={spaceId}
                              selectedPageId={selectedPageId}
                              allIcons={allIcons}
                              reactIcons={reactIcons}
                              iconPickerOpen={iconPickerOpen}
                              colorPickerOpen={colorPickerOpen}
                              sidebarPositionOpen={sidebarPositionOpen}
                              handlePageReorder={handlePageReorder}
                              handleIconUpdate={handleIconUpdate}
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
                          )
                        }
                        
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
                </div>
              </div>
            )
          })()}
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

