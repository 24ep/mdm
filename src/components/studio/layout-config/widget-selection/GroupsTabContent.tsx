'use client'

import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronRight, FolderOpen, Edit2, X, Check } from 'lucide-react'
import { widgetsPalette } from '../widgets'
import { WidgetGroup } from './types'
import { WidgetItem } from './WidgetItem'
import { useDragHandler } from './useDragHandler'

interface GroupsTabContentProps {
  groups: WidgetGroup[]
  collapsedGroups: Set<string>
  selectedGroupId: string | null
  editingGroupId: string | null
  editingGroupName: string
  searchQuery: string
  onEditingGroupNameChange: (name: string) => void
  onToggleGroup: (groupId: string) => void
  onStartEditGroup: (groupId: string, currentName: string) => void
  onSaveEditGroup: (groupId: string) => void
  onCancelEditGroup: () => void
  onDeleteGroup: (groupId: string) => void
  onAddWidgetToGroup: (widgetType: string, groupId: string) => void
  onRemoveWidgetFromGroup: (widgetType: string, groupId: string) => void
  onClose: () => void
}

export function GroupsTabContent({
  groups,
  collapsedGroups,
  selectedGroupId,
  editingGroupId,
  editingGroupName,
  searchQuery,
  onEditingGroupNameChange,
  onToggleGroup,
  onStartEditGroup,
  onSaveEditGroup,
  onCancelEditGroup,
  onDeleteGroup,
  onAddWidgetToGroup,
  onRemoveWidgetFromGroup,
  onClose,
}: GroupsTabContentProps) {
  const { handleDragStart, handleDragEnd } = useDragHandler(onClose)
  
  // Filter widgets by groups
  const filteredWidgetsByGroup = useMemo(() => {
    const result: Record<string, Array<typeof widgetsPalette[number]>> = {}
    
    groups.forEach(group => {
      const groupWidgets = widgetsPalette.filter(w => 
        group.widgetTypes.includes(w.type) &&
        (!searchQuery.trim() || 
          w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.type.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      
      if (groupWidgets.length > 0) {
        result[group.id] = groupWidgets
      }
    })
    
    return result
  }, [groups, searchQuery])
  
  // Get widgets not in any group
  const ungroupedWidgets = useMemo(() => {
    const groupedTypes = new Set(groups.flatMap(g => g.widgetTypes))
    return widgetsPalette.filter(w => !groupedTypes.has(w.type))
  }, [groups])
  
  if (!groups || groups.length === 0) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="text-center py-8 text-sm text-muted-foreground">
            Create a group to organize widgets
          </div>
        </div>
      </ScrollArea>
    )
  }
  
  if (!selectedGroupId) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="text-center py-8 text-sm text-muted-foreground">
            Select a group from the sidebar to manage its widgets
          </div>
        </div>
      </ScrollArea>
    )
  }
  
  const group = groups.find(g => g.id === selectedGroupId)
  if (!group) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="text-center py-8 text-sm text-muted-foreground">
            Group not found
          </div>
        </div>
      </ScrollArea>
    )
  }
  
  const isCollapsed = collapsedGroups.has(group.id)
  const groupWidgets = filteredWidgetsByGroup[group.id] || []
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="border rounded-lg">
          {/* Group Header */}
          <div className="p-3 bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {isCollapsed ? (
                <ChevronRight 
                  className="h-4 w-4 text-muted-foreground cursor-pointer"
                  onClick={() => onToggleGroup(group.id)}
                />
              ) : (
                <ChevronDown 
                  className="h-4 w-4 text-muted-foreground cursor-pointer"
                  onClick={() => onToggleGroup(group.id)}
                />
              )}
              {editingGroupId === group.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editingGroupName}
                    onChange={(e) => onEditingGroupNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSaveEditGroup(group.id)
                      } else if (e.key === 'Escape') {
                        onCancelEditGroup()
                      }
                    }}
                    className="h-7 text-sm flex-1"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onSaveEditGroup(group.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={onCancelEditGroup}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-sm">{group.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({groupWidgets.length})
                  </span>
                </>
              )}
            </div>
            {editingGroupId !== group.id && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onStartEditGroup(group.id, group.name)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onDeleteGroup(group.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Group Widgets */}
          {!isCollapsed && (
            <div className="p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Widgets in Group
              </div>
              {groupWidgets.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 text-center">
                  No widgets in this group. Add widgets below.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {groupWidgets.map(w => (
                    <WidgetItem
                      key={w.type}
                      widget={w}
                      showGroupActions={true}
                      groupId={group.id}
                      isInGroup={true}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onRemoveFromGroup={onRemoveWidgetFromGroup}
                    />
                  ))}
                </div>
              )}
              
              {/* Add Widgets Section */}
              <div className="mt-4 border-t pt-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Available Widgets
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {ungroupedWidgets
                    .filter(w => 
                      // Exclude widgets already in this group
                      !group.widgetTypes.includes(w.type) &&
                      (!searchQuery.trim() ||
                        w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        w.type.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map(w => (
                      <WidgetItem
                        key={w.type}
                        widget={w}
                        showGroupActions={true}
                        groupId={group.id}
                        isInGroup={false}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onAddToGroup={onAddWidgetToGroup}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

