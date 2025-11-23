'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X, Folder, FolderOpen } from 'lucide-react'
import { WidgetGroup } from './types'

interface GroupsTabSidebarProps {
  groups: WidgetGroup[]
  collapsedGroups: Set<string>
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
  onToggleGroup: (groupId: string) => void
  onCreateGroup: (name: string) => string
}

export function GroupsTabSidebar({
  groups,
  collapsedGroups,
  selectedGroupId,
  onSelectGroup,
  onToggleGroup,
  onCreateGroup,
}: GroupsTabSidebarProps) {
  const [newGroupName, setNewGroupName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    
    const groupId = onCreateGroup(newGroupName)
    setNewGroupName('')
    setCreatingGroup(false)
    onSelectGroup(groupId)
  }
  
  return (
    <div className="w-48 border-r bg-muted/20 flex flex-col">
      <div className="p-2 border-b">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setCreatingGroup(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Group
        </Button>
        {creatingGroup && (
          <div className="mt-2 space-y-2">
            <Input
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="h-8 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateGroup()
                } else if (e.key === 'Escape') {
                  setCreatingGroup(false)
                  setNewGroupName('')
                }
              }}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="default"
                className="flex-1 h-7 text-xs"
                onClick={handleCreateGroup}
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => {
                  setCreatingGroup(false)
                  setNewGroupName('')
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => {
                onSelectGroup(group.id)
                onToggleGroup(group.id)
              }}
              className={`w-full text-left p-2 rounded text-sm hover:bg-muted transition-colors ${
                selectedGroupId === group.id ? 'bg-muted font-medium border-l-2 border-primary' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {collapsedGroups.has(group.id) ? (
                  <Folder className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FolderOpen className="h-4 w-4 text-primary" />
                )}
                <span className="flex-1 truncate">{group.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({group.widgetTypes.length})
                </span>
              </div>
            </button>
          ))}
          
          {groups.length === 0 && (
            <div className="text-xs text-muted-foreground p-2 text-center">
              No groups yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

