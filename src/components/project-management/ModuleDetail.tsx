'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  FolderKanban,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
  ListTodo
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { TicketCard } from './TicketCard'

interface Module {
  id: string
  name: string
  description?: string | null
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate?: string | null
  targetDate?: string | null
  progress?: number
  totalTickets?: number
  completedTickets?: number
  creator: {
    id: string
    name: string | null
    email: string
    avatar?: string | null
  }
  lead?: {
    id: string
    name: string | null
    email: string
    avatar?: string | null
  } | null
  project: {
    id: string
    name: string
  }
  tickets?: Array<{
    id: string
    title: string
    status: string
    priority: string
    assignees?: Array<{
      user: {
        id: string
        name: string | null
        avatar?: string | null
      }
    }>
    tags?: Array<{
      id: string
      name: string
      color?: string | null
    }>
  }>
  createdAt: string
  updatedAt: string
}

interface ModuleDetailProps {
  moduleId: string
  onBack: () => void
  onTicketClick?: (ticketId: string) => void
}

const statusConfig = {
  PLANNED: {
    label: 'Planned',
    icon: Clock,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300'
  }
}

export function ModuleDetail({ moduleId, onBack, onTicketClick }: ModuleDetailProps) {
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadModule()
  }, [moduleId])

  const loadModule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/modules/${moduleId}`)
      if (!response.ok) throw new Error('Failed to load module')
      const data = await response.json()
      setModule(data.module)
    } catch (error) {
      console.error('Error loading module:', error)
      toast({
        title: 'Error',
        description: 'Failed to load module',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Module not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  const statusInfo = statusConfig[module.status]
  const StatusIcon = statusInfo.icon

  const ticketsByStatus = {
    BACKLOG: module.tickets?.filter(t => t.status === 'BACKLOG') || [],
    TODO: module.tickets?.filter(t => t.status === 'TODO') || [],
    IN_PROGRESS: module.tickets?.filter(t => t.status === 'IN_PROGRESS') || [],
    IN_REVIEW: module.tickets?.filter(t => t.status === 'IN_REVIEW') || [],
    DONE: module.tickets?.filter(t => t.status === 'DONE') || [],
    CANCELLED: module.tickets?.filter(t => t.status === 'CANCELLED') || []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FolderKanban className="h-8 w-8" />
              {module.name}
            </h1>
            {module.description && (
              <p className="text-muted-foreground mt-1">{module.description}</p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0`}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusInfo.label}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{module.totalTickets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {module.completedTickets || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{module.progress || 0}%</div>
            <Progress value={module.progress || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{module.project.name}</div>
          </CardContent>
        </Card>
      </div>

      {/* Module Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Module Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(module.startDate || module.targetDate) && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Timeline</Label>
                <div className="space-y-1">
                  {module.startDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Start: {format(new Date(module.startDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {module.targetDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Target: {format(new Date(module.targetDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {module.lead && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Module Lead</Label>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={module.lead.avatar || undefined} />
                    <AvatarFallback>
                      {module.lead.name?.[0] || module.lead.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{module.lead.name || module.lead.email}</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Created By</Label>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={module.creator.avatar || undefined} />
                  <AvatarFallback>
                    {module.creator.name?.[0] || module.creator.email[0]}
                  </AvatarFallback>
                </Avatar>
                <span>{module.creator.name || module.creator.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(ticketsByStatus).map(([status, tickets]) => {
              if (tickets.length === 0) return null
              const percentage = module.totalTickets
                ? Math.round((tickets.length / module.totalTickets) * 100)
                : 0
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{status}</span>
                    <span className="font-medium">{tickets.length}</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Tickets ({module.totalTickets || 0})
          </CardTitle>
          <CardDescription>
            All tickets assigned to this module
          </CardDescription>
        </CardHeader>
        <CardContent>
          {module.tickets && module.tickets.length > 0 ? (
            <div className="space-y-2">
              {module.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onTicketClick?.(ticket.id)}
                  className="cursor-pointer"
                >
                  <TicketCard
                    ticket={{
                      id: ticket.id,
                      title: ticket.title,
                      status: ticket.status,
                      priority: ticket.priority,
                      assignee: ticket.assignees?.[0]?.user || null,
                      labels: ticket.tags?.map(t => t.name) || []
                    }}
                    onTicketClick={() => onTicketClick?.(ticket.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets assigned to this module yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

