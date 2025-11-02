'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus, X, Folder, FolderOpen, ChevronRight, ChevronDown, Box, Edit2, Check } from 'lucide-react'
import { PlacedWidget, widgetsPalette } from './widgets'

interface WidgetGroup {
  id: string
  name: string
  widgetIds: string[]
  collapsed?: boolean
}

interface WidgetGroupsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  placedWidgets: PlacedWidget[]
  onUpdateWidgets: (updates: PlacedWidget[]) => void
}

export function WidgetGroupsDialog({
  open,
  onOpenChange,
  placedWidgets,
  onUpdateWidgets,
}: WidgetGroupsDialogProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const [searchQuery, setSearchQuery] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')
  
  // Initialize groups from existing widgets - recalculate when dialog opens or widgets change
  const [groups, setGroups] = useState<WidgetGroup[]>([])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  
  // Recalculate groups when dialog opens or widgets change
  useEffect(() => {
    if (!open) return
    
    const groupMap = new Map<string, { widgetIds: string[]; groupName?: string }>()
    placedWidgets.forEach(widget => {
      const groupId = widget.properties?.groupId
      if (groupId && groupId !== 'ungrouped') {
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, { widgetIds: [], groupName: widget.properties?.groupName })
        }
        groupMap.get(groupId)!.widgetIds.push(widget.id)
      }
    })
    
    const newGroups: WidgetGroup[] = []
    groupMap.forEach((data, groupId) => {
      newGroups.push({
        id: groupId,
        name: data.groupName || `Group ${groupId.slice(0, 8)}`,
        widgetIds: data.widgetIds,
        collapsed: collapsedGroups.has(groupId),
      })
    })
    
    setGroups(newGroups)
  }, [open, placedWidgets])

  // Get all widgets organized by group
  const widgetsByGroup = useMemo(() => {
    const grouped: Record<string, PlacedWidget[]> = { ungrouped: [] }
    
    placedWidgets.forEach(widget => {
      const groupId = widget.properties?.groupId || 'ungrouped'
      if (!grouped[groupId]) {
        grouped[groupId] = []
      }
      grouped[groupId].push(widget)
    })
    
    return grouped
  }, [placedWidgets])

  // Filter widgets based on search
  const filteredWidgetsByGroup = useMemo(() => {
    if (!searchQuery.trim()) {
      return widgetsByGroup
    }
    
    const query = searchQuery.toLowerCase()
    const filtered: Record<string, PlacedWidget[]> = {}
    
    Object.entries(widgetsByGroup).forEach(([groupId, widgets]) => {
      const filteredWidgets = widgets.filter(widget => {
        const widgetDef = widgetsPalette.find(w => w.type === widget.type)
        const label = widgetDef?.label || widget.type
        return (
          label.toLowerCase().includes(query) ||
          widget.type.toLowerCase().includes(query) ||
          widget.id.toLowerCase().includes(query)
        )
      })
      
      if (filteredWidgets.length > 0) {
        filtered[groupId] = filteredWidgets
      }
    })
    
    return filtered
  }, [widgetsByGroup, searchQuery])

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    
    const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const newGroup: WidgetGroup = {
      id: groupId,
      name: newGroupName.trim(),
      widgetIds: [],
      collapsed: false,
    }
    
    setGroups(prev => [...prev, newGroup])
    setNewGroupName('')
    setCreatingGroup(false)
    // Don't update widgets yet - wait until widgets are added to group
  }

  const handleDeleteGroup = (groupId: string) => {
    // Remove group from widgets
    onUpdateWidgets(
      placedWidgets.map(widget => {
        if (widget.properties?.groupId === groupId) {
          const { groupId: _, groupName: __, ...restProperties } = widget.properties || {}
          return { ...widget, properties: restProperties }
        }
        return widget
      })
    )
    
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  const handleStartEditGroup = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId)
    setEditingGroupName(currentName)
  }

  const handleSaveEditGroup = (groupId: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroupId(null)
      return
    }
    
    // Update group name in widgets
    onUpdateWidgets(
      placedWidgets.map(widget => {
        if (widget.properties?.groupId === groupId) {
          return {
            ...widget,
            properties: {
              ...widget.properties,
              groupName: editingGroupName.trim(),
            },
          }
        }
        return widget
      })
    )
    
    setGroups(prev =>
      prev.map(g =>
        g.id === groupId ? { ...g, name: editingGroupName.trim() } : g
      )
    )
    
    setEditingGroupId(null)
    setEditingGroupName('')
  }

  const handleAddWidgetToGroup = (widgetId: string, groupId: string) => {
    onUpdateWidgets(
      placedWidgets.map(widget => {
        if (widget.id === widgetId) {
          const group = groups.find(g => g.id === groupId)
          return {
            ...widget,
            properties: {
              ...widget.properties,
              groupId,
              groupName: group?.name,
            },
          }
        }
        return widget
      })
    )
  }

  const handleRemoveWidgetFromGroup = (widgetId: string) => {
    onUpdateWidgets(
      placedWidgets.map(widget => {
        if (widget.id === widgetId) {
          const { groupId: _, groupName: __, ...restProperties } = widget.properties || {}
          return { ...widget, properties: restProperties }
        }
        return widget
      })
    )
  }

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const ungroupedWidgets = filteredWidgetsByGroup['ungrouped'] || []

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent widthClassName="w-[500px]">
        <DrawerHeader>
          <DrawerTitle>Widget Groups</DrawerTitle>
          <DrawerDescription>
            Organize your widgets into groups for better management
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Create New Group */}
          <div className="flex gap-2">
            {creatingGroup ? (
              <>
                <Input
                  placeholder="Group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateGroup()
                    } else if (e.key === 'Escape') {
                      setCreatingGroup(false)
                      setNewGroupName('')
                    }
                  }}
                  autoFocus
                  className="flex-1"
                />
                <Button onClick={handleCreateGroup} size="sm">
                  Create
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreatingGroup(false)
                    setNewGroupName('')
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setCreatingGroup(true)}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            )}
          </div>

          {/* Groups and Widgets */}
          <ScrollArea className="flex-1 min-h-[400px] max-h-[500px] border rounded-md">
            <div className="p-4 space-y-4">
              {/* Display Groups */}
              {groups.map(group => {
                const groupWidgets = filteredWidgetsByGroup[group.id] || []
                const isCollapsed = collapsedGroups.has(group.id)
                
                return (
                  <div key={group.id} className="border rounded-lg">
                    <div className="flex items-center justify-between p-3 bg-muted/50">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => toggleGroupCollapse(group.id)}
                          className="hover:bg-muted rounded p-1"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        {isCollapsed ? (
                          <Folder className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FolderOpen className="h-4 w-4 text-blue-600" />
                        )}
                        {editingGroupId === group.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEditGroup(group.id)
                                } else if (e.key === 'Escape') {
                                  setEditingGroupId(null)
                                  setEditingGroupName('')
                                }
                              }}
                              className="h-7 text-sm"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveEditGroup(group.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingGroupId(null)
                                setEditingGroupName('')
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="font-semibold">{group.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({groupWidgets.length} widget{groupWidgets.length !== 1 ? 's' : ''})
                            </span>
                          </>
                        )}
                      </div>
                      {editingGroupId !== group.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditGroup(group.id, group.name)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {!isCollapsed && (
                      <div className="p-2 space-y-1">
                        {groupWidgets.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-2 text-center">
                            No widgets in this group
                          </div>
                        ) : (
                          groupWidgets.map(widget => {
                            const widgetDef = widgetsPalette.find(w => w.type === widget.type)
                            const Icon = widgetDef?.icon || Box
                            return (
                              <div
                                key={widget.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded text-sm"
                              >
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1">{widgetDef?.label || widget.type}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveWidgetFromGroup(widget.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Ungrouped Widgets */}
              {ungroupedWidgets.length > 0 && (
                <div className="border rounded-lg">
                  <div className="p-3 bg-muted/30">
                    <span className="font-semibold text-sm">Ungrouped</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({ungroupedWidgets.length} widget{ungroupedWidgets.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="p-2 space-y-1">
                    {ungroupedWidgets.map(widget => {
                      const widgetDef = widgetsPalette.find(w => w.type === widget.type)
                      const Icon = widgetDef?.icon || Box
                      return (
                        <div
                          key={widget.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded text-sm"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{widgetDef?.label || widget.type}</span>
                          {groups.length > 0 && (
                            <select
                              className="text-xs border rounded px-2 py-1"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddWidgetToGroup(widget.id, e.target.value)
                                }
                              }}
                            >
                              <option value="">Add to group...</option>
                              {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {groups.length === 0 && ungroupedWidgets.length === 0 && (
                <div className="text-center text-muted-foreground p-8">
                  {searchQuery ? 'No widgets found' : 'No widgets on canvas'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

