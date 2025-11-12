'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { ConfigurableKanbanBoard } from '@/components/project-management/ConfigurableKanbanBoard'
import { SpreadsheetView } from '@/components/project-management/SpreadsheetView'
import { GanttChartView } from '@/components/project-management/GanttChartView'
import { TimesheetView } from '@/components/project-management/TimesheetView'
import { TicketDetailModalEnhanced } from '@/components/project-management/TicketDetailModalEnhanced'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, List, Kanban as KanbanIcon, Table, BarChart3, Clock } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'

interface Ticket {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
  startDate?: string | null
  estimate?: number | null
  labels?: string[]
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string | null
  } | null
  spaces?: Array<{
    space: {
      id: string
      name: string
      slug: string
    }
  }>
  attributes?: Array<{
    id: string
    name: string
    displayName: string
    type: string
    value?: string | null
  }>
}

export default function ProjectsPage() {
  const { currentSpace } = useSpace()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'spreadsheet' | 'gantt' | 'timesheet'>('kanban')
  const [kanbanConfig, setKanbanConfig] = useState<{ rows?: string; columns?: string }>({ columns: 'status' })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [bulkPushing, setBulkPushing] = useState(false)
  const [serviceDeskConfig, setServiceDeskConfig] = useState<any>(null)

  useEffect(() => {
    fetchTickets()
    checkServiceDeskConfig()
  }, [selectedSpaceId, statusFilter, priorityFilter])

  const checkServiceDeskConfig = async () => {
    if (!selectedSpaceId || selectedSpaceId === 'all') return
    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk?space_id=${selectedSpaceId}`)
      if (response.ok) {
        const data = await response.json()
        setServiceDeskConfig(data.config)
      }
    } catch (error) {
      console.error('Failed to check ServiceDesk config:', error)
    }
  }

  const handleBulkPushToServiceDesk = async () => {
    if (selectedTickets.size === 0 || !selectedSpaceId || selectedSpaceId === 'all') {
      alert('Please select tickets and ensure a space is selected')
      return
    }

    if (!confirm(`Push ${selectedTickets.size} ticket(s) to ServiceDesk?`)) {
      return
    }

    setBulkPushing(true)
    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/bulk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_ids: Array.from(selectedTickets),
          space_id: selectedSpaceId,
          syncComments: true,
          syncAttachments: true,
          syncTimeLogs: true
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Successfully pushed ${result.results.success.length} ticket(s). ${result.results.failed.length} failed.`)
        setSelectedTickets(new Set())
        fetchTickets()
      } else {
        alert(`Failed to push tickets: ${result.error}`)
      }
    } catch (error) {
      console.error('Bulk push error:', error)
      alert('Failed to push tickets to ServiceDesk')
    } finally {
      setBulkPushing(false)
    }
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '100',
      })

      // Only add spaceId if a specific space is selected (not "all")
      if (selectedSpaceId && selectedSpaceId !== 'all') {
        params.append('spaceId', selectedSpaceId)
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter)
      }

      const response = await fetch(`/api/tickets?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      alert('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsModalOpen(true)
  }

  const handleAddTicket = async (status: string) => {
    if (!selectedSpaceId || selectedSpaceId === 'all') {
      alert('Please select a specific space to create a ticket')
      return
    }

    const newTicket: Partial<Ticket> = {
      title: 'New Ticket',
      description: '',
      status,
      priority: 'MEDIUM',
      attributes: [],
    }

    setSelectedTicket(newTicket as Ticket)
    setIsModalOpen(true)
  }

  const handleSaveTicket = async (ticketData: any) => {
    try {
      const isNew = !ticketData.id

      const payload = {
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status,
        priority: ticketData.priority,
        dueDate: ticketData.dueDate,
        startDate: ticketData.startDate,
        estimate: ticketData.estimate,
        labels: ticketData.labels || [],
        spaceId: selectedSpaceId && selectedSpaceId !== 'all' ? selectedSpaceId : (currentSpace?.id || ''),
        assignedTo: ticketData.assignee?.id || null,
        attributes: ticketData.attributes || [],
      }

      const url = isNew ? '/api/tickets' : `/api/tickets/${ticketData.id}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save ticket')

      // Ticket saved successfully

      setIsModalOpen(false)
      setSelectedTicket(null)
      fetchTickets()
    } catch (error) {
      console.error('Error saving ticket:', error)
      alert('Failed to save ticket')
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete ticket')

      // Ticket deleted successfully

      fetchTickets()
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Failed to delete ticket')
    }
  }

  const handleTicketMove = async (ticketId: string, newStatus: string) => {
    try {
      const ticket = tickets.find((t) => t.id === ticketId)
      if (!ticket) return

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to move ticket')

      fetchTickets()
    } catch (error) {
      console.error('Error moving ticket:', error)
      alert('Failed to move ticket')
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = ticket.title.toLowerCase().includes(query)
      const matchesDescription = ticket.description?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription) return false
    }
    return true
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
            <p className="text-muted-foreground">Manage your tickets and tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleAddTicket('BACKLOG')}
              disabled={!selectedSpaceId || selectedSpaceId === 'all'}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <SpaceSelector
            value={selectedSpaceId}
            onValueChange={setSelectedSpaceId}
            className="w-[200px]"
            showAllOption={true}
          />

          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="BACKLOG">Backlog</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <KanbanIcon className="mr-2 h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'spreadsheet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('spreadsheet')}
              >
                <Table className="mr-2 h-4 w-4" />
                Spreadsheet
              </Button>
              <Button
                variant={viewMode === 'gantt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gantt')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Gantt
              </Button>
              <Button
                variant={viewMode === 'timesheet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timesheet')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Timesheet
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading tickets...</div>
          </div>
        ) : viewMode === 'kanban' ? (
          <ConfigurableKanbanBoard
            tickets={filteredTickets}
            config={kanbanConfig}
            onConfigChange={setKanbanConfig}
            onTicketClick={handleTicketClick}
            onAddTicket={handleAddTicket}
            onTicketMove={handleTicketMove}
            showSpaces={selectedSpaceId === 'all'}
          />
        ) : viewMode === 'spreadsheet' ? (
          <SpreadsheetView
            tickets={filteredTickets}
            selectedTickets={selectedTickets}
            onTicketSelect={(ticketId, selected) => {
              const newSelected = new Set(selectedTickets)
              if (selected) {
                newSelected.add(ticketId)
              } else {
                newSelected.delete(ticketId)
              }
              setSelectedTickets(newSelected)
            }}
            onTicketClick={handleTicketClick}
            onTicketUpdate={async (ticketId, field, value) => {
              await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
              })
              fetchTickets()
            }}
          />
        ) : viewMode === 'gantt' ? (
          <GanttChartView
            tickets={filteredTickets}
            onTicketClick={handleTicketClick}
          />
        ) : viewMode === 'timesheet' ? (
          <TimesheetView
            tickets={filteredTickets}
            onTicketClick={(ticket) => {
              // Find the full ticket from filteredTickets to get all properties
              const fullTicket = filteredTickets.find(t => t.id === ticket.id)
              if (fullTicket) {
                handleTicketClick(fullTicket)
              }
            }}
            onAddTimeLog={async (ticketId, hours, description, loggedAt) => {
              await fetch(`/api/tickets/${ticketId}/time-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hours, description, loggedAt }),
              })
              fetchTickets()
            }}
          />
        ) : (
          <div className="space-y-2">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No tickets found. Create your first ticket to get started.
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleTicketClick(ticket)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{ticket.title}</h3>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {ticket.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{ticket.status}</span>
                      <span className="text-xs text-muted-foreground">{ticket.priority}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Ticket Detail Modal */}
        <TicketDetailModalEnhanced
          ticket={selectedTicket ? {
            ...selectedTicket,
            spaces: selectedTicket.spaces?.map(s => ({
              spaceId: s.space.id,
              space: {
                id: s.space.id,
                name: s.space.name,
              }
            })),
            assignees: selectedTicket.assignee ? [{
              user: {
                id: selectedTicket.assignee.id,
                name: selectedTicket.assignee.name,
                avatar: selectedTicket.assignee.avatar,
                email: selectedTicket.assignee.email,
              }
            }] : undefined,
          } : null}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSave={handleSaveTicket}
          onDelete={selectedTicket?.id ? handleDeleteTicket : undefined}
        />
      </div>
    </MainLayout>
  )
}

