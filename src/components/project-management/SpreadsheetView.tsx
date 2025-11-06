'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Ticket {
  id: string
  title: string
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
  tags?: Array<{
    id: string
    name: string
    color?: string | null
  }>
}

interface SpreadsheetViewProps {
  tickets: Ticket[]
  onTicketClick?: (ticket: Ticket) => void
  onTicketUpdate?: (ticketId: string, field: string, value: any) => void
}

export function SpreadsheetView({ tickets, onTicketClick, onTicketUpdate }: SpreadsheetViewProps) {
  const [editingCell, setEditingCell] = useState<{ ticketId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleCellClick = (ticketId: string, field: string, currentValue: any) => {
    setEditingCell({ ticketId, field })
    setEditValue(currentValue?.toString() || '')
  }

  const handleCellSave = () => {
    if (editingCell && onTicketUpdate) {
      onTicketUpdate(editingCell.ticketId, editingCell.field, editValue)
    }
    setEditingCell(null)
    setEditValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="min-w-[300px]">Title</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[150px]">Priority</TableHead>
            <TableHead className="w-[150px]">Due Date</TableHead>
            <TableHead className="w-[100px]">Estimate</TableHead>
            <TableHead className="w-[200px]">Assignees</TableHead>
            <TableHead className="w-[200px]">Tags</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket, index) => (
            <TableRow key={ticket.id} className="hover:bg-accent/50">
              <TableCell>{index + 1}</TableCell>
              <TableCell
                className="cursor-pointer"
                onClick={() => onTicketClick?.(ticket)}
              >
                {editingCell?.ticketId === ticket.id && editingCell?.field === 'title' ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCellSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCellSave()
                      if (e.key === 'Escape') handleCellCancel()
                    }}
                    autoFocus
                    className="h-8"
                  />
                ) : (
                  <span
                    className="hover:underline"
                    onDoubleClick={() => handleCellClick(ticket.id, 'title', ticket.title)}
                  >
                    {ticket.title}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.ticketId === ticket.id && editingCell?.field === 'status' ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCellSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCellSave()
                      if (e.key === 'Escape') handleCellCancel()
                    }}
                    autoFocus
                    className="h-8"
                  />
                ) : (
                  <Badge
                    variant="outline"
                    onDoubleClick={() => handleCellClick(ticket.id, 'status', ticket.status)}
                  >
                    {ticket.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.ticketId === ticket.id && editingCell?.field === 'priority' ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCellSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCellSave()
                      if (e.key === 'Escape') handleCellCancel()
                    }}
                    autoFocus
                    className="h-8"
                  />
                ) : (
                  <Badge
                    variant="secondary"
                    onDoubleClick={() => handleCellClick(ticket.id, 'priority', ticket.priority)}
                  >
                    {ticket.priority}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {ticket.dueDate ? (
                  editingCell?.ticketId === ticket.id && editingCell?.field === 'dueDate' ? (
                    <Input
                      type="date"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleCellSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCellSave()
                        if (e.key === 'Escape') handleCellCancel()
                      }}
                      autoFocus
                      className="h-8"
                    />
                  ) : (
                    <span
                      onDoubleClick={() =>
                        handleCellClick(ticket.id, 'dueDate', ticket.dueDate)
                      }
                    >
                      {format(new Date(ticket.dueDate), 'MMM d, yyyy')}
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.ticketId === ticket.id && editingCell?.field === 'estimate' ? (
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCellSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCellSave()
                      if (e.key === 'Escape') handleCellCancel()
                    }}
                    autoFocus
                    className="h-8"
                  />
                ) : (
                  <span
                    onDoubleClick={() =>
                      handleCellClick(ticket.id, 'estimate', ticket.estimate)
                    }
                  >
                    {ticket.estimate ? `${ticket.estimate}h` : '—'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {ticket.assignees?.slice(0, 3).map((assignee) => (
                    <Avatar key={assignee.user.id} className="h-6 w-6">
                      <AvatarImage src={assignee.user.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {assignee.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {ticket.assignees && ticket.assignees.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{ticket.assignees.length - 3}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {ticket.tags?.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{ borderColor: tag.color || undefined }}
                      className="text-xs"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {ticket.tags && ticket.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{ticket.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onTicketClick?.(ticket)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

