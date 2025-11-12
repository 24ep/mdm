'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TicketCard } from './TicketCard'
import { Plus, Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Ticket {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
  estimate?: number | null
  assignees?: Array<{
    user: {
      id: string
      name: string
      avatar?: string | null
    }
  }>
  spaces?: Array<{
    space: {
      id: string
      name: string
      slug: string
    }
  }>
  tags?: Array<{
    id: string
    name: string
    color?: string | null
  }>
  [key: string]: any // For custom grouping fields
}

export interface KanbanConfig {
  rows?: string // Field to group by rows (e.g., 'priority', 'assignee')
  columns?: string // Field to group by columns (e.g., 'status')
  grouping?: string // Additional grouping (e.g., 'tags')
}

interface ConfigurableKanbanBoardProps {
  tickets: Ticket[]
  config: KanbanConfig
  onConfigChange?: (config: KanbanConfig) => void
  onTicketClick?: (ticket: Ticket) => void
  onAddTicket?: (status: string, groupKey?: string) => void
  onTicketMove?: (ticketId: string, newStatus: string, newGroupKey?: string) => void
  showSpaces?: boolean
}

export function ConfigurableKanbanBoard({
  tickets,
  config,
  onConfigChange,
  onTicketClick,
  onAddTicket,
  onTicketMove,
  showSpaces = false,
}: ConfigurableKanbanBoardProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState<KanbanConfig>(config)

  // Group tickets based on configuration
  const groupedTickets = useMemo(() => {
    const { rows, columns, grouping } = localConfig

    // Default: group by status (columns)
    if (!rows && !columns && !grouping) {
      const statusGroups: Record<string, Ticket[]> = {}
      tickets.forEach((ticket) => {
        const key = ticket.status || 'BACKLOG'
        if (!statusGroups[key]) statusGroups[key] = []
        statusGroups[key].push(ticket)
      })
      return { '': statusGroups }
    }

    // Group by rows first, then columns
    const result: Record<string, Record<string, Ticket[]>> = {}

    tickets.forEach((ticket) => {
      const rowKey = rows ? (ticket[rows] || 'Unassigned') : ''
      const colKey = columns ? (ticket[columns] || 'Unassigned') : ticket.status || 'BACKLOG'

      if (!result[rowKey]) result[rowKey] = {}
      if (!result[rowKey][colKey]) result[rowKey][colKey] = []
      result[rowKey][colKey].push(ticket)
    })

    return result
  }, [tickets, localConfig])

  // Get unique values for grouping
  const getUniqueValues = (field: string): string[] => {
    const values = new Set<string>()
    tickets.forEach((ticket) => {
      const value = ticket[field]
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => values.add(String(v)))
        } else {
          values.add(String(value))
        }
      }
    })
    return Array.from(values).sort()
  }

  const handleConfigSave = () => {
    onConfigChange?.(localConfig)
    setIsConfigOpen(false)
  }

  const statusColumns = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
  const priorityRows = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

  return (
    <div className="space-y-4">
      {/* Configuration Button */}
      <div className="flex justify-end">
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configure Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Kanban Board</DialogTitle>
              <DialogDescription>
                Customize how tickets are grouped and displayed
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Group by Rows</Label>
                <Select
                  value={localConfig.rows || 'none'}
                  onValueChange={(value) =>
                    setLocalConfig({ ...localConfig, rows: value === 'none' ? undefined : value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="assignee">Assignee</SelectItem>
                    <SelectItem value="tags">Tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Group by Columns</Label>
                <Select
                  value={localConfig.columns || 'status'}
                  onValueChange={(value) =>
                    setLocalConfig({ ...localConfig, columns: value === 'status' ? undefined : value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="assignee">Assignee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleConfigSave} className="flex-1">
                  Save Configuration
                </Button>
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      {localConfig.rows ? (
        // Row-based grouping (e.g., by priority)
        <div className="space-y-6">
          {Object.entries(groupedTickets).map(([rowKey, columns]) => (
            <div key={rowKey} className="space-y-2">
              <h3 className="text-lg font-semibold">{rowKey || 'Unassigned'}</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {statusColumns.map((status) => {
                  const columnTickets = columns[status] || []
                  return (
                    <div key={status} className="flex-shrink-0 w-80">
                      <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">{status}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {columnTickets.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[300px]">
                          {columnTickets.map((ticket) => (
                            <TicketCard
                              key={ticket.id}
                              ticket={ticket}
                              onClick={() => onTicketClick?.(ticket)}
                              showSpaces={showSpaces}
                            />
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start border-dashed"
                            onClick={() => onAddTicket?.(status, rowKey)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add ticket
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Standard column-based view
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((status) => {
            const columnTickets = groupedTickets['']?.[status] || []
            return (
              <div key={status} className="flex-shrink-0 w-80">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{status}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {columnTickets.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px]">
                    {columnTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => onTicketClick?.(ticket)}
                        showSpaces={showSpaces}
                      />
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start border-dashed"
                      onClick={() => onAddTicket?.(status)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add ticket
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

