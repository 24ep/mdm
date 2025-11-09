'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime } from '@/lib/date-formatters'
import { 
  Clock, 
  Calendar, 
  Mail, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Send
} from 'lucide-react'
import { toast } from 'sonner'

interface Schedule {
  id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  time: string
  dayOfWeek?: number
  dayOfMonth?: number
  recipients: string[]
  format: 'pdf' | 'excel' | 'csv' | 'image'
  enabled: boolean
  lastRun?: string
  nextRun: string
  created_at: string
  created_by: string
}

interface DashboardSchedulingProps {
  dashboardId: string
  onScheduleCreate: (schedule: Omit<Schedule, 'id' | 'created_at' | 'created_by'>) => void
  onScheduleUpdate: (scheduleId: string, updates: Partial<Schedule>) => void
  onScheduleDelete: (scheduleId: string) => void
  onScheduleToggle: (scheduleId: string, enabled: boolean) => void
  onScheduleRun: (scheduleId: string) => void
}

export function DashboardScheduling({
  dashboardId,
  onScheduleCreate,
  onScheduleUpdate,
  onScheduleDelete,
  onScheduleToggle,
  onScheduleRun
}: DashboardSchedulingProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    frequency: 'daily' as const,
    time: '09:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    recipients: [''],
    format: 'pdf' as const,
    enabled: true
  })

  // Mock schedules data
  const mockSchedules: Schedule[] = [
    {
      id: '1',
      name: 'Daily Sales Report',
      description: 'Daily sales performance report',
      frequency: 'daily',
      time: '08:00',
      recipients: ['sales@company.com', 'manager@company.com'],
      format: 'pdf',
      enabled: true,
      lastRun: '2024-01-17T08:00:00Z',
      nextRun: '2024-01-18T08:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      created_by: 'John Doe'
    },
    {
      id: '2',
      name: 'Weekly Marketing Summary',
      description: 'Weekly marketing metrics and insights',
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1, // Monday
      recipients: ['marketing@company.com'],
      format: 'excel',
      enabled: true,
      lastRun: '2024-01-15T09:00:00Z',
      nextRun: '2024-01-22T09:00:00Z',
      created_at: '2024-01-10T14:30:00Z',
      created_by: 'Jane Smith'
    },
    {
      id: '3',
      name: 'Monthly Financial Report',
      description: 'Monthly financial dashboard export',
      frequency: 'monthly',
      time: '10:00',
      dayOfMonth: 1,
      recipients: ['finance@company.com', 'ceo@company.com'],
      format: 'pdf',
      enabled: false,
      nextRun: '2024-02-01T10:00:00Z',
      created_at: '2024-01-01T12:00:00Z',
      created_by: 'Bob Johnson'
    }
  ]

  useEffect(() => {
    loadSchedules()
  }, [dashboardId])

  const loadSchedules = async () => {
    // Simulate API call
    setSchedules(mockSchedules)
  }

  const handleCreateSchedule = async () => {
    if (!newSchedule.name.trim()) {
      toast.error('Schedule name is required')
      return
    }

    if (newSchedule.recipients.length === 0 || !newSchedule.recipients[0].trim()) {
      toast.error('At least one recipient is required')
      return
    }

    try {
      const scheduleData = {
        ...newSchedule,
        nextRun: calculateNextRun(newSchedule.frequency, newSchedule.time, newSchedule.dayOfWeek, newSchedule.dayOfMonth)
      }

      setSchedules(prev => [...prev, {
        ...scheduleData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        created_by: 'Current User'
      }])

      onScheduleCreate(scheduleData)
      setNewSchedule({
        name: '',
        description: '',
        frequency: 'daily',
        time: '09:00',
        dayOfWeek: 1,
        dayOfMonth: 1,
        recipients: [''],
        format: 'pdf',
        enabled: true
      })
      setShowCreateDialog(false)
      toast.success('Schedule created successfully')
    } catch (error) {
      toast.error('Failed to create schedule')
    }
  }

  const handleUpdateSchedule = async (scheduleId: string, updates: Partial<Schedule>) => {
    try {
      setSchedules(prev => prev.map(s => 
        s.id === scheduleId ? { ...s, ...updates } : s
      ))
      onScheduleUpdate(scheduleId, updates)
      setEditingSchedule(null)
      toast.success('Schedule updated successfully')
    } catch (error) {
      toast.error('Failed to update schedule')
    }
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))
    onScheduleDelete(scheduleId)
    toast.success('Schedule deleted successfully')
  }

  const handleToggleSchedule = (scheduleId: string, enabled: boolean) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId ? { ...s, enabled } : s
    ))
    onScheduleToggle(scheduleId, enabled)
    toast.success(`Schedule ${enabled ? 'enabled' : 'disabled'}`)
  }

  const handleRunSchedule = (scheduleId: string) => {
    onScheduleRun(scheduleId)
    toast.success('Schedule executed successfully')
  }

  const calculateNextRun = (frequency: string, time: string, dayOfWeek?: number, dayOfMonth?: number): string => {
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    
    let nextRun = new Date()
    nextRun.setHours(hours, minutes, 0, 0)

    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        break
      case 'weekly':
        const targetDay = dayOfWeek || 1
        const currentDay = now.getDay()
        const daysUntilTarget = (targetDay - currentDay + 7) % 7
        nextRun.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
        break
      case 'monthly':
        const targetDate = dayOfMonth || 1
        nextRun.setDate(targetDate)
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
        break
    }

    return nextRun.toISOString()
  }


  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      case 'custom': return 'Custom'
      default: return frequency
    }
  }

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'pdf': return 'PDF'
      case 'excel': return 'Excel'
      case 'csv': return 'CSV'
      case 'image': return 'Image'
      default: return format
    }
  }

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Dashboard Scheduling</h2>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      <Tabs defaultValue="schedules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(schedule.enabled)}
                      <CardTitle className="text-lg">{schedule.name}</CardTitle>
                      <Badge variant="outline">
                        {getFrequencyLabel(schedule.frequency)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRunSchedule(schedule.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSchedule(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{schedule.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Frequency</Label>
                      <p className="text-sm text-muted-foreground">
                        {getFrequencyLabel(schedule.frequency)} at {schedule.time}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Recipients</Label>
                      <p className="text-sm text-muted-foreground">
                        {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Format</Label>
                      <p className="text-sm text-muted-foreground">
                        {getFormatLabel(schedule.format)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Next Run</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(schedule.nextRun)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                      />
                      <Label className="text-sm">
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                    {schedule.lastRun && (
                      <div className="text-sm text-muted-foreground">
                        Last run: {formatDateTime(schedule.lastRun)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No execution history available</p>
                <p className="text-sm">Schedule executions will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Schedule Dialog */}
      {(showCreateDialog || editingSchedule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingSchedule(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  value={editingSchedule?.name || newSchedule.name}
                  onChange={(e) => {
                    if (editingSchedule) {
                      setEditingSchedule({ ...editingSchedule, name: e.target.value })
                    } else {
                      setNewSchedule({ ...newSchedule, name: e.target.value })
                    }
                  }}
                  placeholder="Enter schedule name"
                />
              </div>

              <div>
                <Label htmlFor="schedule-description">Description</Label>
                <Textarea
                  id="schedule-description"
                  value={editingSchedule?.description || newSchedule.description}
                  onChange={(e) => {
                    if (editingSchedule) {
                      setEditingSchedule({ ...editingSchedule, description: e.target.value })
                    } else {
                      setNewSchedule({ ...newSchedule, description: e.target.value })
                    }
                  }}
                  placeholder="Enter schedule description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule-frequency">Frequency</Label>
                  <Select
                    value={editingSchedule?.frequency || newSchedule.frequency}
                    onValueChange={(value) => {
                      if (editingSchedule) {
                        setEditingSchedule({ ...editingSchedule, frequency: value as any })
                      } else {
                        setNewSchedule({ ...newSchedule, frequency: value as any })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={editingSchedule?.time || newSchedule.time}
                    onChange={(e) => {
                      if (editingSchedule) {
                        setEditingSchedule({ ...editingSchedule, time: e.target.value })
                      } else {
                        setNewSchedule({ ...newSchedule, time: e.target.value })
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="schedule-recipients">Recipients</Label>
                <div className="space-y-2">
                  {(editingSchedule?.recipients || newSchedule.recipients).map((recipient, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={recipient}
                        onChange={(e) => {
                          const newRecipients = [...(editingSchedule?.recipients || newSchedule.recipients)]
                          newRecipients[index] = e.target.value
                          if (editingSchedule) {
                            setEditingSchedule({ ...editingSchedule, recipients: newRecipients })
                          } else {
                            setNewSchedule({ ...newSchedule, recipients: newRecipients })
                          }
                        }}
                        placeholder="Enter email address"
                        type="email"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newRecipients = (editingSchedule?.recipients || newSchedule.recipients).filter((_, i) => i !== index)
                          if (editingSchedule) {
                            setEditingSchedule({ ...editingSchedule, recipients: newRecipients })
                          } else {
                            setNewSchedule({ ...newSchedule, recipients: newRecipients })
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (editingSchedule) {
                        setEditingSchedule({ ...editingSchedule, recipients: [...editingSchedule.recipients, ''] })
                      } else {
                        setNewSchedule({ ...newSchedule, recipients: [...newSchedule.recipients, ''] })
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="schedule-format">Format</Label>
                <Select
                  value={editingSchedule?.format || newSchedule.format}
                  onValueChange={(value) => {
                    if (editingSchedule) {
                      setEditingSchedule({ ...editingSchedule, format: value as any })
                    } else {
                      setNewSchedule({ ...newSchedule, format: value as any })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSchedule?.enabled ?? newSchedule.enabled}
                  onCheckedChange={(checked) => {
                    if (editingSchedule) {
                      setEditingSchedule({ ...editingSchedule, enabled: checked })
                    } else {
                      setNewSchedule({ ...newSchedule, enabled: checked })
                    }
                  }}
                />
                <Label>Enable schedule</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setEditingSchedule(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingSchedule) {
                      handleUpdateSchedule(editingSchedule.id, editingSchedule)
                    } else {
                      handleCreateSchedule()
                    }
                  }}
                >
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
