'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, Clock, User, X, Plus, MessageSquare, Paperclip, 
  ListChecks, GitBranch, Trash2, Edit, Download
} from 'lucide-react'
import { format } from 'date-fns'

interface TicketDetailModalProps {
  ticket: {
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
    tags?: Array<{
      id: string
      name: string
      color?: string | null
    }>
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (ticket: any) => void
  onDelete?: (ticketId: string) => void
}

export function TicketDetailModalEnhanced({
  ticket,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: TicketDetailModalProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [comments, setComments] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [subtasks, setSubtasks] = useState<any[]>([])
  const [dependencies, setDependencies] = useState<{ dependencies: any[], dependents: any[] }>({ dependencies: [], dependents: [] })
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState({ title: '', status: 'BACKLOG' })
  const [newTimeLog, setNewTimeLog] = useState({ hours: '', description: '', loggedAt: format(new Date(), 'yyyy-MM-dd') })

  useEffect(() => {
    if (ticket?.id && open) {
      loadAllData()
    }
  }, [ticket?.id, open])

  const loadAllData = async () => {
    if (!ticket?.id) return

    try {
      const [commentsRes, attachmentsRes, subtasksRes, depsRes, timeLogsRes] = await Promise.all([
        fetch(`/api/tickets/${ticket.id}/comments`),
        fetch(`/api/tickets/${ticket.id}/attachments`),
        fetch(`/api/tickets/${ticket.id}/subtasks`),
        fetch(`/api/tickets/${ticket.id}/dependencies`),
        fetch(`/api/tickets/${ticket.id}/time-logs`)
      ])

      if (commentsRes.ok) {
        const data = await commentsRes.json()
        setComments(data.comments || [])
      }
      if (attachmentsRes.ok) {
        const data = await attachmentsRes.json()
        setAttachments(data.attachments || [])
      }
      if (subtasksRes.ok) {
        const data = await subtasksRes.json()
        setSubtasks(data.subtasks || [])
      }
      if (depsRes.ok) {
        const data = await depsRes.json()
        setDependencies(data)
      }
      if (timeLogsRes.ok) {
        const data = await timeLogsRes.json()
        setTimeLogs(data.timeLogs || [])
      }
    } catch (error) {
      console.error('Error loading ticket data:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket?.id) return

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })
      if (res.ok) {
        const comment = await res.json()
        setComments([...comments, comment])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !ticket?.id) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/tickets/${ticket.id}/attachments`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const attachment = await res.json()
        setAttachments([...attachments, attachment])
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.title.trim() || !ticket?.id) return

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubtask)
      })
      if (res.ok) {
        const subtask = await res.json()
        setSubtasks([...subtasks, subtask])
        setNewSubtask({ title: '', status: 'BACKLOG' })
      }
    } catch (error) {
      console.error('Error adding subtask:', error)
    }
  }

  const handleAddTimeLog = async () => {
    if (!newTimeLog.hours || !ticket?.id) return

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: parseFloat(newTimeLog.hours),
          description: newTimeLog.description,
          loggedAt: newTimeLog.loggedAt
        })
      })
      if (res.ok) {
        const timeLog = await res.json()
        setTimeLogs([...timeLogs, timeLog])
        setNewTimeLog({ hours: '', description: '', loggedAt: format(new Date(), 'yyyy-MM-dd') })
      }
    } catch (error) {
      console.error('Error adding time log:', error)
    }
  }

  if (!ticket) return null

  const totalHours = timeLogs.reduce((sum, log) => sum + Number(log.hours), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket.title}</DialogTitle>
          <DialogDescription>Manage ticket details and activities</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              Comments {comments.length > 0 && `(${comments.length})`}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Files {attachments.length > 0 && `(${attachments.length})`}
            </TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks {subtasks.length > 0 && `(${subtasks.length})`}
            </TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="time">
              Time {totalHours > 0 && `(${totalHours.toFixed(1)}h)`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select defaultValue={ticket.status}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select defaultValue={ticket.priority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {ticket.description && (
              <div>
                <Label>Description</Label>
                <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
              </div>
            )}
            {ticket.assignees && ticket.assignees.length > 0 && (
              <div>
                <Label>Assignees</Label>
                <div className="flex gap-2 mt-2">
                  {ticket.assignees.map((assignee) => (
                    <Avatar key={assignee.user.id} className="h-8 w-8">
                      <AvatarImage src={assignee.user.avatar || undefined} />
                      <AvatarFallback>
                        {assignee.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author?.avatar || undefined} />
                        <AvatarFallback>
                          {comment.author?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.author?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4 mt-4">
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <Card key={attachment.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{attachment.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {(attachment.fileSize / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              <div>
                <Input
                  type="file"
                  onChange={handleUploadAttachment}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subtasks" className="space-y-4 mt-4">
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <Card key={subtask.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{subtask.title}</span>
                      <Badge variant="outline" className="text-xs">{subtask.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Subtask title"
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  className="flex-1"
                />
                <Button onClick={handleAddSubtask} disabled={!newSubtask.title.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4 mt-4">
            <div className="space-y-4">
              {dependencies.dependencies.length > 0 && (
                <div>
                  <Label className="mb-2 block">Depends On</Label>
                  {dependencies.dependencies.map((dep) => (
                    <Card key={dep.id} className="mb-2">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{dep.dependsOn?.title}</span>
                          <Badge variant="outline">{dep.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {dependencies.dependents.length > 0 && (
                <div>
                  <Label className="mb-2 block">Blocks</Label>
                  {dependencies.dependents.map((dep) => (
                    <Card key={dep.id} className="mb-2">
                      <CardContent className="p-3">
                        <span className="text-sm">{dep.ticket?.title}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4 mt-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Time</div>
                      <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
                    </div>
                    {ticket.estimate && (
                      <div>
                        <div className="text-sm text-muted-foreground">Estimated</div>
                        <div className="text-2xl font-bold">{ticket.estimate}h</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {timeLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{Number(log.hours).toFixed(2)}h</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.loggedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{log.user?.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-2 border-t pt-4">
                <Input
                  type="date"
                  value={newTimeLog.loggedAt}
                  onChange={(e) => setNewTimeLog({ ...newTimeLog, loggedAt: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.25"
                    placeholder="Hours"
                    value={newTimeLog.hours}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, hours: e.target.value })}
                    className="w-24"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newTimeLog.description}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, description: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTimeLog} disabled={!newTimeLog.hours}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Time
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={() => onSave?.(ticket)} className="flex-1">
            Save Changes
          </Button>
          {onDelete && (
            <Button variant="destructive" onClick={() => onDelete(ticket.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

