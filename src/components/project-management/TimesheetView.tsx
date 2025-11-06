'use client'

import React, { useState } from 'react'
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
import { Card } from '@/components/ui/card'
import { Plus, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface TimeLog {
  id: string
  hours: number
  description?: string | null
  loggedAt: string
  user: {
    id: string
    name: string
    avatar?: string | null
  }
  ticket: {
    id: string
    title: string
  }
}

interface Ticket {
  id: string
  title: string
  status: string
  timeLogs?: TimeLog[]
  assignees?: Array<{
    user: {
      id: string
      name: string
      avatar?: string | null
    }
  }>
}

interface TimesheetViewProps {
  tickets: Ticket[]
  onAddTimeLog?: (ticketId: string, hours: number, description: string, loggedAt: Date) => void
  onTicketClick?: (ticket: Ticket) => void
}

export function TimesheetView({ tickets, onAddTimeLog, onTicketClick }: TimesheetViewProps) {
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const [newTimeLog, setNewTimeLog] = useState<{
    ticketId: string
    hours: string
    description: string
    loggedAt: string
  } | null>(null)

  const toggleTicket = (ticketId: string) => {
    const newExpanded = new Set(expandedTickets)
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId)
    } else {
      newExpanded.add(ticketId)
    }
    setExpandedTickets(newExpanded)
  }

  const handleAddTimeLog = (ticketId: string) => {
    setNewTimeLog({
      ticketId,
      hours: '',
      description: '',
      loggedAt: format(new Date(), 'yyyy-MM-dd'),
    })
  }

  const handleSaveTimeLog = () => {
    if (newTimeLog && onAddTimeLog && newTimeLog.hours) {
      onAddTimeLog(
        newTimeLog.ticketId,
        parseFloat(newTimeLog.hours),
        newTimeLog.description,
        new Date(newTimeLog.loggedAt)
      )
      setNewTimeLog(null)
    }
  }

  const calculateTotalHours = (ticket: Ticket) => {
    return ticket.timeLogs?.reduce((sum, log) => sum + Number(log.hours), 0) || 0
  }

  const allTimeLogs = tickets.flatMap((ticket) => {
    return (ticket.timeLogs || []).map((log) => ({ ...log, ticket }))
  })

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Hours</div>
          <div className="text-2xl font-bold">
            {allTimeLogs.reduce((sum, log) => sum + Number(log.hours), 0).toFixed(2)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active Tickets</div>
          <div className="text-2xl font-bold">{tickets.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Time Entries</div>
          <div className="text-2xl font-bold">{allTimeLogs.length}</div>
        </Card>
      </div>

      {/* Time Logs Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const isExpanded = expandedTickets.has(ticket.id)
              const totalHours = calculateTotalHours(ticket)

              return (
                <React.Fragment key={ticket.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => toggleTicket(ticket.id)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {isExpanded ? '−' : '+'}
                      </Button>
                    </TableCell>
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation()
                        onTicketClick?.(ticket)
                      }}
                      className="hover:underline"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ticket.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {ticket.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ticket.assignees?.slice(0, 2).map((assignee) => (
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
                      </div>
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="font-medium">{totalHours.toFixed(2)}h</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddTimeLog(ticket.id)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <>
                      {ticket.timeLogs?.map((log) => (
                        <TableRow key={log.id} className="bg-accent/30">
                          <TableCell></TableCell>
                          <TableCell className="pl-8 text-sm text-muted-foreground">
                            {ticket.title}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={log.user.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {log.user.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{log.user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(log.loggedAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {Number(log.hours).toFixed(2)}h
                          </TableCell>
                          <TableCell className="text-sm">{log.description || '—'}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}

                      {newTimeLog?.ticketId === ticket.id && (
                        <TableRow className="bg-accent/50">
                          <TableCell></TableCell>
                          <TableCell className="pl-8 text-sm">{ticket.title}</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={newTimeLog.loggedAt}
                              onChange={(e) =>
                                setNewTimeLog({ ...newTimeLog, loggedAt: e.target.value })
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.25"
                              placeholder="Hours"
                              value={newTimeLog.hours}
                              onChange={(e) =>
                                setNewTimeLog({ ...newTimeLog, hours: e.target.value })
                              }
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Description"
                              value={newTimeLog.description}
                              onChange={(e) =>
                                setNewTimeLog({ ...newTimeLog, description: e.target.value })
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={handleSaveTimeLog}
                                disabled={!newTimeLog.hours}
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNewTimeLog(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
