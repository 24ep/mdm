import React from 'react'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronRight, Square } from 'lucide-react'
import { ToolboxItem, ToolboxGroup } from '../types'

interface ToolboxProps {
  groups: ToolboxGroup[]
  collapsedGroups: Set<string>
  onToggleGroup: (groupId: string) => void
  onDragStart: (e: React.DragEvent, item: ToolboxItem) => void
}

export function Toolbox({ groups, collapsedGroups, onToggleGroup, onDragStart }: ToolboxProps) {
  const [query, setQuery] = React.useState('')
  const normalized = query.trim().toLowerCase()
  const filteredGroups = React.useMemo(() => {
    if (!normalized) return groups
    return groups.map(g => ({
      ...g,
      items: g.items.filter(it => (
        it.name.toLowerCase().includes(normalized) ||
        (it.description || '').toLowerCase().includes(normalized) ||
        (it.chart_type || '').toLowerCase().includes(normalized)
      ))
    })).filter(g => g.items.length > 0)
  }, [groups, normalized])

  return (
    <div className="w-80 bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Elements</h2>
        <p className="text-sm text-muted-foreground">Drag elements to canvas</p>
        <div className="mt-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search elements..."
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredGroups.map((group) => {
          const GroupIcon = group.icon ?? Square
          const isCollapsed = collapsedGroups.has(group.id)
          
          return (
            <div key={group.id} className="space-y-2">
              {/* Group Header */}
              <div
                className="flex items-center justify-between p-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => onToggleGroup(group.id)}
              >
                <div className="flex items-center space-x-2">
                  <GroupIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{group.name}</span>
                  <span className="text-xs text-muted-foreground">({group.items.length})</span>
                </div>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              
              {/* Group Items */}
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-2 pl-2">
                  {group.items.map((item) => {
                    const Icon = item.icon ?? Square
                    return (
                      <div
                        key={item.id}
                        className="p-3 border rounded-lg cursor-grab hover:bg-muted transition-colors"
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        title={item.description}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-2" />
                        <p className="text-xs text-center font-medium">{item.name}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
